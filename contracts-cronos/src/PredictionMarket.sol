// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IPredictionMarket.sol";
import "./PositionToken.sol";
import "./Treasury.sol";

/**
 * @title PredictionMarket
 * @notice Main contract for the Cronos Prediction Market - mirrors Polymarket with spread-taking
 * @dev This contract manages markets, positions, and settlement
 */
contract PredictionMarket is IPredictionMarket {
    // State variables
    Treasury public immutable treasury;
    address public owner;
    address public backend; // Backend address for automated operations

    // Market storage
    mapping(bytes32 => Market) public markets;
    mapping(bytes32 => PositionToken) public yesTokens;
    mapping(bytes32 => PositionToken) public noTokens;
    mapping(bytes32 => mapping(address => bool)) public hasClaimed;

    // Spread configuration (in basis points, 100 = 1%)
    uint256 public spreadBps = 200; // 2% default spread
    uint256 public constant MAX_SPREAD_BPS = 500; // 5% max spread

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyBackend() {
        require(msg.sender == backend || msg.sender == owner, "Only backend or owner");
        _;
    }

    modifier marketExists(bytes32 marketId) {
        require(markets[marketId].endTime > 0, "Market does not exist");
        _;
    }

    modifier marketNotResolved(bytes32 marketId) {
        require(!markets[marketId].resolved, "Market already resolved");
        _;
    }

    modifier marketResolved(bytes32 marketId) {
        require(markets[marketId].resolved, "Market not resolved");
        _;
    }

    constructor(address _treasury) {
        owner = msg.sender;
        backend = msg.sender;
        treasury = Treasury(payable(_treasury));
    }

    /**
     * @notice Create a new prediction market
     * @param polymarketConditionId The corresponding Polymarket condition ID
     * @param question The market question
     * @param endTime When the market ends
     * @return marketId The unique market identifier
     */
    function createMarket(
        bytes32 polymarketConditionId,
        string calldata question,
        uint256 endTime
    ) external onlyBackend returns (bytes32 marketId) {
        require(endTime > block.timestamp, "End time must be in future");
        require(bytes(question).length > 0, "Question required");

        // Generate unique market ID
        marketId = keccak256(abi.encodePacked(polymarketConditionId, block.timestamp, msg.sender));

        // Ensure market doesn't already exist
        require(markets[marketId].endTime == 0, "Market already exists");

        // Create position tokens
        string memory yesName = string(abi.encodePacked("YES-", _substring(question, 20)));
        string memory noName = string(abi.encodePacked("NO-", _substring(question, 20)));

        yesTokens[marketId] = new PositionToken(yesName, "YES", address(this));
        noTokens[marketId] = new PositionToken(noName, "NO", address(this));

        // Store market data
        markets[marketId] = Market({
            polymarketConditionId: polymarketConditionId,
            question: question,
            endTime: endTime,
            outcome: MarketOutcome.UNRESOLVED,
            resolved: false,
            totalYesShares: 0,
            totalNoShares: 0,
            totalVolume: 0
        });

        emit MarketCreated(marketId, polymarketConditionId, question, endTime);
    }

    /**
     * @notice Buy shares in a market outcome
     * @param marketId The market to buy shares in
     * @param isYes Whether to buy YES or NO shares
     * @param amount The USDC amount to spend
     * @param minShares Minimum shares to receive (slippage protection)
     * @return shares The number of shares purchased
     */
    function buyShares(
        bytes32 marketId,
        bool isYes,
        uint256 amount,
        uint256 minShares
    )
        external
        marketExists(marketId)
        marketNotResolved(marketId)
        returns (uint256 shares)
    {
        require(block.timestamp < markets[marketId].endTime, "Market ended");
        require(amount > 0, "Amount must be positive");

        // Transfer USDC from user to treasury
        treasury.deposit(msg.sender, amount);

        // Calculate shares after spread
        // For simplicity, we assume 1 share = 1 USDC potential payout
        // Spread is taken as: user gets (amount * (1 - spread)) worth of shares at current price
        uint256 effectiveAmount = (amount * (10000 - spreadBps)) / 10000;

        // In a real implementation, price would come from the backend/oracle
        // For now, we'll use a simple model where shares = effective amount
        // (assuming price is handled by the backend)
        shares = effectiveAmount;

        require(shares >= minShares, "Slippage exceeded");

        // Mint position tokens
        PositionToken token = isYes ? yesTokens[marketId] : noTokens[marketId];
        token.mint(msg.sender, shares);

        // Update market stats
        if (isYes) {
            markets[marketId].totalYesShares += shares;
        } else {
            markets[marketId].totalNoShares += shares;
        }
        markets[marketId].totalVolume += amount;

        // Record spread profit in treasury
        uint256 spreadProfit = amount - effectiveAmount;
        if (spreadProfit > 0) {
            treasury.recordSpreadProfit(spreadProfit);
        }

        emit SharesPurchased(marketId, msg.sender, isYes, amount, shares, 0);
    }

    /**
     * @notice Sell shares back to the market
     * @param marketId The market to sell shares in
     * @param isYes Whether selling YES or NO shares
     * @param shares The number of shares to sell
     * @param minAmount Minimum USDC to receive (slippage protection)
     * @return amount The USDC amount received
     */
    function sellShares(
        bytes32 marketId,
        bool isYes,
        uint256 shares,
        uint256 minAmount
    )
        external
        marketExists(marketId)
        marketNotResolved(marketId)
        returns (uint256 amount)
    {
        require(block.timestamp < markets[marketId].endTime, "Market ended");
        require(shares > 0, "Shares must be positive");

        PositionToken token = isYes ? yesTokens[marketId] : noTokens[marketId];
        require(token.balanceOf(msg.sender) >= shares, "Insufficient shares");

        // Calculate amount after spread
        // User receives (shares * (1 - spread))
        amount = (shares * (10000 - spreadBps)) / 10000;

        require(amount >= minAmount, "Slippage exceeded");

        // Burn position tokens
        token.burn(msg.sender, shares);

        // Update market stats
        if (isYes) {
            markets[marketId].totalYesShares -= shares;
        } else {
            markets[marketId].totalNoShares -= shares;
        }

        // Withdraw from treasury to user
        treasury.withdraw(msg.sender, amount);

        // Record spread profit
        uint256 spreadProfit = shares - amount;
        if (spreadProfit > 0) {
            treasury.recordSpreadProfit(spreadProfit);
        }

        emit SharesSold(marketId, msg.sender, isYes, shares, amount);
    }

    /**
     * @notice Resolve a market with the final outcome
     * @param marketId The market to resolve
     * @param outcome The market outcome (YES, NO, or INVALID)
     */
    function resolveMarket(
        bytes32 marketId,
        MarketOutcome outcome
    ) external onlyBackend marketExists(marketId) marketNotResolved(marketId) {
        require(outcome != MarketOutcome.UNRESOLVED, "Invalid outcome");

        markets[marketId].resolved = true;
        markets[marketId].outcome = outcome;

        emit MarketResolved(marketId, outcome);
    }

    /**
     * @notice Claim winnings from a resolved market
     * @param marketId The resolved market
     * @return amount The USDC amount claimed
     */
    function claimWinnings(
        bytes32 marketId
    ) external marketExists(marketId) marketResolved(marketId) returns (uint256 amount) {
        require(!hasClaimed[marketId][msg.sender], "Already claimed");

        Market storage market = markets[marketId];
        MarketOutcome outcome = market.outcome;

        uint256 yesShares = yesTokens[marketId].balanceOf(msg.sender);
        uint256 noShares = noTokens[marketId].balanceOf(msg.sender);

        if (outcome == MarketOutcome.YES) {
            // YES holders get $1 per share
            amount = yesShares;
            if (yesShares > 0) {
                yesTokens[marketId].burn(msg.sender, yesShares);
            }
            // NO shares are worthless
            if (noShares > 0) {
                noTokens[marketId].burn(msg.sender, noShares);
            }
        } else if (outcome == MarketOutcome.NO) {
            // NO holders get $1 per share
            amount = noShares;
            if (noShares > 0) {
                noTokens[marketId].burn(msg.sender, noShares);
            }
            // YES shares are worthless
            if (yesShares > 0) {
                yesTokens[marketId].burn(msg.sender, yesShares);
            }
        } else if (outcome == MarketOutcome.INVALID) {
            // Refund all positions (simplified: return share value)
            amount = yesShares + noShares;
            if (yesShares > 0) {
                yesTokens[marketId].burn(msg.sender, yesShares);
            }
            if (noShares > 0) {
                noTokens[marketId].burn(msg.sender, noShares);
            }
        }

        if (amount > 0) {
            hasClaimed[marketId][msg.sender] = true;
            treasury.withdraw(msg.sender, amount);
            emit WinningsClaimed(marketId, msg.sender, amount);
        }
    }

    /**
     * @notice Get market details
     */
    function getMarket(bytes32 marketId) external view returns (Market memory) {
        return markets[marketId];
    }

    /**
     * @notice Get user's share balances for a market
     */
    function getUserShares(
        bytes32 marketId,
        address user
    ) external view returns (uint256 yesShares, uint256 noShares) {
        if (address(yesTokens[marketId]) != address(0)) {
            yesShares = yesTokens[marketId].balanceOf(user);
        }
        if (address(noTokens[marketId]) != address(0)) {
            noShares = noTokens[marketId].balanceOf(user);
        }
    }

    /**
     * @notice Get position token addresses for a market
     */
    function getPositionTokens(
        bytes32 marketId
    ) external view returns (address yesToken, address noToken) {
        return (address(yesTokens[marketId]), address(noTokens[marketId]));
    }

    // Admin functions

    function setSpread(uint256 _spreadBps) external onlyOwner {
        require(_spreadBps <= MAX_SPREAD_BPS, "Spread too high");
        spreadBps = _spreadBps;
    }

    function setBackend(address _backend) external onlyOwner {
        require(_backend != address(0), "Invalid address");
        backend = _backend;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }

    // Internal helper

    function _substring(string memory str, uint256 len) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        if (strBytes.length <= len) {
            return str;
        }
        bytes memory result = new bytes(len);
        for (uint256 i = 0; i < len; i++) {
            result[i] = strBytes[i];
        }
        return string(result);
    }
}

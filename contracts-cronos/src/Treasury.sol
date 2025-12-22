// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IERC20.sol";

/**
 * @title Treasury
 * @notice Holds user funds and manages payouts for the prediction market
 * @dev Supports both native CRO and USDC deposits
 */
contract Treasury {
    address public owner;
    address public predictionMarket;
    IERC20 public usdc;

    uint256 public totalDeposits;
    uint256 public totalSpreadProfits;

    mapping(address => uint256) public userBalances;

    event Deposit(address indexed user, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);
    event SpreadProfitRecorded(uint256 amount);
    event SpreadProfitWithdrawn(address indexed to, uint256 amount);
    event EmergencyWithdrawal(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyMarket() {
        require(msg.sender == predictionMarket || msg.sender == owner, "Only market or owner");
        _;
    }

    constructor(address _usdc) {
        owner = msg.sender;
        usdc = IERC20(_usdc);
    }

    /**
     * @notice Set the prediction market contract address
     */
    function setPredictionMarket(address _predictionMarket) external onlyOwner {
        require(_predictionMarket != address(0), "Invalid address");
        predictionMarket = _predictionMarket;
    }

    /**
     * @notice Deposit USDC into the treasury
     * @param user The user making the deposit
     * @param amount The amount to deposit
     */
    function deposit(address user, uint256 amount) external onlyMarket {
        require(amount > 0, "Amount must be positive");

        // Transfer USDC from user to treasury
        require(usdc.transferFrom(user, address(this), amount), "Transfer failed");

        userBalances[user] += amount;
        totalDeposits += amount;

        emit Deposit(user, amount);
    }

    /**
     * @notice Withdraw USDC from the treasury
     * @param user The user to send funds to
     * @param amount The amount to withdraw
     */
    function withdraw(address user, uint256 amount) external onlyMarket {
        require(amount > 0, "Amount must be positive");
        require(usdc.balanceOf(address(this)) >= amount, "Insufficient treasury balance");

        // Transfer USDC to user
        require(usdc.transfer(user, amount), "Transfer failed");

        if (userBalances[user] >= amount) {
            userBalances[user] -= amount;
        }
        totalDeposits -= amount;

        emit Withdrawal(user, amount);
    }

    /**
     * @notice Record spread profit from trading
     */
    function recordSpreadProfit(uint256 amount) external onlyMarket {
        totalSpreadProfits += amount;
        emit SpreadProfitRecorded(amount);
    }

    /**
     * @notice Withdraw accumulated spread profits (owner only)
     */
    function withdrawSpreadProfits(address to) external onlyOwner {
        require(to != address(0), "Invalid address");
        require(totalSpreadProfits > 0, "No profits to withdraw");

        uint256 amount = totalSpreadProfits;
        totalSpreadProfits = 0;

        require(usdc.transfer(to, amount), "Transfer failed");

        emit SpreadProfitWithdrawn(to, amount);
    }

    /**
     * @notice Get user balance
     */
    function getUserBalance(address user) external view returns (uint256) {
        return userBalances[user];
    }

    /**
     * @notice Get treasury stats
     */
    function getStats()
        external
        view
        returns (uint256 deposits, uint256 profits, uint256 balance)
    {
        return (totalDeposits, totalSpreadProfits, usdc.balanceOf(address(this)));
    }

    /**
     * @notice Emergency withdrawal (owner only, for emergencies)
     */
    function emergencyWithdraw(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid address");
        require(usdc.transfer(to, amount), "Transfer failed");
        emit EmergencyWithdrawal(to, amount);
    }

    /**
     * @notice Transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }

    // Native CRO support (optional)

    receive() external payable {}

    function withdrawCRO(address payable to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid address");
        require(address(this).balance >= amount, "Insufficient CRO balance");
        to.transfer(amount);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPredictionMarket {
    enum MarketOutcome {
        UNRESOLVED,
        YES,
        NO,
        INVALID
    }

    struct Market {
        bytes32 polymarketConditionId;
        string question;
        uint256 endTime;
        MarketOutcome outcome;
        bool resolved;
        uint256 totalYesShares;
        uint256 totalNoShares;
        uint256 totalVolume;
    }

    event MarketCreated(
        bytes32 indexed marketId,
        bytes32 polymarketConditionId,
        string question,
        uint256 endTime
    );

    event SharesPurchased(
        bytes32 indexed marketId,
        address indexed user,
        bool isYes,
        uint256 amount,
        uint256 shares,
        uint256 price
    );

    event SharesSold(
        bytes32 indexed marketId,
        address indexed user,
        bool isYes,
        uint256 shares,
        uint256 amount
    );

    event MarketResolved(bytes32 indexed marketId, MarketOutcome outcome);

    event WinningsClaimed(bytes32 indexed marketId, address indexed user, uint256 amount);

    function createMarket(
        bytes32 polymarketConditionId,
        string calldata question,
        uint256 endTime
    ) external returns (bytes32 marketId);

    function buyShares(
        bytes32 marketId,
        bool isYes,
        uint256 amount,
        uint256 minShares
    ) external returns (uint256 shares);

    function sellShares(
        bytes32 marketId,
        bool isYes,
        uint256 shares,
        uint256 minAmount
    ) external returns (uint256 amount);

    function resolveMarket(bytes32 marketId, MarketOutcome outcome) external;

    function claimWinnings(bytes32 marketId) external returns (uint256 amount);

    function getMarket(bytes32 marketId) external view returns (Market memory);

    function getUserShares(
        bytes32 marketId,
        address user
    ) external view returns (uint256 yesShares, uint256 noShares);
}

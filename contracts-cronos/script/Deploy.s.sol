// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Treasury.sol";
import "../src/PredictionMarket.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address usdc = vm.envAddress("USDC_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy Treasury first
        Treasury treasury = new Treasury(usdc);
        console.log("Treasury deployed at:", address(treasury));

        // Deploy PredictionMarket
        PredictionMarket predictionMarket = new PredictionMarket(address(treasury));
        console.log("PredictionMarket deployed at:", address(predictionMarket));

        // Set prediction market in treasury
        treasury.setPredictionMarket(address(predictionMarket));
        console.log("Treasury configured with PredictionMarket");

        vm.stopBroadcast();

        // Output deployment addresses for verification
        console.log("");
        console.log("=== Deployment Summary ===");
        console.log("Treasury:", address(treasury));
        console.log("PredictionMarket:", address(predictionMarket));
        console.log("USDC:", usdc);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library CosmicSwapLibrary {
    function computeOptimalAmount(uint amount0, uint reserve0, uint reserve1) internal pure returns (uint amount1) {
        require(amount0 > 0, "CosmicSwap: INSUFICIENT_AMOUNT");
        require(reserve0 > 0 && reserve1 > 0, "CosmicSwap: INSUFICIENT_LIQUIDITY");
        amount1 = (reserve1 * amount0) / reserve0;
    }
}
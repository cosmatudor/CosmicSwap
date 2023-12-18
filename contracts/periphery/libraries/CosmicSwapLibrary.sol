// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library CosmicSwapLibrary {
    function computeOptimalAmount(uint amount0, uint reserve0, uint reserve1) internal pure returns (uint amount1) {
        require(amount0 > 0, "CosmicSwap: INSUFICIENT_AMOUNT");
        require(reserve0 > 0 && reserve1 > 0, "CosmicSwap: INSUFICIENT_LIQUIDITY");
        amount1 = (reserve1 * amount0) / reserve0;
    }

    function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        require(tokenA != tokenB, "CosmicSwap: IDENTICAL_ADDRESSES");
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "CosmicSwap: ZERO_ADDRESS");
    }

    function computeSwapAmount(uint amountIn, uint reserveIn, uint reserveOut) internal pure returns (uint amoutout) {
        require(amountIn > 0, "CosmicSwap: INSUFFICIENT_INPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "CosmicSwap: INSUFFICIENT_LIQUIDITY");
        
        // amountIn / amountOut = reserveIn / reserveOut => amountOut = amountIn * reserveOut / reserveIn
        // but we apply a 0.03% fee
        uint amountInWithFee = amountIn * 997;
        uint numerator = amountInWithFee * reserveOut; // * 1000, but then we must divide again by 1000
        uint denominator = reserveIn * 1000;
        amoutout = numerator / denominator;
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "contracts/core/CosmicSwapFactory.sol";
import "contracts/core/CosmicSwapPair.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "contracts/periphery/libraries/CosmicSwapLibrary.sol";
import "hardhat/console.sol";

contract CosmicSwapRouter {
    address public immutable factory;

    constructor(address _factory) {
        factory = _factory;
    }

    function _computeLiquidity(address pair, uint amountDesired0, uint amountDesired1) internal view
    returns(uint amount0, uint amount1) {
        (uint reserve0, uint reserve1) = CosmicSwapPair(pair).getReserves();
        if (reserve0 == 0 && reserve1 == 0) {
            (amount0, amount1) = (amountDesired0, amountDesired1);
        } else {
            uint amountOptimal1 = CosmicSwapLibrary.computeOptimalAmount(amountDesired0, reserve0, reserve1);

            if (amountOptimal1 <= amountDesired1) {
                (amount0, amount1) = (amountDesired0, amountOptimal1);
            } else {
                uint amountOptimal0 = CosmicSwapLibrary.computeOptimalAmount(amountDesired1, reserve1, reserve0);
                assert(amountOptimal0 <= amountDesired0);
                (amount0, amount1) = (amountOptimal0, amountDesired1);
            }
        }
    }

    /******** ADD LIQUIDITY ********/
    function addLiquidity(address token0, address token1, uint amountDesired0, uint amountDesired1, address to) external
    returns (uint amount0, uint amount1, uint liquidity) {
        address pair = CosmicSwapFactory(factory).getPair(token0, token1);
        if (pair == address(0)) {
            pair = CosmicSwapFactory(factory).createPool(token0, token1);
        }
        (amount0, amount1) = _computeLiquidity(pair, amountDesired0, amountDesired1);
        IERC20(token0).transferFrom(msg.sender, pair, amount0);
        IERC20(token1).transferFrom(msg.sender, pair, amount1);
        liquidity = CosmicSwapPair(pair).mint(to);
    }

    /******** REMOVE LIQUIDITY ********/
    function removeLiquidity(address token0, address token1, uint liquidity, address to) external returns(uint amount0, uint amount1) {
        address pair = CosmicSwapFactory(factory).getPair(token0, token1);
        CosmicSwapPair(pair).transferFrom(msg.sender, pair, liquidity);
        (amount0, amount1) = CosmicSwapPair(pair).burn(to);
    }

    /******** SWAP ********/
    function swap(address tokenIn, address tokenOut, uint amountIn, address to) external returns(uint amountOut) {
        // get the pair
        address pair = CosmicSwapFactory(factory).getPair(tokenIn, tokenOut);
        require(pair != address(0), "CosmicSwap: NO_PAIR");

        // sort tokens and reserves
        (address token0, ) = CosmicSwapLibrary.sortTokens(tokenIn, tokenOut);
        (uint reserve0, uint reserve1) = CosmicSwapPair(pair).getReserves();
        (uint reserveIn, uint reserveOut) = tokenIn == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
        
        // now that we have organized the amounts, we can compute the amount out
        amountOut = CosmicSwapLibrary.computeSwapAmount(amountIn, reserveIn, reserveOut);
        require(amountOut > 0, "CosmicSwap: INSUFFICIENT_OUTPUT_AMOUNT");

        // check which amount is In and which is Out
        (uint amount0Out, uint amount1Out) = token0 == tokenIn ? (uint(0), amountOut) : (amountOut, uint(0));

        // transfer amountIn to pool and call low-level swap function
        IERC20(tokenIn).transferFrom(msg.sender, pair, amountIn);
        CosmicSwapPair(pair).swap(amount0Out, amount1Out, to);
    }
}
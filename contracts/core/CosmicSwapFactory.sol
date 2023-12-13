// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "contracts/core/CosmicSwapPair.sol";

contract CosmicSwapFactory {
    event PairCreated(address indexed token0, address indexed token1, address pair, uint);

    mapping (address => mapping (address => address)) public getPair;
    address[] public allPools;

    function getPoolsCount() public view returns(uint) {
        return allPools.length;
    }

    function createPool(address tokenA, address tokenB) external returns(address pair) {
        require(tokenA != tokenB, "CosmicSwap: IDENTICAL_ADDRESSES");

        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "CosmicSwap: ZERO_ADDRESS");

        require(getPair[tokenA][tokenB] == address(0), "CosmicSwap: EXISTENT_PAIR");

        CosmicSwapPair _pair = new CosmicSwapPair(token0, token1);
        pair = address(_pair);
        
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair;
        allPools.push(pair);
    }
}
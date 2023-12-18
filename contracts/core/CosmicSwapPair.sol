// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "./libraries/Math.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";


contract CosmicSwapPair is ERC20 {
    // libraries
    // ...

    // Events
    event Mint(address indexed sender, uint amount0, uint amount1);
    event Burn(
        address indexed sender,
        uint amount0,
        uint amount1,
        address indexed to 
    );
    event Swap( 
        address indexed sender,
        uint amount0In,
        uint amount1In,
        uint amount0Out,
        uint amount1Out,
        address indexed to
    );

    // this selector helps us to avoid having to import an interface for the token function
    bytes4 private constant SELECTOR = bytes4(keccak256(bytes('transfer(address,uint256)')));
    uint public constant MINIMUM_LIQUIDITY = 1000;

    address public factory;
    address public token0;
    address public token1;

    // uses a single storage slot
    uint128 private reserve0;
    uint128 private reserve1;
    
    uint public kLast; // reserve0 * reserve1

    constructor(address _token0, address _token1) ERC20("CosmicSwap", "COS") {
        // factory = msg.sender;
        token0 = _token0;
        token1 = _token1;
    }

    // function initialize(address _token0, address _token1) {
    //     require(msg.sender == factory, "CosmicSwap: FORBIDEN");
    //     token0 = _token0;
    //     token1 = _token1;
    // }

    function getReserves() public view returns (uint128, uint128) {
        return (reserve0, reserve1);
    }

    /**
     * Updates the reserves
     */
    function _updateReserves(uint balance0, uint balance1) private {
        require (balance0 <= type(uint128).max && balance1 <= type(uint128).max, "CosmicSwap: OVERFLOW");
        reserve0 = uint128(balance0);
        reserve1 = uint128(balance1);
    }

    /**
     * Transfers an amount of ERC20 tokens from the exchange to somebody else
     */
    function _safeTransfer(address token, address to, uint value) private {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(SELECTOR, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), "CosmicSwap: TRANSFER_FAILED");
    }

    function mint(address to) external returns (uint liquidity) {
        (uint128 _reserve0, uint128 _reserve1) = getReserves();
        uint balance0 = IERC20(token0).balanceOf(address(this));
        uint balance1 = IERC20(token1).balanceOf(address(this));

        uint amount0 = balance0 - _reserve0;
        uint amount1 = balance1 - _reserve1;

        uint _totalSupply = totalSupply();
        if (_totalSupply == 0) {
            liquidity = Math.sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY;
            _mint(address(0x1aE6600120151eDb09495A66fa1cFc88dCe457f0), MINIMUM_LIQUIDITY);
        }
        else {
            liquidity = Math.min(amount0 * _totalSupply / _reserve0, amount1 * _totalSupply / _reserve1);
        }

        require (liquidity > 0, "CosmicSwap: INSUFFICIENT_LIQUIDITY_MINTED");
        _mint(to, liquidity);

        _updateReserves(balance0, balance1);
        
        emit Mint(msg.sender, amount0, amount1);

    }

    function burn(address to) external returns (uint amount0, uint amount1) {
        // in my balance of COS token contract, it will be always just the amount of LP tokens that a user wants to burn to get liquidity back
        uint liquidity = balanceOf(address(this));
        uint _totalSupply = totalSupply(); // total amount of existent LP tokens

        uint balance0 = IERC20(token0).balanceOf(address(this));
        uint balance1 = IERC20(token1).balanceOf(address(this));

        // now we have the amounts of token 0/1 that must be send to user
        amount0 = liquidity * balance0 / _totalSupply;
        amount1 = liquidity * balance1 / _totalSupply;

        require(amount0 > 0 && amount1 > 0, "CosmicSwap: INSUFFICIENT_LIQUIDITY_BURNED");

        // Now we can actually burn the LP Tokens sent
        _burn(address(this), liquidity);

        // and send back to user the tokens from the pair
        _safeTransfer(token0, to, amount0);
        _safeTransfer(token1, to, amount1);

        // update the reserves with the current balances
        balance0 = IERC20(token0).balanceOf(address(this));
        balance1 = IERC20(token1).balanceOf(address(this));
        _updateReserves(balance0, balance1);

        emit Burn(msg.sender, amount0, amount1, to);
    }

    function swap(uint amount0Out, uint amount1Out, address to) external {
        require(amount0Out > 0 || amount1Out > 0, "CosmicSwap: INSUFICIENT_OUTPUT_AMOUNT");
        (uint128 _reserve0, uint128 _reserve1) = getReserves();
        require(amount0Out < _reserve0 && amount1Out < _reserve1, "CosmicSwap: INSUFICIENT_LIQUIDITY");

        /// transfer out first, so we can compute with ease the inputs after
        require(to != token0 && to != token1, "CosmicSwap: INVALID_TO");
        _safeTransfer(token0, to, amount0Out); // optimistically transfer tokens
        _safeTransfer(token1, to, amount1Out); // optimistically transfer tokens

        // compute the inputs
        uint balance0 = IERC20(token0).balanceOf(address(this));
        uint balance1 = IERC20(token1).balanceOf(address(this));

        uint amount0In = balance0 > _reserve0 - amount0Out ? balance0 - (_reserve0 - amount0Out) : 0;
        uint amount1In = balance1 > _reserve1 - amount1Out ? balance1 - (_reserve1 - amount1Out) : 0;
        require(amount0In > 0 || amount1In > 0, 'CosmicSwap: INSUFFICIENT_INPUT_AMOUNT');

        _updateReserves(balance0, balance1);
        emit Swap(msg.sender, amount0In, amount1In, amount0Out, amount1Out, to);
    }

}
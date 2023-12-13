// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract MintableToken is ERC20, ERC20Permit {
    uint constant _initial_supply = 7000 * (10 ** 18);
    constructor(string memory name, string memory symbol) 
    ERC20(name, symbol) 
    ERC20Permit(name) {
        _mint(msg.sender, _initial_supply);
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}

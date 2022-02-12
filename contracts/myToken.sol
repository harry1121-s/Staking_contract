//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract myToken is ERC20("Harshit", "HAR"), Ownable{

    function mint(address _account, uint256 _supply)public onlyOwner
    {
        _mint(_account, _supply * 10**18);
    }

    function decimals()public view virtual override returns(uint8){
        return 18;
    }

}

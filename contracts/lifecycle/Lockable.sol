pragma solidity 0.4.24;

import "../ownership/Ownable.sol";

contract Lockable is Ownable {

    bool public locked;

    modifier onlyWhenUnlocked() {
        require(!locked, "Not unlocked");
        _;
    }

    function lock() external onlyOwner {
        locked = true;
    }

    function unlock() external onlyOwner {
        locked = false;
    }
}
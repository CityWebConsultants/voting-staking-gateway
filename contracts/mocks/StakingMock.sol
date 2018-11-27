pragma solidity ^0.4.24;

contract StakingMock {    
    bool userValid;

    constructor(bool valid) public {
        userValid = valid;
    }

    function availableToUnstakeAt(address, uint256) 
    public
    view
    returns (bool)
    {  
        return userValid;
    }
}
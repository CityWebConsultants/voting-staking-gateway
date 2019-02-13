pragma solidity ^0.4.24;

contract StakingMock {    
    bool public valid;
    uint256 public mayUnstake;
    uint256 public staked;
    uint256 public oneMonth = 2630000;

    constructor(bool _valid, uint256 _mayUnstake) 
    public 
    {
        valid = _valid;
        mayUnstake = _mayUnstake;
        staked = 100;
    }

    function availableToUnstakeAt(address, uint256) 
    public
    view
    returns (uint256)
    {  
        return staked; // huh should this not be a number?
    }

    function totalStakedFor(address)
    public
    view
    returns (uint256)
    {  
        return staked;
    }

    function totalStakedForAt(address, uint256 _time)
    public
    view
    returns (uint256)
    {  
        if (_time >= now + oneMonth) {
            return staked / 2;
        }
        return staked;
    }

    function setValid(bool _valid)
    public
    {
        valid = _valid;
    }

    function setMayUnstake(uint256 _mayUnstake)
    public 
    {
        mayUnstake = _mayUnstake;
    }

    function setStake(uint256 _stake) 
    public 
    {
        staked = _stake;
    }
}
pragma solidity ^0.4.24;
// Adapted from ERC900 https://github.com/ethereum/EIPs/issues/900

contract StakingInterface {

    uint256 public totalStaked;
    
    // do we really need a total -- this is duplicate info -- can derive this from other metadata about event
    // should we havbe duration or time that maybe unstaked at 
    // either will not be a breaking change... come back
    event Staked(address indexed user, uint256 amount, uint256 stakeUntil, bool includesBonus);
    event Unstaked(address indexed user, uint256 amount);

    // @todo take out data -- we don't need it... pass in timeLength, hasBonus
    function stake(uint256 amount, uint256 time, bool claimBonus) public;
    function stakeFor(address user, uint256 amount, uint256 time, bool claimBonus) public;
    function unstake(uint256 amount) public;
    function totalStakedFor(address addr) public view returns (uint256);
    function getRate(uint256 time) public pure returns (uint256);
    
    function token() public view returns (address);

   //  function lastStakedFor(address addr) public view returns (uint256);
    // should add something for unstake at
    
    // function totalStakedForAt(address addr, uint256 blockNumber) public view returns (uint256);
    // function totalStakedAt(uint256 blockNumber) public view returns (uint256);
}
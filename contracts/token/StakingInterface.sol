pragma solidity ^0.4.24;

// Adapted from EIP900 draft
// @see https://github.com/ethereum/EIPs/issues/900
contract StakingInterface {

    uint256 public totalStaked;
    
    event Staked(address indexed user, uint256 amount, uint256 stakeUntil, bool hasBonus);
    event Unstaked(address indexed user, uint256 amount);

    function stake(uint256 amount, uint256 time, bool hasBonus) public;
    function unstake(uint256 amount) public;
    function totalStakedFor(address addr) public view returns (uint256);
    function getRate(uint256 time) public pure returns (uint256);
    function token() public view returns (address);

    function totalStakedForAt(address addr, uint256 time) public view returns (uint256);
    function availableToUnstake(address addr) public view returns (uint256);
    function availableToUnstakeAt(address addr, uint256 time) public view returns (uint256);
}
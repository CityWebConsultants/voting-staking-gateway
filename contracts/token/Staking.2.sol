pragma solidity 0.4.24;
// Adapted from Harbour prohect Stakebank https://github§§§.com/HarbourProject/stakebank/blob/development/contracts/StakeBank.sol
// declare interface for erc20 token
// we should NOT talk to the voting contract
// perhaphs include lifecycle lockable?
// should grab tests from the same location
// need to add additional 
// perhaps use different than lockable .... because we need time lock
// @todo grab tests and adapt https://github.com/HarbourProject/stakebank/blob/development/test/TestStakeBank.js
// If this uses block numbers
// using block numbers is the properly accurate way to do things
// make sure there is no conflict between how we are doing things here and how they are done elsewhere ie preSale...
// @todo refactor to put lifecycle inside of tokens

import "../lifecycle/Lockable.sol";
import "../ownership/Ownable.sol";
import "./ERC20.sol";
import "./StakingInterface.sol";
import "../math/SafeMath.sol";

contract Staking is StakingInterface, Lockable {

    using SafeMath for uint256;

   // uint256 totalStaked;

    // Used for history
    struct Checkpoint {
        uint256 at;
        uint256 amount;
    }

    // Used for accounting
    struct StakeItem {
        uint256 stakedAt; // timestamp, date of deposit
        uint256 stakeUntil; // timestamp, date of deposit
        uint256 amount; // current balance in this tranche...
    }

    ERC20 public token;

    Checkpoint[] public stakeHistory;
    
    mapping (address => stakeItem[]) public stakesFor;

    /// @param _token Token that can be staked.
    constructor(ERC20 _token) public {
        require(address(_token) != 0x0, "Empty address!");
        token = _token;
    }

    /// @notice Stakes a certain amount of tokens.
    /// @param amount Amount of tokens to stake.
    /// @param data Data field used for signalling in more complex staking applications.
    function stake(uint256 amount, bytes data) public {
        stakeFor(msg.sender, amount, data);
    }

    /// @notice Stakes a certain amount of tokens for another user.
    /// @param user Address of the user to stake for.
    /// @param amount Amount of tokens to stake.
    /// @param data Data field used for signalling in more complex staking applications.
    function stakeFor(address _user, uint256 _amount, bytes _data) public onlyWhenUnlocked {

        require(token.transferFrom(_user, address(this), _amount), "Unable to transfer tokens");
        
        uint256 stakeUntil = toUInt256(_data); // derive block height height from bytes --- block height

        stakesFor[_user].push({stakedAt: block.height, _amount: getRate(stakeUntil), stakedUntil: stakeUntil});
        updateCheckpointAtNow(stakeHistory, _amount, false);

        uint256 until = 1000000;

        emit Staked(_user, _amount, totalStakedFor(_user), _data);
    }

    // really should be able to cast this... what is the xor solution...


    function toUInt256(bytes _bytes) 
    private
    pure
    returns (uint256 timestamp){
        return (sliceUint(_bytes, 0));
    }

    // we are not collecting values here
    // we should demand it exactly matches the correct length
    // but need to experiment to get it to work
    function sliceUint(bytes bs, uint start)
    internal pure
    returns (uint)
    {
        require(bs.length >= start + 32, "slicing out of range");
        uint x;
        assembly {
            x := mload(add(bs, add(0x20, start)))
        }
        return x;
    }


    // could trat them as separate steaks so the first one found that was more than 0
    // but what if non zero
    // single digits is  enough to identify...





    /// @notice Unstakes a certain amount of tokens.
    /// @param amount Amount of tokens to unstake.
    /// @param data Data field used for signalling in more complex staking applications.
    function unstake(uint256 _amount, bytes _data) public {
        require(availableToWithdraw(_amount) > _amount, "Not enough funds");
        
        uint256 withdrawn = withdrawStake(msg.sender, _amount);
        require(withdrawn == _amount, "Cannot withdraw that amount"); // 8-?
        updateCheckpointAtNow(stakeHistory, amount, true);
        require(token.transfer(msg.sender, amount), "Unable to transfer tokens");

        emit Unstaked(msg.sender, amount, totalStakedFor(msg.sender), _data);

        // do we need to reduce the values 
        // yes because we have pockets of data left over
        //require(totalStakedFor(msg.sender) >= amount, "Attemping to unstake more than staked");
        // require(block.number >= lastStaked[msg.sender].add(10), "Attempting withdraw more than staked");

        //updateCheckpointAtNow(stakesFor[msg.sender], amount, true, 0);

        
       // require(token.transfer(msg.sender, amount), "Unable to transfer tokens");
     
        // This assumes we can unstake at any point and thus do not have tokens added in advance
        // So, we need to add tokens from somewhere to this amount
        // a lot of question marks so can't do that just now.
        // Add a way to differentiate between different stakes
        // Should do here, or should override the functions here depending
        // on what is happening...
    }

    /// @notice Returns total tokens staked for address.
    /// @param addr Address to check.
    /// @return amount of tokens staked.
    function totalStakedFor(address addr) public view returns (uint256) {
        Checkpoint[] storage stakes = stakesFor[addr];

        if (stakes.length == 0) {
            return 0;
        }

        return stakes[stakes.length-1].amount;
    }

    /// @notice Returns total tokens staked.
    /// @return amount of tokens staked.
    function totalStaked() public view returns (uint256) {
        return totalStakedAt(block.number);
    }

    /// @notice Returns if history related functions are implemented.
    /// @return Bool whether history is implemented.
    function supportsHistory() public pure returns (bool) {
        return true;
    }
    
    /// @notice Returns the token address.
    /// @return Address of token.
    function token() public view returns (address) {
        return token;
    }

    /// @notice Returns last block address staked at.
    /// @param addr Address to check.
    /// @return block number of last stake.
    function lastStakedFor(address addr) public view returns (uint256) {
        Checkpoint[] storage stakes = stakesFor[addr];

        if (stakes.length == 0) {
            return 0;
        }

        return stakes[stakes.length-1].at;
    }

    /// @notice Returns total amount of tokens staked at block for address.
    /// @param addr Address to check.
    /// @param blockNumber Block number to check.
    /// @return amount of tokens staked.
    function totalStakedForAt(address addr, uint256 blockNumber) public view returns (uint256) {
        return stakedAt(stakesFor[addr], blockNumber);
    }

    /// @notice Returns the total tokens staked at block.
    /// @param blockNumber Block number to check.
    /// @return amount of tokens staked.
    function totalStakedAt(uint256 blockNumber) public view returns (uint256) {
        return stakedAt(stakeHistory, blockNumber);
    }

    function updateCheckpointAtNow(Checkpoint[] storage history, uint256 amount, bool isUnstake, uint256 until) internal {

        uint256 length = history.length;
        if (length == 0) {
            history.push(Checkpoint({at: block.number, until:until, amount: amount}));
            return;
        }

        if (history[length-1].at < block.number) {
            history.push(Checkpoint({at: block.number, until: until, amount: history[length-1].amount}));
        }

        Checkpoint storage checkpoint = history[length];

        if (isUnstake) {
            checkpoint.amount = checkpoint.amount.sub(amount);
        } else {
            checkpoint.amount = checkpoint.amount.add(amount);
        }
    }

    // Perhaps adapt to unix time?
    // we should measure this in blocks rather than 
    // 
    function stakedAt(Checkpoint[] storage history, uint256 blockNumber) internal view returns (uint256) {
        uint256 length = history.length;

        if (length == 0 || blockNumber < history[0].at) {
            return 0;
        }

        if (blockNumber >= history[length-1].at) {
            return history[length-1].amount;
        }

        uint min = 0;
        uint max = length-1;
        while (max > min) {
            uint mid = (max + min + 1) / 2;
            if (history[mid].at <= blockNumber) {
                min = mid;
            } else {
                max = mid-1;
            }
        }

        return history[min].amount;
    }

    // feels like an uncessary burden on the user...
    // 3 months
    // would have to withdraw and restake 
    function availableToUnstake(address user)
    public
    view 
    returns (uint256)
    {
        uint256 available;
        StakeItem[] memory stakes = stakesFor[_user];
        uint256 length = stakesFor[_user].length;
        // @todo -- use Safe Math
        // Iterate over each and establish value
        for (uint i = 0; i < length-1; i++) {
            if (stakes[i].stakeUntil >= block.height) {
                available += stakes.amount;
            }
        }

        return available;
    }

    // abstract this in to some kind of iterator
    // wasting resource by iterating twice....
    // daily report...

    function withdrawStake(address user, uint256 _amount)
    private
    returns(uint256 amountUnstaked) 
    {
        // actually --- we need to put storage here
        // we're making changes
        // each tranche deserves and event...
        //withdrawStake(address user, uint256 _amount)
        require(availableToUnstake(user) >= _amount, "Not enough funds available");
        // we do twice the work... meh!!!
        StakeItem[] storage stakes = stakesFor[_user];
        uint256 length = stakesFor[_user].length;
        uint256 toWithdraw = _amount;

        for (uint256 i = 0; i < length-1; i++) {
            if (toWithdraw > 0 && stakes[i].amount >= toWithdraw) {
                stakes[i].amount -= toWithdraw;
                toWithdraw = 0;
            } else if (toWithdraw > 0 && stakes[i].amount > 0) {
                stakes[i].amount -= stakes[i].amount;
                toWithdraw -= stakes[i].amount;
            }
        }

        return (amount - toWithdraw);
    }

   // function reduceStakeBalance()

    function getRate (uint8 monthsToStake) 
    public 
    pure 
    returns (uint256) {
        if (monthsToStake == 0) {
            return 0;
        }
        if (monthsToStake == 6) {
            return 20;
        }
        if (monthsToStake == 9) {
            return 30;
        }
        if (monthsToStake == 9) {
            return 30;
        }
    }

    function calculateUnstakeTime(uint8 months)
    public
    pure
    returns(uint256 unstakeAtTimestamp) 
    {
        uint256 unixMonth = 2592000000;
        return months * unixMonth;
    }

    // timestamp
    function estimateBlockDistance(uint256 length)
    public
    pure
    returns(uint256 blockDistance)
    {
        return 14000 * length;
    }
}
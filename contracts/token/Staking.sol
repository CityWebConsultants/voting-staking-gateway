pragma solidity 0.4.24;
//@todo add docBlocks where none
// pragma experimental "ABIEncoderV2";
//@todo get this working piece by piece...
//use it on remix -- but need web for that... at least see if it compiles.

// 0x0000000000000000000000000000000000000000000000000000000000000001
// @todo and safety function to transfer back out tokens thar should n't be here!!!!



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
// could still take a single byte in months... and apply like this...
//
// @todo at no point do we lock -- when no funds left do not allow anyone to join...  

import "../lifecycle/Lockable.sol";
import "../ownership/Ownable.sol";
import "./ERC20Interface.sol";
import "./StakingInterface.sol";
import "../math/SafeMath.sol";

contract Staking is StakingInterface/*, Lockable */{
    //@todo use safe math
    using SafeMath for uint256;

    struct StakeEntry {
        uint256 stakedAt; // timestamp, date of deposit
        uint256 stakeUntil; // timestamp, date of deposit
        uint256 amount; // current balance in this tranche...
    }

    ERC20Interface public token;

    mapping (address => StakeEntry[]) public stakesFor;

    // add a parameter for number of bonus tokens...
    /// @param _token Token that can be staked.
    constructor(ERC20Interface _token) public {
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
    /// @param _user Address of the user to stake for.
    /// @param _amount Amount of tokens to stake.
    /// @param _data Data field used for signalling in more complex staking applications.
    function stakeFor(address _user, uint256 _amount, bytes _data) public /* onlyWhenUnlocked*/ {
        // @todo ensure there are enough funds that a user can withdraw full amount
        // check required number of tokens exist to fulfill
        // make sure there are enough tokens for this user to stake
        uint256 stakeUntil = toUint256(_data);
        uint256 rate = 10; // <--- put this back getRate(stakeUntil);
        uint256 amount = _amount + (_amount * rate / 100);

        require(token.balanceOf(address(this)) >= totalStaked + amount, "Not enough funds to pay out stake");
        require(token.transferFrom(_user, address(this), _amount), "Unable to transfer tokens");
        
        // derive block height height from bytes --- block height

        // we have to calculate block height here
        // and also add safemath
        // maybe do away with locking...
        // should this have an expiration time
        // perhaps admin should be able to delete the contract when all the funds are gone
        // hmmmmmmm

        StakeEntry memory stakeItem;

        stakeItem.stakedAt = block.number;
        stakeItem.amount = amount;
        stakeItem.stakeUntil = stakeUntil;

        stakesFor[_user].push(stakeItem);

        totalStaked += amount;

        emit Staked(_user, _amount, totalStakedFor(_user), _data);
    }

    function toUint256(bytes _bytes)
    internal
    pure
    returns (uint256 blockHeight) {
        require(_bytes.length <= 32, "slicing out of range");
        uint256 x;
        assembly { // solium-disable-line security/no-inline-assembly
            x := mload(add(_bytes, 0x20))
        }
        return x;
    }

    /// @notice Unstakes a certain amount of tokens.
    /// @param _amount Amount of tokens to unstake.
    /// @param _data Data field used for signalling in more complex staking applications.
    function unstake(uint256 _amount, bytes _data) 
    public 
    {
        require(withdrawStake(msg.sender, _amount), "Unable to withdraw that amount");
        require(token.transfer(msg.sender, _amount), "Unable to transfer tokens");

        totalStaked -= _amount;

        emit Unstaked(msg.sender, _amount, totalStakedFor(msg.sender), _data);
    }

    /// @notice Returns total tokens staked for address.
    /// @param _addr Address to check.
    /// @return amount of tokens staked.
    function totalStakedFor(address _addr) public view returns (uint256) {
        StakeEntry[] memory stakes = stakesFor[_addr];
        uint256 amountStaked;
        for (uint256 i = 0; i < stakes.length; i++) {
            amountStaked += stakes[i].amount;
        }
        return amountStaked;
    }

    // @notice Returns total tokens staked.
    // @return amount of tokens staked.
    // function totalStaked() public view returns (uint256) {
    //     return totalStakedAt(block.number);
    // }

    /// @notice Returns if history related functions are implemented.
    /// @return Bool whether history is implemented.
    function supportsHistory() public pure returns (bool) {
        return false;
    }
    
    /// @notice Returns the token address.
    /// @return Address of token.
    function token() public view returns (address) {
        return token;
    }

    // feels like an uncessary burden on the user...
    // 3 months
    // would have to withdraw and restake 
    function availableToUnstake(address _user)
    public
    view 
    returns (uint256)
    {
        uint256 available;
        StakeEntry[] memory stakes = stakesFor[_user];

        // @todo -- use Safe Math
        // Iterate over each and establish value
        for (uint256 i = 0; i < stakes.length; i++) {
            if (stakes[i].stakeUntil <= block.number) {
                available += stakes[i].amount;
            }
        }

        return available;
    }
    
    // @todo should consider some kind of iterator - we have a lot of repition
    // We should rename this is as it does not actually withdrw stake...
    function withdrawStake(address _user, uint256 _amount)
    private
    returns(bool)
    {
        // bytes array containing. 
        // @todo require(availableToUnstake(_user) >= _amount, "Attempted to unstake more tokens than available.");
        require(_amount > 0, "Amount must be greater than 0");
        StakeEntry[] storage stakes = stakesFor[_user];
        uint256 toWithdraw = _amount;
        uint256 withdrawn = 0;

        for (uint256 i = 0; i < stakes.length; i++) {
            if (stakes[i].stakeUntil <= block.number) {
                if (stakes[i].amount >= toWithdraw) {
                    // easy for there to be a bug here
                    // it's unclear what is happening here
                    // need to change logic...
                    withdrawn = stakes[i].amount -= toWithdraw; // reduce stake and withdraw 
                    // stakes[i].amount -= toWithdraw; 
                    toWithdraw -= withdrawn;
                }
            }
        }

        return (toWithdraw == 0 && withdrawn == _amount);
    }

    // test to assert constants
    function getRate (uint256 blocksToStake) 
    public 
    pure
    returns (uint256 rate) {
        // seconds in month / blocktime === 2629746 / 15;
        uint256 blocksInMonth = 175316;

        require(blocksToStake < blocksInMonth * 25, "Cannot stake for this long");

        if (blocksToStake == 0) {
            return 0;
        }

        // Just because of the way things work -- can't get code coverage...
        if (blocksToStake >= 6 * blocksInMonth && blocksToStake < 9 * blocksInMonth) {
            return 20;
        }

        if (blocksToStake >= 9 * blocksInMonth && blocksToStake < 12 * blocksInMonth) {
            return 30;
        }

        if (blocksToStake >= 12 * blocksInMonth && blocksToStake < 18 * blocksInMonth) {
            return 50;
        }

        if (blocksToStake >= 18 * blocksInMonth && blocksToStake < 24 * blocksInMonth) {
            return 75;
        }

        if (blocksToStake >= 24 * blocksInMonth && blocksToStake < 25 * blocksInMonth) {
            return 100;
        }
    }


/*
    function withdrawAllAvailable() {

    }
*/


/*
   // function reduceStakeBalance()

    // change this to blockheight calculations


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

    **/
}

/*
    // really should be able to cast this... what is the xor solution...
    function toUInt256(bytes _bytes) 
    private
    pure
    returns (uint256 timestamp){
        return (sliceUint(_bytes, 0));
    }

    // @todo tighten up the assembly so we can rely on only a uint - nothing more and nothing less...

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

    */

        // // @notice Returns last block address staked at.
    // // @param addr Address to check.
    // // @return block number of last stake.
    // function lastStakedFor(address addr) public view returns (uint256) {
    //     Checkpoint[] storage stakes = stakesFor[addr];

    //     if (stakes.length == 0) {
    //         return 0;
    //     }

    //     return stakes[stakes.length-1].at;
    // }

    // // @notice Returns total amount of tokens staked at block for address.
    // // @param addr Address to check.
    // // @param blockNumber Block number to check.
    // // @return amount of tokens staked.
    // function totalStakedForAt(address addr, uint256 blockNumber) public view returns (uint256) {
    //     return stakedAt(stakesFor[addr], blockNumber);
    // }

    // // @notice Returns the total tokens staked at block.
    // // @param blockNumber Block number to check.
    // // @return amount of tokens staked.
    // function totalStakedAt(uint256 blockNumber) public view returns (uint256) {
    //     // uhm.....
    //     // return stakedAt(stakeHistory, blockNumber);
    //     return 1;
    // }

    // function updateCheckpointAtNow(Checkpoint[] storage history, uint256 amount, bool isUnstake, uint256 until) internal {

    //     uint256 length = history.length;
    //     if (length == 0) {
    //         history.push(Checkpoint({at: block.number, until:until, amount: amount}));
    //         return;
    //     }

    //     if (history[length-1].at < block.number) {
    //         history.push(Checkpoint({at: block.number, until: until, amount: history[length-1].amount}));
    //     }

    //     Checkpoint storage checkpoint = history[length];

    //     if (isUnstake) {
    //         checkpoint.amount = checkpoint.amount.sub(amount);
    //     } else {
    //         checkpoint.amount = checkpoint.amount.add(amount);
    //     }
    // }

    // Perhaps adapt to unix time?
    // we should measure this in blocks rather than 
    // 
    // function stakedAt(Checkpoint[] storage history, uint256 blockNumber) internal view returns (uint256) {
    //     uint256 length = history.length;

    //     if (length == 0 || blockNumber < history[0].at) {
    //         return 0;
    //     }

    //     if (blockNumber >= history[length-1].at) {
    //         return history[length-1].amount;
    //     }

    //     uint min = 0;
    //     uint max = length-1;
    //     while (max > min) {
    //         uint mid = (max + min + 1) / 2;
    //         if (history[mid].at <= blockNumber) {
    //             min = mid;
    //         } else {
    //             max = mid-1;
    //         }
    //     }

    //     return history[min].amount;
    // }   
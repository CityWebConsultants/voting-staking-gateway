pragma solidity 0.4.24;
//@todo add docBlocks where none
// @todo add safemath
// lock? destruction?
// document interface
// import "../lifecycle/Lockable.sol";
// import "../ownership/Ownable.sol";
import "./ERC20Interface.sol";
import "./StakingInterface.sol";
//import "../math/SafeMath.sol";

contract Staking is StakingInterface/*, Lockable */{
    //@todo use safe math
    // using SafeMath for uint256;

    struct StakeEntry {
        uint256 stakedAt; // timestamp, date of deposit
        uint256 stakeUntil; // timestamp, date of deposit
        uint256 amount; // current balance in this tranche...
    }

    ERC20Interface public token;

    mapping (address => StakeEntry[]) public stakesFor;

    event debugUint(string msg, uint256);


    /// @param _token Token that can be staked.
    constructor(ERC20Interface _token) public {
        require(address(_token) != 0x0, "Empty address!");
        token = _token;
        // @todo consider destruction
        // @todo consider owner
    }
 
    /// @notice Stakes a certain amount of tokens.
    /// @param _amount Amount of tokens to stake.
    /// @param _time Length of time in seconds to take for.
    /// @param _claimBonus Whether a bonus should be applied.
    function stake(uint256 _amount, uint256 _time, bool _claimBonus) public {
        stakeFor(msg.sender, _amount, _time, _claimBonus);
    }

    /// @notice Stakes a certain amount of tokens for another user.
    /// @param _user Address of the user to stake for.
    /// @param _amount Amount of tokens to stake.
    /// @param _time Length of time in seconds to take for.
    /// @param _claimBonus Whether a bonus should be applied.
    function stakeFor(address _user, uint256 _amount, uint256 _time, bool _claimBonus) 
    public /* onlyWhenUnlocked*/ 
    {
        // @todo ensure there are enough funds that a user can withdraw full amount
        // check required number of tokens exist to fulfill
        // make sure there are enough tokens for this user to stake
        uint256 stakeUntil = (_time + block.timestamp); //solium-disable-line security/no-block-members

        // that way could recreate all that has happened from receipts
        // @todo rename this to avoid similarity to _amount
        uint256 rate = getRate(_time);
        uint256 amount;
        if (_claimBonus == true) {
            amount = _amount + (_amount * rate / 100);
        } else {
            amount = _amount;
        }

        // Continue only if there are enough funds to cover bonus
        require(token.balanceOf(address(this)) >= totalStaked + amount, "Not enough funds to pay out stake");
        require(token.transferFrom(_user, address(this), _amount), "Unable to transfer tokens");
    
        StakeEntry memory stakeItem = StakeEntry(block.timestamp, stakeUntil, amount); //solium-disable-line security/no-block-members
/*
        // can we pass this as an object rather than adding properties separately
        stakeItem.stakedAt = block.timestamp; //solium-disable-line security/no-block-members
        stakeItem.amount = amount;
        stakeItem.stakeUntil = stakeUntil;
*/
        stakesFor[_user].push(stakeItem);

        totalStaked += amount;
        // deposited... bonus... available to withdraw // should this be claimed or includesBonus
        emit Staked(_user, _amount, stakeUntil, _claimBonus);
    }

    /// @notice Unstakes a certain amount of tokens.
    /// @param _amount Amount of tokens to unstake.
    function unstake(uint256 _amount) 
    public 
    {   

        // may as well combine unstake and withdraw stake -- theres an artifciual separatop
        require(withdrawStake(msg.sender, _amount), "Unable to withdraw that amount"); // but it could also be for other rea
        require(token.transfer(msg.sender, _amount), "Unable to transfer tokens");

        totalStaked -= _amount;
        // is it worth including how much a users total remaning stake is when that information can easily be derived?
        emit Unstaked(msg.sender, _amount);
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
/*
    /// @notice Returns if history related functions are implemented.
    /// @return Bool whether history is implemented.
    function supportsHistory() public pure returns (bool) {
        return false;
    }
    */
    /// @notice Returns the token address.
    /// @return Address of token.
    function token() 
    public 
    view 
    returns (address) 
    {
        return token;
    }

    /// @notice Returns the token address.
    /// @param _user Address of staker
    /// @return Address of token.
    function availableToUnstake(address _user)
    public
    view 
    returns (uint256)
    {
        uint256 available;
        StakeEntry[] memory stakes = stakesFor[_user];

        // @todo -- use Safe Math
        // Iterate over each and establish value
        // could there be any issue arising form less than or equal to 
        // perhaps should be just be less than
        for (uint256 i = 0; i < stakes.length; i++) {
            if (stakes[i].stakeUntil <= block.timestamp) { //solium-disable-line security/no-block-members
                available += stakes[i].amount;
            }
        }

        return available;
    }

    // perhaps could just be same as above but wrap a param
    // @todo add this back in later
/*
    function availableToUnstakeAt(address _user, uint256 _time) 
    public 
    view
    returns (uint256 amount) 
    {
        return availableToStake
    }
  */
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
        // is this the correct 
        for (uint256 i = 0; i < stakes.length; i++) {
            // emit debugUint("block", block.timestamp);
            // emit debugUint("until", stakes[i].stakeUntil);
            if (stakes[i].stakeUntil <= block.timestamp) { //solium-disable-line security/no-block-members
                if (stakes[i].amount >= toWithdraw) {
                    stakes[i].amount -= toWithdraw;
                    withdrawn = toWithdraw;
                    toWithdraw = 0;
                }
                else if (stakes[i].amount > 0 && stakes[i].amount < toWithdraw) {
                    withdrawn = stakes[i].amount;
                    stakes[i].amount = 0;
                    toWithdraw = toWithdraw - withdrawn;
                }
            }
        }

        return (toWithdraw == 0 && withdrawn == _amount);
    }

    // test to assert constants
    function getRate (uint256 _timeLength) 
    public 
    pure
    returns (uint256 rate) {

        uint256  secondsInMonth = 2629746; // should this be seconds or milliseconds?

        require(_timeLength < secondsInMonth * 25, "Cannot stake for this long");

        if (_timeLength == 0) {
            return 0;
        }
        
        if (_timeLength >= 6 * secondsInMonth && _timeLength < 9 * secondsInMonth) {
            return 20;
        }

        if (_timeLength >= 9 * secondsInMonth && _timeLength < 12 * secondsInMonth) {
            return 30;
        }

        if (_timeLength >= 12 * secondsInMonth && _timeLength < 18 * secondsInMonth) {
            return 50;
        }

        if (_timeLength >= 18 * secondsInMonth && _timeLength < 24 * secondsInMonth) {
            return 75;
        }

        if (_timeLength >= 24 * secondsInMonth && _timeLength < 25 * secondsInMonth) {
            return 100;
        }
    }
/*
    function withdrawAllAvailable() {

    }
*/
/*
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
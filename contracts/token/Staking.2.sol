pragma solidity 0.4.24;
//@todo get this working piece by piece...
//use it on remix -- but need web for that... at least see if it compiles.

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

import "../lifecycle/Lockable.sol";
import "../ownership/Ownable.sol";
import "./ERC20.sol";
import "./StakingInterface.sol";
import "../math/SafeMath.sol";

contract Staking is StakingInterface, Lockable {

    using SafeMath for uint256;

   // uint256 totalStaked;

    // Used for history
    // struct Checkpoint {
    //     uint256 at;
    //     uint256 amount;
    // }
    // All of the history can be established from history
    // so we don't really need it. We just need running totals...
    // as long as it is captured in events -- it can be reconstructed, we dotn have to use it here


    // Used for accounting
    struct StakeEntry {
        uint256 stakedAt; // timestamp, date of deposit
        uint256 stakeUntil; // timestamp, date of deposit
        uint256 amount; // current balance in this tranche...
    }

    ERC20 public token;

    // we should also keep a stake history? read what the form on it should be
    //Checkpoint[] public stakeHistory;
    
    mapping (address => StakeEntry[]) public stakesFor;

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
        // check required number of tokens exist to fulfill
        require(token.transferFrom(_user, address(this), _amount), "Unable to transfer tokens");
        
        uint256 stakeUntil = toUInt256(_data); // derive block height height from bytes --- block height

        uint256 rate = getRate(stakeUntil);
        uint256 amount = _amount + (_amount / rate * 100);

        // had to change initialisation =of this object because passsing in an object literal has issues.
       // this is poor tho, so should figure out what the problem was and go back... 
        StakeEntry memory stakeItem;
        stakeItem.stakedAt = block.number;
        stakeItem.amount = amount; 
        stakeItem.stakeUntil = stakeUntil;
    
        stakesFor[_user].push(stakeItem);
       
       // stakesFor[_user].push({stakedAt: block.number, amount: amount, stakedUntil: stakeUntil});
        totalStaked += amount;
        // updateCheckpointAtNow(stakeHistory, _amount, false);
        // so when we measure this waht if it takes a while for a block to get mined?
        // uint256 until = 1000000;

        emit Staked(_user, _amount, totalStakedFor(_user), _data);
    }

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

    /// @notice Unstakes a certain amount of tokens.
    /// @param amount Amount of tokens to unstake.
    /// @param data Data field used for signalling in more complex staking applications.
    function unstake(uint256 _amount, bytes _data) 
    public 
    {
        // is it extreme to put these 3 requires in this way?
        require((availableToUnstake(msg.sender) > _amount), "Not enough funds");
        require(withdrawStake(msg.sender, _amount), "Unable to withdraw");
        require(token.transfer(msg.sender, _amount), "Unable to transfer tokens");

        totalStaked -= _amount;
        emit Unstaked(msg.sender, _amount, totalStakedFor(msg.sender), _data);
    }

    /// @notice Returns total tokens staked for address.
    /// @param addr Address to check.
    /// @return amount of tokens staked.
    function totalStakedFor(address _addr) public view returns (uint256) {
        StakeEntry[] storage stakes = stakesFor[_addr];
        uint256 amountStaked;
        for (uint256 i = 0; i < stakes.length; i++) {
            amountStaked += stakes[i].amount;
        }
        return amountStaked;
    }

    /// @notice Returns total tokens staked.
    /// @return amount of tokens staked.
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

    // /// @notice Returns last block address staked at.
    // /// @param addr Address to check.
    // /// @return block number of last stake.
    // function lastStakedFor(address addr) public view returns (uint256) {
    //     Checkpoint[] storage stakes = stakesFor[addr];

    //     if (stakes.length == 0) {
    //         return 0;
    //     }

    //     return stakes[stakes.length-1].at;
    // }

    // /// @notice Returns total amount of tokens staked at block for address.
    // /// @param addr Address to check.
    // /// @param blockNumber Block number to check.
    // /// @return amount of tokens staked.
    // function totalStakedForAt(address addr, uint256 blockNumber) public view returns (uint256) {
    //     return stakedAt(stakesFor[addr], blockNumber);
    // }

    // /// @notice Returns the total tokens staked at block.
    // /// @param blockNumber Block number to check.
    // /// @return amount of tokens staked.
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
        uint256 length = stakesFor[_user].length;
        // @todo -- use Safe Math
        // Iterate over each and establish value
        for (uint i = 0; i < length-1; i++) {
            if (stakes[i].stakeUntil >= block.number) {
                available += stakes[i].amount;
            }
        }

        return available;
    }

    // abstract this in to some kind of iterator
    // wasting resource by iterating twice....
    // daily report...

    function withdrawStake(address _user, uint256 _amount)
    private
    returns(bool)
    {
        // bytes array containing. 
        require(availableToUnstake(_user) >= _amount, "Attempted to unstake more tokens than available.");

        StakeEntry[] storage stakes = stakesFor[_user];
        uint256 length = stakes.length;
        uint256 toWithdraw = _amount;

        for (uint256 i = 0; i < length; i++) {
            if (toWithdraw > 0 && stakes[i].stakeUntil >= block.number) {
                if (stakes[i].amount >= toWithdraw) {
                    stakes[i].amount -= toWithdraw;
                    toWithdraw = 0;
                } else if (stakes[i].amount > 0) {
                    stakes[i].amount = 0;
                    toWithdraw -= stakes[i].amount;
                }
            }
        }
        
        // Don't trusy own logic, so if something fucks up, roll it all back.
        require(_amount == toWithdraw, "Not enough funds to withdraw");
        return true;
        // We should fire an event here
    }

   // function reduceStakeBalance()

    // change this to blockheight calculations
    function getRate (uint256 monthsToStake) 
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
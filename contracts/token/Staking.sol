pragma solidity 0.4.24;
// @todo add safemath
// import "../ownership/Ownable.sol";
import "./ERC20Interface.sol";
import "./StakingInterface.sol";
//import "../math/SafeMath.sol";
// test limit
// access to remove bonus tokens
// add multisig to withdraw all funds
// @todo consider hardcoding boundaries of time
// so that we can do a get and figure out the exact wtidrawl data
// @todo extend time doesn't work past 0 bonus stakes --- consider removing -- get an opinion 
// Should be able to interrogate what value of return will by doing a call!!!!!!


contract Staking is StakingInterface {
    //@todo use safe math
    // using SafeMath for uint256;

    struct StakeEntry {
        uint256 stakedAt; // timestamp, date of deposit
        uint256 stakeUntil; // timestamp, available to withdraw
        uint256 amount; // current balance in this tranche...
    }

    ERC20Interface public token;
    uint256 public availableBonusTokens;

    mapping (address => StakeEntry[]) public stakesFor;

    event debugUint(string msg, uint256);
    event ExtendTime(uint256 extendedBy, uint256 trancheId);
    // uhm... how is this applied to those with bonus 

    /// @param _token Token that can be staked.
    constructor(ERC20Interface _token) public {
        require(address(_token) != 0x0, "Empty address!");
        token = _token;
        // @todo consider destruction
        // @todo consider owner
    }
 
    function depositBonusTokens(uint256 _amount)
    public
    {   
        availableBonusTokens += _amount;
        require(token.transferFrom(msg.sender, address(this), _amount), "Unable to transfer tokens");
    }

    /// @notice Stakes a certain amount of tokens.
    /// @param _amount Amount of tokens to stake.
    /// @param _time Length of time in seconds to take for.
    /// @param _claimBonus Whether a bonus should be applied.
    function stake(uint256 _amount, uint256 _time, bool _claimBonus) public {
        stakeFor(msg.sender, _amount, _time, _claimBonus);
    }

    // Consider using ENUM && or Array of numbers.... same as but easier than using assembly
    // uint[] _options,
    /// @notice Stakes a certain amount of tokens for another user.
    /// @param _user Address of the user to stake for.
    /// @param _amount Amount of tokens to stake.
    /// @param _time Length of time in seconds to take for.
    /// @param _claimBonus Whether a bonus should be applied.
    function stakeFor(address _user, uint256 _amount, uint256 _time, bool _claimBonus) 
    public
    {
        uint256 stakeUntil = (_time + block.timestamp); //solium-disable-line security/no-block-members
        // @todo rename amount to disambiguate
        uint256 rate = getRate(_time);
        uint256 amount;

        uint256 bonus = _amount * rate / 100;

        if (_claimBonus == true) {
            // @todo check this for re-entrance issues
            require(availableBonusTokens >= bonus, "Not enough bonus tokens left to pay out");
            amount = _amount + bonus;
            availableBonusTokens -= bonus;
        } else {
            amount = _amount;
        }
        // check bonus amount against remaining bonus before applying
        // require(token.balanceOf(address(this)) >= totalStaked + amount, "Not enough funds to pay out stake");
        require(token.transferFrom(_user, address(this), _amount), "Unable to transfer tokens");
    
        StakeEntry memory stakeItem = StakeEntry(block.timestamp, stakeUntil, amount); //solium-disable-line security/no-block-members
        stakesFor[_user].push(stakeItem);
        totalStaked += amount;

        emit Staked(_user, amount, stakeUntil, _claimBonus);
    }

    /// @notice Unstakes a certain amount of tokens.
    /// @param _amount Amount of tokens to unstake.
    function unstake(uint256 _amount) 
    public 
    {   
        require(withdrawStake(msg.sender, _amount), "Unable to withdraw");
        require(token.transfer(msg.sender, _amount), "Unable to transfer tokens");

        totalStaked -= _amount;

        emit Unstaked(msg.sender, _amount);
    }

    /// @notice Amount locked in contract at given time.
    /// @param _addr address of stakee
    /// @param _time timestamp to check for locked state
    /// @return amount  
    function totalStakedForAt(address _addr, uint256 _time)
    public
    view 
    returns (uint256 amount)
    {
        // @q -- do we need to define amount
        // Already gets created in memory when set as a return value
        StakeEntry[] memory stakes = stakesFor[_addr];
        for (uint256 i = 0; i < stakes.length; i++) {
            if (stakes[i].stakeUntil > _time) { //solium-disable-line security/no-block-members
                amount += stakes[i].amount;
            }
        }
        return amount;   
    }

    /// @notice internal accounting of token withdrawal
    /// @param _user Address of withdrawee
    /// @param _amount Amount to unstake
    function withdrawStake(address _user, uint256 _amount)
    private
    returns(bool)
    {
        require(_amount > 0, "Amount must be greater than 0");
        StakeEntry[] storage stakes = stakesFor[_user];
        uint256 toWithdraw = _amount;
        uint256 withdrawn = 0;

        // @todo consider refactoring (do..while) for efficiency
        for (uint256 i = 0; i < stakes.length; i++) {

            if (stakes[i].stakeUntil <= block.timestamp) { //solium-disable-line security/no-block-members
                if (toWithdraw > 0 && stakes[i].amount >= toWithdraw) {
                    stakes[i].amount -= toWithdraw;
                    withdrawn += toWithdraw;
                    toWithdraw = 0;
                }
                else if (stakes[i].amount > 0 && stakes[i].amount < toWithdraw) {
                    withdrawn += stakes[i].amount;
                    toWithdraw -= stakes[i].amount;
                    stakes[i].amount = 0;
                }
            }
        }

        return (toWithdraw == 0 && withdrawn == _amount);
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
    public // @todo this should call the next
    view 
    returns (uint256)
    {
        return availableToUnstakeAt(_user, block.timestamp);
    }

    function availableToUnstakeAt(address _user, uint256 _time) 
    public 
    view
    returns (uint256 amount) 
    {
        uint256 available;
        StakeEntry[] memory stakes = stakesFor[_user];
        for (uint256 i = 0; i < stakes.length; i++) {
            if (stakes[i].stakeUntil <= _time) { //solium-disable-line security/no-block-members
                available += stakes[i].amount;
            }
        }
        return available;   
    }
    
    //@todo test
    // Cover edge cases where a user requires lock to complete other action when initial staking period ends
    // does not include additonal bonus
    // is there anyway to explot this?
    function extendStakingDuration(uint256 _duration, uint256 _trancheId)
        public
        returns (bool) {
        stakesFor[msg.sender][_trancheId].stakeUntil += _duration;
        emit ExtendTime(stakesFor[msg.sender][_trancheId].stakeUntil, _trancheId);
        return true; // or we could return the timestamp
    }

    /// @notice set rate
    /// @param _timeLength Length of time a user has staked for
    function getRate (uint256 _timeLength) 
    public 
    pure
    returns (uint256 rate) {
        uint256  secondsInMonth = 2592000; // based on a 30 day month

        require(_timeLength < secondsInMonth * 25, "Cannot stake for this long");
        
        // if (_timeLength >= 0 && _timeLength <= 6) {
        //     return 0;
        // }
    
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

        return 0;
    }
}

  
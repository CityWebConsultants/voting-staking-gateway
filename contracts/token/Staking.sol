pragma solidity 0.4.24;
// @todo add safemath
// import "../ownership/Ownable.sol";
import "./ERC20Interface.sol";
import "./StakingInterface.sol";
    //import "../math/SafeMath.sol";

contract Staking is StakingInterface {
    //@todo use safe math
    // using SafeMath for uint256;

    struct StakeEntry {
        uint256 stakedAt; // timestamp, date of deposit
        uint256 stakeUntil; // timestamp, available to withdraw
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
    public
    {
        uint256 stakeUntil = (_time + block.timestamp); //solium-disable-line security/no-block-members
        // @todo rename amount var to disambiguate
        uint256 rate = getRate(_time);
        uint256 amount;

        if (_claimBonus == true) {
            amount = _amount + (_amount * rate / 100);
        } else {
            amount = _amount;
        }

        // actually -- the total amount is not important -- what is important is the rate...
        // this is a flaw.
        // we don't care about the principle amount -- we should apply this logic to the added rate
        // hmmmmmm... that raises the issue -- how do we track only 
        require(token.balanceOf(address(this)) >= totalStaked + amount, "Not enough funds to pay out stake");
        require(token.transferFrom(_user, address(this), _amount), "Unable to transfer tokens");
    
        StakeEntry memory stakeItem = StakeEntry(block.timestamp, stakeUntil, amount); //solium-disable-line security/no-block-members
        stakesFor[_user].push(stakeItem);
        totalStaked += amount;

        emit Staked(_user, _amount, stakeUntil, _claimBonus);

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

        // @TODO this would be better as a do while so we don't execute more than necessary
        // refactor a little to make more efficent
        for (uint256 i = 0; i < stakes.length; i++) {
            // emit debugUint("block", block.timestamp);
            // emit debugUint("until", stakes[i].stakeUntil);
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
    public
    view 
    returns (uint256)
    {
        uint256 available;
        StakeEntry[] memory stakes = stakesFor[_user];
        for (uint256 i = 0; i < stakes.length; i++) {
            if (stakes[i].stakeUntil <= block.timestamp) { //solium-disable-line security/no-block-members
                available += stakes[i].amount;
            }
        }

        return available;
    }


    /// @notice set rate
    /// @param _timeLength Length of time a user has staked for
    function getRate (uint256 _timeLength) 
    public 
    pure
    returns (uint256 rate) {
        uint256  secondsInMonth = 2629746; 

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
}

/*
    function availableToUnstakeAt(address _user, uint256 _time) 
    public 
    view
    returns (uint256 amount) 
    {
        return availableToStake
    }
  */
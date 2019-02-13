pragma solidity 0.4.24;

import "./ERC20Interface.sol";
import "./StakingInterface.sol";
import "../math/SafeMath.sol";
import "../MultiSigWallet.sol";

contract Staking is StakingInterface, MultiSigWallet {

    using SafeMath for uint256;

    struct StakeEntry {
        uint256 stakedAt; // timestamp, date of deposit
        uint256 stakeUntil; // timestamp, available to withdraw
        uint256 amount; // redeemable value in this tranche.
    }

    ERC20Interface public token;

    uint256 public availableBonusTokens;
    // 30 days in seconds
    uint256 public constant month = 30 days; //2592000;

    mapping (address => StakeEntry[]) public stakesFor;

    event debugUint(string msg, uint256);

    ///@param _token Token that can be staked.
    constructor(ERC20Interface _token, address[] _signers, uint256 _required) MultiSigWallet(_signers, _required)
    public 
     {
        require(address(_token) != 0x0, "Empty address!");
        token = _token;
    }

    ///@notice all ur eth r not belong to us
    function () 
    public
    payable {
        revert("Contract does not accept Ether");
    }
    
    ///@notice Transfer tokens from sender to this contract
    ///@param _amount of tokens to deposit
    function depositBonusTokens(uint256 _amount)
    public
    {   
        availableBonusTokens = availableBonusTokens.add(_amount);
        require(token.transferFrom(msg.sender, address(this), _amount), "Unable to transfer tokens");
    }

    ///@notice Stakes a certain amount of tokens.
    ///@param _amount Amount of tokens to stake.
    ///@param _time Length of time in seconds to take for.
    ///@param _claimBonus Whether a bonus should be applied.
    function stake(uint256 _amount, uint256 _time, bool _claimBonus) public {

        require(_time < month.mul(25), "Cannot stake for this long");

        uint256 stakeUntil = (_time + block.timestamp); //solium-disable-line security/no-block-members
        uint256 rate = getRate(_time);
        uint256 amount;
        // @todo safe math
        uint256 bonus = _amount * rate / 100;

        if (_claimBonus == true) {
            // @todo check this for re-entrance issues
            require(availableBonusTokens >= bonus, "Not enough bonus tokens left to pay out");
            amount = _amount + bonus;
            availableBonusTokens -= bonus;
        } else {
            amount = _amount;
        }

        require(token.transferFrom(msg.sender, address(this), _amount), "Unable to transfer tokens");

        StakeEntry memory stakeItem = StakeEntry(block.timestamp, stakeUntil, amount); //solium-disable-line security/no-block-members
        stakesFor[msg.sender].push(stakeItem);
        totalStaked = totalStaked.add(amount);

        emit Staked(msg.sender, amount, stakeUntil, _claimBonus);
    }

    ///@notice Unstakes a certain amount of tokens.
    ///@param _amount Amount of tokens to unstake.
    function unstake(uint256 _amount) 
    public 
    {   
        require(withdrawStake(msg.sender, _amount), "Unable to withdraw");
        require(token.transfer(msg.sender, _amount), "Unable to transfer tokens");

        totalStaked = totalStaked.sub(_amount);

        emit Unstaked(msg.sender, _amount);
    }

    ///@notice Amount locked in contract at given time.
    ///@param _addr address of stakee
    ///@param _time timestamp to check for locked state
    ///@return amount  
    function totalStakedForAt(address _addr, uint256 _time)
    public
    view 
    returns (uint256 amount)
    {
        //@q? Is it acceptable to let amount be defined in return value statement and not in body of function?
        StakeEntry[] memory stakes = stakesFor[_addr];
        for (uint256 i = 0; i < stakes.length; i++) {
            if (stakes[i].stakeUntil > _time) { //solium-disable-line security/no-block-members
                amount = amount.add(stakes[i].amount);
            }
        }

        return amount;   
    }

    ///@notice internal accounting of token withdrawal
    ///@param _user Address of withdrawee
    ///@param _amount Amount to unstake
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
                    stakes[i].amount = stakes[i].amount.sub(toWithdraw);
                    withdrawn = withdrawn.add(toWithdraw);
                    toWithdraw = 0;
                }
                else if (stakes[i].amount > 0 && stakes[i].amount < toWithdraw) {
                    withdrawn = withdrawn.add(stakes[i].amount);
                    toWithdraw = toWithdraw.sub(stakes[i].amount);
                    stakes[i].amount = 0;
                }
            }
        }

        return (toWithdraw == 0 && withdrawn == _amount);
    }


    ///@notice Returns total tokens staked for address.
    ///@param _addr Address to check.
    ///@return amount of tokens staked.
    function totalStakedFor(address _addr) public view returns (uint256) {
        StakeEntry[] memory stakes = stakesFor[_addr];
        uint256 amountStaked;
        for (uint256 i = 0; i < stakes.length; i++) {
            amountStaked = amountStaked.add(stakes[i].amount);
        }
        return amountStaked;
    }

    ///@notice Returns the token address.
    ///@return Address of token contract.
    function token() 
    public 
    view 
    returns (address) 
    {
        return token;
    }

    ///@notice Returns the token address.
    ///@param _user Address of staker
    ///@return Address of token.
    function availableToUnstake(address _user)
    public // @todo this should call the next
    view 
    returns (uint256)
    {
        return availableToUnstakeAt(_user, block.timestamp);
    }

    ///@notice Get amount available to unstake at a given time
    ///@param _user Address of staker
    ///@param _time The time at which funds may be unstaked
    ///@return Amount available to unstake
    function availableToUnstakeAt(address _user, uint256 _time) 
    public 
    view
    returns (uint256 amount) 
    {
        uint256 available;
        StakeEntry[] memory stakes = stakesFor[_user];
        for (uint256 i = 0; i < stakes.length; i++) {
            if (stakes[i].stakeUntil <= _time) { //solium-disable-line security/no-block-members
                available = available.add(stakes[i].amount);
            }
        }
        return available;   
    }
    

    ///@notice set rate
    ///@param _timeLength Length of time a user has staked for
    ///@return Percentage rate of bonus
    function getRate (uint256 _timeLength) 
    public 
    pure
    returns (uint256 rate) {

        // require(_timeLength < month.mul(25), "Cannot stake for this long");
        
        if (_timeLength < month.mul(6)) {
            return 0;
        }  
    
        if (_timeLength >= month.mul(6) && _timeLength < month.mul(12)) {
            return 5;
        }

        if (_timeLength >= month.mul(12) && _timeLength < month.mul(18)) {
            return 10;
        }

        if (_timeLength >= month.mul(18) && _timeLength < month.mul(24)) {
            return 15;
        }

        if (_timeLength >= month.mul(24)) {
            return 20;
        }
        
        //@todo dynamic set rates...
        // private 
    }
}

  
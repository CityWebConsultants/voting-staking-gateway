pragma solidity ^0.4.23;

import "./ownership/Ownable.sol";
import "./GatewayERC20Contract.sol";

contract Presale {

    // Ask adam... public or private
    address public beneficiary;
    address public techFund;
    uint public fundingGoal;
    uint public amountRaised;
    uint public deadline;
    uint public startTime;
    uint public price;
    uint public minimumSpend;
    // @todo this should be disambiguated from erc20 token balance of
    mapping(address => uint256) public balanceOf;
    bool fundingGoalReached = false;
    bool crowdsaleClosed = false;

    GatewayERC20Contract tokenContract;

    event GoalReached(address indexed recipient, uint256 totalAmountRaised);
    event FundTransfer(address indexed backer, uint amount, bool isContribution);

    // what happens if targets are not met!?
// should have 'stop' / 'start' flags ?

    /**
     * Constructor function
     *
     * Setup the owner
     */
    constructor(
        address addressOfTokenUsedAsReward,
        address ifSuccessfulSendTo,
        address ifSuccessfulSendToTech,
        uint fundingGoalInEthers,
        uint durationInMinutes,
        uint etherCostOfEachToken,
        uint _minimumSpend
    ) public {
        tokenContract = GatewayERC20Contract(addressOfTokenUsedAsReward);
        startTime = now;
        beneficiary = ifSuccessfulSendTo;
        techFund = ifSuccessfulSendToTech;
        fundingGoal = fundingGoalInEthers * 1 ether;
        deadline = now + durationInMinutes * 1 minutes; // consider using blocktime
        price = etherCostOfEachToken * 1 wei;
        minimumSpend = _minimumSpend * 1 finney;
    }

    function getTokenContractAddress() 
    public 
    view 
    returns(address)
    {
        return tokenContract;
    }

    /**
     * Fallback function
     *
     * The function without name is the default function that is called whenever anyone sends funds to a contract
     */
    function () 
    public 
    payable 
    {
        require(!crowdsaleClosed);
        require(msg.value > minimumSpend, "Value must but be greater than minimum spend");
        uint256 amount = msg.value;
        balanceOf[msg.sender] += amount;
        amountRaised += amount;
        
        // Offer discount for volume
        // should this also include the amount a user has already desposited?
        uint256 discount = getRate(amount);
        // should be using safe math here and assign variable before use (imo)
        tokenContract.transfer(msg.sender, discount / price);

        //tokenContract.transfer(msg.sender, amount / price);
        emit FundTransfer(msg.sender, discount, true);
    }

    modifier afterDeadline() 
    {
        if (block.timestamp >= deadline) {
            _;  
        }
        
    }

    /**
     * Check if goal was reached
     *
     * Checks if the goal or time limit has been reached and ends the campaign
     */
    function checkGoalReached() public afterDeadline {

        uint balance = tokenContract.balanceOf(address(this));
        // ? huh ?
        if (balance <= 0){
            fundingGoalReached = true;
            emit GoalReached(beneficiary, amountRaised);
        }
        crowdsaleClosed = true;
    }

    // Should disambugaute what value we are retrieved by adding noun to balance
    /**
    * Check balance
    */
    function balance() 
    public 
    view 
    returns (uint) 
    {
        return amountRaised;
    }


    /**
     * Withdraw the funds
     *
     * Checks to see if goal or time limit has been reached, and if so, and the funding goal was reached,
     * sends the entire amount to the beneficiary. If goal was not reached, each contributor can withdraw
     * the amount they contributed.
     */
    function safeWithdrawal() 
    public 
    afterDeadline 
    {
        if (!fundingGoalReached) {
        
            uint256 amount = balanceOf[msg.sender];

            if (amount > 0) {
                msg.sender.transfer(amount);
                balanceOf[msg.sender] = 0;
                emit FundTransfer(msg.sender, amount, false);
            }
        }

        if (fundingGoalReached && beneficiary == msg.sender) {
            // Why divided by 3 and 4 
            // these values should be set as constants 
            // elsewhere or in here
            beneficiary.transfer(amountRaised / 3);
            techFund.transfer(amountRaised / 4);
            emit FundTransfer(beneficiary, amountRaised / 3, false);
            emit FundTransfer(techFund, amountRaised / 4, false);
            // } else {
            //     // why would the transfer fail and why would we unlock it, and how would that unlock it -- it is already defaulted to fales
            //     //If we fail to send the funds to beneficiary, unlock funders balance
            //     fundingGoalReached = false;
            // }
        }
    }

    // What happens if the whole thing is games a bogey?

    // @todo suggest starting in a block...
    function getRate(uint256 _amount) 
    internal
    view  
    returns(uint256) 
    {
        // easier to use an array for this logic... 
        // divide and multiple 
        // perhaps we should pass in an array of blocktimes 
        // double seems a bit nuts -- it's a bit extreme
        // If this is a presale, then how will the sale be managed...
        // blocknumber...
        // pass in two arrays. One containing 
        if (startTime + 1 weeks > now) {
            return _amount * 2; //number of tokens in week 1
        //} else if (startTime + 2 weeks > now) {
        //        return 750; //number of tokens in week 2
        //} else if (startTime + 3 weeks > now) {
        //        return 500; //number of tokens in week 3
        } else {
            return _amount + ((_amount / 10) * 3);
        }
    }
}
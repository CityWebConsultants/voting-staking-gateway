pragma solidity ^0.4.23;

import "./ownership/Ownable.sol";
import "./GatewayERC20Contract.sol";
import "./math/SafeMath.sol";

contract Presale {
    using SafeMath for uint256;
    // @todo add safeMath
    address public beneficiary;
    address public techFund;
    uint public fundingGoal; // this a product of number of tokens and cost... doesn't need to be here...
    // means we have to sell the exact amount of tokens -- should derive like 90% or something like that
    uint public amountRaised;
    uint public deadline;
    uint public startTime;
    uint public price;
    uint public minimumSpend; // whats the reasoning behing a minimum spend
    // maximum spend ????
    // @todo this should be disambiguated from erc20 token balance of
    mapping(address => uint256) public balanceOf; // 
    bool fundingGoalReached = false;
    bool crowdsaleClosed = false;

    GatewayERC20Contract public token;

    event GoalReached(address indexed recipient, uint256 totalAmountRaised);
    event FundTransfer(address indexed backer, uint amount, bool isContribution);
    // deposit
    // withdrawal
    // Suggest creating two separate events for contributuon and withdrawal so we can access via filters
    // here we assume if it is not a contributuin that it is a wuthdrawal
    // may better to use emnumartatioin or separate events
    // since bool is not indexed, we can't "watch" ie subscribe for fund transfers of a given type


    // an event should be fired that differs from cashing out to techfund... backer makes no sense
    // what happens if targets are not met!?
// should have 'stop' / 'start' flags ?

    /**
     * Constructor function
     *
     * Setup the owner
     */
    constructor(
        address _token,
        address _beneficiary, 
        address _techFund, 
        uint256 fundingGoalInEthers, // no longer used @todo consult with Adam about removal // this should be wei
        uint256 _durationInMinutes,
        uint256 _tokenCost,
        uint256 _minimumSpend
    ) public {
        token = GatewayERC20Contract(_token);
        startTime = now;
        beneficiary = _beneficiary;
        techFund = _techFund;
        deadline = now + (_durationInMinutes * 1 minutes); // mightbe better to take a similar approach in staking contract using  days
        price = _tokenCost; 
        minimumSpend = _minimumSpend;
    }

    // @todo check we actually have enough gas to set these values !!!!!!!
    // only have a stipend of 2600
    /** 
     * Fallback function
     *
     * The function without name is the default function that is called whenever anyone sends funds to a contract
     */
    function () 
    public 
    payable 
    {
        require(!crowdsaleClosed, "Crowdsale is closed");
        require(msg.value > minimumSpend, "Value must but be greater than minimum spend");
        uint256 amount = msg.value; 
        balanceOf[msg.sender] = balanceOf[msg.sender].add(amount);
        amountRaised = amountRaised.add(amount);
    
        // uint256 awarded = getRate(amount);
        uint256 discount = getRate(amount);

        // token.transfer(msg.sender, awarded);
        token.transfer(msg.sender, discount / price);
        // emit FundTransfer(msg.sender, awarded, true);
        emit FundTransfer(msg.sender, discount, true);
        //        require(!crowdsaleClosed);
        // require(msg.value > minimumSpend, "Value must but be greater than minimum spend");
        // uint256 amount = msg.value; 
        // balanceOf[msg.sender] += amount;
        // amountRaised += amount;
        
        // // Offer discount for volume
        // // should this also include the amount a user has already desposited?
        // uint256 discount = getRate(amount);
        // // should be using safe math here and assign variable before use (imo)
        // // is it because not have permission to do this?
        // // so are these actually minted first!!!???
        // token.transfer(msg.sender, discount / price);
        // emit FundTransfer(msg.sender, discount, true);
    }

    modifier afterDeadline() 
    {
        require(block.timestamp > deadline);
        _;
    }


    // Anyone can close crowdsale, assuming this is ok?
    /**
     * Check if goal was reached
     *
     * Checks if the goal or time limit has been reached and ends the campaign
     */
    function checkGoalReached() 
    public 
    afterDeadline 
    {
        require(crowdsaleClosed == false, "Crowdsale is already closed");
        uint balance = token.balanceOf(address(this));
        // @todo needs fixed - this could easily end up locking coins given mimimum
        if (balance == 0) { 
            fundingGoalReached = true;
            // why do we include beneficiary here!?
            emit GoalReached(beneficiary, amountRaised);
        }
        crowdsaleClosed = true;
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
                balanceOf[msg.sender] = 0;
                msg.sender.transfer(amount);
                emit FundTransfer(msg.sender, amount, false);
            }
        }

        // this relies on a single key to retrieve funds
        // how could we improve this situation
        if (fundingGoalReached && beneficiary == msg.sender) {
            // 75% to project, 25% to tech fund
            uint256 benficiaryAllocation = address(this).balance.div(100).mul(75);
            uint256 techFundAllocation = address(this).balance.sub(benficiaryAllocation);
            // do we need to assert that total amount is correct
            // is it possible to get in to a situaiotn where can't withdarw
            beneficiary.transfer(benficiaryAllocation);
            techFund.transfer(techFundAllocation);

            emit FundTransfer(beneficiary, benficiaryAllocation, false);
            emit FundTransfer(techFund, techFundAllocation, false);
        }
        // there was an else here that marked fund  ...
    }

    // @todo the way this is used it is not getting a rate but actually calculating 
    // should be get total award
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
        // should we use safemath for time too
        if (block.timestamp < startTime + 1 weeks ) {
            // return _amount * 2;
            return _amount.mul(2); //number of tokens in week 1
        //} else if (startTime + 2 weeks > now) {
        //        return 750; //number of tokens in week 2
        //} else if (startTime + 3 weeks > now) {
        //        return 500; //number of tokens in week 3
        } else {
            return _amount + _amount.div(10).mul(3);
            //return _amount + ((_amount / 10) * 3);
        }
    }
}
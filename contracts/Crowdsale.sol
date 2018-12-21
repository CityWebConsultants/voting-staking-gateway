pragma solidity ^0.4.23;

import "./ownership/Ownable.sol";
import "./GatewayERC20Contract.sol";
import "./math/SafeMath.sol";

//@todo implement max spend
contract Crowdsale {
    using SafeMath for uint256;

    address public beneficiary;
    address public techFund;
    uint public fundingGoal; // need feedback on usage
    uint public amountRaised;
    uint public startTime;
    uint public endTime;
    uint public price;
    uint public minSpend; // whats the reasoning behing a minimum spend
    //uint public maxSpend;
    // @todo should be disambiguated from erc20 token balance of?
    mapping(address => uint256) public balanceOf; // 
    bool fundingGoalReached = false;
    bool crowdsaleClosed = false;

    GatewayERC20Contract public token;

    // @todo whats the purpose of indexed recipient here...
    event GoalReached(address indexed recipient, uint256 totalAmountRaised);
    event Contribution(address indexed account, uint256 amount, uint256 tokens);
    event Withdrawal(address indexed account, uint amount);

    /**
     * Constructor function
     *
     * Setup the owner
     */
    constructor(
        address _token,
        address _beneficiary, 
        address _techFund, 
        uint256 fundingGoalInEthers, // actually makes sense to have a funding goal -- but it should be in wei
        uint256 _startTime,
        uint256 _endTime,
        uint256 _tokenCost,
        uint256 _minSpend
    ) public {
        token = GatewayERC20Contract(_token);
        startTime = _startTime;
        beneficiary = _beneficiary;
        techFund = _techFund;
        startTime = _startTime;
        endTime = _endTime;
        price = _tokenCost; 
        minSpend = _minSpend;
        //maxSpend = _maxSpend;
    }

    // add a modifier or condition to check early on that enough tokens are left
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
        require(msg.value >= minSpend, "Value must but be greater than minimum spend");
        // require(msg.value <= maxSpend);
        uint256 amount = msg.value; 
        balanceOf[msg.sender] = balanceOf[msg.sender].add(amount);
        amountRaised = amountRaised.add(amount);
        
        // @todo improve logic with fewer vars
        uint256 tokens = amount.div(price);
        uint256 bonusTokens = getBonus(tokens);
        uint256 totalTokens = tokens + bonusTokens;

        token.transfer(msg.sender, totalTokens);
        emit Contribution(msg.sender, amount, totalTokens);
    }

    modifier afterEndTime() 
    {
        require(block.timestamp > endTime);
        _;
    }

    // Anyone can close crowdsale, assuming this is ok?
    // this mutates values so shouldn't be called check (implies is getter)
    /**
     * Check if goal was reached
     *
     * Checks if the goal or time limit has been reached and ends the campaign
     */
    function checkGoalReached() 
    public 
    afterEndTime 
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
    

    // This refund stuff needs work!!!!!!!!
    /**
     * Withdraw the funds
     *
     * Checks to see if goal or time limit has been reached, and if so, and the funding goal was reached,
     * sends the entire amount to the beneficiary. If goal was not reached, each contributor can withdraw
     * the amount they contributed.
     */
    function safeWithdrawal() 
    public 
    afterEndTime 
    {   
        if (!fundingGoalReached) {
        
            uint256 amount = balanceOf[msg.sender];

            if (amount > 0) {
                balanceOf[msg.sender] = 0;
                msg.sender.transfer(amount);
                emit Withdrawal(msg.sender, amount);
            }
        }

        // there was an else here that marked fund  ... what was the idea
    }


    function allocateFunds()
    public
    afterEndTime
    {
        if (fundingGoalReached && beneficiary == msg.sender) {
            // 75% to project, 25% to tech fund
            uint256 benficiaryAllocation = address(this).balance.div(100).mul(75);
            uint256 techFundAllocation = address(this).balance.sub(benficiaryAllocation);

            beneficiary.transfer(benficiaryAllocation);
            techFund.transfer(techFundAllocation);
            
            // do we even need a withdrawal event -- we can see this from erc20?
            emit Withdrawal(beneficiary, benficiaryAllocation);
            emit Withdrawal(techFund, techFundAllocation);

            // do we need some other kind of closure here?
        }
    }

    // Need to check this against the whitepaper
    function getBonus(uint256 _tokens)
    public
    view  
    returns(uint256)
    {
        // 20% bonus in first week
        if (block.timestamp <= startTime.add(1 weeks)) {
            return _tokens.div(100).mul(20); //number of tokens in week 1
        //} else if (startTime + 2 weeks > now) {
        //        return 750; //number of tokens in week 2
        //} else if (startTime + 3 weeks > now) {
        //        return 500; //number of tokens in week 3
        } else if (block.timestamp > startTime.add(1 weeks) && block.timestamp <= startTime.add(2 weeks)) {
            return _tokens.div(100).mul(10);
        }
        else {
            return 0;
        }
    }
}
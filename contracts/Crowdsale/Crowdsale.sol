pragma solidity ^0.4.24;

import "../ownership/Ownable.sol";
import "../GatewayERC20Contract.sol";
import "../math/SafeMath.sol";
import "./RefundList.sol";

//@todo check 
//@todo remove max spend

contract Crowdsale is Ownable {
    using SafeMath for uint256;

    address public treasury;  // consider renaming treasury...
    address public techFund;
    GatewayERC20Contract public token;
    RefundList public refundList;
    uint256 public fundingGoal; // close to max amount minus dust... hmmmm
    uint256 public amountRaised;
    uint256 public startTime;
    uint256 public endTime;
    uint256 public price;
    uint256 public minSpend; // whats the reasoning behing a minimum spend
    uint256 public refundFee = 100000000000; //@todo make this a parameter number of tokens deducted
    mapping(address => uint256) public tokenAllocation; // @todo change name to tokenAllocation or tokenClaim
    bool finalised;


    event Withdrawal(address indexed account, uint amount);
    event Contribution(address indexed account, uint256 ethAmount, uint256 tokens);
    event Refund(address indexed account, uint256 ethAmount); // should we also have deposit?
    event Claimed(address indexed account, uint256 tokenAmount);
    event CrowdsaleFinalized();
    // funding goal in tokens...

    /**
     * Constructor function
     *
     * Setup the owner
     */
    constructor(
        address _token,
        address _treasury, 
        address _techFund, 
        address _refundList, //break
        // uint256 fundingGoalInEthers, // actually makes sense to have a funding goal
        uint256 _startTime,
        uint256 _endTime,
        uint256 _tokenCost,
        uint256 _minSpend
    ) public {
        token = GatewayERC20Contract(_token);
        startTime = _startTime;
        treasury = _treasury;
        techFund = _techFund;
        refundList = RefundList(_refundList);
        startTime = _startTime;
        endTime = _endTime;
        price = _tokenCost;
        minSpend = _minSpend;

        // what other values do we need to check?
        require(startTime >= block.timestamp, "Opening time is earlier than now");
        require(endTime > startTime, "Closing time is before opening time");
        owner = msg.sender;
    }

    modifier onlyWhileOpen {
        require(isOpen(), "Crowdsale has closed");
        _;
    }

    modifier onlyWhenFinalised {
        require(finalised == true, "Not yet finalised");
        _;
    }

    function isOpen() 
    public 
    view 
    returns (bool) {
        return block.timestamp >= startTime && block.timestamp <= endTime;
    }

    function hasClosed() 
    public 
    view 
    returns (bool) {
        return block.timestamp > endTime; // @todo || or all tokens sold
    }

    function remainingTokens()
    public
    view
    returns(uint256) 
    {
        return token.balanceOf(address(this));
    }

    function finalize() 
    public
    onlyOwner
    {
        require(!finalised, "Not yet finalised");
        require(hasClosed(), "Sale still open");

        finalised = true;
        emit CrowdsaleFinalized();
    }

    // do an estimation of gas -- not sure there will be enough to call this
    function () 
    public 
    payable
    {
        buyTokens();
    }

    function buyTokens()
    public 
    payable
    onlyWhileOpen
    {
        require(msg.value >= minSpend, "Value must but be greater than minimum spend");
        // require(msg.value <= maxSpend);
        uint256 amount = msg.value;
        amountRaised = amountRaised.add(amount);
        
        uint256 tokens = amount.div(price);
        tokenAllocation[msg.sender] = tokenAllocation[msg.sender].add(tokens);
        // uint256 bonusTokens = getBonus(tokens);
        // uint256 totalTokens = tokens + bonusTokens;

        // Just remove token transfer until after end date
        token.transfer(msg.sender, tokens);
        emit Contribution(msg.sender, amount, tokens);
    }

    function claimTokens()
    public
    onlyWhenFinalised
    {
        // maybe switch the logic round for true
        if (refundList.getAddressStatus(msg.sender) == false) {
            uint256 claimed = tokenAllocation[msg.sender];
            tokenAllocation[msg.sender] = 0;
            token.transfer(msg.sender, claimed);
            emit Claimed(msg.sender, claimed);
        }
    }

    function claimRefund() 
    public
    onlyWhenFinalised
    {
        if (refundList.getAddressStatus(msg.sender) == true) {
            uint256 ethRefund = (tokenAllocation[msg.sender].sub(refundFee)).mul(price);
            tokenAllocation[msg.sender] = 0;
            msg.sender.transfer(ethRefund);
            emit Refund(msg.sender, ethRefund); // should we also have deposit?
        }
    }

    // ah, but this should happen only after all the other stuff has been paid out!!!!
    /// hmmmmmmmm
    // want to make sure there are no circumstances where funds could remaim lock
    // what if something happens
    // at what point
    // maybe these should be stored in an array...
    // where we can only pull funds
    // would make much more sense just to pull out whatever we want
    // then there is no mnot

    // function allocateFunds()
    // public
    // onlyWhenFinalised
    // onlyOwner
    // {
    //         // 75% to treasury, 25% to tech fund
    //     uint256 treasuryAllocation = address(this).balance.div(100).mul(75);
    //     uint256 techFundAllocation = address(this).balance.sub(treasuryAllocation);

    //     treasury.transfer(treasuryAllocation);
    //     techFund.transfer(techFundAllocation);
        
    //     emit Withdrawal(treasury, treasuryAllocation);
    //     emit Withdrawal(techFund, techFundAllocation);
    // }

    // Worry about how to deal with this later
    // could be a fixed amount of time
    // could calculate what is the amount that must be left in to 
    // claim 
    function withdrawToTreasury(uint256 _amount)
    public
    onlyWhenFinalised
    onlyOwner
    {
        // any amount withdrawn -- 25% must go to tech fund
        // but the amount can be arbitary?
        treasury.transfer(_amount);
    }

    // can only withdraw once and must be 25%
    // treasure can withdraw an arbitary amount
    function withdrawToTechFund(uint256 _amount)
    public
    onlyWhenFinalised
    onlyOwner
    {
        techFund.transfer(_amount);
    }

    // Anyone can close crowdsale, assuming this is ok?
    // this mutates values so shouldn't be called check (implies is getter)
    /**
     * Check if goal was reached
     *
     * Checks if the goal or time limit has been reached and ends the campaign
     */
    // function checkGoalReached() 
    // public 
    // afterEndTime 
    // {
    //     // whole thing passes when there is no code here  : o
    //     require(crowdsaleClosed == false, "Crowdsale is already closed");
    //     // makes no sense
    //     // @todo modif
    //     // uint balance = token.balanceO(address(this));
    //     // @todo needs fixed - this could easily end up locking coins given mimimum
    //     // if (balance == 0) {
    //     //     fundingGoalReached = true;
    //     //     // why do we include treasury here!?
    //     //     emit GoalReached(treasury, amountRaised);
    //     // }
    //     crowdsaleClosed = true;    // }

    // settlement time

    // function refund(uint256 tokens) 
    // public 
    // afterEndTime
    // {
    //     token.transfer();
    // }


    // this only covers eth, we also have to pass out tokens too...
    // after end time

    // /**
    //  * Withdraw the funds
    //  *
    //  * Checks to see if goal or time limit has been reached, and if so, and the funding goal was reached,
    //  * sends the entire amount to the treasury. If goal was not reached, each contributor can withdraw
    //  * the amount they contributed.
    //  */
    // function safeWithdrawal() 
    // public 
    // afterEndTime 
    // {   
    //     if (!fundingGoalReached) {
    //         // transfer tokens 
    //         // tokenAmount = 
    //         // transfer(address(this), )
    //         uint256 amount = tokenAllocation[msg.sender];

    //         if (amount > 0) {
    //             tokenAllocation[msg.sender] = 0;
    //             msg.sender.transfer(amount);
    //             emit Withdrawal(msg.sender, amount);
    //         }
    //     }

    //     // there was an else here that marked fund  ... what was the idea
    // }


    //@todo remove bonus...
    // Need to check this against the whitepaper
    // function getBonus(uint256 _tokens)
    // public
    // view  
    // returns(uint256)
    // {
    //     // 20% bonus in first week
    //     if (block.timestamp <= startTime.add(1 weeks)) {
    //         return _tokens.div(100).mul(20); //number of tokens in week 1
    //     //} else if (startTime + 2 weeks > now) {
    //     //        return 750; //number of tokens in week 2
    //     //} else if (startTime + 3 weeks > now) {
    //     //        return 500; //number of tokens in week 3
    //     } else if (block.timestamp > startTime.add(1 weeks) && block.timestamp <= startTime.add(2 weeks)) {
    //         return _tokens.div(100).mul(10);
    //     }
    //     else {
    //         return 0;
    //     }
    // }
}


// a single claim function... if name is not on refund list then can claim coins back
// otherwise the account is refunded minus a certain amount of tokens...
// so say it costs 10 tokens to get a refund...
// what happens if any tokens left locked in the contract....





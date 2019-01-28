pragma solidity ^0.4.24;

// @todo sort out admin withdrawal
// @todo minimum amount left before closed (min purchase +?)

import "../ownership/Ownable.sol";
import "../GatewayERC20Contract.sol";
import "../math/SafeMath.sol";
import "./RefundList.sol";

contract Crowdsale is Ownable {
    using SafeMath for uint256;

    address public treasury;
    address public techFund;
    GatewayERC20Contract public token;
    RefundList public refundList;
    uint256 public tokensSold;
    uint256 public startTime;
    uint256 public endTime; 
    uint256 public price;
    uint256 public minSpend;
    uint256 public maxSpend;
    //@todo  this should be calculated a number of tokens
    uint256 public refundFee = 100000000000; //@todo make this a parameter number of tokens deducted
    
    mapping(address => uint256) public tokenAllocation; // @todo change name to tokenAllocation or tokenClaim
    bool public finalised;

    event Withdrawal(address indexed account, uint amount);
    event Contribution(address indexed account, uint256 ethAmount, uint256 tokens);
    event Refund(address indexed account, uint256 ethAmount); // should we also have deposit?
    event Claimed(address indexed account, uint256 tokenAmount);
    //@todo how to test
    event CrowdsaleFinalized();

    constructor(
        address _token,
        address _treasury, 
        address _techFund, 
        address _refundList,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _tokenCost,
        uint256 _minSpend,
        uint256 _maxSpend
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
        maxSpend = _maxSpend;

        // what other values do we need to check?
        require(startTime >= block.timestamp, "Opening time is earlier than now");
        require(endTime > startTime, "Closing time is before opening time");
        owner = msg.sender;
    }

    function minTokenPurchase()
    public
    view // should be really be pure
    returns (uint256)
    {
        return minSpend / price;
    }

    modifier onlyWhileOpen {
        require(isOpen(), "Crowd sale is not open");
        _;
    }

    modifier onlyWhenFinalised {
        require(finalised == true, "Not yet finalised");
        _;
    }

    // messed up my math somewhere???
    function isOpen() 
    public 
    view 
    returns (bool) {
        return block.timestamp >= startTime 
        && block.timestamp <= endTime
        && (tokensSold + minTokenPurchase()) <= token.balanceOf(address(this));
    }

    function hasClosed()
    public 
    view 
    returns (bool) {
        return block.timestamp > endTime || (tokensSold + minTokenPurchase() > token.balanceOf(address(this))); // @todo || or all tokens sold
    }

    function remainingTokens()
    public
    view
    returns(uint256) 
    {
        return token.balanceOf(address(this));
    }

    function finalise() 
    public
    onlyOwner
    {
        require(!finalised, "Not yet finalised");
        require(hasClosed(), "Sale still open");

        finalised = true;
        emit CrowdsaleFinalized();
    }

    // All ur eth not belong to us
    function () 
    public 
    payable
    {
        revert("Cannot accept eth directly");
    }

    function buyTokens()
    public 
    payable
    onlyWhileOpen
    {
        require(msg.value >= minSpend, "Value must but be greater than minimum spend");
        uint256 amount = msg.value;   
        uint256 tokens = amount.div(price);
        // should this trigger finalise? how will we deal with finalise
        require(tokens <= (token.balanceOf(address(this)) - tokensSold), "Not enough tokens left");
        tokensSold = tokensSold.add(tokens);
        tokenAllocation[msg.sender] = tokenAllocation[msg.sender].add(tokens);
        // token.transfer(msg.sender, tokens);
        emit Contribution(msg.sender, amount, tokens);
    }

    function claimTokens()
    public
    onlyWhenFinalised
    {
        require(refundList.getAddressStatus(msg.sender) == false, "This account is due refund");
        uint256 claimed = tokenAllocation[msg.sender];
        tokenAllocation[msg.sender] = 0;
        token.transfer(msg.sender, claimed);
        emit Claimed(msg.sender, claimed);
    }

    // oh :o 
    // we need a way to take out any remaning in tokens!

    function claimRefund() 
    public
    onlyWhenFinalised
    {
        require(refundList.getAddressStatus(msg.sender) == true, "No refund available");
        //uint256 fee = refundFee.mul(price);
        // double check we have the correct refund in 
        uint256 ethRefund = (tokenAllocation[msg.sender].mul(price)).sub(refundFee);//.mul(price);
        tokenAllocation[msg.sender] = 0;
        msg.sender.transfer(ethRefund);
        emit Refund(msg.sender, ethRefund); // should we also have deposit?
    }

    // @todo -- we don't really test multiple purchases

    function withdrawEth(uint256 _amount)
    public
    onlyWhenFinalised
    onlyOwner
    //  only x time after finalisation?
    // how do we provide assurance to users?
    {   
        // 75% to treasury, 25% to technical development
        // uint256 treasuryAllocation = address(this).balance.div(100).mul(75);
        // uint256 techFundAllocation = address(this).balance.sub(treasuryAllocation);

        uint256 treasuryAllocation = _amount.div(100).mul(75);
        uint256 techFundAllocation = _amount.sub(treasuryAllocation);

        // Transfer Eth
        treasury.transfer(treasuryAllocation);
        techFund.transfer(techFundAllocation);
    }

    // only after grace period
    // have 28 days to collect tokens
    // is that fair and reasonable
    // on finalisation set a grace date...
    // what happens to allocation of tokens.
    // pre-signed transaction
    // is it possible to approve more than exists in an account?
    // How do we provide extra security for investors here?
    
    function withdrawTokensToTreasury(uint256 _amount)
    public
    //  only x time after finalisation?
    onlyWhenFinalised
    onlyOwner
    {   
        // Dont want to end up with locked coins
        require(_amount < tokensSold, "Cannot withdraw more than available");
        token.transfer(treasury, _amount);
        emit Withdrawal(treasury, _amount);
    }
}

// a single claim function... if name is not on refund list then can claim coins back
// otherwise the account is refunded minus a certain amount of tokens...
// so say it costs 10 tokens to get a refund...
// what happens if any tokens left locked in the contract....





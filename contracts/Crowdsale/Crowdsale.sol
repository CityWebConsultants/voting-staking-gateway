pragma solidity ^0.4.24;

//@todo add refund fee 

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
    uint256 public refundFee; // = 100000000000; //@todo make this a parameter number of tokens deducted
    
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
        uint256 _maxSpend,
        uint256 _refundFee
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
        refundFee = _refundFee;

        require(startTime >= block.timestamp, "Opening time is earlier than now");
        require(endTime > startTime, "Closing time is before opening time");
        owner = msg.sender;
    }

    ///@notice calculate minimum number of purchaseable tokens
    ///@return number of purchaseable tokens
    function minTokenPurchase()
    public
    view
    returns (uint256)
    {
        return minSpend / price;
    }

    ///@notice modifier, only allow whilst crowdsale open
    modifier onlyWhileOpen {
        require(isOpen(), "Crowd sale is not open");
        _;
    }

    ///@notice modifier, only allow when finalised
    modifier onlyWhenFinalised {
        require(finalised == true, "Not yet finalised");
        _;
    }

    
    ///@notice check if sale open
    ///@return bool, true if open, otherwise false
    function isOpen() 
    public 
    view 
    returns (bool) {
        return block.timestamp >= startTime 
        && block.timestamp <= endTime
        && (tokensSold + minTokenPurchase()) <= token.balanceOf(address(this));
    }

    ///@notice check sale has closed
    ///@return bool, true if closed, otherwise false
    function hasClosed()
    public 
    view 
    returns (bool) {
        return block.timestamp > endTime || (tokensSold + minTokenPurchase() > token.balanceOf(address(this))); // @todo || or all tokens sold
    }

    ///@notice check number of tokens in this account
    ///@return uint256 number of tokens at this account address
    function remainingTokens()
    public
    view
    returns(uint256) 
    {
        return token.balanceOf(address(this));
    }

    ///@notice finalise contract
    function finalise() 
    public
    onlyOwner
    {
        require(!finalised, "Not yet finalised");
        require(hasClosed(), "Sale still open");

        finalised = true;
        emit CrowdsaleFinalized();
    }

    ///@notice do not allow direct eth transfer
    function () 
    public 
    payable
    {
        revert("Cannot accept eth directly");
    }

    ///@notice recieves eth deposit and reserves tokens
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

    ///@notice once finalised, allow accounts to claim tokens
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

    ///@notice once finalised, allow accounts to claim tokens
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


    ///@notice withdraw eth to organisation accounts
    function withdrawEth(uint256 _amount)
    public
    onlyWhenFinalised
    onlyOwner
    {   
        // 75% to treasury, 25% to technical development
        uint256 treasuryAllocation = _amount.div(100).mul(75);
        uint256 techFundAllocation = _amount.sub(treasuryAllocation);

        treasury.transfer(treasuryAllocation);
        techFund.transfer(techFundAllocation);
    }

    ///@notice withdraw remaining tokens
    function withdrawTokensToTreasury(uint256 _amount)
    public
    onlyWhenFinalised
    onlyOwner
    {   
        token.transfer(treasury, _amount);
        emit Withdrawal(treasury, _amount);
    }
}




pragma solidity ^0.4.24;
import "./ownership/Ownable.sol";
import "./math/SafeMath.sol";
import "./token/ERC20Interface.sol";


contract GatewayERC20Contract is ERC20Interface, Ownable{
    using SafeMath for uint256;

    // be explicit about public and private
    // try and separate concerns erc 20 and such
    // fix tests

    address paymentGatewayAddress;
    string public symbol;
    string public  name;
    uint256 public decimals;
    uint256 _totalSupply;
    // is this basically for pausing?
    bool transferActive;

    mapping(address => uint) balances;
    
    constructor(address _gatewayContract, uint256 _tokenSupply, string _symbol, string _name) public{
        symbol = _symbol;
        name = _name;
        decimals = 6;
        _totalSupply = _tokenSupply * 1000000;
        balances[owner] = _totalSupply;
        paymentGatewayAddress = _gatewayContract;
        transferActive = false;
    }

    function totalSupply() 
    public 
    view 
    returns (uint) 
    {
        return _totalSupply.sub(balances[owner]);
    }    

    function balanceOf(address tokenOwner) 
    public 
    view 
    returns (uint balance) 
    {
        return balances[tokenOwner];
    }

    function transfer(address to, uint tokens) 
    public 
    returns (bool success) 
    {
        // rly?, bit clunky -- whats this transger enabled thing?
        require(hasSufficientBalanceForTransfer(msg.sender, tokens));
        require(transferEnabled());
        balances[msg.sender] = balances[msg.sender].sub(tokens);
        balances[to] = balances[to].add(tokens);
        emit Transfer(msg.sender, to, tokens);
        return true;
    }

    //function approve(address spender, uint tokens) public returns (bool success) {
    //     allowed[msg.sender][spender] = tokens;
    //     emit Approval(msg.sender, spender, tokens);
    //     return true;
    //}

    //function transferFrom(address from, address to, uint tokens) public returns (bool success) {
    //    balances[from] = balances[from].sub(tokens);
    //    allowed[from][msg.sender] = allowed[from][msg.sender].sub(tokens);
    //    balances[to] = balances[to].add(tokens);
    //    emit Transfer(from, to, tokens);
    //    return true;
    //}

    //function allowance(address tokenOwner, address spender) public view returns (uint remaining) {
    //     return allowed[tokenOwner][spender];
    //}

    function () public payable {
        revert("Bounce Eth");
    }

    function transferAnyERC20Token(address tokenAddress, uint tokens) 
    public 
    onlyOwner 
    returns (bool success) 
    {
        return ERC20Interface(tokenAddress).transfer(owner, tokens);
    }


    function setPaymentGatewayAddress(address _gatewayContract) 
    public 
    onlyOwner 
    {
        paymentGatewayAddress = _gatewayContract;
    }

    function setTransferStatus(bool _status) 
    public 
    onlyOwner 
    {
        transferActive = _status;
    }

// this seems to be creating extra tokens on top of inital supply?
// should this not be transfer() ?
// does the gateway contract need to issue tokens?
    function issueTokens(address _recipient, uint _tokens) 
    public 
    canIssueTokens 
    returns(bool) 
    {
        uint balance = balances[_recipient];
        balances[_recipient] = balance.add(_tokens);
        _totalSupply = _totalSupply.add(_tokens);
        emit IssueTokens(_recipient, _tokens, balance, balances[_recipient], msg.sender);
        return true;
    }

    function gatewayTokenTransfer(address from, address to, uint tokens) public
        callerIsGatewayContract() returns (bool success) {
        require(hasSufficientBalanceForTransfer(from, tokens));
        balances[from] = balances[from].sub(tokens);
        balances[to] = balances[to].add(tokens);
        emit Transfer(msg.sender, to, tokens); // should this not be from, to, tokens?
        return true;
    }

    modifier canIssueTokens(){
        //require(owner == msg.sender || msg.sender == paymentGatewayAddress);
        require(owner == msg.sender);
        _;
    }

    modifier callerIsGatewayContract(){
        require(msg.sender == paymentGatewayAddress);
        _;
    }

    function hasSufficientBalanceForTransfer(address _sender, uint _amount) 
    private 
    view 
    returns(bool)
    {
        uint balance = balances[_sender];
        return balance >= _amount;
    }

    function transferEnabled() 
    private 
    view 
    returns(bool) 
    {
        return msg.sender == owner || transferActive;
    }
}
pragma solidity ^0.4.23;
import "./ownership/Ownable.sol";
import "./math/SafeMath.sol";
import "./token/ERC20Interface.sol";


contract GatewayERC20Contract is ERC20Interface, Ownable{
    using SafeMath for uint256;

    address paymentGatewayAddress;
    string public symbol;
    string public  name;
    uint256 public decimals;
    uint256 _totalSupply;

    mapping(address => uint) balances;
    
    constructor(address _gatewayContract, uint256 _tokenSupply, string _symbol, string _name) public{
        symbol = _symbol;
        name = _name;
        decimals = 6;
        _totalSupply = _tokenSupply * 1000000;
        balances[owner] = _totalSupply;
        paymentGatewayAddress = _gatewayContract;
    }

    function setPaymentGatewayAddress(address _gatewayContract) public onlyOwner{
        paymentGatewayAddress = _gatewayContract;
    }

    function issueTokens(address _recipient, uint _tokens) public canIssueTokens returns(bool){
        uint balance = balances[_recipient];
        balances[_recipient] = balance.add(_tokens);     
        _totalSupply = _totalSupply.add(_tokens);
        emit IssueTokens(_recipient, _tokens, balance, balances[_recipient], msg.sender);        
        return true;
    }    

    function totalSupply() public view returns (uint) {
        return _totalSupply.sub(balances[owner]);
    }    

    function balanceOf(address tokenOwner) public view returns (uint balance) {
        return balances[tokenOwner];
    }

    function gatewayTokenTransfer(address from, address to, uint tokens) public
        callerIsGatewayContract() returns (bool success) {
        require(hasSufficientBalanceForTransfer(from, tokens));
        balances[from] = balances[from].sub(tokens);
        balances[to] = balances[to].add(tokens);
        emit Transfer(msg.sender, to, tokens);
        return true;
    }

    function transfer(address to, uint tokens) public returns (bool success) {
        require(hasSufficientBalanceForTransfer(msg.sender, tokens));
        balances[msg.sender] = balances[msg.sender].sub(tokens);
        balances[to] = balances[to].add(tokens);
        emit Transfer(msg.sender, to, tokens);
        return true;
    }

    function () public payable {
        revert();
    }

    function transferAnyERC20Token(address tokenAddress, uint tokens) public onlyOwner returns (bool success) {
        return ERC20Interface(tokenAddress).transfer(owner, tokens);
    }      

    modifier canIssueTokens(){
        require(owner == msg.sender || msg.sender == paymentGatewayAddress);
        _;
    }

    modifier callerIsGatewayContract(){
        require(msg.sender == paymentGatewayAddress);
        _;
    }

    function hasSufficientBalanceForTransfer(address _sender, uint _amount) private view returns(bool){
        uint balance = balances[_sender];
        return balance >= _amount;
    }
}
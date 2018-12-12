pragma solidity ^0.4.24;
import "./ownership/Ownable.sol";
import "./math/SafeMath.sol";
import "./token/ERC20.sol";

// @todo remove issueTokens or do it properly
contract GatewayERC20Contract is ERC20, Ownable{
    using SafeMath for uint256;

    address paymentGatewayAddress;
   // string public symbol;
   // string public  name;
   // uint256 public decimals;
    // uint256 _totalSupply;
    // is this basically for pausing?
    // Consider removing once tokens have been issued....
    bool transferActive;

    // mapping(address => uint) balances;
    
    // humho
    constructor(address _gatewayContract, uint256 _initialSupply, string _symbol, string _name)
    ERC20(_initialSupply, _name, 10, _symbol)
    public //internal?  
    {
        paymentGatewayAddress = _gatewayContract;
        transferActive = true; // so how are we supposed to issue tokens... this is awful
    }

    // should be mintable and finalsied

        // putting this back in... what will break?
    event IssueTokens(address _recipient, uint256 n_tokens, uint256 balance, uint256 recipientBalance, address sender);

    function () public payable {
        revert("Bounce Eth");
    }

    function transferAnyERC20Token(address tokenAddress, uint tokens) 
    public 
    onlyOwner 
    returns (bool success) 
    {
        return ERC20(tokenAddress).transfer(owner, tokens);
    }


    function setPaymentGatewayAddress(address _gatewayContract) 
    public 
    onlyOwner 
    {
        paymentGatewayAddress = _gatewayContract;
    }

    // Uhm, do people really want their token to be able to be stopped once it has started!?!?!
    // @todo put this back
    function setTransferStatus(bool _status) 
    public
    onlyOwner 
    {
        transferActive = _status;
    }

// this seems to be creating extra tokens on top of inital supply?
// should this not be transfer() ?
// does the gateway contract need to issue tokens?

// why are we transferring tokens when we have token issance
//  // @todo remove this
    function issueTokens(address _recipient, uint _tokens) 
    public 
    canIssueTokens 
    returns(bool) 
    {
        uint balance = balances[_recipient];
        balances[_recipient] = balance.add(_tokens);
        totalSupply = totalSupply.add(_tokens);
        // balance can be queries -- we only want to say from, to and amount
        // current balance should be queries elsewhere
        emit IssueTokens(_recipient, _tokens, balance, balances[_recipient], msg.sender);
        return true;
    }
    

    // @todo -- this should actially be transfer!????
    function gatewayTokenTransfer(address from, address to, uint tokens) public
        callerIsGatewayContract() returns (bool success) {
        //transfer(to, tokens)
        //or transferFrom
        require(hasSufficientBalanceForTransfer(from, tokens));
        balances[from] = balances[from].sub(tokens);
        balances[to] = balances[to].add(tokens);
        emit Transfer(msg.sender, to, tokens); // should this not be from, to, tokens?
        return true;
    }

    // @todo have to wrap this for compatibilty

    // would be better to give perm to mint 
    // from the tokenSale...
    // Rather than stop when all the tokens are sold
    // or mebs not if thats the clients preference

    // @todo no minting after first issuance. remove.
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
        return msg.sender == owner; /*|| transferActive;*/
    }
}
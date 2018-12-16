pragma solidity ^0.4.24;
import "./ownership/Ownable.sol";
import "./math/SafeMath.sol";
import "./token/ERC20.sol";

contract GatewayERC20Contract is ERC20, Ownable{
    using SafeMath for uint256;

    address paymentGatewayAddress;
    bool transferActive;
    
    // humho
    constructor(address _gatewayContract, uint256 _initialSupply, string _symbol, string _name)
    ERC20(_initialSupply, _name, 10, _symbol)
    public //internal?  
    {
        paymentGatewayAddress = _gatewayContract;
        transferActive = true;
    }

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

    function gatewayTokenTransfer(address from, address to, uint tokens) public
        callerIsGatewayContract() returns (bool success) { // no params passed so why ()
        //transfer(to, tokens)
        //or transferFrom
        require(hasSufficientBalanceForTransfer(from, tokens));
        balances[from] = balances[from].sub(tokens);
        balances[to] = balances[to].add(tokens);
        emit Transfer(msg.sender, to, tokens); // should this not be from, to, tokens?
        return true;
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
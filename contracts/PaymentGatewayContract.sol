pragma solidity ^0.4.23;
import "./math/SafeMath.sol";
import "./ownership/Ownable.sol";
import "./GatewayERC20Contract.sol";

contract PaymentGatewayContract is Ownable{
    using SafeMath for uint256;
    uint256 gatewayFeePercentage;
    uint256 gatewayBalance;
    address beneficiary;
    mapping(address => Merchant) merchants;

    GatewayERC20Contract tokenContract;

    event AddMerchantEvent(address merchant);
  //  event PaymentMadeEvent(address _merchant, string _reference, uint _amount);
    event PaymentMadeInTokensEvent(address _merchant, string _reference, uint _tokenAmount);
    event WithdrawGatewayFundsEvent(address _walletAddress, uint _amount);
   // event WithdrawPaymentEvent(address _walletAddress, uint _amount);


// Needs way to forward on in event of new contract
// How do you mean?

    constructor(uint256 _gatewayFee, address _beneficiary) 
    public
    {
        gatewayFeePercentage = _gatewayFee;
        beneficiary = _beneficiary;
        gatewayBalance = 0;
    }

    function () 
    public 
    payable {
        revert("Bounce Eth"); 
    } 

    function setTokenContract(address _tokenContractAddress) 
    public 
    onlyOwner
    {
        tokenContract = GatewayERC20Contract(_tokenContractAddress);
    }

    function getTokenContractAddress() 
    public
    view 
    returns(address)
    {
        return tokenContract;
    }

    function addMerchant(address _walletAddress) 
    public
    onlyOwner 
    {
        require(!isExistingMerchant(_walletAddress));
        Merchant memory newMerchant = Merchant({ balance: 0, created: true});
        merchants[_walletAddress] = newMerchant;
        emit AddMerchantEvent(_walletAddress);
    }

// needs to take gateway fee percentage
// Is it cheaper to make 2 contract calls here or do the logic in erc20 contract?

    function makePaymentInTokens(address _merchantAddress, string _reference, uint _tokenAmount) 
    public
    allowedToMakePayment(_merchantAddress, _reference)
    {
        require(hasSufficientTokensForTransfer(_tokenAmount));
        uint256 transactionFee = calculateGatewayFee(_tokenAmount); // int ?
        uint256 merchantFee = SafeMath.sub(_tokenAmount, transactionFee);
        uint256 ownerFee = transactionFee;

        tokenContract.gatewayTokenTransfer(msg.sender, _merchantAddress, merchantFee );
        emit PaymentMadeInTokensEvent(_merchantAddress, _reference, merchantFee);

        tokenContract.gatewayTokenTransfer(msg.sender, beneficiary, ownerFee );
        emit PaymentMadeInTokensEvent(beneficiary, _reference, ownerFee); // how to alter reference string?
    }

    // Fees
    function setGatewayFee(uint _newFee) 
    public
    onlyOwner 
    {
        require(_newFee < 100);
        gatewayFeePercentage = _newFee;
    }

    // Calculations
    function calculateGatewayFee(uint _amount) 
    private 
    view 
    returns(uint fee) {
        return SafeMath.mul(_amount, gatewayFeePercentage) / 100;
    }

    // Require functions
//    function permittedToAccessAccount(address _address) private view returns (bool valid){
//        if(msg.sender == owner){
//            return true;
//        }
//        return msg.sender == _address;
//    }

    function isExistingMerchant(address _merchantAddress) 
    public 
    view 
    returns (bool)
    {
        return merchants[_merchantAddress].created;
    }

    function isStringEqual(string _input_a, string _input_b) private pure returns(bool)
    {
        return keccakHash(_input_a) == keccakHash(_input_b);
    }

    function isStringEmpty(string _input) 
    private 
    pure 
    returns(bool)
    {
        return keccakHash(_input) == keccakHash("");
    }


    function keccakHash(string _input) private pure returns (bytes32)
    {
        return keccak256(abi.encodePacked(_input));
    }

    function hasSufficientTokensForTransfer(uint _amount) private view returns(bool)
    {
        uint balance = tokenContract.balanceOf(msg.sender);
        return balance >= _amount;
    }

// is this required as this can be used directly on erc20 contract ?

//    function balanceOf(address tokenOwner) public view returns (uint balance) {
//            return tokenContract.balanceOf(tokenOwner);
//        }

    modifier allowedToMakePayment(address _merchant, string _reference)
    {
        require(!isStringEmpty(_reference));
        require(isExistingMerchant(_merchant));
        _;
    }

    struct Merchant{
        uint balance;
        bool created;
    }
}
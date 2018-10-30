pragma solidity ^0.4.23;
import "./math/SafeMath.sol";
import "./ownership/Ownable.sol";
import "./GatewayERC20Contract.sol";

contract PaymentGatewayContract is Ownable{
    using SafeMath for uint256;
    uint gatewayFeePercentage;
    uint256 gatewayBalance;
    address beneficiary;
    mapping(address => Merchant) merchants;

    GatewayERC20Contract tokenContract;

    event AddMerchantEvent(address merchant);
    event PaymentMadeEvent(address _merchant, string _reference, uint _amount);
    event PaymentMadeInTokensEvent(address _merchant, string _reference, uint _tokenAmount);
    event WithdrawGatewayFundsEvent(address _walletAddress, uint _amount);
    event WithdrawPaymentEvent(address _walletAddress, uint _amount);


// Needs way to forward on in event of new contract

    constructor(uint _gatewayFee, address _beneficiary) public {
        gatewayFeePercentage = _gatewayFee;
        beneficiary = _beneficiary;
        gatewayBalance = 0;
    }

    function setTokenContract(address _tokenContractAddress) public onlyOwner{
        tokenContract = GatewayERC20Contract(_tokenContractAddress);
    }

    function getTokenContractAddress() public view returns(address){
        return tokenContract;
    }

// Is this required?
//    function issueTokens(address _recipient, uint _amount) public onlyOwner{
//        tokenContract.issueTokens(_recipient, _amount);
//    }


    function addMerchant(address _walletAddress) public onlyOwner {
        require(!isExistingMerchant(_walletAddress));
        Merchant memory newMerchant = Merchant({ balance: 0, created: true});
        merchants[_walletAddress] = newMerchant;
        emit AddMerchantEvent(_walletAddress);
    }

// Can possibly remove
//    function makePayment(address _merchantAddress, string _reference) payable allowedToMakePayment(_merchantAddress, _reference) public{
//        uint gatewayFee = calculateGatewayFee(msg.value);
//        gatewayBalance = SafeMath.add(gatewayBalance, gatewayFee);

//        uint merchantPayment = SafeMath.sub(msg.value, gatewayFee);
//        addPaymentToMerchantBalance(_merchantAddress, merchantPayment);

//        emit PaymentMadeEvent(_merchantAddress, _reference, msg.value);
//    }

// needs to take gateway fee percentage
// Is it cheaper to make 2 contract calls here or do the logic in erc20 contract?

    function makePaymentInTokens(address _merchantAddress, string _reference, uint _tokenAmount) 
        allowedToMakePayment(_merchantAddress, _reference)
        public{
        require(hasSufficientTokensForTransfer(_tokenAmount));
        uint transactionFee = calculateGatewayFee(_tokenAmount); // int ?
        uint merchantFee = SafeMath.sub(_tokenAmount, transactionFee);
        uint ownerFee = transactionFee;

        tokenContract.gatewayTokenTransfer(msg.sender, _merchantAddress, merchantFee );
        emit PaymentMadeInTokensEvent(_merchantAddress, _reference, merchantFee);

        tokenContract.gatewayTokenTransfer(msg.sender, beneficiary, ownerFee );
        emit PaymentMadeInTokensEvent(beneficiary, _reference, ownerFee); // how to alter reference string?
    }

//    function addPaymentToMerchantBalance(address _merchantAddress, uint256 _paymentAmount) private {
//        uint256 currentBalance = merchants[_merchantAddress].balance;
//        merchants[_merchantAddress].balance = SafeMath.add(currentBalance, _paymentAmount);
//    }

//    function withdrawPayment(address _merchantAddress) public{
//        require(permittedToAccessAccount(_merchantAddress));
//        uint merchBalance = merchants[_merchantAddress].balance;
//        _merchantAddress.transfer(merchBalance);
//        merchants[_merchantAddress].balance = 0;
//        emit WithdrawPaymentEvent(_merchantAddress, merchBalance);
//    }

    // Fees
    function setGatewayFee(uint _newFee) onlyOwner public{
        require(_newFee < 100);
        gatewayFeePercentage = _newFee;
    }

//    function withdrawGatewayFees() onlyOwner public{
//        owner.transfer(gatewayBalance);
//        emit WithdrawGatewayFundsEvent(owner, gatewayBalance);
//        gatewayBalance = 0;
//    }

    // Read only functions
//    function getMerchantBalance(address _merchantAddress) public view returns(address, uint){
//        require(permittedToAccessAccount(_merchantAddress));
//        Merchant memory merchant = merchants[_merchantAddress];
//        return (_merchantAddress, merchant.balance);
//    }

//    function getGatewayBalance() public onlyOwner view returns(uint){
//        return gatewayBalance;
//    }

    // Calculations
    function calculateGatewayFee(uint _amount) private view returns(uint fee){
        return SafeMath.mul(_amount, gatewayFeePercentage) / 100;
    }

    // Require functions
//    function permittedToAccessAccount(address _address) private view returns (bool valid){
//        if(msg.sender == owner){
//            return true;
//        }
//        return msg.sender == _address;
//    }

    function isExistingMerchant(address _merchantAddress) public view returns (bool){
        return merchants[_merchantAddress].created;
    }

    function isStringEqual(string _input_a, string _input_b) private pure returns(bool){
        return keccakHash(_input_a) == keccakHash(_input_b);
    }

    function isStringEmpty(string _input) private pure returns(bool){
        return keccakHash(_input) == keccakHash("");
    }


    function keccakHash(string _input) private pure returns (bytes32){
        return keccak256(abi.encodePacked(_input));
    }

    function hasSufficientTokensForTransfer(uint _amount) private view returns(bool){
        uint balance = tokenContract.balanceOf(msg.sender);
        return balance >= _amount;
    }

// is this required as this can be used directly on erc20 contract ?

//    function balanceOf(address tokenOwner) public view returns (uint balance) {
//            return tokenContract.balanceOf(tokenOwner);
//        }

    modifier allowedToMakePayment(address _merchant, string _reference){
        require(!isStringEmpty(_reference));
        require(isExistingMerchant(_merchant));
        _;
    }

    struct Merchant{
        uint balance;
        bool created;
    }
}
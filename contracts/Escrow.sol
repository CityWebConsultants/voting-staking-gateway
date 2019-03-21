// import ownership contract

contract Escrow is Ownable {
    enum PaymentStatus { Pending, Completed, Refunded, Disputed }

    event PaymentCreation(uint indexed orderId, address indexed customer, uint value);
    event PaymentCompletion(uint indexed orderId, address indexed customer, uint value, PaymentStatus status);
    // payment dispute 
    // rewrite payment completion

    struct Payment {
        address customer;
        address merchant
        uint256 value;
        PaymentStatus status;
        bool refundApproved;
        address refferal; // what can we factor out... this could get very expensive
        uint256 fee;
        uint256 currency;
        uint256 autoCompleteAt;
        bytes32 sku;
    }

    ERC20[] public currencies;

    // modifiers 
    modifier isPaymentParticipant() 
    {
        _;
    }

    modifier isMerchant() 
    {
        _;
    }

    mapping(uint => Payment) public payments;
    ERC20 public currency;
    address public feeCollection;
    Merchant public merchant;
//    ERC20 public currency;
    // fees paid in 
    // should this do more than intended?
    // base currency
    // can create something that could anybody could create a UI for
    // discounted fees -- makes economic sense
    function constructor(ERC20 _currency, address _feeCollection) public {
        currencies[0] = _currency;
        feeCollection = _feeCollection;
        owner = merchant(msg.sender);
    }

    function createPayment(uint _orderId, address _customer, uint _value)
    external 
    onlyOwner 
    {
        payments[_orderId] = Payment(_customer, _value, PaymentStatus.Pending, false);
        emit PaymentCreation(_orderId, _customer, _value);
    }

    function release(uint _orderId) 
    external 
    {
        completePayment(_orderId, feeCollection, PaymentStatus.Completed);
    }

    function refund(uint _orderId)
    is
    public
    {
        completePayment(_orderId, msg.sender, PaymentStatus.Refunded);
    }


    function resolveDispute(uint256 _orderId, address _recipient)
    public 
    onlyOwner
    {
        if (_recipient == ) {

        }
    }

    //add function
    // isParticiapnt
    // use in participant modifuer 

    // consider implementing pull payments
    // payment completion depends who is makeing the refund
    // How are we going to manage order
    // only part
    function dispute(uint _orderId, _raisedBy address)
    public 
    isPaymentParticipant
    {
        require(payment[_orderId].status == PaymentStatus.Pending);
        payment[_orderId].autoCompleteAt += 14 days;
        payment[_orderId].status = PaymentStatus.Disputed;
    }

    // admin can also do this
    function approveRefund(uint _orderId) 
    external 
    {
        // if is 
        require(msg.sender == feeCollection);
        Payment storage payment = payments[_orderId];
        payment.refundApproved = true;
    }

    function completePayment(uint _orderId, address _receiver, PaymentStatus _status) 
    private 
    {
        Payment storage payment = payments[_orderId];
        require(payment.customer == msg.sender);
        require(payment.status == PaymentStatus.Pending);

        if (_status == PaymentStatus.Refunded) {
            require(payment.refundApproved);
        }

        currency.transfer(_receiver, payment.value);
        Merchant.changeOrderStatus(_orderId, Merchant.OrderStatus.Completed);
        payment.status = _status;
        emit PaymentCompletion(_orderId, payment.customer, payment.value, _status);
    }

    addCurrency(ERC20 currency)
    public
    onlyOwner
    {
        currencies.push(currency);
    }

    // transferFrom;
    // getCurrency -- can interrogate contract for name and return it

    // add autofinalise
    // add dispute
    // add fee
    // add payment routing
    // add coin
}
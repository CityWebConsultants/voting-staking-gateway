var PaymentGatewayContract = artifacts.require("PaymentGatewayContract");

var test_validAmountOfWeiToPay = web3.toWei(10,'ether');
var test_validPaymentReference = "ReferenceOne";

contract('PaymentGatewayContract - Merchant',  function(accounts){
    let gatewayContract;
    const merchantAddress = accounts[1];  
    const clientAddress = accounts[2];
    const gatewayBeneficiary = accounts[3];
    const totalSupply = '420000000';
    const symbol = 'BUD';
    const name = 'eBudz';
    const fee = '4';

    before('setup and deploy gateway contract', async () => {
        gatewayContract = await PaymentGatewayContract.new(fee, gatewayBeneficiary);  
        await gatewayContract.addMerchant(merchantAddress); 
    })
    
    // @todo add relevant tests for tokens
});



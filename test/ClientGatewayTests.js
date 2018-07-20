var PaymentGatewayContract = artifacts.require("PaymentGatewayContract");
var GatewayERC20Contract = artifacts.require("GatewayERC20Contract");

var test_validAmountOfWeiToPay = web3.toWei(5,'ether');
var test_invalidAmountOfWeiToPay = -10;
var test_validPaymentReference = "ReferenceOne";
var test_invalidPaymentReference = "";
var test_numberOfTokensForPayment = 100;

contract('PaymentGatewayContract - Client',  function(accounts){
    let gatewayContract;
    let merchantAddress = accounts[1];  
    let clientAddress = accounts[2];

    before('setup, deploy contract and add merchant', async function(){
        gatewayContract = await PaymentGatewayContract.deployed();        
        await gatewayContract.addMerchant(merchantAddress);
    })

    it("Payments - Given a valid merchant and reference, should be able to make payment in Eth ", async function(){
        let paymentSuccessful = false;
        try{
            await gatewayContract.makePayment(merchantAddress,test_validPaymentReference, {value: test_validAmountOfWeiToPay, from: clientAddress} );
            paymentSuccessful = true;
        }
        catch(error){}

        assert.equal(paymentSuccessful, true, "Could not make payment");
    });

    it("Payments - Given an invalid merchant and valid reference, should not be able to make payment in Eth ", async function(){
        let paymentUnsuccessful = false;
        try{
            await gatewayContract.makePayment(clientAddress,test_validPaymentReference, {value: test_validAmountOfWeiToPay, from: clientAddress} );
        }
        catch(error){
            paymentUnsuccessful = true;
        }

        assert.equal(paymentUnsuccessful, true, "Able to make payment to invalid merchant");
    });    

    it("Payments - Given an valid merchant and invalid reference, should not be able to make payment in Eth ", async function(){
        let paymentUnsuccessful = false;
        try{
            await gatewayContract.makePayment(merchantAddress,test_invalidPaymentReference, {value: test_validAmountOfWeiToPay, from: clientAddress} );
        }
        catch(error){
            paymentUnsuccessful = true;
        }

        assert.equal(paymentUnsuccessful, true, "Able to make payment using invalid reference");
    });    

    it("Payments with Tokens - Given a valid merchant, reference and token amount, should be able to make payment", async function(){
        let paymentSuccessful = false;
        try{
            await gatewayContract.issueTokens(clientAddress, test_numberOfTokensForPayment);
            await gatewayContract.makePaymentInTokens(merchantAddress,test_validPaymentReference, test_numberOfTokensForPayment, {from: clientAddress} );
            paymentSuccessful = true;
        }
        catch(error){
            console.log(error);
        }

        assert.equal(paymentSuccessful, true, "Could not make payment in tokens");
    });    

    it("Payments with Tokens - Given an invalid merchant but valid reference and token amount, should not be able to make payment", async function(){
        let paymentUnsuccessful = false;
        try{
            await gatewayContract.issueTokens(clientAddress, test_numberOfTokensForPayment);
            await gatewayContract.makePaymentInTokens(clientAddress,test_validPaymentReference, test_numberOfTokensForPayment, {from: clientAddress} );
        }
        catch(error){
            paymentUnsuccessful = true;
        }

        assert.equal(paymentUnsuccessful, true, "Made payment in tokens despite invalid merchant");
    });  

    it("Payments with Tokens - Given a valid merchant and token amount but invalid reference, should not be able to make payment", async function(){
        let paymentUnsuccessful = false;
        try{
            await gatewayContract.issueTokens(clientAddress, test_numberOfTokensForPayment);
            await gatewayContract.makePaymentInTokens(merchantAddress,test_invalidPaymentReference, test_numberOfTokensForPayment, {from: clientAddress} );
        }
        catch(error){
            paymentUnsuccessful = true;
        }

        assert.equal(paymentUnsuccessful, true, "Made payment in tokens despite an incorrect reference");
    });     

    it("Payments with Tokens - Given a valid merchant and reference but invalid token amount, should not be able to make payment", async function(){
        let paymentUnsuccessful = false;
        try{
            let tokenContract = await GatewayERC20Contract.deployed();
            let currentBalance = await tokenContract.balanceOf(clientAddress);
            let invalidTokenAmountToPay = currentBalance * 2;            
            await gatewayContract.makePaymentInTokens(merchantAddress,test_validPaymentReference, invalidTokenAmountToPay, {from: clientAddress} );
        }
        catch(error){
            paymentUnsuccessful = true;
        }

        assert.equal(paymentUnsuccessful, true, "Made payment in tokens despite not having enough");
    });  
});



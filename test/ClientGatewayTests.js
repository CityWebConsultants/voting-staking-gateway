var PaymentGatewayContract = artifacts.require("PaymentGatewayContract");
var GatewayERC20Contract = artifacts.require("GatewayERC20Contract");

var test_validAmountOfWeiToPay = web3.toWei(12,'ether');
var test_invalidAmountOfWeiToPay = -10;
var test_validPaymentReference = "ReferenceOne";
var test_invalidPaymentReference = "";
var test_numberOfTokensForPayment = 100;

contract('PaymentGatewayContract - Client',  function(accounts){
    let gatewayContract;
    let merchantAddress = accounts[1];  
    let clientAddress = accounts[2];
    let gatewayBeneficiary = accounts[3];

    before('setup, deploy contract and add merchant', async function(){
       /* gatewayContract = await PaymentGatewayContract.new();
        tokenContract = await GatewayERC20Contract.new(gatewayContract.address);*/
      gatewayContract = await PaymentGatewayContract.new(4, gatewayBeneficiary);
      tokenContract = await GatewayERC20Contract.new(gatewayContract.address, 420000000, 'BUD', 'eBudz');
        await gatewayContract.addMerchant(merchantAddress);     
        await gatewayContract.setTokenContract(tokenContract.address);
        await tokenContract.transfer(clientAddress, 10);
    })

  /*  it("Payments - Given a valid merchant and reference, should be able to make payment in Eth ", async function(){
        let paymentSuccessful = false;
        try{
            await gatewayContract.makePayment(merchantAddress,test_validPaymentReference, {value: test_validAmountOfWeiToPay, from: clientAddress} );
            paymentSuccessful = true;
        }
        catch(error){}

        assert.equal(paymentSuccessful, true, "Could not make payment");
    });*/

   /* it("Payments - Given an invalid merchant and valid reference, should not be able to make payment in Eth ", async function(){
        let paymentUnsuccessful = false;
        try{
            await gatewayContract.makePayment(clientAddress,test_validPaymentReference, {value: test_validAmountOfWeiToPay, from: clientAddress} );
        }
        catch(error){
            paymentUnsuccessful = true;
        }

        assert.equal(paymentUnsuccessful, true, "Able to make payment to invalid merchant");
    });    
*/
  /*  it("Payments - Given an valid merchant and invalid reference, should not be able to make payment in Eth ", async function(){
        let paymentUnsuccessful = false;
        try{
            await gatewayContract.makePayment(merchantAddress,test_invalidPaymentReference, {value: test_validAmountOfWeiToPay, from: clientAddress} );
        }
        catch(error){
            paymentUnsuccessful = true;
        }

        assert.equal(paymentUnsuccessful, true, "Able to make payment using invalid reference");
    });    */

  it("Payments with Tokens - Transfer status must be active before users and transfer", async function(){
    let paymentSuccessful = false;
    try{
      await tokenContract.transfer(merchantAddress, test_numberOfTokensForPayment).send({from : clientAddress});
      //await gatewayContract.makePaymentInTokens(merchantAddress,test_validPaymentReference, test_numberOfTokensForPayment, {from: clientAddress} );
      paymentSuccessful = true;
    }
    catch(error){
      console.log(error);
    }

    assert.equal(paymentSuccessful, true, "Could not make payment in tokens");
  });

  it("Payments with Tokens - Given a valid merchant, reference and token amount, should be able to make payment", async function(){
        let paymentSuccessful = false;
        try{
            await tokenContract.transfer(clientAddress, test_numberOfTokensForPayment);
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
            await tokenContract.transfer(clientAddress, test_numberOfTokensForPayment);
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
            await tokenContract.transfer(clientAddress, test_numberOfTokensForPayment);
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
            let currentBalance = await tokenContract.balanceOf(clientAddress);
            let invalidTokenAmountToPay = currentBalance * 2;            
            await gatewayContract.makePaymentInTokens(merchantAddress,test_validPaymentReference, invalidTokenAmountToPay, {from: clientAddress} );
        }
        catch(error){
            paymentUnsuccessful = true;
        }

        assert.equal(paymentUnsuccessful, true, "Made payment in tokens despite not having enough");
    });

  it("Payments with Tokens - Ensure merchant receives correct # of tokens", async function(){
    let paymentUnsuccessful = false;
    let currentBalance = 0;
    try{
      currentBalance = await tokenContract.balanceOf(merchantAddress);
    }
    catch(error){
      console.log(error);
      paymentUnsuccessful = true;
    }
    assert.equal(currentBalance.toNumber(), 96, "Incorrect tokens to merchant");
  });

  it("Payments with Tokens - Ensure beneficiary receives correct # of tokens", async function(){
    let paymentUnsuccessful = false;
    let currentBalance = 0;
    try{
      currentBalance = await tokenContract.balanceOf(gatewayBeneficiary);
    }
    catch(error){
        console.log(error);
      paymentUnsuccessful = true;
    }
    assert.equal(currentBalance.toNumber(), 4, "Incorrect tokens to beneficiary");
  });

});



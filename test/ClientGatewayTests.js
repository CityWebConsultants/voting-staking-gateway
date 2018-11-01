var PaymentGatewayContract = artifacts.require("PaymentGatewayContract");
var GatewayERC20Contract = artifacts.require("GatewayERC20Contract");

var test_validAmountOfWeiToPay = web3.toWei(12,'ether');
var test_invalidAmountOfWeiToPay = -10;
var test_validPaymentReference = "ReferenceOne";
var test_invalidPaymentReference = "";
var test_numberOfTokensForPayment = 100;

contract('Client - PaymentGatewayContract',  function(accounts){
    let gatewayContract;
    const adminAddress = accounts[0];
    const merchantAddress = accounts[1];  
    const clientAddress = accounts[2];
    const gatewayBeneficiary = accounts[3];
    const totalSupply = '420000000';
    const symbol = 'BUD';
    const name = 'eBudz';

    before('setup, deploy contract and add merchant', async function(){
       /* gatewayContract = await PaymentGatewayContract.new();
        tokenContract = await GatewayERC20Contract.new(gatewayContract.address);*/
      // 4 what is this number
        gatewayContract = await PaymentGatewayContract.new('4', gatewayBeneficiary);
        tokenContract = await GatewayERC20Contract.new(gatewayContract.address, totalSupply, symbol, name);
        await gatewayContract.addMerchant(merchantAddress);
        await gatewayContract.setTokenContract(tokenContract.address);
        await tokenContract.setTransferStatus(true);

        // So... only the gatewayContract can call the await tokenContract.setTransferStatus(true);
        // aha -- we have to make sure the accunt has funds to begin with
       //  await tokenContract.transfer(clientAddress, '1000', {from: adminAddress}); 
    })
  // @todo wrap this in 
  // not clear whether this is supposed to fail or....!?
  // check out the older version and see what it does
  it("Payments with Tokens - Transfer status must be active before users and transfer", async function(){
    let paymentSuccessful = false;

    try {
      const transferredToClient = await tokenContract.transfer(merchantAddress, test_numberOfTokensForPayment, {from: clientAddress});
      const gatewayPayment = await gatewayContract.makePaymentInTokens(merchantAddress,test_validPaymentReference, test_numberOfTokensForPayment, {from: clientAddress});
      paymentSuccessful = true;
    }
    catch(error) {
        // @todo come back and check this
        assert(true);
    }

    assert.equal(paymentSuccessful, false, "Could not make payment in tokens");
  });

  it("Payments with Tokens - Given a valid merchant, reference and token amount, should be able to make payment", async function(){
        let paymentSuccessful = false;
        try {
            await tokenContract.transfer(clientAddress, test_numberOfTokensForPayment);
            await gatewayContract.makePaymentInTokens(merchantAddress,test_validPaymentReference, test_numberOfTokensForPayment, {from: clientAddress} );
            
            // @todo should also check results and events and things like that
            paymentSuccessful = true;
        }
        catch(error){
            console.log(error);
        }

        assert.equal(paymentSuccessful, true, "Could not make payment in tokens");
    });    
    

    // what makes a reference valid -- just that it should
    it("Payments with Tokens - Given an invalid merchant but valid reference and token amount, should not be able to make payment", async function(){
        let paymentUnsuccessful = false;
        try {
            await tokenContract.transfer(clientAddress, test_numberOfTokensForPayment);
            await gatewayContract.makePaymentInTokens(clientAddress,test_validPaymentReference, test_numberOfTokensForPayment, {from: clientAddress} );
        }
        catch(error) {
            paymentUnsuccessful = true;
        }

        assert.equal(paymentUnsuccessful, true, "Made payment in tokens despite invalid merchant");
    });  

    it("Payments with Tokens - Given a valid merchant and token amount but invalid reference, should not be able to make payment", async function(){
        let paymentUnsuccessful = false;
        try {
            await tokenContract.transfer(clientAddress, test_numberOfTokensForPayment);
            await gatewayContract.makePaymentInTokens(merchantAddress,test_invalidPaymentReference, test_numberOfTokensForPayment, {from: clientAddress} );
        }
        catch(error){
            // we should be making some kind of assertion about our error
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

  it("Should ensure merchant receives correct # of tokens", async function(){
    let paymentUnsuccessful = false;
    let currentBalance = 0;
    try {
      currentBalance = await tokenContract.balanceOf(merchantAddress);
    }
    catch(error) {
      console.log(error);
      paymentUnsuccessful = true;
    }

    assert.equal(currentBalance.toNumber(), 96, "Incorrect tokens to merchant");
  });

  it("Payments with Tokens - Ensure beneficiary receives correct # of tokens", async function(){
    let paymentUnsuccessful = false;
    let currentBalance = 0;
    try {
      currentBalance = await tokenContract.balanceOf(gatewayBeneficiary);
    }
    catch(error){
        console.log(error);
      paymentUnsuccessful = true;
    }
    assert.equal(currentBalance.toNumber(), 4, "Incorrect tokens to beneficiary");
  });

});



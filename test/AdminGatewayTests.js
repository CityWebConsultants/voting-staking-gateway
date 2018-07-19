var PaymentGatewayContract = artifacts.require("PaymentGatewayContract");
var GatewayERC20Contract = artifacts.require("GatewayERC20Contract");

var test_invalidAddress = "INVALIDADDRESS";
var test_merchantAddress = "0xF86e64c759829AD2c9cd9a85406d98D2d820F21B";
var test_validTokenRecipientAddress = "0x008901D0bD74bC17fe9B20CEE797BB7588ca6e68";
var test_validAmountOfTokens = 100;
var test_invalidAmountOfTokens = -1;;


contract('PaymentGatewayContract - Admin',  function(accounts){
    it("Given a valid address, should add merchant to contract", async function(){
        let gatewayContract = await PaymentGatewayContract.deployed();
        let addedMerchant = false;
        try{
            await gatewayContract.addMerchant(test_merchantAddress);
            addedMerchant = await gatewayContract.isExistingMerchant(test_merchantAddress);
        }
        catch(error){
           // console.log(error);
        }

        assert.equal(addedMerchant, true, "Did not successfully add merchant.");
    });

    it("Given an incorrect address, should fail adding merchant", async function(){
        let gatewayContract = await PaymentGatewayContract.deployed();
        let addedMerchant = true;
        try{
            await gatewayContract.addMerchant(test_invalidAddress);
            addedMerchant = await gatewayContract.isExistingMerchant(test_merchantAddress);
        }
        catch(error){
            addedMerchant = false;
        }

        assert.equal(addedMerchant, false, "Added merchant despite providing invalid address");
    });

    it("Given a correct address and amount, should issue correct amount of tokens", async function(){
        let gatewayContract = await PaymentGatewayContract.deployed();
        let tokenBalance = 0;
        try{
            await gatewayContract.issueTokens(test_validTokenRecipientAddress, test_validAmountOfTokens);
            let tokenContract = await GatewayERC20Contract.deployed();
            let balance = await tokenContract.balanceOf(test_validTokenRecipientAddress);
            tokenBalance = balance.c[0];
        }
        catch(error){
            //console.log(error);
        }

        assert.equal(tokenBalance, test_validAmountOfTokens, "Did not issue the correct amount of tokens.");
    });

    it("Given an incorrect address and correct amount, should not issue tokens", async function(){
        let gatewayContract = await PaymentGatewayContract.deployed();
        let tokenBalance = 0;
        try{
            await gatewayContract.issueTokens(test_validTokenRecipientAddress, test_validAmountOfTokens);
            let tokenContract = await GatewayERC20Contract.deployed();
            let balance = await tokenContract.balanceOf(test_invalidAddress);
            tokenBalance = balance.c[0];
        }
        catch(error){
            //console.log(error);
        }

        assert.equal(tokenBalance, 0, "Token balance is more than 0 for invalid address");
    });
   
    it("Given a correct address and invalid token amount, should fail issue", async function(){
        let gatewayContract = await PaymentGatewayContract.deployed();
        let tokenIssueFail = false;
        try{
            await gatewayContract.issueTokens(test_validTokenRecipientAddress, test_invalidAmountOfTokens);
        }
        catch(error){
            tokenIssueFail = true;
        }

        assert.equal(tokenIssueFail, true, "Issued tokens with when given an invalid amount ("+test_invalidAmountOfTokens+")");
    });
});



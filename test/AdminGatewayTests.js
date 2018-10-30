var PaymentGatewayContract = artifacts.require("PaymentGatewayContract");
var GatewayERC20Contract = artifacts.require("GatewayERC20Contract");

var test_invalidAddress = "INVALIDADDRESS";
var test_validAmountOfTokens = 100;
var test_invalidAmountOfTokens = -1;
var test_validGatewayFeeAmount = 20;
var test_invalidGatewayFeeAmount = 150;

contract('PaymentGatewayContract - Admin',  function(accounts){
    let gatewayContract;
    let tokenContract;
    const merchantAddress = accounts[1];
    const clientAddress = accounts[2];
    const gatewayBeneficiary = accounts[3];
    const totalSupply = '420000000';
    const symbol = 'BUD';
    const name = 'eBudz';
    const fee = '4'

    before('setup and deploy gateway contract', async () => {
        gatewayContract = await PaymentGatewayContract.new(fee, gatewayBeneficiary);
        tokenContract = await GatewayERC20Contract.new(
            gatewayContract.address, 
            totalSupply, 
            symbol, 
            name);
    })

    /*
        Gateway Admin
    */
    it('Gateway Admin - As Owner, should be able to set the token contract address', async () => {    
        let addressSet = false;
        try {
            await gatewayContract.setTokenContract(tokenContract.address);
            addressSet = true;
        }
        catch(error){}

        assert.equal(addressSet, true, "Couldn't set token contract address");
    });

    it('Gateway Admin - As NOT Owner, should not be able to set the token contract address', async function(){    
        let tokenContractAddress = gatewayContract.address;
        let failedSettingAddress = false;
        try {
            await gatewayContract.setTokenContract(tokenContractAddress, {from: clientAddress});
        }
        catch(error){
            failedSettingAddress = true;
        }

        assert.equal(failedSettingAddress, true, "Able to set contract address from non owner account");
    });  

    it('Gateway Admin - As Owner, should be able to set the gateway fees', async function(){  
        // @todo try / catch is not used so bin it  
        let feesSet = false;
        try {
            await gatewayContract.setGatewayFee(test_validGatewayFeeAmount);
            feesSet = true;
        }
        catch(error){}

        assert.equal(feesSet, true, "Couldn't set gateway fees");
    });

    it('Gateway Admin - As NOT Owner, should not be able to set the gateway fees', async function(){    
        let feeSetFail = false;
        try {
            await gatewayContract.setGatewayFee(test_validGatewayFeeAmount, {from: clientAddress});
        }
        catch(error){
            feeSetFail = true;
        }

        assert.equal(feeSetFail, true, "Able to set gateway fee when not owner");
    });    

    it('Gateway Admin - Gateway fees must be less than 100', async function(){    
        let feeSetFail = false;
        try{
            await gatewayContract.setGatewayFee(test_invalidGatewayFeeAmount);
        }
        catch(error){
            feeSetFail = true;
        }

        assert.equal(feeSetFail, true, "Able to set gateway fee above permitted limit");
    });    

    // Eth is no longer used in the smart contract this way
    it.skip('Gateway Admin - As Owner, should be able withdraw gateway fees', async function(){    
        let withdrawalSuccessful = false;
        try{
            await gatewayContract.withdrawGatewayFees();
            withdrawalSuccessful = true;
        }
        catch(error){}

        assert.equal(withdrawalSuccessful, true, "Couldn't withdraw gateway fees");
    });

    it('Gateway Admin - As NOT Owner, should not be able withdraw gateway fees', async function(){    
        let withdrawalUnsuccessful = false;
        try{
            await gatewayContract.withdrawGatewayFees({from: clientAddress});
        }
        catch(error){
            withdrawalUnsuccessful = true;
        }

        assert.equal(withdrawalUnsuccessful, true, "Able to withdraw gateway fees as non owner");
    });  

    // Pointless. Remove.
    it.skip('Gateway Admin - As Owner, should be able to get gateway balance', async function(){    
        let balanceCheckSucessful = false;
        try{
            let balance = await gatewayContract.getGatewayBalance();
            balanceCheckSucessful = balance > -1;
        }
        catch(error){}

        assert.equal(balanceCheckSucessful, true, "Not able to check gateway balance as owner");
    });      

    it('Gateway Admin - As NOT Owner, should not be able to get gateway balance', async function(){    
        let balanceCheckUnsucessful = false;
        try{
            await gatewayContract.getGatewayBalance({from: clientAddress});
        }
        catch(error){
            balanceCheckUnsucessful = true;
        }

        assert.equal(balanceCheckUnsucessful, true, "Able to check gateway balance as non owner");
    });      


    /*
        Merchant Admin
    */
    it("Merchant Admin - As Owner, given a valid address, should add merchant to contract", async function(){
        let addedMerchant = false;
        try{
            await gatewayContract.addMerchant(merchantAddress);
            addedMerchant = await gatewayContract.isExistingMerchant(merchantAddress);
        }
        catch(error){ }

        assert.equal(addedMerchant, true, "Did not successfully add merchant.");
    });

    it("Merchant Admin - As Owner, given an incorrect address, should fail adding merchant", async function(){
        let addedMerchant = true;
        try{
            await gatewayContract.addMerchant(test_invalidAddress);
            addedMerchant = await gatewayContract.isExistingMerchant(test_invalidAddress);
        }
        catch(error){
            addedMerchant = false;
        }

        assert.equal(addedMerchant, false, "Added merchant despite providing invalid address");
    });

    it("Merchant Admin - As NOT Owner, should fail add merchant to contract", async function(){
        let addedMerchantUnsuccessful = false;
        try{
            await gatewayContract.addMerchant(merchantAddress, {from:clientAddress});
        }
        catch(error){
            addedMerchantUnsuccessful = true;
        }

        assert.equal(addedMerchantUnsuccessful, true, "Added merchant when not owner");
    });    

    // this contract function no longer used. Remove.
    it.skip("Merchant Admin - As Owner, should be able to withdraw merchant payments", async function(){
        let withdrawalSuccessful = false;
        try{
            await gatewayContract.withdrawPayment(merchantAddress);
            withdrawalSuccessful = true;
        }
        catch(error){}

        assert.equal(withdrawalSuccessful, true, "Withdraw merchant funds as contract owner unsuccessful");
    });

    it("Merchant Admin - As NOT Owner or Merchant, should be not able to withdraw merchant payments", async function(){
        let withdrawalUnsuccessful = false;
        try{
            await gatewayContract.withdrawPayment(merchantAddress, {from: clientAddress});
        }
        catch(error){
            withdrawalUnsuccessful = true;
        }

        assert.equal(withdrawalUnsuccessful, true, "Withdraw merchant funds using random account possible");
    });    

    // No longer using eth in contract --- remove
    it.skip("Merchant Admin - As Owner, should be able to check merchant balance", async function(){
        let balanceCheckSucessful = false;
        try{
            await gatewayContract.getMerchantBalance(merchantAddress);
            balanceCheckSucessful = true;
        }
        catch(error){ }

        assert.equal(balanceCheckSucessful, true, "Not able to check balance of merchant when owner");
    });  

    it("Merchant Admin - As NOT Owner or Merchant, should not be able to check merchant balance", async function(){
        let balanceCheckUnsucessful = false;
        try{
            await gatewayContract.getMerchantBalance(merchantAddress, {from:clientAddress});
        }
        catch(error){
            balanceCheckUnsucessful = true
         }

        assert.equal(balanceCheckUnsucessful, true, "Able to check balance of merchant when not owner or merchant");
    });      


    /*
        Token Functionality
    */

    // Token issuance is no longer available in this contract. Remove
    it.skip("Token Functionality - As Owner, given a correct address and amount, should issue correct amount of tokens", async function(){
        let tokenBalance = 0;
        try{
            await gatewayContract.issueTokens(clientAddress, test_validAmountOfTokens);
            let balance = await tokenContract.balanceOf(clientAddress);
            tokenBalance = balance.c[0];
        }
        catch(error){
            console.log(error);
         }

        assert.equal(tokenBalance, test_validAmountOfTokens, "Did not issue the correct amount of tokens.");
    });

    it("Token Functionality - As Owner, given an incorrect address and correct amount, should not issue tokens", async function(){
        let tokenBalance = 0;
        try{
            await gatewayContract.issueTokens(test_invalidAddress, test_validAmountOfTokens);
            let tokenContract = await GatewayERC20Contract.deployed();
            let balance = await tokenContract.balanceOf(test_invalidAddress);
            tokenBalance = balance.c[0];
        }
        catch(error){ }

        assert.equal(tokenBalance, 0, "Token balance is more than 0 for invalid address");
    });
   
    it("Token Functionality - As Owner, given a correct address and invalid token amount, should fail issue", async function(){
        let tokenIssueFail = false;
        try{
            await gatewayContract.issueTokens(clientAddress, test_invalidAmountOfTokens);
        }
        catch(error){
            tokenIssueFail = true;
        }

        assert.equal(tokenIssueFail, true, "Issued tokens with when given an invalid amount ("+test_invalidAmountOfTokens+")");
    });

    it("Token Functionality - As NOT Owner, given a correct address and amount, should not issue tokens", async function(){
        let issueTokensUnsuccessful = false;
        try{
            await gatewayContract.issueTokens(clientAddress, test_validAmountOfTokens, {from:clientAddress});
        }
        catch(error){
            issueTokensUnsuccessful = true;
        }

        assert.equal(issueTokensUnsuccessful, true, "Able to issue tokens when not owner");
    });    
});



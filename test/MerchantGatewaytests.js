var PaymentGatewayContract = artifacts.require("PaymentGatewayContract");

var test_validAmountOfWeiToPay = web3.toWei(10,'ether');
var test_validPaymentReference = "ReferenceOne";

contract('PaymentGatewayContract - Merchant',  function(accounts){
    let gatewayContract;
    let merchantAddress = accounts[1];  
    let clientAddress = accounts[2];

    console.log("merch:"+ merchantAddress);
    console.log("client:"+ clientAddress);


    before('setup and deploy gateway contract', async function(){
        gatewayContract = await PaymentGatewayContract.new();  
        await gatewayContract.addMerchant(merchantAddress); 
    })    

    it("Withdrawals - As Merchant, should be able to withdraw merchant payments", async function(){
        let withdrawalSuccessful = false;
        
        try{
            await gatewayContract.withdrawPayment(merchantAddress, {from: merchantAddress});
            withdrawalSuccessful = true;
        }
        catch(error){
            console.log(error)
        }

        assert.equal(withdrawalSuccessful, true, "Withdraw merchant funds as contract merchant unsuccessful");
    });

    it("Withdrawals - As NOT Merchant or Owner, should be not able to withdraw merchant payments", async function(){
        let withdrawalUnsuccessful = false;
        try{
            await gatewayContract.withdrawPayment(merchantAddress, {from: clientAddress});
        }
        catch(error){
            withdrawalUnsuccessful = true;
        }

        assert.equal(withdrawalUnsuccessful, true, "Withdraw merchant funds using random account possible");
    });    
    

    it("Balance - As Merchant, should be able to check balance", async function(){
         let balanceCheckSucessful = false;
        try{
            let balance = await gatewayContract.getMerchantBalance(merchantAddress, {from: merchantAddress});
            balanceCheckSucessful = true;
        }
        catch(error){ }

        assert.equal(balanceCheckSucessful, true, "Not able to check balance of when merchant");
    });  

    it("Balance - As NOT Merchant or Owner, should not be able to check merchant balance", async function(){
        let balanceCheckUnsucessful = false;
        try{
            await gatewayContract.getMerchantBalance(merchantAddress, {from:clientAddress});
        }
        catch(error){
            balanceCheckUnsucessful = true
         }

        assert.equal(balanceCheckUnsucessful, true, "Able to check balance of merchant when not owner or merchant");
    });      

});


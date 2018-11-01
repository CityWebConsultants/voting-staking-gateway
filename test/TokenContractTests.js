var GatewayERC20Contract = artifacts.require("GatewayERC20Contract");
var PaymentGatewayContract = artifacts.require("PaymentGatewayContract");
var PresaleContract = artifacts.require("Presale");

var test_symbol = "BUD";
var test_name = "eBudz";
var decimals = 6;
var test_validAmountOfTokens = 100;
var invalidAmountOfTokens = -1;
var validAmountOfWeiToPay = web3.toWei(10,'ether');
var fundingGoal = 10;
var saleDurationInMins = 20;
// should there also be a sale start
// uhm, thats in weiu
var tokenCostInWei = 2600000000; // $0.75 = 2600000 wei ?
// what is the purpose of the minimum spend
var minimumSpend = 340; // $100 = 340 finney ? // how do we know this is finney

// 
contract("Token Contract - Test", function(accounts){
    let gatewayContract;
    let tokenContract;
    let presaleContract;
    let clientAddress = accounts[2];
    let clientAddressSecondary = accounts[3];
    let saleBeneficiary = accounts[4];
    let techBeneficiary = accounts[5];
    let gatewayBeneficiary = accounts[6];

    // Aha -- couldn't understand why was not being reset everytime -- 
    // cos it wasn't coded that way.... doh!...
    // Don't need to care about that cont
    beforeEach('setup and deploy gateway contract', async function() {
        gatewayContract = await PaymentGatewayContract.new('4', gatewayBeneficiary);
        tokenContract = await GatewayERC20Contract.new(gatewayContract.address, '420000000', 'BUD', 'eBudz');
        presaleContract = await PresaleContract.new(tokenContract.address, saleBeneficiary, techBeneficiary, fundingGoal, saleDurationInMins, tokenCostInWei, minimumSpend);
    })    

    // ah... so it was calling transfer on the 
    it("Token Properties - symbol should equal " + test_symbol, async function(){
        let tokenSymbol = await tokenContract.symbol();
        assert.equal(tokenSymbol, test_symbol, "Token symbol is not as expected")
    });

    it("Token Properties - name should equal " + test_name, async function(){
        let tokenName = await tokenContract.name();
        assert.equal(tokenName, test_name, "Token name is not as expected")
    });

    // Oh, we pass in to presale contract.... So what happens then when there is no burnaddress
    it("Token Functionality - As Owner, given a correct address and amount, should issue correct amount of tokens", async function(){
        let tokenBalance = 0;
        try {
            await tokenContract.transfer(presaleContract.address, 770000000); // 21m + 6 digits
            let balance = await tokenContract.balanceOf(presaleContract.address);
            tokenBalance = balance.toNumber();
        }
        catch(error){
            console.log(error);
        }

        assert.equal(tokenBalance, 770000000, "Did not issue the correct amount of tokens.");
    });

    it("Token Properties - decimal should equal " + decimals, async function(){
        let decimals = await tokenContract.decimals();
        assert.equal(decimals, decimals, "Token decimals is not as expected")
    });      

    it("Token Admin - given a valid address, should be able to set gateway contract address", async function(){
        let addressSet = false;
        try{
            await tokenContract.setPaymentGatewayAddress(gatewayContract.address);
            addressSet = true;
        }
        catch(error){}

        assert.equal(addressSet, true, "Couldn't set gateway contract address");
    })

    it("Token Issuance - As Owner, given a correct address and amount, should issue correct amount of tokens", async function(){
        let tokenBalance = 0;
        try{
            await tokenContract.issueTokens(clientAddress, test_validAmountOfTokens);
            let balance = await tokenContract.balanceOf(clientAddress);
            tokenBalance = balance.c[0];
        }
        catch(error){
            console.log(error);
         }

        assert.equal(tokenBalance, test_validAmountOfTokens, "Did not issue the correct amount of tokens.");
    });

    it("Token Issuance - As Owner, given an incorrect address and correct amount, should not issue tokens", async function(){
        let tokenBalance = 0;
        try{
            await tokenContract.issueTokens(test_invalidAddress, test_validAmountOfTokens);
            let balance = await tokenContract.balanceOf(test_invalidAddress);
            tokenBalance = balance.c[0];
        }
        catch(error){ }

        assert.equal(tokenBalance, 0, "Token balance is more than 0 for invalid address");
    });
   
    it("Token Issuance - As Owner, given a correct address and invalid token amount, should fail issue", async function(){
        let tokenIssueFail = false;
        try{
            await tokenContract.issueTokens(clientAddress, invalidAmountOfTokens);
        }
        catch(error){
            tokenIssueFail = true;
        }

        assert.equal(tokenIssueFail, true, "Issued tokens with when given an invalid amount ("+invalidAmountOfTokens+")");
    });

    it("Token Issuance - As NOT Owner, given a correct address and amount, should not issue tokens", async function(){
        let issueTokensUnsuccessful = false;
        try{
            await tokenContract.issueTokens(clientAddress, test_validAmountOfTokens, {from:clientAddress});
        }
        catch(error){
            issueTokensUnsuccessful = true;
        }

        assert.equal(issueTokensUnsuccessful, true, "Able to issue tokens when not owner");
    }); 

    it("Token Administration - given a valid amount to transfer, should be able to transfer tokens", async function(){
        let tokenTransferSuccessful = false;

        const issuedTokens = await tokenContract.issueTokens(clientAddress, test_validAmountOfTokens);
        assert.equal(issuedTokens.logs[0].event, 'IssueTokens', 'Event not fired');
        
        const transferredTokens = await tokenContract.transfer(clientAddressSecondary, test_validAmountOfTokens, {from: clientAddress});
        assert.equal(transferredTokens.logs[0].event, 'Transfer', 'Event not fired');

        let balance = (await tokenContract.balanceOf(clientAddressSecondary)).toString();
        assert.equal(balance, test_validAmountOfTokens, 'Balance does not match transfer');
    });

   it("Token Administration - given an amount higher than balance to transfer, token transfer should fail", async function(){
        let tokenTransferUnsuccessful = false;
        try{       
            let balance = await tokenContract.balanceOf(clientAddressSecondary);
            tokenBalance = balance.c[0];  
            await tokenContract.transfer(clientAddress, tokenBalance+100, {from: clientAddressSecondary});        
        }
        catch(error){
            tokenTransferUnsuccessful = true;
        }

        assert.equal(tokenTransferUnsuccessful, true, "Token transfer was successful despite inadequate balance");
    });  
    
    it("Contract - should not be payable", async function(){
        let contractPaymentFailed = false;
        try{
            await tokenContract.sendTransaction({value:validAmountOfWeiToPay});            
        }
        catch(error){
            contractPaymentFailed = true;
        }

        assert.equal(contractPaymentFailed, true, "Token contract is payable when it should not be");
    });
});
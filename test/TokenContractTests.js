var GatewayERC20Contract = artifacts.require("GatewayERC20Contract");
var PaymentGatewayContract = artifacts.require("PaymentGatewayContract");

var test_symbol = "GCoin";
var test_name = "Gateway Payment Coin";
var test_decimals = 18;
var test_validAmountOfTokens = 100;
var test_invalidAmountOfTokens = -1;
var test_validAmountOfWeiToPay = web3.toWei(10,'ether');

contract("GatewayERC20Contract - Test", function(accounts){
    let gatewayContract;
    let tokenContract;
    let clientAddress = accounts[2];
    let clientAddressSecondary = accounts[3];

    before('setup and deploy gateway contract', async function(){
        gatewayContract = await PaymentGatewayContract.new(); 
        tokenContract = await GatewayERC20Contract.new(gatewayContract.address);
    })    

    it("Token Properties - symbol should equal " + test_symbol, async function(){
        let tokenSymbol = await tokenContract.symbol();
        assert.equal(tokenSymbol, test_symbol, "Token symbol is not as expected")
    });

    it("Token Properties - name should equal " + test_name, async function(){
        let tokenName = await tokenContract.name();
        assert.equal(tokenName, test_name, "Token name is not as expected")
    });    

    it("Token Properties - decimal should equal " + test_decimals, async function(){
        let decimals = await tokenContract.decimals();
        assert.equal(decimals, test_decimals, "Token decimals is not as expected")
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
            await tokenContract.issueTokens(clientAddress, test_invalidAmountOfTokens);
        }
        catch(error){
            tokenIssueFail = true;
        }

        assert.equal(tokenIssueFail, true, "Issued tokens with when given an invalid amount ("+test_invalidAmountOfTokens+")");
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
        try{
            await tokenContract.issueTokens(clientAddress, test_validAmountOfTokens);
            await tokenContract.transfer(clientAddressSecondary, test_validAmountOfTokens, {from: clientAddress});
            let balance = await tokenContract.balanceOf(clientAddressSecondary);
            tokenBalance = balance.c[0];  
            tokenTransferSuccessful =  tokenBalance ==  test_validAmountOfTokens;
        }
        catch(error){}

        assert.equal(tokenTransferSuccessful, true, "Token transfer was unsuccessful");
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
            await tokenContract.sendTransaction({value:test_validAmountOfWeiToPay});            
        }
        catch(error){
            contractPaymentFailed = true;
        }

        assert.equal(contractPaymentFailed, true, "Token contract is payable when it should not be");
    });
});
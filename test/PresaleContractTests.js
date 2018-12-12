var GatewayERC20Contract = artifacts.require("GatewayERC20Contract");
var PaymentGatewayContract = artifacts.require("PaymentGatewayContract");
var PresaleContract = artifacts.require("Presale");

var test_symbol = "BUD";
var test_name = "eBudz";
var decimals = 6;
var validAmountOfTokens = 100;
var invalidAmountOfTokens = -1; // why are negative numbers being tested. Just use safemath
var validAmountOfWeiToPay = web3.toWei(10,'ether');
var fundingGoal = 10;
var saleDurationInMins = 1; // minutes
var tokenCostInWei = 2600000000; // $0.75 = 2600000 wei ?
// what is the purpose of the minimum spend
var minimumSpend = web3.toWei(0.34, 'ether'); // $100 = 340 finney ?

// @todo this needs all tests running and more of them.
// @todo make a list of above
contract("PreSale - Test", function(accounts){
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
    beforeEach('setup and deploy gateway contract', async function() {
        gatewayContract = await PaymentGatewayContract.new('4', gatewayBeneficiary);
        tokenContract = await GatewayERC20Contract.new(gatewayContract.address, '420000000000000', 'BUD', 'eBudz');
        presaleContract = await PresaleContract.new(tokenContract.address, saleBeneficiary, techBeneficiary, fundingGoal, saleDurationInMins, tokenCostInWei,  minimumSpend);
        await tokenContract.transfer(presaleContract.address, 770000000);
    })

    it("Presale address", async function(){
        let tokenAddress = await presaleContract.getTokenContractAddress();
        assert.equal(tokenAddress, tokenContract.address, "Token address is not as expected")
    });

    it("Buy tokens via presale", async () => {
        // this should really be a regular user
        const beneficiaryBalanceBefore = await tokenContract.balanceOf(gatewayBeneficiary)
        assert.equal(beneficiaryBalanceBefore.toString(), '0', 'Balance should be 0');

        // is it to do with blocktimes?
        let sentTransaction = await presaleContract.sendTransaction({from: gatewayBeneficiary, value: web3.toWei(1, "ether")});
        const beneficiaryBalance = await tokenContract.balanceOf(gatewayBeneficiary);

        assert.equal(beneficiaryBalance.toString(), '769230769', 'Balance does not match expected amount');
    });

  // no limit set... @todo
    it.skip("Buy tokens via presale after limit reached", async function(){
        // ah... no limit has been reached
        // Would have to interrogate for number of tokens remaining
        // What happens if the last purchase has been for a larger amount than the number of 
        // tokens available?
        let paymentSuccessful = true;
        try {
        let result = await presaleContract.sendTransaction({from: gatewayBeneficiary, value: web3.toWei(1, "ether")});
        result
        }
        catch (error) {
        console.log(error);
        paymentSuccessful = false;
        }
        // reverting but not
        assert.equal(paymentSuccessful, false, "Second payment successful")
    });

  // Checking initial state? why?
  it.skip("Get presale ETH balance", async () => {
    let balance = await presaleContract.balance();
    balance = balance.toString();
    assert.equal(balance, 0, "Balance is not equal");
  });

  it("Get token balance from presale", async function() {
    const sentFunds = await presaleContract.sendTransaction(
        {
            from: gatewayBeneficiary,
            value:  web3.toWei(1, "ether")
        });

    let balance = await tokenContract.balanceOf(gatewayBeneficiary);
    balance = balance.toNumber();
    // @todo Move this logic elsewhere -- perhaps a helper

    assert.equal(balance, parseInt(web3.toWei(1, "ether") / tokenCostInWei * 2), "Balance is not equal");
  });

});
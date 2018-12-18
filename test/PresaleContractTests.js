const GatewayERC20Contract = artifacts.require("GatewayERC20Contract");
const PaymentGatewayContract = artifacts.require("PaymentGatewayContract");
const Presale = artifacts.require("Presale");
const BN = require('bignumber.js');
const utils = require('./helpers/Utils.js');




// set BN rounding mode floro same as soklidity
// set big number precision
// kinda fucks things using 10...
// should equally work with 18

//@todo go through whitepaper and esnure specs are properly implemented in smart contract 
// @todo have a wee look at other crowdsales and see what types of bounderies etc...

const tokenSymbol = 'BUD';
const tokenName = 'eBudz';
const tokenDecimals = 10;

// Tokens shifted for ERC20 decimal places
const totalSupply = new BN('420000000').shift(tokenDecimals)
const icoSupply = new BN('189000000').shift(tokenDecimals);

const ethDollarValue = new BN('86');
const tokenDollarValue = new BN('0.5');
const tokensPerEth = (ethDollarValue.div(tokenDollarValue)).shift(tokenDecimals);
const ethWeiValue = new BN(web3.toWei('1', 'ether'));
const tokenCostInWei = ethWeiValue.dividedToIntegerBy(tokensPerEth);

// this ignores bonus
const maxAmountEthCanRaise = icoSupply.dividedToIntegerBy(tokensPerEth);
maxAmountEthCanRaise;
// bonus times need updated

const oneWeekBonus = (amount) => amount.div(100).times(20).toFixed(0);
const laterBonus = (amount) => amount.div(100).times(10).toFixed(0);
const tokensPurchased = (wei) => wei.dividedToIntegerBy(tokenCostInWei);

// @todo set max amount eth in settings for ganache-cli on autotest
// set tests to run on an opens source tool via github
// delete these
var validAmountOfTokens = 100;  // what the fuck does that even mean! -- valid for what!?
var invalidAmountOfTokens = -1; // why are negative numbers being tested. Just use safemath
var validAmountOfWeiToPay = web3.toWei(10,'ether'); //wtf
var fundingGoal = 10; // this should be in wei
var saleDurationInMins = 1; // minutes // should we use days?

const day = new BN('86400');
//@todo fix token decinal places...
// @todo check other values are updated correctly -- eg balance of 
//var tokenCostInWei = 2600000000; // $0.75 = 2600000 wei ?
// what is the purpose of the minimum spend
var minimumSpend = web3.toWei(0.34, 'ether'); // $100 = 340 finney ?
// token cost should be derived from contract
// @todo this needs all tests running and more of them.
// @todo make a list of above
// @todo tests for
// user withdrawal on inadequate funds raised
// admin withdrawal on success
// setting closed state
// setting past time state
// really hard to do the math... costing time....
// @todo rename presale to sale

contract("Sale", function(accounts) {
    let gatewayContract;
    let token;
    let presale; // change the name of this
    let alice = accounts[2];
    let clientB = accounts[3];
    let saleBeneficiary = accounts[4];
    let techBeneficiary = accounts[5];
    let gatewayBeneficiary = accounts[6];
    // contract should have a start time
    // Aha -- couldn't understand why was not being reset everytime -- 
    // cos it wasn't coded that way.... doh!...
    beforeEach('setup and deploy gateway contract', async function() {
        // do we need to know about this contract?
        gatewayContract = await PaymentGatewayContract.new('4', gatewayBeneficiary);

        token = await GatewayERC20Contract.new(gatewayContract.address, totalSupply, tokenSymbol, tokenName);
        presale = await Presale.new(token.address, saleBeneficiary, techBeneficiary, fundingGoal, saleDurationInMins, tokenCostInWei,  minimumSpend);
        await token.transfer(presale.address, icoSupply);
    })


    it("Should have correct settings at start of sale", async () => {

    })

    it("Presale address", async function(){
        let tokenAddress = await presale.token();
        assert.equal(tokenAddress, token.address, "Token address is not as expected")
    });

      // Checking initial state? why?
  it.skip("Get presale ETH balance", async () => {
    let balance = await presale.balance();
    balance = balance.toString();
    assert.equal(balance, 0, "Balance is not equal");
  });

    it("Should return correct bonus amounts", async () => {
        assert.equal(await presale.getBonus.call(100), '20')
        await utils.increaseTime((day.mul(8)).toNumber());
        assert.equal(await presale.getBonus.call(100), 10)
        // could also test our own function in here!
    })

    // assert all the values should have together in stead of habing lots of separate stuff

    // the only useful things therse tests do is check one successful and one unsuccessful transefr
    // thats not nearly enough coverage
    // @todo assert the value of the sale
    it("Should buy tokens via sale during first week", async () => {

        const aliceBalanceBefore = await token.balanceOf(alice)
        assert.equal(aliceBalanceBefore.toString(), '0', 'Balance should be 0');
 
        let sentTransaction = await presale.sendTransaction({from: alice, value: ethWeiValue});
        const aliceBalanceAfter = await token.balanceOf(alice);

        const tokens = tokensPurchased(ethWeiValue);
        const expected = tokens.add(oneWeekBonus(tokens))

        assert.equal(aliceBalanceAfter.toString(), expected, 'Balance does not match expected amount');
        // test firing of event
        // then don't have to after that
    });

    it("Should buy tokens after first week", async () => {

        await utils.increaseTime((day.mul(8)).toNumber());
        await presale.sendTransaction({from: alice, value: ethWeiValue});

        const aliceBalance = await token.balanceOf(alice);
        const tokens = tokensPurchased(ethWeiValue);
        const expected = tokens.add(laterBonus(tokens))
        assert.equal(aliceBalance.toString(), expected, 'Balance does not match expected amount');
    })

    // consider locking coins until sale is completed
    // then we have no issues with refunds
    // need to calculate how many ether
    // @todo check our boundaries

    it("Should not allow purchase of tokens greater than amout remaining", async function(){
        // advance to time with no bonus
        await utils.increaseTime((day.mul(15)).toNumber());

        const maxEth = icoSupply.dividedToIntegerBy(tokensPerEth);

        const boughtTokens = await presale.sendTransaction({from: alice, value: web3.toWei(maxEth.minus(1), "ether")});
        let failed
        try {
            let result = await presale.sendTransaction({from: alice, value: web3.toWei(1, "ether")});
            result
        }
        catch (error) {
            failed = true
        }

        assert.equal(failed, true, "Should not be able to make payment")
    });
});


// add additional tests to presale
// add safe math to presale
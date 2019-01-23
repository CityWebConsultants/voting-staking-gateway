const GatewayERC20Contract = artifacts.require("GatewayERC20Contract");
const PaymentGatewayContract = artifacts.require("PaymentGatewayContract");
const Crowdsale = artifacts.require("Crowdsale");
const RefundList = artifacts.require("RefundList");
const BN = require('bignumber.js');
const utils = require('./helpers/Utils.js');

//@todo go through whitepaper and esnure specs are properly implemented in smart contract 
// @todo have a wee look at other crowdsales and see what types of bounderies etc...
// @ todo add constants to utils
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

// this ignores bonus'
// const maxAmountEthCanRaise = icoSupply.dividedToIntegerBy(tokensPerEth);

const weekOneBonus = (amount) => amount.div(100).times(20).toFixed(0);
const weekTwoBonus = (amount) => amount.div(100).times(10).toFixed(0);
const tokensPurchased = (wei) => wei.dividedToIntegerBy(tokenCostInWei);

const day = new BN('86400');

const fundingGoal = 0;
const minimumSpend = web3.toWei(0.34, 'ether');
// token cost should be derived from contract

// @todo tests for
// user withdrawal on inadequate funds raised
// admin withdrawal on success
// setting closed state
// setting past time state
// consider locking coins until sale is completed
// then we have no issues with refunds
// need to calculate how many ether
// @todo check our boundaries

contract("Crowdsale", function(accounts) {
    
    // Contracts
    let gateway, token, sale, refund;
    let startTime, endTime
    let alice = accounts[2];
    let clientB = accounts[3];
    let saleBeneficiary = accounts[4];
    let techBeneficiary = accounts[5];
    let gatewayBeneficiary = accounts[6];

    beforeEach('setup and deploy gateway contract', async function() {

        startTime = new BN(utils.blockNow());
        endTime = startTime.plus(day.times(30));

        gateway = await PaymentGatewayContract.new('4', gatewayBeneficiary);
        token = await GatewayERC20Contract.new(gateway.address, totalSupply, tokenSymbol, tokenName);
        refund = await RefundList.new();
        sale = await Crowdsale.new(token.address, saleBeneficiary, techBeneficiary, refund.address, fundingGoal, startTime, endTime, tokenCostInWei,  minimumSpend);
        await token.transfer(sale.address, icoSupply);
    })

    it("Should have correct settings at start of sale", async () => {
        assert.equal(await sale.token.call(), token.address, "Token address is not as expected");
        assert.equal(await web3.eth.getBalance(sale.address), 0, "Balance is not equal");
        assert(icoSupply.equals(await token.balanceOf(sale.address)), "token supply doesn't match");
    })

    // @todo should finalise at end date 
    // don't use minutes. Use timestamp
    it("Should be finalised at end date", async () => {
        // check for event
        // should also be able to call this
    })

    it("Should withdraw funds at end of successful crowdsale", async () => {
        
    })

    it("Should deal with refunds") // need to consult before doing this

    it.skip("Should return correct bonus amounts", async () => {
        assert.equal(await sale.getBonus.call(100), '20')
        await utils.increaseTime((day.mul(8)).toNumber());
        assert.equal(await sale.getBonus.call(100), 10);
        // could also test our own helper function matches
    })

    // @todo assert the value of the sale
    // time no longer matters as no bonusses
    it.skip("Should buy tokens via sale during first week", async () => {

        const aliceBalanceBefore = await token.balanceOf(alice)
        assert.equal(aliceBalanceBefore.toString(), '0', 'Balance should be 0');
        
        // get how much gas this costs
        const sentTransaction = await sale.sendTransaction({from: alice, value: ethWeiValue});
        const logs = sentTransaction.logs[0];
        const aliceBalanceAfter = await token.balanceOf(alice);

        assert.equal(logs.event, 'Contribution');
        assert.equal(logs.args.account, alice);
        assert(logs.args.amount.equals(ethWeiValue));
        assert(aliceBalanceAfter.equals(logs.args.tokens));
        
        const tokens = tokensPurchased(ethWeiValue);
        const expected = tokens.add(weekOneBonus(tokens))

        assert(aliceBalanceAfter.equals(expected), 'Balance does not match expected amount');
    });

    // time no longer matters
    it.skip("Should buy tokens after first week", async () => {

        await utils.increaseTime((day.mul(8)).toNumber());
        await sale.sendTransaction({from: alice, value: ethWeiValue});

        const aliceBalance = await token.balanceOf(alice);
        const tokens = tokensPurchased(ethWeiValue);
        const expected = tokens.add(weekTwoBonus(tokens))
        assert(aliceBalance.equals(expected) , 'Balance does not match expected amount');
    })


    // need to
    it.skip("Should not allow purchase of tokens greater than amout remaining", async function(){
        // advance to time with no bonus
        await utils.increaseTime((day.mul(15)).toNumber());

        const maxEth = icoSupply.dividedToIntegerBy(tokensPerEth);

        await sale.sendTransaction({from: alice, value: web3.toWei(maxEth.minus(1), "ether")});
        let failed
        try {
            await sale.sendTransaction({from: alice, value: web3.toWei(1, "ether")});
        }
        catch (error) {
            // @todo add assertion for exception message
            failed = true
        }

        assert.equal(failed, true, "Should not be able to make payment")
    });
});
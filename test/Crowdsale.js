const GatewayERC20Contract = artifacts.require("GatewayERC20Contract");
const PaymentGatewayContract = artifacts.require("PaymentGatewayContract");
const Crowdsale = artifacts.require("Crowdsale");
const RefundList = artifacts.require("RefundList");
const BN = require('bignumber.js');
const utils = require('./helpers/Utils.js');    

// @todo resolve tests failing
// what numbers are wrong here?coin
// @todo check sequence and be sure we transactions are fully reverted
// send / transfer ....???
// @ todo add constants to utils
const tokenSymbol = 'BUD';
const tokenName = 'eBudz';
const tokenDecimals = 10;
// hmmmmmmm. shift doesn't do the same thing 
// BigNumber.config({ POW_PRECISION: 100 })
// Tokens shifted for ERC20 decimal places
const totalSupply = new BN('420000000').shift(tokenDecimals)
const icoSupply = new BN('189000000').shift(tokenDecimals);


// fix breaking tests...
// when using non round numbers -- what should happen around rounding...
// use round numbers when writing 
// and then switch them about to make sure the arithmatic works in different 
// circumstances

// @todo when ethdollarvalue is not a round number we get different results.
// find and fix issue.
const ethDollarValue = new BN('100');
const tokenDollarValue = new BN('0.5');
const tokensPerEth = (ethDollarValue.div(tokenDollarValue)).shift(tokenDecimals);
const ethWeiValue = new BN(web3.toWei('1', 'ether'));
const tokenCostInWei = ethWeiValue.dividedToIntegerBy(tokensPerEth);

console.log('Tokens per eth: ', tokensPerEth)
console.log('Token cost = ', tokenCostInWei)


// const maxAmountEthCanRaise = icoSupply.dividedToIntegerBy(tokensPerEth);
// Math.pow(0.7, 2)                // 0.48999999999999994
// x = new BigNumber(0.7)
// x.exponentiatedBy(2)            // '0.49'
// BigNumber(3).pow(-2)  

// const weekOneBonus = (amount) => amount.div(100).times(20).toFixed(0);
// const weekTwoBonus = (amount) => amount.div(100).times(10).toFixed(0);
// const tokensPurchased = (wei) => wei.dividedToIntegerBy(tokenCostInWei);

const day = new BN('86400');

const fundingGoal = 0;
// Keep numbers round for easy counting
const minimumSpend = web3.toWei(0.5, 'ether');
const maximumSpend = web3.toWei(110, 'ether');


// token    cost should be derived from contract
// @todo resolve intermittant fail with crowsdsale open
// @todo tests for
// user withdrawal on inadequate funds raised
// admin withdrawal on success
// setting closed state
// setting past time state
// consider locking coins until sale is completed
// then we have no issues with refunds
// need to calculate how many ether
// @todo check our boundaries

contract("Crowdsale", accounts =>  {
    
    // Contracts
    let gateway, token, sale, refund;
    let startTime, endTime
    let owner = accounts[0];
    let alice = accounts[2];
    let clientB = accounts[3];
    let saleBeneficiary = accounts[4];
    let techBeneficiary = accounts[5];
    let gatewayBeneficiary = accounts[6];

    beforeEach('setup and deploy gateway contract', async () => {
        // should set size of integer
        // Start one minute from now
        // ah! each time it runs
        // bn set decimal places
        const now = utils.blockNow();
        startTime = now+600;  // start in ten minutes
        endTime = startTime+(day*30);
        gateway = await PaymentGatewayContract.new('4', gatewayBeneficiary);
        token = await GatewayERC20Contract.new(
            gateway.address, 
            totalSupply, 
            tokenSymbol, 
            tokenName
        );
        refund = await RefundList.new();
        sale = await Crowdsale.new(
            token.address,
            saleBeneficiary, 
           /* techBeneficiary,*/ 
            refund.address, 
            /*fundingGoal,*/ 
            startTime, 
            endTime, 
            tokenCostInWei, // don't need top say in wei, doesn't say elsewhere  
            minimumSpend,
            maximumSpend
        );
        await token.transfer(sale.address, icoSupply);
        await utils.increaseTime(startTime - utils.blockNow()); 

        const minToken = await sale.minTokenPurchase();
        minToken;
    })

    it("Should have correct settings at start of sale", async () => {

        assert.equal(await sale.token.call(), token.address, "Token address is not as expected");
        assert.equal(await web3.eth.getBalance(sale.address), 0, "Balance is not equal");
        assert(icoSupply.equals(await token.balanceOf(sale.address)), "token supply doesn't match");
        assert.equal(await sale.startTime(), startTime);
        assert.equal(await sale.endTime(), endTime);
        assert.isTrue(tokenCostInWei.equals(await sale.price()));
        assert.equal(await sale.minSpend(), minimumSpend);
        assert.equal(await sale.maxSpend(), maximumSpend);
    })

    it("Should revert when sending ether directly", async () => {

        let error;
        try {
            await sale.sendTransaction({from: alice, value: ethWeiValue});
        } catch (e) {
            error = e;
        }
        utils.ensureException(error);
        assert.isTrue(error.message.indexOf('Cannot accept eth directly') >= 0)
    })

    it("Should buy some tokens", async () => {
        
       //  console.log('gas cost', await sale.buyTokens.estimateGas({from: alice, value: ethWeiValue}));
       // Buy one eth worth of tokens 
        const sentTransaction = await sale.buyTokens({from: alice, value: ethWeiValue});

        const logs = sentTransaction.logs[0];
        assert.equal(logs.event, 'Contribution')
        assert.equal(logs.args.account, alice);
        assert.isTrue(logs.args.ethAmount.equals(ethWeiValue));
        assert.isTrue(logs.args.tokens.equals(tokensPerEth));

        assert.isTrue(tokensPerEth.equals(await sale.tokenAllocation(alice)));
    });

    // try running this through the latest ganache-cli and see what happens

    it("Should buy all available tokens", async () => { 

        const maxEth = (new BN('945000')).shift(18);
        await sale.buyTokens({from: alice, value: maxEth});
        const available = await token.balanceOf(sale.address);
        const allocated = await sale.tokenAllocation(alice);
        console.log(available)
        console.log(allocated)
        assert.isTrue(allocated.equals(available))
        // check value of tokens sold, wtf is up with this...
    });

    // what about accounting for rounding and fractions of a token?
    it("Should not buy more tokens than available", async () => {
        // Attempt to buy one more token than available
        const exceedsMaxEth = (new BN('945000')).shift(18).plus(tokenCostInWei);

        let error;
        try {
            await sale.buyTokens({from: alice, value: exceedsMaxEth});
        } catch (e) {
            error = e;
        }
        utils.ensureException(error);
        assert.isTrue(error.message.indexOf('Not enough tokens left') >= 0)
        
    });

    // Should maybe factor out finalising and closing
    //@todo
    it("Should open at start time", async () => {
        // check now
        // jog time forward
    });

    //@todo 
    it("Should not buy tokens before start time", async () => {
        // uhm, all of these assume is already after opening 
        // probs should have left factored out :/
    })

    it("Should close at end time", async () => {
        // Using +/- one second gives in intermittant results
        // 2 seconds gives an extra second wiggle room.

        // 2 seconds before closing time
        await utils.increaseTime(endTime - 2 - utils.blockNow())
        assert.isFalse(await sale.hasClosed())

        // 2 seconds after closing time
        await utils.increaseTime(endTime + 2 - utils.blockNow())
        assert.isTrue(await sale.hasClosed())
    })

    it("Should not buy tokens after end time", async () => {
        await utils.increaseTime(endTime + 2 - utils.blockNow())

        let error;
        try {
            await sale.buyTokens({from: alice, value: ethWeiValue});
        } catch (e) {
            error = e;
        }
        utils.ensureException(error);
    })

    it("Should not finalise before sale ends", async () => {
        //@todo pass a string so we can be more specific about what exception is occurring
        let error;
            try {
                await sale.finalise({from: owner});
            } catch (e) {
                error = e;
            }

        utils.ensureException(error);
    })

    it("Should finalise after sale ends", async () => {
        await utils.increaseTime(endTime + 2 - utils.blockNow())
        const finalised =  await sale.finalise({from: owner});
        // Bug where an event with no params does list event name in receipt
        // not sure how to assert logs
        assert.isTrue(await sale.finalised())
    })

    it("Should end sale when all available tokens sold",  async () => {
        // how are we going to implement this
    })

    it("Should claim tokens after finalising", async () => {
        await sale.buyTokens({from: alice, value: ethWeiValue});
        await utils.increaseTime(endTime + 2 - utils.blockNow())
        await sale.finalise({from: owner});

        const claim = await sale.claimTokens({from: alice});
        const logs = claim.logs[0];
        assert.equal(logs.event, "Claimed");
        assert.equal(logs.args.account, alice)
        assert.isTrue(logs.args.tokenAmount.equals(ethWeiValue.div(tokenCostInWei)));

        const aliceBalance = await token.balanceOf(alice);
        assert.isTrue(aliceBalance.equals(ethWeiValue.div(tokenCostInWei)))
    })

    // @todo test running up to max and withdrawaing all tokens
    // @todo test the boundaries within one wei

    it("Should not claim tokens after finalising", async () =>  {
        await sale.buyTokens({from: alice, value: ethWeiValue});
        refund.addAddress(alice);
        await utils.increaseTime(endTime + 2 - utils.blockNow())
        await sale.finalise({from: owner});

        let error;
        try {
           await sale.claimTokens({from: alice});
        } catch (e) {
            error = e;
        }

        utils.ensureException(error);  
        assert.isTrue(error.message.indexOf('This account is due refund') >= 0)

    })

    it("Should claim refund after finalising", async () => {
        await sale.buyTokens({from: alice, value: ethWeiValue});
        refund.addAddress(alice); // uhm... what does this do?
        await utils.increaseTime(endTime + 2 - utils.blockNow())
        await sale.finalise({from: owner});

        // get user balance before
        const refunded = await sale.claimRefund({from: alice});
        const logs = refunded.logs[0];

        const fee = await sale.refundFee();

        assert.isTrue(logs.args.ethAmount.equals(ethWeiValue.sub(fee)));
        assert.equal(logs.args.account, alice)
        // test against user after balance

    })

    it("Should not claim refund before finalising", async () => {
        await sale.buyTokens({from: alice, value: ethWeiValue});
        refund.addAddress(alice);
        await utils.increaseTime(endTime + 2 - utils.blockNow());

        let error
        try {
            await sale.claimRefund({from: alice});
        }
        catch(e) {
            error = e;
        }
        utils.ensureException(error);
        assert.isTrue(error.message.indexOf('Not yet finalised') >= 0)
    })

    it("Should not claim refund after finalising", async () => {
        await sale.buyTokens({from: alice, value: ethWeiValue});
        await utils.increaseTime(endTime + 2 - utils.blockNow())
        await sale.finalise({from: owner});

        // get user balance before
        // refund.addAddress(alice);
        await utils.increaseTime(endTime + 2 - utils.blockNow());

        // capture exception, factor this in to a one liner

        let error
        try {
            await sale.claimRefund({from: alice});
        }
        catch(e) {
            error = e;
        }
        utils.ensureException(error);
        assert.isTrue(error.message.indexOf('No refund available') >= 0)

        // assert.isTrue(logs.args.ethAmount.equals(ethWeiValue.sub(fee)));
        // assert.equal(logs.args.account, alice)
    })

    // it should not buy tokens after endtime
    // it should not buy tokens when sold out
    // it should not buy more than remaining tokens
    // it should claim tokens
    // it should not claim tokens after claiming tokens
    // it should not claim tokens after refund
    // it should refund full amount
    // it should not refund -- check 
    // it should not finalise before end time
    // it should not do claime, refund or payout before finalising
    // it should not claim, refund or payout before or after closing
    // it should transfer money to treasury
    // it should not deploy before start time
    // test boundaries of minimum spend
    
    // @todo should finalise at end date 
    // don't use minutes. Use timestamp
    it.skip("Should be finalised at end date", async () => {

        // check for event
        // should also be able to call this
    })

    it.skip("Should withdraw funds at end of successful crowdsale", async () => {
        
    })

    it.skip("Should deal with refunds") // need to consult before doing this

    it.skip("Should return correct bonus amounts", async () => {
        assert.equal(await sale.getBonus.call(100), '20')
        await utils.increaseTime((day.mul(8)).toNumber());
        assert.equal(await sale.getBonus.call(100), 10);
        const refunded = await sale.claimRefund({from: alice});
        // could also test our own helper function matches
    })

    // @todo assert the value of the sale
    // time no longer matters as no bonusses
    // it("Should buy tokens", async () => {
    //     // uhm, whats wrong with increase time?
    //     console.log('start', startTime)
    //     console.log('now', new BN(utils.blockNow()))
    //     // console.log('tx at', (new BN(utils.blockNow())).plus(120).toNumber())
    //     // await utils.increaseTime((new BN(utils.blockNow())).plus(1000).toNumber());
    //     // const aliceBalanceBefore = await token.balanceOf(alice)
    //     // assert.equal(aliceBalanceBefore.toString(), '0', 'Balance should be 0');
        
    //     // // get how much gas this costs
    //     const sentTransaction = await sale.sendTransaction({from: alice, value: ethWeiValue});
    //     // const logs = sentTransaction.logs[0];
    //     // const aliceBalanceAfter = await token.balanceOf(alice);

    //     // assert.equal(logs.event, 'Contribution');
    //     // assert.equal(logs.args.account, alice);
    //     // assert(logs.args.amount.equals(ethWeiValue));
    //     // assert(aliceBalanceAfter.equals(logs.args.tokens));
        
    //     // const tokens = tokensPurchased(ethWeiValue);
    //     // assert(aliceBalanceAfter.equals(expected), 'Balance does not match expected amount');
    // });

    // time no longer matters
    it.skip("Should buy tokens after first week", async () => {

        await utils.increaseTime(utils.blockNow().plus(61));
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
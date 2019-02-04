const GatewayERC20Contract = artifacts.require("GatewayERC20Contract");
const PaymentGatewayContract = artifacts.require("PaymentGatewayContract");
const Crowdsale = artifacts.require("Crowdsale");
const RefundList = artifacts.require("RefundList");
const BN = require('bignumber.js');
const utils = require('./helpers/Utils.js'); 
// @todo refactor to check for exceptions + message in a single line
// @todo resolve tests failing on bitbucket

const tokenSymbol = 'BUD';
const tokenName = 'eBudz';
const tokenDecimals = 10;
// BigNumber.config({ POW_PRECISION: 100 })
// Tokens shifted for ERC20 decimal places
const totalSupply = new BN('420000000').shift(tokenDecimals)
const icoSupply = new BN('189000000').shift(tokenDecimals);

// @todo when ethdollarvalue is not a round number we get different results.
// find and fix issue.
const ethDollarValue = new BN('100');
const tokenDollarValue = new BN('0.5');
const tokensPerEth = (ethDollarValue.div(tokenDollarValue)).shift(tokenDecimals);
const ethWeiValue = new BN(web3.toWei('1', 'ether'));
const tokenCostInWei = ethWeiValue.dividedToIntegerBy(tokensPerEth);

console.log('Tokens per eth: ', tokensPerEth)
console.log('Token cost = ', tokenCostInWei)

const day = new BN('86400');

const minimumSpend = web3.toWei(0.5, 'ether');
const maximumSpend = web3.toWei(110, 'ether');

contract("Crowdsale", accounts =>  {
    
    // Contracts
    let gateway, token, sale, refundList;
    let startTime, endTime
    let owner = accounts[0];
    let alice = accounts[2];
    let clientB = accounts[3];
    let saleBeneficiary = accounts[4];
    let techBeneficiary = accounts[5];
    let gatewayBeneficiary = accounts[6];
    let refundFee = '100000000000';

    beforeEach('setup and deploy gateway contract', async () => {
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
        refundList = await RefundList.new();
        sale = await Crowdsale.new(
            token.address,
            saleBeneficiary, 
            techBeneficiary,
            refundList.address, 
            /*fundingGoal,*/ 
            startTime, 
            endTime, 
            tokenCostInWei, // don't need top say in wei, doesn't say elsewhere  
            minimumSpend,
            maximumSpend,
            refundFee
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

        // confirm targe addresses and ensure not blank in smart contracts
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
        
        const sentTransaction = await sale.buyTokens({from: alice, value: ethWeiValue});

        const logs = sentTransaction.logs[0];
        assert.equal(logs.event, 'Contribution')
        assert.equal(logs.args.account, alice);
        assert.isTrue(logs.args.ethAmount.equals(ethWeiValue));
        assert.isTrue(logs.args.tokens.equals(tokensPerEth));

        assert.isTrue(tokensPerEth.equals(await sale.tokenAllocation(alice)));
    });

    it("Should buy all available tokens", async () => { 

        const maxEth = (new BN('945000')).shift(18);
        await sale.buyTokens({from: alice, value: maxEth});
        const available = await token.balanceOf(sale.address);
        const allocated = await sale.tokenAllocation(alice);
        assert.isTrue(allocated.equals(available))
        assert.isTrue(await sale.hasClosed())
    });

    it("Should be able to buy last remaning minimim amount", async () => {

        const maxEth = (new BN('945000')).shift(18);
        const sold = await sale.buyTokens({from: alice, value: maxEth.sub(minimumSpend)});
        assert.isFalse(await sale.hasClosed())
        const sold2 = await sale.buyTokens({from: alice, value: minimumSpend});
        assert.isTrue(await sale.hasClosed())
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

    it.skip("Should open at start time", async () => {
        // @todo
        // since time is jogged forward in beforeEach
        // can't test the same way as rest
    });


    it.skip("Should not buy tokens before start time", async () => {})

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
        // Bug where an event with no params does not list event name in receipt
        // not sure how to assert non-existant logs
        assert.isTrue(await sale.finalised())
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

    it("Should not claim tokens after finalising", async () =>  {
        await sale.buyTokens({from: alice, value: ethWeiValue});
        refundList.addAddress(alice);
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
        refundList.addAddress(alice); // uhm... what does this do?
        await utils.increaseTime(endTime + 2 - utils.blockNow())
        await sale.finalise({from: owner});

        const refunded = await sale.claimRefund({from: alice});
        const logs = refunded.logs[0];

        const fee = await sale.refundFee();

        assert.isTrue(logs.args.ethAmount.equals(ethWeiValue.sub(fee)));
        assert.equal(logs.args.account, alice)
    })

    it("Should not claim refund before finalising", async () => {
        await sale.buyTokens({from: alice, value: ethWeiValue});
        refundList.addAddress(alice);
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

        await utils.increaseTime(endTime + 2 - utils.blockNow());

        let error
        try {
            await sale.claimRefund({from: alice});
        }
        catch(e) {
            error = e;
        }
        utils.ensureException(error);
        assert.isTrue(error.message.indexOf('No refund available') >= 0)
    })


    it("Should withdraw funds at end of successful crowdsale", async () => {
        // It is up to key holder to leave enough funds to cover refunds.
        techFundBalanceBefore = await web3.eth.getBalance(techBeneficiary);
        saleBeneficiaryBefore = await web3.eth.getBalance(saleBeneficiary);

        const maxEth = (new BN('945000')).shift(18);
        await sale.buyTokens({from: alice, value: maxEth});
        await sale.finalise({from: owner});

        const withdrawn = await sale.withdrawEth(maxEth, {from: owner});

        treasuryPortion = maxEth.div(100).times(75);
        techPortion = maxEth.div(100).times(25);

        techFundBalanceAfter = await web3.eth.getBalance(techBeneficiary);
        saleBeneficiaryAfter = await web3.eth.getBalance(saleBeneficiary);
        
        assert.isTrue(saleBeneficiaryAfter.equals(saleBeneficiaryBefore.add(treasuryPortion)));
        assert.isTrue(techFundBalanceAfter.equals(techFundBalanceBefore.add(techPortion)));
    })

    it("Should withdraw remaining tokens to treasury", async () => {

        const treasuryBalance = await token.balanceOf(saleBeneficiary);
        const saleBalance = await token.balanceOf(sale.address);
        treasuryBalance;
        await utils.increaseTime(endTime + 2 - utils.blockNow())
        await sale.finalise({from: owner});

        const withdrawn = await sale.withdrawTokensToTreasury(saleBalance);
        const logs = withdrawn.logs[0];
        assert.equal(logs.event, 'Withdrawal');
        assert.equal(logs.args.account, saleBeneficiary);
        assert.isTrue(saleBalance.equals(logs.args.amount));

        const treasuryBalanceAfter = await token.balanceOf(saleBeneficiary);
        assert.isTrue(treasuryBalanceAfter.equals(saleBalance));
    })
});


// @todo check we are doing boundaries correctly
// @todo check falls over when trying to stake for too long
// @todo check for throwing
// @todo check for fail on 25 months
//@toodo make sure we are increasing time correctly

const Staking = artifacts.require('Staking.sol');
const TokenMock = artifacts.require('Token.sol');
const utils = require('./helpers/Utils.js');
const BigNumber = require('bignumber.js');
BigNumber.config({ DECIMAL_PLACES: 0}) // ROUND_FLOOR (4) 

contract('Staking', function (accounts) {

    let bank, token, initialBalance, initialBankBalance, rate, now;
    let signers = [accounts[7], accounts[8], accounts[9]];
    let alice = accounts[0];
    let admin = accounts[1];
    let bob = accounts[2];
    let carol = accounts[3];
    let david = accounts[4];
    let erin = accounts[5];

    const second = new BigNumber('1');
    const day = new BigNumber('86400');
    
    // For purposes of smart contract we have 30 days in a monnth
    const month = day.times(30);

    // Consider making the contarct dynamic so we can pass
    // rates and boundaries through the constructor
    const rateBoundaries = [0,6,12,18,24].map(item => month.times(item));
    const rates = [0,5,10,15,20];

    beforeEach(async () => {
        now = new BigNumber(utils.blockNow());
        initialBalance = 10000;
        initialBankBalance = 100000;

        token = await TokenMock.new();
        bank = await Staking.new(token.address, signers, '2', {from: accounts[7], gas: 4200000});

        await token.mint(admin, initialBankBalance);
        await token.mint(alice, initialBalance);
        await token.mint(bob, initialBankBalance);

        await bank.depositBonusTokens(initialBankBalance, {from: admin})
        await token.balanceOf.call(bank.address);
        
    });

    it("Should revert when sending ether directly", async () => {

        let error;
        try {
            const boo = await bank.sendTransaction({from: alice, value: web3.toWei(1, 'ether')});
            boo;
        } catch (e) {
            error = e;
        }
        utils.ensureException(error);
        assert.isTrue(error.message.indexOf('Contract does not accept Ether') >= 0)
    });

    it("Should start with seeded amount", async () => {
        const bankBalance = await token.balanceOf.call(bank.address);
        assert.equal(bankBalance, initialBankBalance);
    })

    // Staking
    it('Should transfer tokens to stake', async () => {

        await bank.stake(initialBalance, month.plus(day), true, {from: alice});
        const aliceBalance = await token.balanceOf.call(alice);
        const bankBalance = await token.balanceOf.call(bank.address);

        assert.equal(aliceBalance.toString(), 0);
        assert.equal(bankBalance.toString(), (initialBankBalance + initialBalance));
    });

    it("Should transfer tokens to stake with no bonus", async () => {

        await bank.stake(initialBalance, month.times(12), false, {from: alice});
        const aliceBalance = await token.balanceOf.call(alice);
        const bankBalance = await token.balanceOf.call(bank.address);

        assert.equal(aliceBalance.toString(), 0);
        assert.equal(bankBalance.toString(), (initialBankBalance + initialBalance));
        assert.equal(await bank.totalStakedFor(alice), initialBalance);
    })

    it("Should unstake tokens with no time lock", async () => {
        const stakeDuration = 0;
        const staked = await bank.stake(initialBalance, stakeDuration, false, {from: alice});
        const unstaked = await bank.unstake(initialBalance, {from: alice});

        const aliceBalance = await token.balanceOf.call(alice);
        assert(aliceBalance.toString(), '10000');
    })

    it("Should not retrieve tokens whilst time locked", async () => {

        const stakeDuration = month.times('6');
        const staked = await bank.stake(initialBalance, stakeDuration, true, {from: alice});

        const unavailable = await bank.availableToUnstakeAt(alice, now.plus(stakeDuration.minus(day)));
        const available = await bank.availableToUnstakeAt(alice, now.plus(stakeDuration.plus(day)));/*.plus(day.times(2)));*/
        assert.isTrue(unavailable.eq(0))
        assert.isTrue(available.gt(initialBalance))

        utils.increaseTime((stakeDuration.minus(day)).toNumber())

        let error;
        try {
            const bug = await bank.unstake(initialBalance, {from: alice});
        } catch (e) {
            error = e;
        }
        utils.ensureException(error);

        utils.increaseTime(day.toNumber());
        const unstaked = await bank.unstake(initialBalance, {from: alice});
        assert.equal(unstaked.logs[0].event, "Unstaked");
    })

    // perhaps should do one min befoe and one min after 
    it("Should retrieve tokens after time lock", async () => {
        const stakeDuration = month.times('6');
        const staked = await bank.stake(initialBalance, stakeDuration, false, {from: alice});

        const unstakeAt = stakeDuration.plus(day).toNumber();
        await utils.increaseTime(unstakeAt);
        const unstaked = await bank.unstake(initialBalance, {from: alice});
        assert(unstaked.logs[0].event === 'Unstaked');
    })

    it("Should fire event when staked", async () => {

        const stakeDuration = month.plus(day);
        const staked = await bank.stake(initialBalance, stakeDuration, true, {from: alice});
        const logs = staked.logs[0];
        const blockTime = new BigNumber(web3.eth.getBlock(staked.receipt.blockNumber).timestamp)

        assert.equal(logs.event,'Staked');
        assert.equal(logs.args.amount.toString(), initialBalance);
        assert.equal(logs.args.hasBonus, true);
        assert.equal(logs.args.stakeUntil.toString(), (blockTime.plus(stakeDuration)).toString());
    })

    it("Should fire event when unstaked", async () => {
        await bank.stake(initialBalance, 0, false, {from: alice});
        await utils.increaseTime(second.toNumber());
        const unstaked = await bank.unstake(initialBalance, {from: alice});
        const logs = unstaked.logs[0];
        assert.equal(logs.event, 'Unstaked');
        assert.equal(logs.args.amount.toString(),  initialBalance);
        assert.equal(logs.args.user, alice);
    })

    it("Should deposit and withdraw tranches of stakes", async () => {
        const aWeeBit = initialBalance / 10;
        let totalStaked = 0;
        let aliceTokenBalance;
    
        let index = 0;
        for (let item of rateBoundaries) {

            // Stake
            let totalStakedBefore = await bank.totalStaked.call();
            let rate = await bank.getRate(item);
            const expectedReturn = utils.addPercent(aWeeBit, rate);
            const staked = await bank.stake(aWeeBit, item, true, {from: alice});
            assert.equal(await bank.totalStaked.call(), totalStakedBefore.add(expectedReturn).toString())

            // Check locked
            if (index > 0) { // cludge for this use case
                await utils.increaseTime((item.minus(day)).toNumber());
                const a = await bank.availableToUnstake(alice);
                assert.equal((await bank.availableToUnstake(alice)).toString(), 0);
            }

            await utils.increaseTime(day.toNumber());

            assert.equal((await bank.availableToUnstake(alice)).toString(), expectedReturn);
            assert.isOk(await bank.unstake(expectedReturn, {from: alice}));
            // aliceTokenBalance += expectedReturn
            // assert.equal((await token.balanceOf(alice)).toString(), aliceTokenBalance);
            assert.equal((await bank.availableToUnstake(alice)).toString(), 0);

            index++;
        }

        const stakeEvent = await bank.Staked({user: accounts[0]}, { fromBlock: 1, toBlock: 'latest'/*, topics: [accounts[3]]}*/});
        const firedStakeEvents = await utils.promisify(cb => stakeEvent.get(cb));
        assert.equal(firedStakeEvents.length, rateBoundaries.length);

        const unstakeEvent = await bank.Unstaked({user: accounts[0]}, { fromBlock: 1, toBlock: 'latest'/*, topics: [accounts[3]]}*/});
        const firedUnstakeEvents = await utils.promisify(cb => unstakeEvent.get(cb));
        assert.equal(firedUnstakeEvents.length, rateBoundaries.length);
    })

    // @todo run numbers on spreadsheet to ensure correct
    it("Should retrieve stakes deposited in tranches with one withdrawal", async () => {
        const aWeeBit = initialBalance / 10;
        let totalStaked = new BigNumber(0);

        for (let item of rateBoundaries) {
            const increasedTime = await utils.increaseTime(month.times(6).toNumber());
            const staked = await bank.stake(aWeeBit, item, true, {from: alice});
            totalStaked = totalStaked.add(staked.logs[0].args.amount);
        };

        await utils.increaseTime(month.times(24).toNumber());
        const available = await bank.availableToUnstake(alice);
        const unstaked = await bank.unstake(totalStaked, {from: alice});

        assert.equal(totalStaked.toString(), unstaked.logs[0].args.amount.toString());
    })

    it("Should not allow staking when inadequate bonus funds in contract to pay out", async() => {
        const availableBonusBefore = await bank.availableBonusTokens();

        await bank.stake((initialBankBalance), month.times(24).plus(day), true, {from: alice});
        await bank.stake((initialBankBalance), month.times(24).plus(day), true, {from: bob});
        await bank.stake((initialBankBalance), month.times(24).plus(day), true, {from: carol});
        await bank.stake((initialBankBalance), month.times(24).plus(day), true, {from: david});
        await bank.stake((initialBankBalance), month.times(24).plus(day), true, {from: erin});
        
        const availableBonusAfter = await bank.availableBonusTokens();
        
        assert.equal(availableBonusAfter.toString(), '0');

        let error;
        try {
            const res = await bank.stake(10, month.times(12).plus(day), true, {from: alice});
            res;
        } catch (e) {
            error = e;
        }

        utils.ensureException(error);
        const stakedNoBonus = await bank.stake(initialBalance, month.times(6).plus(day), false, {from: alice});
        assert.equal(stakedNoBonus.logs[0].event, 'Staked');
        await utils.increaseTime(month.times(24).plus(day).toNumber());

        const unstaked = await bank.unstake(initialBankBalance*1.2, {from: bob});
        assert(unstaked.logs[0].event, 'Unstaked');
        
        const bankBalance = await token.balanceOf.call(bank.address);
        assert(bankBalance.toString(), initialBalance);

    })

    it("Should not stake for 25 months or more", async () => {

        let error;
        try {
            await bank.stake((initialBankBalance), month.times(25), true, {from: alice});
        } catch (e) {
            error = e;
        }
        utils.ensureException(error);

        error;
        try {
            await bank.stake((initialBankBalance), month.times(26), true, {from: alice});
        } catch (e) {
            error = e;
        }
        utils.ensureException(error);
    })

    it("Should have correct rate boundaries", async () => {

        for (const index of rateBoundaries.keys()) {
            assert.equal(await bank.getRate(rateBoundaries[index]), rates[index])
            assert.equal(await bank.getRate(rateBoundaries[index].plus(month)), rates[index])

            if (index > 0) {
                assert.equal(await bank.getRate(rateBoundaries[index].minus(day)), rates[index-1])
            }
        }
    })


    // MultiSig
    // Avoid reimplementing tests written for gnosis multisig by proving we have an identical file
    it("Should contain same multisig contract as gnosis multisig on master", async() => {
        const fetch = require('node-fetch')
        const fs = require('fs')

        let gnosisMultiSigUrl = 'https://raw.githubusercontent.com/gnosis/MultiSigWallet/master/contracts/MultiSigWallet.sol'

        const upstream = await fetch(gnosisMultiSigUrl).then(res => res.text())

        fs.readFile(__dirname + '/../contracts/MultiSigWallet.sol', 'utf8', function read(err, local) {
            if (err) {
                throw err
            }

            assert.equal(local.toString().trim(), upstream.toString().trim())
        });
    })

    // Our single use case
    it("Should move funds using 2 of 3 sigs", async() => {
        const bankBalanceBefore = await token.balanceOf.call(bank.address);
        const tx = token.contract.transfer.getData(carol, bankBalanceBefore);
        const submitted = await bank.submitTransaction(token.address, 0, tx, {from: signers[1]});
        const txId = submitted.logs[0].args.transactionId;
        await bank.confirmTransaction(txId, {from: signers[2]});

        const bankBalanceAfter = await token.balanceOf.call(bank.address);
        const carolBalance = await token.balanceOf.call(carol);

        assert.equal(bankBalanceAfter.toString(), '0');
        assert.deepEqual(carolBalance, bankBalanceBefore);
    })
})
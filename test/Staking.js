// @todo consider modifying contracts so we can run tests on live chain
// @todo tidy up comparisons so we dont have bignumber and tostring everywhere
// @todo test eth bounce
// @todo check we are doing boundaries correctly
// @todo check falls over when trying to stake for too long
// @todo check for throwing

const Staking = artifacts.require('Staking.sol');
const TokenMock = artifacts.require('Token.sol');
const utils = require('./helpers/Utils.js');
const BigNumber = require('bignumber.js');
BigNumber.config({ DECIMAL_PLACES: 0}) // ROUND_FLOOR (4) 

contract('Staking', function (accounts) {

    let bank, token, initialBalance, initialBankBalance, rate;
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

    it.skip("Should transfer tokens to stake with no bonus", async () => {})

    it("Should unstake tokens with no time lock", async () => {
        const stakeDuration = 0;
        const staked = await bank.stake(initialBalance, stakeDuration, false, {from: alice});
        const unstaked = await bank.unstake(initialBalance, {from: alice});

        const aliceBalance = await token.balanceOf.call(alice);
        assert(aliceBalance.toString(), '10000')
    })

    it("Should not retrieve tokens whilst time locked", async () => {
        const stakeDuration = month.times('6').plus(day);
        const staked = await bank.stake(initialBalance, stakeDuration, true, {from: alice});

        // get amount locked at this time
        const stakedAt = await bank.totalStakedForAt(alice, stakeDuration.minus(day));
        const stakedAt2 = await bank.totalStakedForAt(alice, stakeDuration.plus(day));
        // @todo -- make an assertion here
        
        let error;
        try {
            const bug = await bank.unstake(initialBalance, {from: alice});
        } catch (e) {
            error = e;
        }
        utils.ensureException(error);
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

    it("Should have correct rate boundaries", async () => {
        let retrievedRates = []
        for (const boundary of rateBoundaries) {
            retrievedRates.push((await bank.getRate(boundary)).toNumber())
        }
        assert.deepEqual(rates, retrievedRates);
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
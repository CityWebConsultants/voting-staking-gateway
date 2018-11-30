// @todo setup tests so we can also run against rinkeby -- maybe have to use some mocks for getrate and blocktimeings
// @todo make sure outstanding amount of tokens left to distribute is handled correctly
// @todo assert we do need exceed maximum amount withdrawable
// @todo tidy up comparisons so we dont have bignumber and tostring everywhere
// @todo add approve for ... can we do approve and call

const Staking = artifacts.require('Staking.sol');
const TokenMock = artifacts.require('Token.sol');
const utils = require('./helpers/Utils.js');
const BigNumber = require('bignumber.js');
BigNumber.config({ DECIMAL_PLACES: 0}) // ROUND_FLOOR (4) 

contract('Staking', function (accounts) {

    let bank, token, initialBalance, rate;
    let alice = accounts[0];
    let admin = accounts[1];
    let bob = accounts[2];

    const second = new BigNumber('1');
    const month = new BigNumber('2629746');
    const day = new BigNumber('86400');

    const rateBoundaries = [0,6,9,12,18,24].map(item => month.times(item));

    // Helper -- try this out and maybe remove
    const abortedUnstake = async (user, amount) => {
        let attemptedUnstakeException;
        try {
            await bank.unstake(amount, {from: user});
        } catch(e) {
            console.log(e);
            attemptedUnstakeException = e;
        }
        utils.ensureException(attemptedUnstakeException);
    }

    beforeEach(async () => {
        initialBalance = 10000;
        initialBankBalance = 100000; 
        rate = 10; 
        // @todo consider removing default rate and using actual rates!!!!
        token = await TokenMock.new();
        bank = await Staking.new(token.address);

        await token.mint(admin, initialBankBalance);
        await token.mint(alice, initialBalance);
        await token.mint(bob, initialBankBalance); //  Bob is pure minted :)
        await token.transfer(bank.address, initialBankBalance, {from: admin});
        await token.balanceOf.call(bank.address);
        
    });

    it.skip("Should do nothing", async () => {
        assert.isTrue(true);
    });
    
    // init
    
    it("Should start with seeded amount", async () => {
        const bankBalance = await token.balanceOf.call(bank.address);
        assert.equal(bankBalance, initialBankBalance);
    })

    // Staking

    it('Should transfer tokens to stake', async () => {
        // fix this --- is a bit broken --- take a break....
        await bank.stake(initialBalance, month.plus(day), true, {from: alice});
        // @todo we should handle cases where what id we stake for 
        const aliceBalance = await token.balanceOf.call(alice);
        const bankBalance = await token.balanceOf.call(bank.address);

        assert.equal(aliceBalance.toString(), 0);
        assert.equal(bankBalance.toString(), (initialBankBalance + initialBalance));
    });

    it.skip("Should transfer tokens to stake with no bonus", async () => {

    })

    it("Should unstake tokens with no time lock", async () => {
        const stakeDuration = 0;
        const staked = await bank.stake(initialBalance, stakeDuration, false, {from: alice});
        const unstaked = await bank.unstake(initialBalance, {from: alice});

        // @todo assert events?
        const aliceBalance = await token.balanceOf.call(alice);
        assert(aliceBalance.toString(), '10000')
    })

    it("Should not retrieve tokens whilst time locked", async () => {
        const stakeDuration = month.times('6').plus(day);
        const staked = await bank.stake(initialBalance, stakeDuration, true, {from: alice});

        // get amout locked at this time
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
        const stakeDuration = month.times('6'); // this is the same as adding zero - should be added to current time
        const staked = await bank.stake(initialBalance, stakeDuration, false, {from: alice});

        const unstakeAt = stakeDuration.plus(day).toNumber(); //.plus(Math.floor(Date.now() / 1000)).toString();
        await utils.increaseTime(unstakeAt);
        const unstaked = await bank.unstake(initialBalance, {from: alice});
        assert(unstaked.logs[0].event === 'Unstaked');
    })

    // @todo test approve transfer
    it.skip("Should refuse stake for unknown address", async () => {
        // try / catch
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
        // Any number less than now should be immediately unstakable
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

        // Check all events fired
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
            // const now = web3.eth.getBlock('latest').timestamp
            // @todo should increase time here
            const increasedTime = await utils.increaseTime(month.times(6).toNumber());
            const staked = await bank.stake(aWeeBit, item, true, {from: alice});
            totalStaked = totalStaked.add(staked.logs[0].args.amount);
        };

        await utils.increaseTime(month.times(24).toNumber());
        const available = await bank.availableToUnstake(alice);
        const unstaked = await bank.unstake(totalStaked, {from: alice});

        assert.equal(totalStaked.toString(), unstaked.logs[0].args.amount.toString());
    })

    it.skip("Should not allow staking when inadequate funds in contract to pay out", async() => {
        // attept to stake more than will push over the top
    })

    it.skip("Should deduct corret account from self when returning bonuses", async () => {
        // test this in above statements.
    })

    // It should be checking the amounts and cutoffs are being applied correctly
    // It should check the aggregate totals are correct
    // It should check what happens when end conditions are reached

})
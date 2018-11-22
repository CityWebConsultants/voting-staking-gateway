// @todo setup tests so we can also run against rinkeby -- maybe have to use some mocks for getrate and blocktimeings
// @todo instead of doing date now -- should get the time of the most recent blokc to apply
// !!!1 that shoujld fix problem wiht time runningaway


// var PaymentGatewayContract = artifacts.require("PaymentGatewayContract");
// var GatewayERC20Contract = artifacts.require("GatewayERC20Contract");
const Staking = artifacts.require('Staking.sol');
const TokenMock = artifacts.require('Token.sol');
const utils = require('./helpers/Utils.js');
const leftPad = require('left-pad');
const BigNumber = require('bignumber.js');
BigNumber.config({ DECIMAL_PLACES: 0}) // ROUND_FLOOR (4) 
// @todo add anon function for only admin to seed babkj
// swtich over to using fixed times
// @todo tidy up comparisons so we dont have bignumber and tostring everywhere
// @todo add approve for ... can we do approve and call
// 3 x tx to 

contract('Staking', function (accounts) {

    let bank, token, initialBalance, rate;
    let alice = accounts[0];
    let admin = accounts[1];
    let bob = accounts[2];

    //@todo consider tidying up using object to define patrams

    // Don't really need big numbers as they will never be that big
    // will be tidier without them ---
    const second = new BigNumber('1');
    const month = new BigNumber('2629746');
    const day = new BigNumber('86400');

    //should test getRate... or somehting

    // Helper
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
        initialBankBalance = 100000; // call this intial bank balance
        rate = 10; // default rate for 6 months stake
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

    it("Should transfer tokens to stake with no bonus", async () => {
        // Hmmmm, when we create different states then make stuff harder to test by creating more paths
    })

    // Should perhaps test events as a separate thing...
    // To what extent should we test individual parts of events separate from transactions
    it("Should fire event when staked", async () => {
        // actually we don't really need timestamps to be big numbers
        const stakeDuration = month.plus(day);
        const staked = await bank.stake(initialBalance, stakeDuration, true, {from: alice});
        
        const logs = staked.logs[0];
        const blockTime = new BigNumber(web3.eth.getBlock(staked.receipt.blockNumber).timestamp)
        
        // could create a helper function to test each of staked and unstaked
        // then would only have to check in one plave if we updated them
        assert.equal(logs.event,'Staked');
        assert.equal(logs.args.amount.toString(), initialBalance);
        assert.equal(logs.args.hasBonus, true);
        assert.equal(logs.args.stakeUntil.toString(), (blockTime.plus(stakeDuration)).toString());
    })

    it("Should unstake tokens with no time lock", async () => {
        const stakeDuration = 0;
        const staked = await bank.stake(initialBalance, stakeDuration, false, {from: alice});
        const unstaked = await bank.unstake(initialBalance, {from: alice});

        // check events have the correct information
        // we should also assert the event ocurred here
        const aliceBalance = await token.balanceOf.call(alice);
        assert(aliceBalance.toString(), '10000')
    })


    // WTF!!!! Why is this failing!!!!!!!!!!!!!!!
    it("Should not retrieve tokens whilst time locked", async () => {
        const stakeDuration = month.times('6').plus(day).toString();
        const staked = await bank.stake(initialBalance, stakeDuration, true, {from: alice});

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
        // How -- check which network we are on

        const unstakeAt = stakeDuration.plus(day).toNumber(); ///.plus(Math.floor(Date.now() / 1000)).toString();
        await utils.increaseTime(unstakeAt);
        const unstaked = await bank.unstake(initialBalance, {from: alice});

        // check balance before and after 
        // Is it better to test it here or give events their own 
        assert(unstaked.logs[0].event === 'Unstaked');
    })

    // @todo test approve transfer
    it.skip("Should refuse stake for unknown address", async () => {

    })

    // @todo assert we do need exceed maximum amount withdrawable

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


    // @todo multiple stakes in a single month


    // Simulate journey
    // @todo refactor this to make use of objects
    // so we don't have so we can make use of loops and vars rather than having literal values scattered through
    it("Should deposit and withdraw tranches of stakes", async () => {
        const aWeeBit = initialBalance / 10;
        let aliceTokenBalance;
        let totalStaked;
        // No time no bonus
        await bank.stake(aWeeBit, 0, false, {from: alice});

        // should create this as an object so that the valus are easy to change
        // can set those params at the start of the file
        // Would be much tiedier and easier to change and would make it more generic....

        // make thi smore dyanimc, iterate over values
        // just use lityeral as an amount just now...
        assert(await bank.totalStaked(),  aWeeBit, 'total staked does not match deposited');
        // No time no bonus awarded (< 6 months)
        await bank.stake(aWeeBit, 0, true, {from: alice}); // should still be 0
        assert(await bank.totalStaked(),  aWeeBit * 2, 'total staked does not match deposited');
        await bank.stake(aWeeBit, month.times(6), true, {from: alice});
        assert(await bank.totalStaked(),  '3200', 'total staked does not match deposited');
        await bank.stake(aWeeBit, month.times(9), true, {from: alice});
        assert(await bank.totalStaked(),  '4500', 'total staked does not match deposited');
        await bank.stake(aWeeBit, month.times(12), true, {from: alice});
        assert(await bank.totalStaked(),  '6000', 'total staked does not match deposited');
        await bank.stake(aWeeBit, month.times(18), true, {from: alice});
        assert(await bank.totalStaked(), '7750', 'total staked does not match deposited');
        await bank.stake(aWeeBit, month.times(24), true, {from: alice});
        assert(await bank.totalStaked(), '9750', 'total staked does not match deposited');
        // stake some from bob without bonus for two years
        aliceTokenBalance = await token.balanceOf.call(alice);
        assert.equal(aliceTokenBalance.toString(), '3000');


        // assert alices coins
        // assert bobs coins
    
        // const bug = await bank.totalStaked();
        // const a = await bank.availableToUnstake(alice);

        // @todo should also apply a deposit from bob
        // @todo assert balance of alice
        // @todo should use getRate function
        // Should not deposit after time limit
        let exceedsMaxTimeException
        try {
            await bank.stake(aWeeBit, month.times(25).plus(day), true, {from: alice});
        } catch(e) {
            exceedsMaxTimeException = e
        }
        utils.ensureException(exceedsMaxTimeException);
        // also assert failures
    
        // Check availability
        let available = await bank.availableToUnstake(alice);
        assert.equal(available.toString(), aWeeBit * 2);
        // assert total staked
        await bank.unstake(2000, {from: alice});
        assert((await bank.availableToUnstake(alice)).toString(), 0);
        
        // 6 months
        await utils.increaseTime(month.times(6).toNumber());
        available = await bank.availableToUnstake(alice);
        assert(available.toNumber(), '1200');
        await bank.unstake('1200', {from: alice});
        assert.equal((await token.balanceOf.call(alice)).toString(), '6200');

        // 9 months
        await utils.increaseTime(month.times(3).toNumber());
        available = await bank.availableToUnstake(alice);
        assert(available.toNumber(), '1300');
        await bank.unstake('1300', {from: alice});
        assert.equal((await token.balanceOf.call(alice)).toString(), '7500');
        
        // 12 months
        await utils.increaseTime(month.times(3).toNumber());
        available = await bank.availableToUnstake(alice);
        assert(available.toNumber(), '1500');
        await bank.unstake('1500', {from: alice});
        assert.equal((await token.balanceOf.call(alice)).toString(), '9000');

        // 18 months
        await utils.increaseTime(month.times(6).toNumber());
        available = await bank.availableToUnstake(alice);
        assert(available.toNumber(), '1750');
        await bank.unstake('1750', {from: alice});
        assert.equal((await token.balanceOf.call(alice)).toString(), '10750');

        // 24 months
        await utils.increaseTime(month.times(6).toNumber());
        available = await bank.availableToUnstake(alice);
        assert(available.toNumber(), '2000');
        await bank.unstake('2000', {from: alice});
        assert.equal((await token.balanceOf.call(alice)).toString(), '12750');

        assert.equal(await token.balanceOf.call(bank.address), initialBankBalance - 2750);

/*
        attemptedUnstakeException = undefined;
        try {
            await bank.unstake(available, {from: alice});
        } catch(e) {
            attemptedUnstakeException = e;
        }
        available = await bank.availableToUnstake(alice);
        utils.ensureException(attemptedUnstakeException);
        */

    })

    // testing return values
    // test batching of amounts in different tranches...
    // theres a solidity preprocessor we coulc maybe use to interpolate variables so that this could actually be tested on-chain
    // 
    

    // it("Should not not s")

    // It should be checking the amounts and cutoffs are being applied correctly
    // It should check the aggregate totals are correct
    // It should check what happens when end conditions are reached


/*
    it("Should retrieve tokens staked for 0 blocks", async () => {
        const rate = 10;
        const bonus = initialBalance * rate / 100

    //    await bank.stake(initialBalance, '0x0000000000000000000000000000000000000000000000000000000000000001');
        await bank.stake(initialBalance, '0x0');
        const totalStaked = await bank.totalStakedFor.call(alice);
        
        assert.equal(totalStaked.toString(), initialBalance + bonus);

        // should also assert available
        // const available = await bank.availableToUnstake(alice)
        const unstaked = await bank.unstake(totalStaked / 2, '0x0');

        const totalStakedAfter = await bank.totalStakedFor.call(alice);
        const tokenBalanceAfter = await token.balanceOf.call(alice)
        const bankTokenBalanceAfter = await token.balanceOf.call(bank.address);
        
        //const goo = totalStaked.minus(totalStaked.dividedBy(2)).add(initialBankBalance);

        // @todo tidy up this logic so it is easier to understand
        assert.deepEqual(bankTokenBalanceAfter, totalStaked.dividedBy(2).add(initialBankBalance).minus(bonus))
    })

    it("Should retrieve tokens staked after target period", async () => {
        const rate = 10;
        const bonus = initialBalance * rate / 100

        const currentBlock = new BigNumber(web3.eth.blockNumber);
        const targetBlock = currentBlock.add(50);
        // make this a helper funciton
        const targetBlockBytes = '0x' + leftPad(targetBlock.toString(16), 64, 0);

        await bank.stake(initialBalance, targetBlockBytes);
        const totalStaked = await bank.totalStakedFor.call(alice);
        await utils.advanceToBlock(targetBlock.toString(10))

        assert.equal(totalStaked.toString(), initialBalance + bonus);
        const available = await bank.availableToUnstake(alice)
        // @todo assert this
        const unstaked = await bank.unstake(totalStaked / 2, '0x0');

        const totalStakedAfter = await bank.totalStakedFor.call(alice);
        const tokenBalanceAfter = await token.balanceOf.call(alice)
        const bankTokenBalanceAfter = await token.balanceOf.call(bank.address);
        const foo = 0;
        assert.deepEqual(bankTokenBalanceAfter, totalStaked.dividedBy(2).add(initialBankBalance).minus(bonus));
    })

    it("Should not retrieve tokens before target block", async () => {
        const currentBlock = new BigNumber(web3.eth.blockNumber);
        const targetBlock = currentBlock.add(50);
        // make this a helper funciton
        const targetBlockBytes = '0x' + leftPad(targetBlock.toString(16), 64, 0);

        await bank.stake(initialBalance, targetBlockBytes);
        const totalStaked = await bank.totalStakedFor.call(alice);
        await utils.advanceToBlock(targetBlock.minus(10).toString(10))

        assert(await bank.availableToUnstake(alice), 0);

        let error;
        try {
            const unstaked = await bank.unstake(totalStaked, '0x0');
        } catch(e) {
            error = e;
        }
        utils.ensureException(error);
    })

    it("Should not allow staking when inadequate funds in contract to pay out", async() => {
        const currentBlock = new BigNumber(web3.eth.blockNumber);
        const targetBlock = currentBlock.add(50);
        // make this a helper funciton
        const targetBlockBytes = '0x' + leftPad(targetBlock.toString(16), 64, 0);

        let error
        try {
            await bank.stake(initialBankBalance - (initialBankBalance * 5 / 100), targetBlockBytes);  
        } catch(e) {
            error = e
        }

        utils.ensureException(error)
    })


*/


    ///////////////////////////////////////////////////////////////////////

    // @todo test for passing in more tokens than can handle
    
    // it('should allow user to unstake tokens', async () => {
    //     await bank.stake(initialBalance, '0x0');
    //     assert.equal(await bank.totalStakedFor.call(accounts[0]), initialBalance);
    //     await bank.unstake(initialBalance / 2, '0x0');
    //     assert.equal(await bank.totalStakedFor.call(accounts[0]), initialBalance / 2);
    // });

    // @todo test blocks

    /*

    it('should allow user to stake for other person', async () => {
        await bank.stakeFor(accounts[1], initialBalance, '0x0');
        assert.equal(await bank.totalStakedFor.call(accounts[1]), initialBalance);
        await bank.unstake(initialBalance / 2, '0x0', {from: accounts[1]});
        assert.equal(await bank.totalStakedFor.call(accounts[1]), initialBalance / 2);
    });

    context('staking constants', async () => {

        let firstBlock;
        let secondBlock;

        beforeEach(async () => {
            firstBlock = web3.eth.blockNumber;
            secondBlock = firstBlock + 5;

            let result = await bank.stake(initialBalance / 2, '0x0');
            firstBlock = result['receipt']['blockNumber'];

            await utils.advanceToBlock(secondBlock);

            result = await bank.stake(initialBalance / 2, '0x0');
            secondBlock = result['receipt']['blockNumber'];
        });

        it('should return full staked value when calling totalStaked', async () => {
            assert.equal(await bank.totalStakedFor.call(accounts[0]), initialBalance);
        });

        it('should return correct amount staked at block', async () => {
            assert.equal(await bank.totalStakedForAt.call(accounts[0], firstBlock), initialBalance / 2);
        });

        it('should return correct block when calling lastStaked', async () => {
            assert.equal(await bank.lastStakedFor.call(accounts[0]), secondBlock);
        });

        it('should return correct amount staked at block in future', async () => {
            assert.equal(await bank.totalStakedForAt.call(accounts[0], secondBlock * 2), initialBalance);
        });
    });

    it('should return correct total amount staked', async () => {
        await bank.stake(initialBalance / 2, '0x0', {from: accounts[0]});
        let result = await bank.stake(initialBalance / 2, '0x0', {from: accounts[1]});

        let block = result['receipt']['blockNumber'];
        assert.equal(await bank.totalStakedAt.call(block * 2), initialBalance);
    });
});

*/
})
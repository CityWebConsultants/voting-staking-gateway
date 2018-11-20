// @todo setup tests so we can also run against rinkeby -- maybe have to use some mocks for getrate and blocktimeings



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

contract('Staking', function (accounts) {

    let bank, token, initialBalance, rate;
    let alice = accounts[0];
    let admin = accounts[1];
    let bob = accounts[2];

    // Time in seconds
    const month = new BigNumber('2629746');
    const day = new BigNumber('86400');

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
        assert(true);
    });
    
    // init
    
    it("Should start with seeded amount", async () => {
        const bankBalance = await token.balanceOf.call(bank.address);
        assert.equal(bankBalance, initialBankBalance);
    })

    // Staking

    it('Should transfer tokens when staking', async () => {
        // fix this --- is a bit broken --- take a break....
        await bank.stake(initialBalance, month.plus(day), true, {from: alice});
        // @todo we should handle cases where what id we stake for 
        const aliceBalance = await token.balanceOf.call(alice);
        const bankBalance = await token.balanceOf.call(bank.address);

        assert.equal(aliceBalance.toString(), 0);
        assert.equal(bankBalance.toString(), (initialBankBalance + initialBalance));
    });

    it("Should transfer tokens to bank with no bonus for one year", async () => {
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
        
        assert.equal(logs.event,'Staked');
        assert.equal(logs.args.amount.toString(), initialBalance);
        assert.equal(logs.args.includesBonus, true);
        assert.equal(logs.args.stakeUntil.toString(), blockTime.plus(stakeDuration).toString());
    })

    it("Should unstake tokens with no time lock", async () => {
        const stakeDuration = 0;
        const staked = await bank.stake(initialBalance, stakeDuration, false, {from: alice});
        const unstaked = await bank.unstake(initialBalance, {from: alice});

        // we should also assert the event ocurred here
        const aliceBalance = await token.balanceOf.call(alice);
        assert(aliceBalance.toString(), '10000')
    })

    it("Should not retrieve tokens before whilst time locked", async () => {
        const stakeDuration = month.times('6');
        const staked = await bank.stake(initialBalance, stakeDuration, false, {from: alice});

        let error;
        try {
            const unstaked = await bank.unstake(initialBalance, {from: alice});
        } catch (e) {
            error = e;
        }

        utils.ensureException(error);
    })

    it("Should retrieve tokens with time lock", async () => {
        const stakeDuration = month.times('6');
        const staked = await bank.stake(initialBalance, stakeDuration, false, {from: alice});
        // How -- check which network we are on

        const unstakeAt = stakeDuration.plus(day).toNumber(); ///.plus(Math.floor(Date.now() / 1000)).toString();
        await utils.increaseTime(unstakeAt);
        const unstaked = await bank.unstake(initialBalance, {from: alice});

        assert(unstaked.logs[0].event === 'Unstaked');
    })

    it("Should not retrieve tokens before end of timelock", async () => {

    })

    it("Should not unstake for wrong user", async () => {

    })

    // testing return values
    // test batching of amounts
    

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
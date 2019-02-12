const BinaryVoting = artifacts.require("BinaryVoting");
const StakingMock = artifacts.require("StakingMock");

const utils = require('./helpers/Utils.js');

// @todo improve exception handling for DRYness
// @todo review tests for user votes on multiple polls
// @todo all suggestions for improving coverage welcome
//@todo add shared constants to utils
// eg one month one year etc....
//@todo change message used throughout -- stick in a var

contract('BinaryVoting', function (accounts) {
    let staking, voting, now, nextweek;

    const optionA = 'Yes';
    const optionB = 'No';

    const optionAHex = web3.toHex(optionA);
    const optionBHex = web3.toHex(optionB);

    const oneMonth = 2592000;
    const oneWeek = 604800;
    const oneDay = 86400;
    const oneMinute = 60;


    const admin = accounts[0];
    const alice = accounts[1];
    const bob = accounts[3];
    const charlie = accounts[4];
    const debs = accounts[5];

    const minStake = 100;

    before(async () => {})

    beforeEach(async () => {
        staking = await StakingMock.new(true, minStake);
        voting = await BinaryVoting.new(staking.address, minStake);
        now = await utils.blockNow();
        nextWeek = now + oneWeek;
        nextMonth = now + oneMonth;
    });

    it("Should create new proposal with correct properties", async () => {

        const createdProposal = await voting.createIssue('Does this work?', now, nextWeek);
        const logs = createdProposal.logs[0];

        // check event
        assert.equal(logs.args.endTime, nextWeek);
        assert.equal(logs.args.id, 0);
        assert.equal(logs.args.user, accounts[0]);
        
        const description = await voting.issueDescription(0);
        assert.equal(description, "Does this work?");

        const noOption = await voting.optionDescription(0, 0);
        const optionDescriptionA = await voting.optionDescription(0, 1);
        const optionDescriptionB = await voting.optionDescription(0, 2);

        // assert number of options
        assert.equal(noOption, '');
        assert.equal(optionDescriptionA, optionA);
        assert.equal(optionDescriptionB, optionB);
   
        // get all descriptions
        const optionDescriptions = await voting.optionDescriptions(0);
        
        const optionDescriptionsText = optionDescriptions.map(item => web3.toAscii(item).replace(/\u0000/g, ''));
        
        assert.equal(optionDescriptionsText[1], optionA);
        assert.equal(optionDescriptionsText[2], optionB);

        const availableOptions = await voting.availableOptions(0);
        assert.isTrue(availableOptions[0].eq(1));
        assert.isTrue(availableOptions[1].eq(2));
        assert.equal(availableOptions[3], undefined);

        // check events


    })

    it("Should open and close with correct status", async () => {
        // should check firing of events and should also check this before
        // check events

        await voting.createIssue('Does this work?', now + oneMinute, nextWeek);
        assert.equal(await voting.getStatus(0), false);
        
        utils.increaseTime(oneMinute)
        assert.equal(await voting.getStatus(0), true);

        await utils.increaseTime(oneWeek + oneMinute);
        assert.equal(await voting.getStatus(0), false);
    })

    it("Should cast a vote", async () => {
        
        await voting.createIssue('Does this work?', now, nextWeek);
        const voted = await voting.vote(0, 1, {from: alice});
        args = voted.logs[0].args;

        assert.equal(args.from, alice);
        assert.equal(args.value.toString(), '1');

        const ballot = await voting.ballotOf(0, alice);
        assert.equal(ballot.toString(), '1');
        // consider explicitly setting stakedForAt
        // also consider changing logic <= > in contract
        const weightedCount = await voting.weightedVoteCountsOf(0, 1);
        assert.isTrue(weightedCount.eq(100));
    })

    it("Should retrieve a users ballot", async () => {
        await voting.createIssue('Does this work?', now, nextWeek);
        await voting.vote(0, 1, {from: alice});

        assert.equal(await voting.ballotOf(0, alice));
    })

    it("Should retrieve voting weight", async () => {
        await voting.createIssue('Does this work?', now, nextWeek);
        await voting.vote(0, 1, {from: alice});

        assert.equal(await voting.weightOf(0, alice), 100);
    })

    it("Should not allow a second vote", async () => {
        await voting.createIssue('Does this work?', now, nextWeek);
        await voting.vote(0, 1, {from: alice});
        
        let errVote;
        try {
            await voting.vote(0, 1, {from: alice});
        } catch(e) {
           errVote = e; 
        }

        utils.ensureException(errVote);
    })

    it("Should not accept votes outside of start and end times", async () => {
        await voting.createIssue('Does this work?', now + oneMinute, nextWeek);

        let errVote;
        try {
            await voting.vote(0, 1, {from: alice});
        } catch(e) {
           errVote = e; 
        }
        utils.ensureException(errVote);

        await utils.increaseTime(oneWeek + oneMinute);

        errVote = '';
        try {
            await voting.vote(0, 1, {from: bob});
        } catch(e) {
           errVote = e; 
        }
        utils.ensureException(errVote);
    });

    // check tallies
    it("Should cast multiple votes on multiple proposals", async () => {
/*        await voting.createIssue('Does this work?', [optionAHex, optionBHex, optionCHex], nextWeek);
        
        // check events fire on each?
        await voting.vote(0, 1, {from: accounts[0]});
        await voting.vote(0, 1, {from: alice});
        await voting.vote(0, 1, {from: bob});
        await voting.vote(0, 2, {from: accounts[3]});


        const optionAVotes = await voting.weightedVoteCountsOf(0, 1);
        const optionBVotes = await voting.weightedVoteCountsOf(0, 2);


        await voting.createIssue('Does this work too?', nextWeek);

        await voting.vote(1, 1, {from: accounts[0]});
        await voting.vote(1, 2, {from: alice});
        const foo = await voting.vote(1, 2, {from: bob});
        foo;
*/
        // checkall the results

        // const optionAVotes = await voting.weightedVoteCountsOf(0, 1);
        // const optionBVotes = await voting.weightedVoteCountsOf(0, 2);

        // asserttions
        // check correct weightings
        // do we need to check 
        // perhaps use loops and check weights

        // what other state should w ebe checking
    })

    it("Should not vote outside of option range", async () => {
        await voting.createIssue('Does this work?', now, nextWeek);
        
        let errZero;
        try {
            await voting.vote(0, 0, {from: alice});
        } catch(e) {
            errZero = e;
        }

        utils.ensureException(errZero);

        let errTooHigh;
        try {
            await voting.vote(0, 4, {from: alice});
        } catch(e) {
            errTooHigh = e;
        }

        utils.ensureException(errTooHigh);
    });

    it("It should throw on non-existing poll", async () => {
 
        let errPoll;
        try {
            await voting.vote(1, 1, {from: accounts[0]});
        } catch(e) {
            errPoll = e;
        }

        utils.ensureException(errPoll);
    })

    it("Should prevent creation of a poll when inadequate funds staked at end date", async () => {

        assert.isTrue(await staking.totalStakedForAt(bob, nextMonth + oneDay) < minStake)

        let inadequateSteak;
        try {
            await voting.createIssue('Does this work?', now, nextMonth + oneDay, {from: bob});
            foo;
        } catch(e) {
            inadequateSteak = e;
        }
        utils.ensureException(inadequateSteak);
    })

    it("Should have correct voting results", async () => {
        await voting.createIssue('Does this work?', now, nextWeek);

        await voting.vote(0, 1, {from: alice});
        await voting.vote(0, 2, {from: bob});
        await voting.vote(0, 2, {from: charlie});

        assert.equal(await voting.winningOption(0), 2);

        const topOptions = await voting.topOptions(0, 2);
        assert.equal(topOptions[0], 2);
        assert.equal(topOptions[1], 1);

        await voting.createIssue('Noone votes for this?', now, nextWeek);
        
        const noVotesTopOptions = await voting.topOptions(1, 2);
        assert.equal(noVotesTopOptions[0], 0);
        assert.equal(noVotesTopOptions[1], 0);

        assert(await voting.winningOption(1), 0);

        await voting.createIssue('Noone votes for this?', now, nextWeek);
        await voting.vote(2, 1, {from: alice});
        await voting.vote(2, 2, {from: bob});
    })

    // what happens when we have 

})
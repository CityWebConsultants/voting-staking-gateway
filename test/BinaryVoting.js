const BinaryVoting = artifacts.require("BinaryVoting");
const StakingMock = artifacts.require("StakingMock");

const utils = require('./helpers/Utils.js');

// @todo improve exception handling for DRYness
// @todo review tests for user votes on multiple polls
// @todo all suggestions for improving coverage welcome

contract('BinaryVoting', function (accounts) {
    let staking, voting, now, nextweek;

    const optionA = 'Yes';
    const optionB = 'No';

    const optionAHex = web3.toHex(optionA);
    const optionBHex = web3.toHex(optionB);

    const oneMonth = 2630000;
    const oneWeek = 604800;
    const oneMinute = 60;

    before(async () => {})

    beforeEach(async () => {
        staking = await StakingMock.new(true, 100);
        voting = await BinaryVoting.new(staking.address, 100);
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
    })

    it("Should cast a vote", async () => {
        
        await voting.createIssue('Does this work?', now, nextWeek);
        const voted = await voting.vote(0, 1, {from: accounts[1]});
        args = voted.logs[0].args;

        assert.equal(args.from, accounts[1]);
        assert.equal(args.value.toString(), '1');

        const ballot = await voting.ballotOf(0, accounts[1]);
        assert.equal(ballot.toString(), '1');
        // consider explicitly setting stakedForAt
        // also consider changing logic <= > in contract
        const weightedCount = await voting.weightedVoteCountsOf(0, 1);
        assert.isTrue(weightedCount.eq(100));
    })

    it("Should not allow a second vote", async () => {
        await voting.createIssue('Does this work?', now, nextWeek);
        await voting.vote(0, 1, {from: accounts[1]});   
        
        let errVote;
        try {
            await voting.vote(0, 1, {from: accounts[1]});
        } catch(e) {
           errVote = e; 
        }

        utils.ensureException(errVote);
    })

    it("Should not accept votes outside of start and end times", async () => {
        await voting.createIssue('Does this work?', now + oneMinute, nextWeek);

        let errVote;
        try {
            await voting.vote(0, 1, {from: accounts[1]});
        } catch(e) {
           errVote = e; 
        }
        utils.ensureException(errVote);

        await utils.increaseTime(oneWeek + oneMinute);

        errVote = '';
        try {
            await voting.vote(0, 1, {from: accounts[2]});
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
        await voting.vote(0, 1, {from: accounts[1]});
        await voting.vote(0, 1, {from: accounts[2]});
        await voting.vote(0, 2, {from: accounts[3]});


        const optionAVotes = await voting.weightedVoteCountsOf(0, 1);
        const optionBVotes = await voting.weightedVoteCountsOf(0, 2);


        await voting.createIssue('Does this work too?', nextWeek);

        await voting.vote(1, 1, {from: accounts[0]});
        await voting.vote(1, 2, {from: accounts[1]});
        const foo = await voting.vote(1, 2, {from: accounts[2]});
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
            await voting.vote(0, 0, {from: accounts[1]});
        } catch(e) {
            errZero = e;
        }

        utils.ensureException(errZero);

        let errTooHigh;
        try {
            await voting.vote(0, 4, {from: accounts[1]});
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
        
        let inadequateSteak;
        try {
            await voting.createIssue('Does this work?', now, nextMonth + oneMinute);
        } catch(e) {
            inadequateSteak = e;
        }
        utils.ensureException(inadequateSteak);
    })
})
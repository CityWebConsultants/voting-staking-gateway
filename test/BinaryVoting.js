const BinaryVoting = artifacts.require("BinaryVoting");
const StakingMock = artifacts.require("StakingMock");

const utils = require('./helpers/Utils.js');

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

        assert.equal(logs.args.endTime, nextWeek);
        assert.equal(logs.args.id, 0);
        assert.equal(logs.args.user, accounts[0]);
        
        const description = await voting.issueDescription(0);
        assert.equal(description, "Does this work?");

        const noOption = await voting.optionDescription(0, 0);
        const optionDescriptionA = await voting.optionDescription(0, 1);
        const optionDescriptionB = await voting.optionDescription(0, 2);

        assert.equal(noOption, '');
        assert.equal(optionDescriptionA, optionA);
        assert.equal(optionDescriptionB, optionB);

        const optionDescriptions = await voting.optionDescriptions(0);
        
        const optionDescriptionsText = optionDescriptions.map(item => web3.toAscii(item).replace(/\u0000/g, ''));
        
        assert.equal(optionDescriptionsText[1], optionA);
        assert.equal(optionDescriptionsText[2], optionB);

        const availableOptions = await voting.availableOptions(0);
        assert.isTrue(availableOptions[0].eq(1));
        assert.isTrue(availableOptions[1].eq(2));
        assert.equal(availableOptions[3], undefined);
    })

    it("Should not create issue when inadequate stake", async () => {
        await staking.setStake(0);

        let errStake;
        try {
            await voting.createIssue('Does this work?', now, nextWeek);
        } catch(e) {
           errStake = e; 
        }

        utils.ensureException(errStake);
    })

    it("Should open and close with correct status", async () => {

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

        const weightedCount = await voting.weightedVoteCountsOf(0, 1);
        assert.isTrue(weightedCount.eq(100));
    })

    it("Should not count vote when inadequate stake", async () => {
        
        await voting.createIssue('Does this work?', now, nextWeek);
        staking.setStake(0);

        let errStake;
        try {
            const goo = await voting.vote(0, 1, {from: alice});
            goo;
            console.log(goo.toString())
        } catch(e) {
           errStake = e; 
        }

        utils.ensureException(errStake);
    })

    it("Should retrieve a users ballot", async () => {
        await voting.createIssue('Does this work?', now, nextWeek);
        await voting.vote(0, 1, {from: alice});

        assert.equal(await voting.ballotOf(0, alice), 1);
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

    it("Should cast votes in multiple proposals", async () => {
        await voting.createIssue('Does this work?', now, nextWeek);
        await voting.createIssue('Does this work too?', now, nextWeek);
        await voting.createIssue('Does this work as well?', now, nextWeek);
        
        const votedA = await voting.vote(0, 1, {from: alice});
        const votedB = await voting.vote(1, 1, {from: alice});
        const votedC = await voting.vote(2, 1, {from: alice});

        assert.equal(votedA.logs[0].event, "OnVote")
        assert.equal(votedB.logs[0].event, "OnVote")
        assert.equal(votedC.logs[0].event, "OnVote")
    })
})
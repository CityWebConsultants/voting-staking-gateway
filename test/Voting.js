const VotingContract = artifacts.require("Voting");
const StakingMock = artifacts.require("StakingMock");

const utils = require('./helpers/Utils.js');

//@todo move mocks back in tst folder
// and improt .sol
// @todo improve exception handling for DRYness
// @todo review tests for user votes on multiple polls
// @todo all suggestions for improving coverage welcome
//@todo factor out repitiion of a single vote

contract('Voting', function (accounts) {
    let staking, voting, now, nextweek;

    const optionA = 'Yeah, fab.';
    const optionB = 'Nope, fix it.';
    const optionC = 'Dont care';

    const optionAHex = web3.toHex(optionA);
    const optionBHex = web3.toHex(optionB);
    const optionCHex = web3.toHex(optionC);

    const oneMonth = 2630000;
    const oneWeek = 604800;
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
        voting = await VotingContract.new(staking.address, minStake);
        now = await utils.blockNow();
        nextWeek = now + oneWeek;
        nextMonth = now + oneMonth;
    });

    it("Should create new proposal with correct properties", async () => {

        const createdProposal = await voting.createIssue('Does this work?', [optionAHex, optionBHex, optionCHex], now, nextWeek);
        const logs = createdProposal.logs[0];

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
        assert.equal(optionDescriptionsText[3], optionC);

        const availableOptions = await voting.availableOptions(0);
        assert.isTrue(availableOptions[0].eq(1))
        assert.isTrue(availableOptions[1].eq(2))
        assert.isTrue(availableOptions[2].eq(3))
        assert.equal(availableOptions[3], undefined);
    })

    it("Should have correct status", async () => {

        await voting.createIssue('Does this work?', [optionAHex, optionBHex, optionCHex], now+oneMinute, nextWeek);
        assert.equal(await voting.getStatus(0), false);

        utils.increaseTime(oneMinute);
        assert.equal(await voting.getStatus(0), true);

        await utils.increaseTime(oneWeek + oneMinute);
        assert.equal(await voting.getStatus(0), false);
    })

    it("Should only allow owner to create vote", async () => {
 
        let errVote;
        try {
            await voting.createIssue('Does this work?', [optionAHex, optionBHex, optionCHex], now, nextWeek, {from: alice});
        } catch(e) {
           errVote = e; 
        }

        utils.ensureException(errVote);
    })

    it("Should cast a vote", async () => {
        
        await voting.createIssue('Does this work?', [optionAHex, optionBHex, optionCHex], now, nextWeek);
        const voted = await voting.vote(0, 1, {from: accounts[1]});
        args = voted.logs[0].args;

        assert.equal(args.from, accounts[1]);
        assert.equal(args.value.toString(), '1');

        const ballot = await voting.ballotOf(0, accounts[1]);
        assert.equal(ballot.toString(), '1');
        const weightedCount = await voting.weightedVoteCountsOf(0, 1);
        assert.isTrue(weightedCount.eq(100));
    })

    it("Should not vote with inadequate stake", async () => {
        
        await voting.createIssue('Does this work?', [optionAHex, optionBHex, optionCHex], now, nextWeek);
        staking.setStake(0);

        let errStake;
        try {
            await voting.vote(0, 1, {from: alice});
        } catch(e) {
           errStake = e; 
        }

        utils.ensureException(errStake);
    })

    it("Should retrieve a users ballot", async () => {
        await voting.createIssue('Does this work?', [optionAHex, optionBHex, optionCHex], now, nextWeek);
        await voting.vote(0, 1, {from: alice});

        assert.equal(await voting.ballotOf(0, alice), 1);
    })

    it("Should retrieve voting weight", async () => {
        await voting.createIssue('Does this work?', [optionAHex, optionBHex, optionCHex], now, nextWeek);
        await voting.vote(0, 1, {from: alice});

        assert.equal(await voting.weightOf(0, alice), 100);
    })

    it("Should not allow a second vote", async () => {
        await voting.createIssue('Does this work?', [optionAHex, optionBHex, optionCHex], now, nextWeek);
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
        await voting.createIssue('Does this work?', [optionAHex, optionBHex, optionCHex], now + oneMinute, nextWeek);

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

    it("Should not vote outside of option range", async () => {
        await voting.createIssue('Does this work?', [optionAHex, optionBHex, optionCHex], now, nextWeek);
        
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

    it("Should have correct voting results", async () => {
        await voting.createIssue('Does this work?', [optionAHex, optionBHex, optionCHex], now, nextWeek);

        await voting.vote(0, 1, {from: alice});
        await voting.vote(0, 2, {from: bob});
        await voting.vote(0, 2, {from: charlie});

        assert.equal(await voting.winningOption(0), 2);
        const topOptions = await voting.topOptions(0, 3);
        assert.equal(topOptions[0], 2);
        assert.equal(topOptions[1], 1);
        // zero value for options with no votes
        assert.equal(topOptions[2], 0);

        await voting.createIssue('Noone votes for this?', [optionAHex, optionBHex, optionCHex], now, nextWeek);
        
        const noVotesTopOptions = await voting.topOptions(1, 3);
        assert.equal(noVotesTopOptions[0], 0);
        assert.equal(noVotesTopOptions[1], 0);
        assert.equal(noVotesTopOptions[2], 0);

        assert(await voting.winningOption(1), 0);
    })

    it.skip("Should cast votes in multiple proposals", async () => {
        await voting.createIssue('Does this work?', [optionAHex, optionBHex, optionCHex], now, nextWeek);
        await voting.createIssue('Does this work too?', [optionAHex, optionBHex, optionCHex], now, nextWeek);
        await voting.createIssue('Does this work as well?', [optionAHex, optionBHex, optionCHex], now, nextWeek);
        
        await voting.vote(0, 1, {from: alice});
        await voting.vote(1, 1, {from: alice});
        await voting.vote(2, 1, {from: alice});
    })
})


        // const opt1 = voting.weightedVoteCountsOf(0, 1);
        // const opt2 = voting.weightedVoteCountsOf(0, 2);

        // const winningOption = winningOption(uint256 _proposalId)
        // const topOptions = await voting.topOptions(0, 3);
        // assert.equal(topOptions[0], 2);
        // assert.equal(topOptions[1], 1);
        // // zero value for options with no votes
        // assert.equal(topOptions[2], 0);



        // const first = topOptions[0].toString();
        // const second = topOptions[1].toString();
        // const third = topOptions[2].toString();
        // third;

        
        // check poll closed... need for another contract to decide on something
        // act on poll...


        //how winning option is treated before and after time...
const VotingContract = artifacts.require("Voting");
const StakingMock = artifacts.require("StakingMock");

const utils = require('./helpers/Utils.js');
// start date 
// updating options
// @todo improve exception handling
// @todo deal with finalisation
// @todo deal with string which are too long? There's not really a way around this other than adding one at a time
// then that would have to be restricted before opening
// @todo update voting contructor 
// @todo should be no winner
// @todo user votes on multiple polls
// @todo write test for inadeqaute funds

contract('Voting', function (accounts) {
    let staking, voting, now, nextweek;

    const optionA = 'Yeah, fab.';
    const optionB = 'Nope, fix it.';
    const optionC = 'Dont care';

    const optionAHex = web3.toHex(optionA);
    const optionBHex = web3.toHex(optionB);
    const optionCHex = web3.toHex(optionC);

    //const now = Math.floor(Date.now() / 1000);
    const oneMonth = 2630000;
    const oneWeek = 604800;
    const oneMinute = 60;

    before(async () => {})

    beforeEach(async () => {
        staking = await StakingMock.new(true, 100);
        voting = await VotingContract.new(staking.address, 100);
        now = await utils.blockNow();
        nextWeek = now + oneWeek;
        nextMonth = now + oneMonth;
    });

    // test each function
    it.skip("Should do nothing", async () => {
        assert.isTrue(true);
    })

    // refactor 
    // need to create some kind of helper to deal wit
    // check all parameters on new

    it("Should create new proposal with correct properties", async () => {
        // use a data structure to create multple
        // proposals and random results
        const createdProposal = await voting.createIssue('Does this work?', [optionAHex, optionBHex, optionCHex], now, nextWeek);
        const logs = createdProposal.logs[0];

        // check event
        assert.equal(logs.args.endTime, nextWeek);
        assert.equal(logs.args.id, 0);
        assert.equal(logs.args.user, accounts[0]);
        
        const description = await voting.issueDescription(0);
        assert.equal(description, "Does this work?");

        // @todo test indiviudal functions sepaarelt mebs set up two contracts
        // one for journey one for individual functions
        // place directly in to assert when tidying up
        const noOption = await voting.optionDescription(0, 0);
        const optionDescriptionA = await voting.optionDescription(0, 1);
        const optionDescriptionB = await voting.optionDescription(0, 2);

        // assert number of options
        assert.equal(noOption, '');
        assert.equal(optionDescriptionA, optionA);
        assert.equal(optionDescriptionB, optionB);
        // const noOptionB = await voting.optionDescription(0, 3);
   
        // get all descriptions 
        const optionDescriptions = await voting.optionDescriptions(0);
        
        const optionDescriptionsText = optionDescriptions.map(item => web3.toAscii(item).replace(/\u0000/g, ''));
        // @todo assertions
        assert.equal(optionDescriptionsText[1], optionA);
        assert.equal(optionDescriptionsText[2], optionB);
        assert.equal(optionDescriptionsText[3], optionC);
    })

    it("Should cast a vote", async () => {
        
        await voting.createIssue('Does this work?', [optionAHex, optionBHex, optionCHex], now, nextWeek);
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

    // there is no way to enfoce this!!!!???
    // it("Should fail on string exceeding bytes32 length", async () => {
    //     // so there is no way to force number of options
    //     // have to trust in the user
    //     const optionTooLong = '............................................................';
    //     // how the fuck does that wokr!!!
    //     // try moving it earlier....
    //     const optionTooLongHex = web3.toHex(optionTooLong);
    //     const foo = 1;  

    //     try {
    //         const boo = await voting.createIssue('Does this work?', [optionTooLongHex, optionBHex, optionCHex], nextWeek);
    //     }
    //     catch(e) {
    //         const foo = e;
    //     }   

    //     const optionDescriptions = await voting.optionDescriptions(0);
        
    //     const optionDescriptionsText = optionDescriptions.map(item => web3.toAscii(item).replace(/\u0000/g, ''));
    //     // Hmmmmmmm. This is a problem.... There's no way to enforce this.... :/
    //     // What I thought was a good idea turned out to be a bad idea
    //     assert.equal(optionDescriptionsText[1], optionTooLongHex);
    //     assert.equal(optionDescriptionsText[2], optionB);
    //     assert.equal(optionDescriptionsText[3], optionC);
    //     // get options -- see what happens
    // })
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

    // check tallies
    it("Should cast multiple votes on multiple proposals", async () => {
/*        await voting.createIssue('Does this work?', [optionAHex, optionBHex, optionCHex], nextWeek);
        
        // check events fire on each?
        await voting.vote(0, 1, {from: accounts[0]});
        await voting.vote(0, 1, {from: accounts[1]});
        await voting.vote(0, 1, {from: accounts[2]});
        await voting.vote(0, 2, {from: accounts[3]});
        await voting.vote(0, 3, {from: accounts[4]});
        await voting.vote(0, 3, {from: accounts[5]});

        const optionAVotes = await voting.weightedVoteCountsOf(0, 1);
        const optionBVotes = await voting.weightedVoteCountsOf(0, 2);
        const optionCVotes = await voting.weightedVoteCountsOf(0, 3);

        await voting.createIssue('Does this work too?', [optionAHex, optionBHex, optionCHex], nextWeek);

        await voting.vote(1, 1, {from: accounts[0]});
        await voting.vote(1, 2, {from: accounts[1]});
        const foo = await voting.vote(1, 2, {from: accounts[2]});
        foo;
*/
        // checkall the results

        // const optionAVotes = await voting.weightedVoteCountsOf(0, 1);
        // const optionBVotes = await voting.weightedVoteCountsOf(0, 2);
        // const optionCVotes = await voting.weightedVoteCountsOf(0, 3);
        // asserttions
        // check correct weightings
        // do we need to check 
        // perhaps use loops and check weights

        // what other state should w ebe checking
    })

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

    it("Should prevent creation of a poll when inadequate funds staked at end date", async () => {
        
        let inadequateSteak;
        try {
            await voting.createIssue('Does this work?', [optionAHex, optionBHex, optionCHex], now, nextMonth + oneMinute);
        } catch(e) {
            inadequateSteak = e;
        }
        utils.ensureException(inadequateSteak);
    })
})
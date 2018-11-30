const VotingContract = artifacts.require("Voting");
const StakingMock = artifacts.require("StakingMock");

const utils = require('./helpers/Utils.js');

// @todo Mock staking contract
// @todo tidy up exception handling

contract('Voting', function (accounts) {
    let staking, voting; // contracts

    const optionA = 'Yeah, fab.';
    const optionB = 'Nope, fix it.';
    const optionC = 'Dont care.';

    const optionAHex = web3.toHex(optionA);
    const optionBHex = web3.toHex(optionB);
    const optionCHex = web3.toHex(optionC);


    const now = Math.floor(Date.now() / 1000);
    const nextWeek = now + 604800;

    before(async () => {})

    beforeEach(async () => {
        staking = await StakingMock.new(true, 100);
        voting = await VotingContract.new(staking.address);
    });

    // test each function
    it.skip("Should do nothing", async () => {
        assert.isTrue(true);
    })

    // refactor 
    // need to create some kind of helper to deal wit
    // check all parameters on new
    it("Should create new proposal with correct properties", async () => {

        const createdProposal = await voting.createIssue('Does this work?', [optionAHex, optionBHex, optionCHex], nextWeek);
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

/*
        // this will change across propo
        const addressWeight = await voting.weightOf(accounts[0], 0);

        // user places vote
        // how do we stop them placing another vote
        const voted = await voting.vote(0, 1);
        await voting.vote(0, 1, {from: accounts[1]});
        await voting.vote(0, 2, {from: accounts[2]});
        await voting.vote(0, 3, {from: accounts[3]});
        await voting.vote(0, 3, {from: accounts[4]});

        // @todo assert events
        const optionAVotes = await voting.weightedVoteCountsOf(0, 1);
        const optionBVotes = await voting.weightedVoteCountsOf(0, 2);
        
        const ballot = await voting.ballotOf(0, accounts[0]);

        try {
            //const attemptSecondVoteA = await voting.vote(0, 1);
        }
        catch(e) {
            console.log(e);
        }


        // try / catch
        // const attemptSecondVoteB = await voting.vote(0, 2);
        // attempt to vote again


        // weightOf
        // WeightAtEndOf....
        // finalisation
        // should this only declare at the end
        const top = await voting.topOptions(0,3);
        const winning = await voting.winningOption(0);
        // How do we 
        const foo = 1;

        // is there a final winnner
        // so, we could count the ballots at the end
        // and then add the weights
        // better that weights are withdrawn
        // no way of know who has done what -- unless cycling through all of the accounts...

        // user places vote
        // @todo range 0 and above
        // would need to use try catch or pass baxck undefined string


        // should get option for proposal
        // should get all options for proposal
        // no need to store internally as strings

        //    function optionDescription(uint option) external view returns (string desc);
        // get options descriptions

        // assert description
        // assert options
        */
    })


    

    // test what happens at boundary to 32Bytes in string -- we have to make sure that everything fits

    // it should create multiple


    it("Should cast a vote", async () => {
        await voting.createIssue('Does this work?', [optionAHex, optionBHex, optionCHex], nextWeek);
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
        await voting.createIssue('Does this work?', [optionAHex, optionBHex, optionCHex], nextWeek);
        await voting.vote(0, 1, {from: accounts[1]});   
        
        let errVote;
        try {
            await voting.vote(0, 1, {from: accounts[1]});
        } catch(e) {
           errVote = e; 
        }

        utils.ensureException(errVote);
    })


    // check tallies
    it("Should cast multiple votes on multiple proposals", async () => {
        await voting.createIssue('Does this work?', [optionAHex, optionBHex, optionCHex], nextWeek);
        
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

    // @todo should be no winner
    // @todo user votes on multiple polls

    it("Should not vote outside of option range", async () => {

        await voting.createIssue('Does this work?', [optionAHex, optionBHex, optionCHex], nextWeek);
        
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

    it.skip("Should", async () => {
        
    })
})
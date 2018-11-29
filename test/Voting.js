const VotingContract = artifacts.require("Voting");
const StakingMock = artifacts.require("StakingMock");

// @todo Mock staking contract

contract('Voting', function (accounts) {
    let staking, voting; // contracts

    before(async () => {
        
    })


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
    it("Should create new proposal", async () => {
        const optionA = 'Yeah, fab.';
        const optionB = 'Nope, fix it.';
        const optionC = 'Dont care.';

        const optionAHex = web3.toHex(optionA);
        const optionBHex = web3.toHex(optionB);
        const optionCHex = web3.toHex(optionC);


        const now = Math.floor(Date.now() / 1000);
        const nextWeek = now + 604800;

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
        assert.equal(optionDescriptionsText[1], optionA)
        assert.equal(optionDescriptionsText[2], optionB)

        // this will change across propo
        const addressWeight = await voting.weightOf(accounts[0]);

        // user places vote
        // how do we stop them placing another vote
        const voted = await voting.vote(0, 1);
        //await voting.vote(0, 1, {from: accounts[1]});
        await voting.vote(0, 2, {from: accounts[2]});
        await voting.vote(0, 3, {from: accounts[3]});
        await voting.vote(0, 3, {from: accounts[4]});

        // @todo assert events
        const optionAVotes = await voting.weightedVoteCountsOf(0, 1);
        const optionBVotes = await voting.weightedVoteCountsOf(0, 2);
        
        const ballot = await voting.ballotOf(0, accounts[0]);
        // try / catch
        try {
   //         const attemptSecondVoteA = await voting.vote(0, 1);
        }
        catch(e) {
            console.log(e);
        }
        // const attemptSecondVoteB = await voting.vote(0, 2);
        // attempt to vote again


        // weightOf
        // WeightAtEndOf....
        // finalisation
        // should this only declare at the end
        const top = await voting.topOptions(0,3, {gas: 8000000});
        const winning = await voting.winningOption(0);

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




    })

    // test what happens at boundary to 32Bytes in string -- we have to make sure that everything fits

    it.skip("Should have correct description", async () => {
        // @todo move these in to beforeEach
        const optionA = web3.toHex('Yeah, fab.');
        const optionB = web3.toHex('Nope, fix it.');
        //const optionC = web3.toHex('I don\'t care');
        const now = Math.floor(Date.now() / 1000);
        const nextWeek = now + 604800;

        const createdProposal = await voting.createIssue('Does this work?', [optionA, optionB], nextWeek);

        //voting.



    })

    // it should create multiple


    it.skip("Should have correct options", async () => {
        
    })

    it.skip("Should", async () => {
        
    })

    it.skip("Should", async () => {
        
    })

    it.skip("Should", async () => {
        
    })
})
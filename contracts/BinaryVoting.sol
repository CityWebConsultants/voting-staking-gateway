pragma solidity ^0.4.24;

/**
 
 */

import "./token/Staking.sol";
import "./VotingInterface.sol";

// Can remove amount staked from this...
// Need to add to binary version
// @todo update docBlocks
// consider set status 
/**
  (1) Support multiple issues.
  (2) Only Yes / No binary options.
  (3) Start and end time limit on voting.
  (4) Requires minimum stake to create issue.
  (5) Each address can only vote once.
  (6) Each address has different voting weight according to amount staked in external contract.
  
  Perhaps a little over engineered, but is desirable to work with same interface as other voting contract
  */

  // @todo document each function
contract BinaryVoting is VotingInterface {
    StakingInterface stake;

    uint256 minimumStakeToPropose;
    mapping(uint256 => bytes32) voteOptions;

    struct Proposal {
        uint256 votingStarts;
        uint256 votingEnds;
        string issueDescription;
        mapping (uint256 => uint256) weightedVoteCounts;
        mapping (address => uint256) ballotOf_;
    }

    Proposal[] proposals;

    constructor(StakingInterface stakingAddress, uint256 _minimumStakeToPropose) public {
        stake = StakingInterface(stakingAddress);
        minimumStakeToPropose = _minimumStakeToPropose;

        voteOptions[1] = "Yes";
        voteOptions[2] = "No";
    }

    ///@notice create a new issue to vote on
    ///@param _description the question posed
    ///@param _votingStarts timestamp in seconds to open vote
    ///@param _votingEnds timestamp in seconds to close vote
    function createIssue(string _description, uint256 _votingStarts, uint256 _votingEnds)
    public  
    {
        require(_votingStarts < _votingEnds, "End time must be later than start time");
        require(stake.totalStakedForAt(msg.sender, _votingEnds) >= minimumStakeToPropose, "Inadeqaute funds at end date");

        Proposal memory proposal = Proposal(
            _votingStarts, 
            _votingEnds, 
            _description
        );
        proposals.push(proposal);

        emit OnProposal(msg.sender, proposals.length-1, _votingStarts, _votingEnds);
    }

    ///@notice Place a weighted vote on a given proposal
    ///@param _proposalId Proposal ID
    ///@param _option Option to vote for
    function vote(uint256 _proposalId, uint256 _option) 
    public 
    returns (bool success)
    {
        Proposal storage proposal = proposals[_proposalId];
        require(_option == 1 || _option == 2, "Option out of range");
        require(proposal.ballotOf_[msg.sender] == 0, "The sender has already cast their vote."); 
        require(getStatus(_proposalId) == true, "Attempted vote outside of time constraints");

        proposal.ballotOf_[msg.sender] = _option;
        proposal.weightedVoteCounts[_option] += weightOf(_proposalId, msg.sender);

        emit OnVote(msg.sender, _option);
        return true;
    }

    ///@notice Fetch string text of an voting options
    ///@param _proposalId Proposal ID
    ///@param _option Option to return description for
    ///@return string of text if options exists, otherwise empty string
    function optionDescription(uint256 _proposalId, uint256 _option) 
    public
    view 
    returns (string description) 
    {   
        return bytes32ToString(voteOptions[_option]);
    }

    ///@notice Fetch list of option descriptions
    ///@param _proposalId Proposal ID
    ///@return 32 byte array of encoded strings
    function optionDescriptions(uint256 _proposalId) 
    public
    view
    returns (bytes32[3] descriptions) {
        descriptions[1] = voteOptions[1];
        descriptions[2] = voteOptions[2];
        return descriptions;
    }

    ///@notice Not implemented
    function setStatus(uint256, bool) 
    public
    returns (bool) 
    {
        return false;
    }

    ///@notice Fetch option voted on by address on a proposal
    ///@param _proposalId Proposal ID
    ///@param _addr Address of voter
    ///@return integer value of option voted on
    function ballotOf(uint256 _proposalId, address _addr) 
    public 
    view 
    returns (uint option) {
        return proposals[_proposalId].ballotOf_[_addr];
    }

    ///@notice Fetch weight of a given voters vote
    ///@param _proposalId Proposal ID
    ///@param _addr Address of voter
    ///@return Weight of a given voters vote
    function weightOf(uint256 _proposalId, address _addr)
    public 
    view
    returns (uint weight) {
        return stake.totalStakedForAt(_addr, proposals[_proposalId].votingEnds);
    }

    ///@notice Check if proposal is open for voting
    ///@param _proposalId Proposal ID
    ///@return true if voting open, false is closed
    function getStatus(uint256 _proposalId) 
    public 
    view 
    returns (bool isOpen) 
    { 
        //@todo get feedback on less than or less than or equal too
        return (block.timestamp >= proposals[_proposalId].votingStarts && block.timestamp <= proposals[_proposalId].votingEnds);
    }

    ///@notice Fetch description of proposal
    ///@param _proposalId Proposal ID
    ///@return Proposal description
    function issueDescription(uint256 _proposalId)
    public 
    view 
    returns (string description) {
        return proposals[_proposalId].issueDescription;
    }

    ///@notice Fetch aggregate weighted votes for an option of a proposal
    ///@param _proposalId Proposal ID
    ///@return Weighted vote count
    function weightedVoteCountsOf(uint256 _proposalId, uint256 _option) 
    public 
    view 
    returns (uint256 count) 
    {
        return proposals[_proposalId].weightedVoteCounts[_option];
    }

    ///@notice Fetch a given number of voting options ordered by number of weighted votes
    ///@param _proposalId Proposal ID
    ///@param _limit Number of items to return
    function topOptions(uint256 _proposalId, uint256 _limit) 
    public
    view
    returns (uint256[] ordered)
    {    
        //@todo test this limit
        require(_limit <= 2, "Only two options available");
        mapping(uint256 => uint256) voteCounts = proposals[_proposalId].weightedVoteCounts;

        uint256 optionSize = 2;
        uint256[] memory ordinalIndex = new uint256[](_limit);

        for (uint256 i = 0; i < _limit; i++) {
            uint256 highestIndex = 0;
            uint256 acc = 0;
            for (uint256 j = 1; j <= optionSize; j++) {
                if (voteCounts[j] > acc) {
                    highestIndex = j;  
                    acc = voteCounts[highestIndex];
                }
            }
            delete voteCounts[highestIndex]; //solium-disable-line
            ordinalIndex[i] = highestIndex;
        }

        return ordinalIndex;
    }

    ///@notice Get winning options
    ///@param _proposalId Proposal ID
    ///@return Winning optons or 0 is no winner (no votes or tie)
    function winningOption(uint256 _proposalId) 
    public 
    view 
    returns (uint256 winningOptions) 
    {   
        // if 0 zero there is no winning option
        uint256[] memory result = topOptions(_proposalId, 1);
        return result[0];
    }

    ///@notice Fetch all voting options
    ///@param _proposalId Proposal ID. Not used.
    ///@return Numerical list of available options
    function availableOptions(uint256 _proposalId)
    public 
    view
    returns (uint256[])
    {   
        uint256[] memory options = new uint256[](2);
        options[0] = 1;
        options[1] = 2;
        return options;
    }

    ///@notice Convert bytes32 to a string
    ///@param _bytes32 Value to convert
    ///@return Value cast to string
    function bytes32ToString(bytes32 _bytes32) 
    internal
    pure 
    returns (string)
    {
        bytes memory bytesArray = new bytes(32);
        for (uint256 i; i < 32; i++) {
            bytesArray[i] = _bytes32[i];
        }

        string memory ret = string(bytesArray);
           
        return ret; //bytesArray);
    }

    ///@notice Convert string to bytes32
    ///@param _string string to convert
    ///@return A 32Byte number
    function stringToBytes32(string memory _string) 
    internal
    pure
    returns (bytes32 result)
    {
        bytes memory tempEmptyStringTest = bytes(_string);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }

        assembly { //solium-disable-line security/no-inline-assembly
            result := mload(add(_string, 32))
        }
    }

    event OnProposal(address user, uint256 id, uint256 startTime, uint256 endTime);
    event OnVote(address indexed from, uint value);
    event Debug(string str, uint256 num);
}
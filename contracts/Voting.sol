pragma solidity ^0.4.24;

// @todo rename this  doc
/// consider using weightOf instead of line with staked
/// wld need to add that tp 

import "./token/Staking.sol";
import "./VotingInterface.sol";
import "./ownership/Ownable.sol";
/**
  (1) Support multiple issues.
  (2) Supports defining multiple options.
  (3) start and end time limit on voting.
  (4) each address can only vote once.
  (5) each address has different weights according to amount staked in external contract.
  */

contract Voting is VotingInterface, Ownable {
    StakingInterface stake;

    uint256 minimumStake;

    struct Proposal {
        uint256 votingStarts;
        uint256 votingEnds;
        string issueDescription;
        bytes32[] optionDescriptions; // maybe this should be a mapping and we consider 0 to be void
        // do we need to have available options?
        mapping (uint256 => uint256) weightedVoteCounts;
        mapping (address => uint256) ballotOf_;
    }

    Proposal[] proposals;
    
    constructor(StakingInterface _stakingAddress, uint256 _minimumStake) public {
        stake = StakingInterface(_stakingAddress);
        minimumStake = _minimumStake;
        owner = msg.sender;
    }

    ///@notice create a new issue
    ///@param _description variable length string question
    ///@param _optionDescriptions array of options, must be <= 32bytes each 
    ///@param  _votingStarts unix time in seconds to open vote
    ///@param _votingEnds un
    function createIssue(string _description, bytes32[] _optionDescriptions, uint256 _votingStarts, uint256 _votingEnds)
    public
    onlyOwner
    {
        require(_votingStarts < _votingEnds, "End time must be later than start time");
        // Length increased by 1 to allow for first element to used as a zero (null) value
        bytes32[] memory optionDescriptions = new bytes32[](_optionDescriptions.length + 1); 
 
        for (uint256 i = 0; i < _optionDescriptions.length; i++) {
            optionDescriptions[i+1] = _optionDescriptions[i];
        }

        Proposal memory proposal = Proposal(
            _votingStarts, 
            _votingEnds, 
            _description, 
            optionDescriptions
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
        uint256 staked = weightOf(_proposalId, msg.sender);   //stake.totalStakedForAt(msg.sender, proposal.votingEnds); 
        require(staked >= minimumStake, "Inadequate to vote");
        require(_option > 0 && _option < proposal.optionDescriptions.length, "Vote out of range"); 
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
        // Should range be required here 
        if (_option > 0 && _option <= proposals[_proposalId].optionDescriptions.length) {
            return bytes32ToString(proposals[_proposalId].optionDescriptions[_option]); 
        } else {
            return "";
        }
    }

    ///@notice Fetch list of option descriptions
    ///@param _proposalId Proposal ID
    ///@return 32 byte array of encoded strings
    function optionDescriptions(uint256 _proposalId) 
    public
    view
    returns (bytes32[] descriptions) {
        return proposals[_proposalId].optionDescriptions;
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
    ///@return Weighted vote count (options with zero vites)
    function weightedVoteCountsOf(uint256 _proposalId, uint256 _option) 
    public 
    view 
    returns (uint256 count) 
    {
        return proposals[_proposalId].weightedVoteCounts[_option];
    }

    ///@notice Fetch a given number of voted on options ordered by number of weighted votes
    ///@param _proposalId Proposal ID
    ///@param _limit Number of items to return
    function topOptions(uint256 _proposalId, uint256 _limit) 
    public
    view
    returns (uint256[])
    {      
        //@todo in situations of no votes we should return 0;
        // double check how that is handled here?
        //Proposal memory proposal = proposals[_proposalId];
        // @todo explicitly put this in memory!!!!!!
        uint256 optionSize = proposals[_proposalId].optionDescriptions.length-1;
        require(_limit <= optionSize, "Limit greater than number of options"); // <-- @todo test this

        mapping(uint256 => uint256) voteCounts = proposals[_proposalId].weightedVoteCounts;

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
    ///@param _proposalId Proposal ID
    ///@return Numerical list of available options
    function availableOptions(uint256 _proposalId) 
    public 
    view 
    returns (uint256[])
    {   
        uint256 optionSize = proposals[_proposalId].optionDescriptions.length - 1;
        uint256[] memory options = new uint256[](optionSize);
        // what happens in storage versus array, is it ok to allow the return  param to define?
        for(uint256 i = 0; i < optionSize; i++) {
            options[i] = i+1;
        }

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
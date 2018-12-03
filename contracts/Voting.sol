pragma solidity ^0.4.24;

import "./token/Staking.sol";
import "./VotingInterface.sol";

// Any other changes could be considered in a separate contract and the contents of this one migrated over
// add a start time
// allow updating options
// store as a string
// regardless of binary option
// we still need a start and end date
// add functionality to vest 
//  If we want to introduce CRUD aspects then we would also have to add properties for a creator
// Otherewsie anyone could update options
// should this contract be destructable...

// Would  need to add a creator if we wanted to store ... just adds complexity...

/**
  (1) Support multiple issues
  (2) Supports multiple options
  (3) time limit on voting // still to implement
  (4) each address can only vote once.
  (5) each address has different weights according to amount staked in external contract.
  */

  // @todo document each function
contract Voting is VotingInterface {
    StakingInterface stake;

    uint256 minimumStakeToPropose;

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

    // do we assume it starts as soons as published
    constructor(StakingInterface stakingAddress, uint256 _minimumStakeToPropose) public {
        stake = StakingInterface(stakingAddress);
        minimumStakeToPropose = _minimumStakeToPropose;


        // By default we could define yes / no
        // or update options via a selection of strings
        // perhaps give options to delete before started
    }

    // @todo add an event to this
    // could potentially add 1 by 1
    // should there be any scope for destroying contract
    function createIssue(string _description, bytes32[] _optionDescriptions, uint256 _votingStarts, uint256 _votingEnds)
    public // add modifier
    {
        require(_votingStarts < _votingEnds, "End time must be later than start time");
        require(stake.totalStakedForAt(msg.sender, _votingEnds) >= minimumStakeToPropose, "Inadeqaute funds at end date");
        // Length increased by 1 to allow for first element to used as a zero (null) value
        bytes32[] memory optionDescriptions = new bytes32[](_optionDescriptions.length + 1); 
 
        for (uint256 i = 0; i < _optionDescriptions.length; i++) {
            optionDescriptions[i+1] = _optionDescriptions[i];
        }

        Proposal memory proposal = Proposal(_votingStarts, _votingEnds, _description, optionDescriptions);
        proposals.push(proposal);

        emit OnProposal(msg.sender, proposals.length-1, _votingEnds);
    }

    /// @notice Place a weighted vote on a given proposal
    /// @param _proposalId Proposal ID
    /// @param _option Option to vote for
    function vote(uint256 _proposalId, uint256 _option) 
    public 
    returns (bool success) 
    {
        Proposal storage proposal = proposals[_proposalId];
        require(_option > 0 && _option < proposal.optionDescriptions.length, "Vote out of range"); 
        require(proposal.ballotOf_[msg.sender] == 0, "The sender has already cast their vote.");
        require(getStatus(_proposalId) == true, "Attempted vote outside of time constraints");

        proposal.ballotOf_[msg.sender] = _option;
        proposal.weightedVoteCounts[_option] += weightOf(_proposalId, msg.sender);

        emit OnVote(msg.sender, _option);
        return true;
    }

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

    function ballotOf(uint256 _proposalId, address addr) 
    public 
    view 
    returns (uint option) {
        return proposals[_proposalId].ballotOf_[addr];
    }

    function weightOf(uint256 _proposalId, address _addr)
    public 
    view 
    returns (uint weight) {
        return stake.totalStakedForAt(_addr, proposals[_proposalId].votingEnds);
    }

    function getStatus(uint256 _proposalId) 
    public 
    view 
    returns (bool isOpen) 
    {   
        //@todo get feedback on less than or less than or equal too
        return (block.timestamp >= proposals[_proposalId].votingStarts && block.timestamp <= proposals[_proposalId].votingEnds);
    }

    function issueDescription(uint256 _proposalIndex)
    public 
    view 
    returns (string description) {
        return proposals[_proposalIndex].issueDescription;
    }

    function weightedVoteCountsOf(uint256 _proposalId, uint256 _option) 
    public 
    view 
    returns (uint256 count) 
    {
        return proposals[_proposalId].weightedVoteCounts[_option];
    }

    function topOptions(uint256 _proposalId, uint256 _limit) 
    public
    view
    returns (uint256[])
    {   
        //Proposal memory proposal = proposals[_proposalId];
        mapping(uint256 => uint256) voteCounts = proposals[_proposalId].weightedVoteCounts;

        uint256 optionSize = proposals[_proposalId].optionDescriptions.length-1;
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

    function winningOption(uint256 _proposalId) 
    public 
    view 
    returns (uint256 winningOptions) 
    {   
        // require()
        // if 0 zero there is no winning option
        uint256[] memory result = topOptions(_proposalId, 1);
        return result[0];
    }

    // uhm are we breaking re
    // should there be an individaul option too
    // double check this agianst advanced interface
    function availableOptions(uint256 _proposalId) 
    public 
    view 
    returns (uint256[] options)
    {   
        uint256 optionSize = proposals[_proposalId].optionDescriptions.length;
        // uint256[] memory options = new uint256[](optionSize);
        // what happens in storage versus array, is it ok to allow the return param to define?
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

    // to do
    event OnProposal(address user, uint256 id, uint256 endTime);
    event OnVote(address indexed from, uint value);
    event OnStatusChange(bool newIsOpen);
    // when do we check closing conditions
    event Debug(string str, uint256 num);
}
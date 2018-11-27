pragma solidity ^0.4.24;

import "./token/Staking.sol";

// Implementation of EIP1202
// todo: add interface
// todo do not accept funds
// code to call return of tokens

/**
  A simplest vote interface.
  (1) Support multiple issues
  (2) Supports multiple options
  (3) time limit on voting // still to implement
  (4) each address can only vote once.
  (5) each address has different weights according to staking.
  (6) each address may only bote 
  */
contract Voting {
    // should we consider having a fixed candidate list?
    // consider changing ballot of to ballot -- not seen thatuse of undersacore before
    StakingInterface stake;

    struct Proposal {
        bool votingOpen;
        uint256 votingEnds;
        string issueDescription;
        string[] optionDescriptions; // maybe this should be a mapping and we consider 0 to be void
        mapping (uint256 => uint256) weightedVoteCounts;
        mapping (address => uint256) ballotOf_;
    }

    Proposal[] proposals;

    // do we assume it starts as soons as published
    constructor(StakingInterface stakingAddress) public {
        stake = StakingInterface(stakingAddress);
    }

    // @todo add an event to this
    function createIssue( string _description, bytes32[] _optionDescriptions, uint256 _votingEnds)
    public // add modifier
    {
        string[] memory optionDescriptions;
        // Reserve zero as void result
        for (uint256 i = 0; i < _optionDescriptions.length; i++) {
            optionDescriptions[i+1] = bytes32ToString(_optionDescriptions[i]);
        }

        Proposal memory proposal = Proposal(true, _votingEnds, _description, optionDescriptions);
        // check push works when empty
        proposals.push(proposal);
        // Fire event proposal created
    }

    function vote(uint256 _proposalId, uint256 _option) 
    public 
    returns (bool success) 
    {
        Proposal storage proposal = proposals[_proposalId];

        require(_option <= proposal.optionDescriptions.length, "Vote out of range"); 
        require(proposal.ballotOf_[msg.sender] == 0, "The sender has cast proposals.");
        // use has coins staked is implicit but perhaps should use require to make it explicit
        proposal.ballotOf_[msg.sender] = _option;
        proposal.weightedVoteCounts[_option] += weightOf(_proposalId, msg.sender);

        emit OnVote(msg.sender, _option);
        return true;
    }

    ///@notice Not implemented
    function setStatus(bool) 
    public 
    pure 
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
        return stake.availableToUnstakeAt(_addr, proposals[_proposalId].votingEnds);
    }

    function getStatus(uint256 _proposalId) 
    public 
    view 
    returns (bool isOpen) 
    {
        return proposals[_proposalId].votingOpen;
    }

    function weightedVoteCountsOf(uint256 _proposalId, uint256 _option) 
    public 
    view 
    returns (uint count) 
    {
        return proposals[_proposalId].weightedVoteCounts[_option];
    }

    function topOptions(uint256 _proposalId, uint256 _limit) 
    public 
    view 
    returns (uint[]) {
        //Proposal memory proposal = proposals[_proposalId];
        mapping(uint256 => uint256) voteCounts = proposals[_proposalId].weightedVoteCounts;
        uint256 optionSize = proposals[_proposalId].optionDescriptions.length;
        uint256[] memory ordinalIndex;

        for (uint256 i = 0; i <= _limit; i++) {
            uint256 highestIndex;
            uint256 acc = 0;
            for (uint256 j = 0; i < optionSize; j++) {
                if (voteCounts[j] >= acc) {
                    acc = voteCounts[j];
                    highestIndex = j; 
                }
            }
            delete voteCounts[j]; // set to 0
            ordinalIndex[i] = highestIndex;
        }

        return ordinalIndex;
    }

    function winningOption(uint256 _proposalId) 
    public 
    view 
    returns (uint256 winningOptions) 
    {     
        uint256[] memory result = topOptions(_proposalId, 1);
        return result[1];
    }

    // should there be an individaul option too
    // double check this agianst advanced interface
    function availableOptions(uint256 _proposalId) 
    public 
    view 
    returns (bytes32[] optionsBytes32)
    {
        // Does it matter much if we use the same eturn values as use elsewhere
        for (uint256 i = 1; i < proposals[_proposalId].optionDescriptions.length; i++) {
            optionsBytes32[i] = stringToBytes32(proposals[_proposalId].optionDescriptions[i]);
        }
    }

    ///@notice Convert bytes32 to a string
    ///@param _bytes32 Value to convert
    ///@return Value cast to string
    function bytes32ToString(bytes32 _bytes32) 
    public 
    pure 
    returns (string)
    {
        bytes memory bytesArray = new bytes(32);
        for (uint256 i; i < 32; i++) {
            bytesArray[i] = _bytes32[i];
        }
           
        return string(bytesArray);
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
    // event OnProposal();
    event OnVote(address indexed _from, uint _value);
    event OnStatusChange(bool newIsOpen);
}
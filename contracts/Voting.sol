pragma solidity ^0.4.22;

import "./token/Staking.sol";



// describe the functions of this and add the interface
/**
  A simplest vote interface.
  (1) single issue ... should be multiple issues
  (2) only 1 or 2 as the vote option
  (3) time limit on voting
  (4) each address can only vote once.
  (5) each address has different weights.
  */
contract Voting {

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

        require(_option <= proposal.optionDescriptions.length, "Vote out of range"); // must be within range
        require(proposal.ballotOf_[msg.sender] == 0, "The sender has cast proposals."); // no re-vote
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

    function topOptions(uint issueId, uint limit) 
    public 
    view 
    returns (uint[] topOptions_) {

    }

    function winningOption(uint256 _proposalId) 
    public 
    view 
    returns (uint256 winningOptions) 
    {   
        // why does this break?
        // Proposal memory proposal = proposals[_proposalId];

        // cycle through order and return winning proposal

        return 1;
        // cycle through and take the item with the most votes
        // should this be calculated on every
        // We must establish a quorum?
        // Winning number of votes -- what of we want to execute something like uploading a signed message
        // 
        // if (voteCounts[1] >= voteCounts[2]) {
        //     return 1; // in a tie, 1 wins
        // } else {
        //     return 2;
        // }
    }

    function availableOptions() 
    public 
    view 
    returns (uint256 _proposalId, uint256[] options_) 
    {
        // Check the warning we get when we dont have memory
        bytes32[] memory optionsBytes32;
        for (uint256 i = 1; i < proposals[_proposalId].optionDescriptions.length; i++) {
            optionsBytes32[i] = bytes32(proposals[_proposalId].optionDescriptions[i]);
        }

        return optionsBytes32;
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

    ///@ wrapper for sorting
    function sort(uint[] _data) 
    public 
    pure 
    returns(uint[]) 
    {
        quickSort(_data, int(0), int(_data.length - 1));
        return _data;
    }
    
    ///@notice Orders array
    function quickSort(uint256[] memory arr, int left, int right) 
    internal 
    pure 
    {
        int i = left;
        int j = right;
        if(i==j) return;
        uint pivot = arr[uint(left + (right - left) / 2)];
        while (i <= j) {
            while (arr[uint(i)] < pivot) i++;
            while (pivot < arr[uint(j)]) j--;
            if (i <= j) {
                (arr[uint(i)], arr[uint(j)]) = (arr[uint(j)], arr[uint(i)]);
                i++;
                j--;
            }
        }
        
        if (left < j)
        quickSort(arr, left, j);
        if (i < right)
        quickSort(arr, i, right);
    }

    ///@notice Returns index of highest number in array
    function imax(uint256[] _data) 
    public 
    pure
    returns (uint) 
    {
        uint maximal = 0;
        for(uint i;i < _data.length;i++){
            if(_data[i] > _data[maximal]){
                maximal = i;
            }
        }
        return maximal;
    }

    // also need to add a slice to return top values

    event OnVote(address indexed _from, uint _value);
    event OnStatusChange(bool newIsOpen);
}
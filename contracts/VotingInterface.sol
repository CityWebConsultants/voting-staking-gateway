pragma solidity ^0.4.24;

// Adapted from ERC1202 (advanced) draft v2
contract VotingInterface {

    function vote(uint issueId, uint option) public returns (bool success);
    function setStatus(uint issueId, bool isOpen) public returns (bool success);

    function issueDescription(uint issueId) public view returns (string desc);
    function availableOptions(uint issueId) public view returns (uint[] options);
    function optionDescription(uint issueId, uint option) public view returns (string desc);
    function ballotOf(uint issueId, address addr) public view returns (uint option);
    function weightOf(uint issueId, address addr) public view returns (uint weight);
    function getStatus(uint issueId) public view returns (bool isOpen);
    function weightedVoteCountsOf(uint issueId, uint option) public view returns (uint count);
    function topOptions(uint issueId, uint limit) public view returns (uint[] topOptions_);

    event OnProposal(address user, uint256 id, uint256 startTime, uint256 endTime);
    event OnVote(uint issueId, address indexed _from, uint _value);
}
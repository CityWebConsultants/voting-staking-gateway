pragma solidity ^0.4.24;

// ERC1202
interface VotingInterface {
    // @todo mark as external

    // Vote with an option. The caller needs to handle success or not
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

    event OnVote(uint issueId, address indexed _from, uint _value);
    event OnStatusChange(uint issueId, bool newIsOpen);

    // function vote(uint option) external returns (bool success);
    // function setStatus(bool isOpen) external returns (bool success);

    // function issueDescription() external view returns (string desc);
    // function availableOptions() external view returns (uint[] options);
    // // this should return the size of array
    // // we kind of broken this by not using a map to describe
    // // but don't see why we need to
    // // actually we can pass back a single string here and cast it
    // // can also add another function to return all issue descriptions
    
    // function optionDescription(uint option) external view returns (string desc);
    // function ballotOf(address addr) external view returns (uint option);
    // function weightOf(address addr) external view returns (uint weight);
    // function getStatus() external view returns (bool isOpen);
    // function weightedVoteCountsOf(uint option) external view returns (uint count);
    // function winningOption() external view returns (uint option);

    // event OnVote(address indexed _from, uint _value);
    // event OnStatusChange(bool newIsOpen);
}
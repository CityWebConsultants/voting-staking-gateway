pragma solidity ^0.4.24;

interface ERC1202 {

    // Vote with an option. The caller needs to handle success or not
    function vote(uint option) external returns (bool success);
    function setStatus(bool isOpen) external returns (bool success);

    function issueDescription() external view returns (string desc);
    function availableOptions() external view returns (uint[] options);
    function optionDescription(uint option) external view returns (string desc);
    function ballotOf(address addr) external view returns (uint option);
    function weightOf(address addr) external view returns (uint weight);
    function getStatus() external view returns (bool isOpen);
    function weightedVoteCountsOf(uint option) external view returns (uint count);
    function winningOption() external view returns (uint option);

    event OnVote(address indexed _from, uint _value);
    event OnStatusChange(bool newIsOpen);
}
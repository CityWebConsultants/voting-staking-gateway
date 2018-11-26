pragma solidity ^0.4.22;

import "./token/Staking.sol";

/**
  A simplest vote interface.
  (1) single issue ... should be multiple issues
  (2) only 1 or 2 as the vote option
  (3) time limit on voting
  (4) each address can only vote once.
  (5) each address has different weights.
  */
contract SimplestVote1202 {

    StakingInterface stake;

    uint[] options = [1, 2];
    mapping(uint => string) internal optionDescMap;
    mapping (uint => uint) private voteCounts;
    mapping (address => uint) private ballotOf_;

    uint256 ballotEnds;
    bool ballotOpen;
    string description;

    constructor(StakingInterface stakingAddress, string _description, uint256 _ballotEnds) public {
        // No good reason not to have multiple options
        // can we pass in an array of bytes32 <--- forces to fit in that length
        // or can we pass in an array of strings
        // 0 is the description
        // and assign the rest to an array
        // how many people have to participate
        // binary is simply the most votes between 2
        // be better to do quadratic voting
        // options
        // Should be able to pass in one or two or more
        optionDescMap[1] = "Yes";
        optionDescMap[2] = "No";

        description = _description;
        ballotEnds = _ballotEnds;

        stake = StakingInterface(stakingAddress);
    }

    // Should store result and kill
    // Shoudl we actually make thi smore flexible 
    function vote(uint256 option, uint256 ends) public 
        returns (bool success) {    
        require(option == 1 || option == 2, "Vote option has to be either 1 or 2.");
        require(ballotOf_[msg.sender] == 0, "The sender has casted ballots."); // no re-vote
        ballotOf_[msg.sender] = option;

        // assert coins are staked until after the end of the vote
        // doesn't handle being able to rollback
        // not sure how best to implement
        // so presuambely should remain being one rather than hav vote tallied -- what s the benefit of that
        voteCounts[option] = voteCounts[option] += weightOf(msg.sender);
        // do we really only care about 
        emit OnVote(msg.sender, option);
        return true;
    }

    function setStatus(bool /*isOpen*/) public pure returns (bool success) {
        return false;
        // if (now > ballotEnds) {
        //     isOpen =
        // require(false); // always public status change in this implementation
        // return false;
    }

    function ballotOf(address addr) public view returns (uint option) {
        return ballotOf_[addr];
    }

    function weightOf(address addr) 
    public 
    view 
    returns (uint weight) {
        return stake.availableToUnstakeAt(addr, ballotEnds);
    }

    function getStatus() public view returns (bool isOpen) {
        return ballotOpen; 
    }

    function weightedVoteCountsOf(uint option) public view returns (uint count) {
        return voteCounts[option];
        // ah actually this is ok because there is no weighted votes of
    }

    function winningOption() public view returns (uint option) {

        if (voteCounts[1] >= voteCounts[2]) {
            return 1; // in a tie, 1 wins
        } else {
            return 2;
        }
    }

    function issueDescription() public pure returns (string desc) {
        return "Should we make John Smith our CEO?";
    }

    function availableOptions() public view returns (uint[] options_) {
        return options;
    }

    function optionDescription(uint option) public view returns (string desc) {
        return optionDescMap[option];
    }

    event OnVote(address indexed _from, uint _value);
    event OnStatusChange(bool newIsOpen);
}
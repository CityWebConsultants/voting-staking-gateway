pragma solidity ^0.4.23;

import "./ownership/Ownable.sol";
import "./GatewayERC20Contract.sol";

contract Presale {
    address public beneficiary;
    address public techFund;
    uint public fundingGoal;
    uint public amountRaised;
    uint public deadline;
    uint public startTime;
    uint public price;
    uint public minimumSpend;
    mapping(address => uint256) public balanceOf;
    bool fundingGoalReached = false;
    bool crowdsaleClosed = false;

    GatewayERC20Contract tokenContract;

    event GoalReached(address recipient, uint totalAmountRaised);
    event FundTransfer(address backer, uint amount, bool isContribution);


// should have 'stop' / 'start' flags ?

    /**
     * Constructor function
     *
     * Setup the owner
     */
    constructor(
        address addressOfTokenUsedAsReward,
        address ifSuccessfulSendTo,
        address ifSuccessfulSendToTech,
        uint fundingGoalInEthers,
        uint durationInMinutes,
        uint etherCostOfEachToken,
        uint _minimumSpend
    ) public {
        tokenContract = GatewayERC20Contract(addressOfTokenUsedAsReward);
        startTime = now;
        beneficiary = ifSuccessfulSendTo;
        techFund = ifSuccessfulSendToTech;
        fundingGoal = fundingGoalInEthers * 1 ether;
        deadline = now + durationInMinutes * 1 minutes;
        price = etherCostOfEachToken * 1 wei;
        minimumSpend = _minimumSpend * 1 finney;
    }

    function getTokenContractAddress() public view returns(address){
            return tokenContract;
        }

    /**
     * Fallback function
     *
     * The function without name is the default function that is called whenever anyone sends funds to a contract
     */
    function () payable public {
        require(!crowdsaleClosed);
        require(msg.value > minimumSpend);
        uint amount = msg.value;
        balanceOf[msg.sender] += amount;
        amountRaised += amount;
        uint discount = getRate(amount);
        tokenContract.transfer(msg.sender, discount / price);

        //tokenContract.transfer(msg.sender, amount / price);
        emit FundTransfer(msg.sender, discount, true);
    }

    modifier afterDeadline() { if (now >= deadline) _; }

    /**
     * Check if goal was reached
     *
     * Checks if the goal or time limit has been reached and ends the campaign
     */
    function checkGoalReached() public afterDeadline {

        uint balance = tokenContract.balanceOf(address(this));

        if (balance <= 0){
            fundingGoalReached = true;
            emit GoalReached(beneficiary, amountRaised);
        }
        crowdsaleClosed = true;
    }

    /**
    * Check balance
    */
    function balance() public view returns (uint) {
      return amountRaised;
    }


    /**
     * Withdraw the funds
     *
     * Checks to see if goal or time limit has been reached, and if so, and the funding goal was reached,
     * sends the entire amount to the beneficiary. If goal was not reached, each contributor can withdraw
     * the amount they contributed.
     */
    function safeWithdrawal() public afterDeadline {
        if (!fundingGoalReached) {
            uint amount = balanceOf[msg.sender];
            balanceOf[msg.sender] = 0;
            if (amount > 0) {
                if (msg.sender.send(amount)) {
                   emit FundTransfer(msg.sender, amount, false);
                } else {
                    balanceOf[msg.sender] = amount;
                }
            }
        }

        if (fundingGoalReached && beneficiary == msg.sender) {
            if (beneficiary.send(amountRaised / 3) && techFund.send(amountRaised / 4)) {
               emit FundTransfer(beneficiary, amountRaised / 3, false);
               emit FundTransfer(beneficiary, amountRaised / 4, false);
            } else {
                //If we fail to send the funds to beneficiary, unlock funders balance
                fundingGoalReached = false;
            }
        }
    }

    function getRate(uint _amount) constant internal returns(uint) {
        if (startTime + 1 weeks > now) {
                return _amount * 2; //number of tokens in week 1
        //} else if (startTime + 2 weeks > now) {
        //        return 750; //number of tokens in week 2
        //} else if (startTime + 3 weeks > now) {
        //        return 500; //number of tokens in week 3
        } else {
                return _amount + ((_amount / 10) * 3);
        }
      }
}
pragma solidity ^0.4.24;

/**
 * Manage a list of accounts due refund.
 */

import "../ownership/Ownable.sol";

contract RefundList is Ownable {

    mapping(address => bool) private list;
 
    constructor() 
    public
    {
        owner = msg.sender;
    }
    ///@notice Add an account to list
    ///@param _address account address to add
    function addAddress(address _address) 
    public 
    onlyOwner
    {
        list[_address] = true;
        emit RefundStatus(_address, true);
    }

    ///@notice Remove an account from list
    ///@param _address account to remove
    function removeAddress(address _address) 
    public
    onlyOwner
    {   
        list[_address] = false;
        emit RefundStatus(_address, false);
    }

    ///@notice Get current state of an account
    ///@param _address account to check
    ///@return bool True if address listed, otherwise false
    function getAddressStatus(address _address)
    public
    view
    returns(bool)
    {
        return list[_address];
    }

    event RefundStatus(address account, bool refund);
}
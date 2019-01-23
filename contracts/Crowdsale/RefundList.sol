pragma solidity ^0.4.24;

import "../ownership/Ownable.sol";

contract RefundList is Ownable {

    mapping(address => bool) private list;
 
    constructor() 
    public
    {
        owner = msg.sender;
    }

    function addAddress(address _address) 
    public 
    onlyOwner
    {
        list[_address] = true;
        emit RefundStatus(_address, true);
    }

    function removeAddress(address _address) 
    public
    onlyOwner
    {   
        list[_address] = false;
        emit RefundStatus(_address, false);
    }

    function getAddressStatus(address _address)
    public
    view
    returns(bool)
    {
        return list[_address];
    }

    event RefundStatus(address _address, bool refundUser);
}
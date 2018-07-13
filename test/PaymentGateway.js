var PaymentGatewayContract = artifacts.require("PaymentGatewayContract");

var test_merchantAddress = "0xF86e64c759829AD2c9cd9a85406d98D2d820F21B";

contract('PaymentGatewayContract',  function(accounts){
    it("Given a valid address, should add merchant to contract", function(){
        return PaymentGatewayContract.deployed().then(function(instance){
            try{
                instance.addMerchant(test_merchantAddress);
                return true;
            }
            catch(error){
                return false;
            }
        });
    });

    it("Given an incorrect address, should fail adding merchant", function(){
        return PaymentGatewayContract.deployed().then(function(instance){
            try{
                instance.addMerchant("INCORRECTADDRESS");
                return false;
            }
            catch(error){
                return true;
            }
        });
    });
}); 



var Migrations = artifacts.require("./Migrations.sol");
var PaymentGatewayContract = artifacts.require("./PaymentGatewayContract.sol");
var GatewayERC20Contract = artifacts.require("./GatewayERC20Contract.sol");
var Presale = artifacts.require("./Presale.sol");

var gatewayFee = 4;
var gatewayBeneficiary = '0x05f00bbd02658561442165456bef7eaa49a950ac'; // test admin address
var techFundAddr = '0x3c0516a1b90c0de455b34895dfca7ed0ee09f626'; // test tech fund address
var totalEthToRaise = 10000;
var saleDurationInMins = 99999;
var tokenCostInEth = 2600; // $0.75 = 2600 szabo ?
var minimumSpend = 340; // $100 = 340 finney ?

module.exports = function(deployer) {  
  deployer.deploy(Migrations);
  var gateway;
  deployer.deploy(PaymentGatewayContract, gatewayFee, gatewayBeneficiary).then((g) => {
    gateway = g;
    return deployer.deploy(GatewayERC20Contract, gateway.address, 420000000, "BUD", "eBudz utility token");
  }).then((erc20) => {

    deployer.deploy(Presale, erc20.address, gatewayBeneficiary, techFundAddr, totalEthToRaise, saleDurationInMins, tokenCostInEth, minimumSpend);
    return gateway.setTokenContract(erc20.address);

  });

/*  deployer.deploy(Migrations);
  var gateway;
  deployer.deploy(PaymentGatewayContract).then((g) => {
    gateway = g;
    return gateway.setTokenContract('0xf75efb606f6b0d5ed997365f86d30f40c917af0c');
  });*/
};
var Migrations = artifacts.require("./Migrations.sol");
var PaymentGatewayContract = artifacts.require("./PaymentGatewayContract.sol");
var GatewayERC20Contract = artifacts.require("./GatewayERC20Contract.sol");

module.exports = function(deployer) {  
  deployer.deploy(Migrations);
  var gateway;
  deployer.deploy(PaymentGatewayContract).then((g) => {
    gateway = g;
    return deployer.deploy(GatewayERC20Contract, gateway.address, 420000000, "BUD", "eBudz utility token");
  }).then((erc20) => {
    return gateway.setTokenContract(erc20.address);
  });

/*  deployer.deploy(Migrations);
  var gateway;
  deployer.deploy(PaymentGatewayContract).then((g) => {
    gateway = g;
    return gateway.setTokenContract('0xf75efb606f6b0d5ed997365f86d30f40c917af0c');
  });*/
};
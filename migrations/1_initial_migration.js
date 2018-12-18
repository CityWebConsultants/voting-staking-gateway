var Migrations = artifacts.require("./Migrations.sol");
var PaymentGatewayContract = artifacts.require("./PaymentGatewayContract.sol");
var GatewayERC20Contract = artifacts.require("./GatewayERC20Contract.sol");
var Crowdsale = artifacts.require("./Crowdsale.sol");
var Staking = artifacts.require('./Staking.sol');

var gatewayFee = 4;
var gatewayBeneficiary = '0x05f00bbd02658561442165456bef7eaa49a950ac'; // test admin address
var techFundAddr = '0x3c0516a1b90c0de455b34895dfca7ed0ee09f626'; // test tech fund address
var totalEthToRaise = 10000;
var saleDurationInMins = 99999; 
var tokenCostInEth = 2600; // $0.75 = 2600 szabo ?
var minimumSpend = 340; // $100 = 340 finney ?

module.exports = function(deployer) {  
  //const foo = await deployer.deploy(Migrations);
  console.log('1')
   return deployer.deploy(PaymentGatewayContract, gatewayFee, gatewayBeneficiary)
   .then((gateway) =>{
      return deployer.deploy(GatewayERC20Contract, gateway.address, '420000000', "BUD", "eBudz utility token")
      .then((erc20) => {
        deployer.deploy(Staking, erc20.address);
        return deployer.deploy(
          Crowdsale, 
          erc20.address, 
          gatewayBeneficiary, 
          techFundAddr, 
          totalEthToRaise, // do we need totalEthToRaise if there is a finite amount to distibute?
          saleDurationInMins, 
          tokenCostInEth, 
          minimumSpend);
      })
      .then((crowdale) => {
      // return deployer.deploy(Staking, erc20.address);
      })
   })
   //console.log(gateway)
  //  const erc20 = await deployer.deploy(GatewayERC20Contract, gateway.address, '420000000', "BUD", "eBudz utility token");
  // console.log(erc20)

  // const presale = await  deployer.deploy(
  //   Presale, 
  //   erc20.address, 
  //   gatewayBeneficiary, 
  //   techFundAddr, 
  //   totalEthToRaise, // do we need totalEthToRaise if there is a finite amount to distibute?
  //   saleDurationInMins, 
  //   tokenCostInEth, 
  //   minimumSpend);
  //   const stakingWallet = await deployer.deploy(Staking, '0x1');
  //   console.log(stakingWallet)

/*
  deployer.deploy(PaymentGatewayContract, gatewayFee, gatewayBeneficiary).then((g) => {
    gateway = g;
    // do we need to return here?
    return deployer.deploy(GatewayERC20Contract, gateway.address, 420000000, "BUD", "eBudz utility token");
  }).then((erc20) => {
    deployer.deploy(
      Presale, 
      erc20.address, 
      gatewayBeneficiary, 
      techFundAddr, 
      totalEthToRaise, // do we need totalEthToRaise if there is a finite amount to distibute?
      saleDurationInMins, 
      tokenCostInEth, 
      minimumSpend)
      deployer.deploy(Staking, erc20.address);
      //return gateway.setTokenContract(erc20.address);
     
    //return gateway.setTokenContract(erc20.address);
  });

/*  deployer.deploy(Migrations);
  var gateway;
  deployer.deploy(PaymentGatewayContract).then((g) => {
    gateway = g;
    return gateway.setTokenContract('0xf75efb606f6b0d5ed997365f86d30f40c917af0c');
  });*/
};
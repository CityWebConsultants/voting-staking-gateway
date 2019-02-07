var Migrations = artifacts.require("./Migrations.sol");
var PaymentGatewayContract = artifacts.require("./PaymentGatewayContract.sol");
var GatewayERC20Contract = artifacts.require("./GatewayERC20Contract.sol");
var Crowdsale = artifacts.require("./Crowdsale.sol");
var Staking = artifacts.require('./Staking.sol');
var Voting = artifacts.require('./Voting.sol');

const BN = require('bignumber.js');
var gatewayFee = 4;

//@todo derive this from env
var gatewayBeneficiary = '0x05f00bbd02658561442165456bef7eaa49a950ac'; // test admin address
var techFundAddr = '0x3c0516a1b90c0de455b34895dfca7ed0ee09f626'; // test tech fund address
var totalEthToRaise = 10000;
// ethToRaise
// put this stuff in to env

// let signer1, signer2, signer3;

// signer1 = web3.eth.accounts[0];
// signer2 = accounts[1];
// signer3 = accounts[2];
// check which network we are using to establish signers
signers = ['0x3fAbE74712f7CBaEd335BA7b60C3493Fc16c7BdB'
          ,'0x5C3356216a5AF404486f1a98A2c1C5AB68d95499' 
          ,'0xAE6C0b574524Aa57425C2dda4B913A876b1B71D1']

//@todo define what we are going to deplyu and when!
// @todo this needs defined
const day = new BN('86400');
const startTime = new BN(web3.eth.getBlock(web3.eth.blockNumber).timestamp);
const endTime = startTime.plus(day.times(30));
  
// these values need fixed...
// check where we are ... do we have outstanding things merge
var tokenCostInEth = 2600; // $0.75 = 2600 szabo ?
var minimumSpend = 340; // $100 = 340 finney ?
// token cost an min spend
let tokenAddress;

module.exports = (deployer) => {
  
  // truffle test runs this ok, wtf is going on?
  // deployer.then(async () => {
  //   await deployer.deploy(GatewayERC20Contract, '0x0', '4200000000000000000', "BUD", "eBudz utility token")
  //   const e = await GatewayERC20Contract.deployed();
  //   console.log(e.address)

  //   await deployer.deploy(PaymentGatewayContract, gatewayFee, gatewayBeneficiary)
  //   const f = await PaymentGatewayContract.deployed();
  //   console.log(f.address)
  // })


  //const foo = await deployer.deploy(Migrations);
  // console.log('1')
  // so if we change this to async await
  //console.log()
  //throw('foo');
  // const gateway = await deployer.deploy(PaymentGatewayContract, gatewayFee, gatewayBeneficiary)

  
  //const erc20 = await deployer.deploy(GatewayERC20Contract, '0x0', '4200000000000000000', "BUD", "eBudz utility token")
  
  // console.log(gateway)
  //console.log(erc20)

  // @todo separate out deployments so we can deploy contracts separately when not testing
// @todo merchant
   deployer.deploy(PaymentGatewayContract, gatewayFee, gatewayBeneficiary)
   .then((gateway) => {
      return deployer.deploy(GatewayERC20Contract, gateway.address, '4200000000000000000', "BUD", "eBudz utility token")
      .then((erc20) => {
        tokenAddress = erc20.address;
        // costs over 4.1M Gas  :/
        return deployer.deploy(Staking, tokenAddress, signers, '2')
        .then((staking) => {
          return deployer.deploy(Voting, staking.address);
        })
        // whats the voting param?
        // return deployer.deploy(
        //   Crowdsale, 
        //   erc20.address, 
        //   gatewayBeneficiary, 
        //   techFundAddr, 
        //   totalEthToRaise,
        //   startTime,
        //   endTime, 
        //   tokenCostInEth, // this should be in wei!!!!!!!!!!!
        //   minimumSpend);
      })
  //     .then((crowdsale) => {
  //     // return deployer.deploy(Staking, erc20.address);
  //     })
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
/*
 * Helper to add data to blockchain without having to go through truffle.
 */

//@todo transfer Tokens
//@todo stake Tokens
//@todo vote on something

const { staking, voting, token, infuraKey, contractOwner, contractOwnerPrivateKey, seed } = require(__dirname + '../../../app-config.js');
const Web3 = require('web3');
const sign = require('ethjs-signer').sign;
const HookedWeb3Provider = require("hooked-web3-provider");
const Accounts = require('../helpers/accounts.js');
const accounts = new Accounts(seed)
const BigNumber = require('bignumber.js');
BigNumber.config({ DECIMAL_PLACES: 0})

const alice = accounts.getAddress(1);

const provider =  new HookedWeb3Provider({
    // host: "http://localhost:8545",
    host: "https://rinkeby.infura.io/v3/" + infuraKey,
    transaction_signer: { // consider creating own transaction signer object against a seed
      hasAddress: (address, cb) => cb(null, accounts.getPrivateKeyFromAddress(address) !== null), // @todo add check for exists
      signTransaction: (rawTx, cb) => cb(null, sign(rawTx, '0x' + accounts.getPrivateKeyFromAddress(rawTx.from))),
    },
  });

const web3 = new Web3(provider);

const stakingArtifacts = require('../../build/contracts/Staking.json')
const votingArtifacts = require('../../build/contracts/Voting.json')
const tokenArtifacts = require('../../build/contracts/GatewayERC20Contract.json')

const promisify = inner =>
  new Promise((resolve, reject) =>
    inner((err, res) => {
      if (err) { reject(err) }
      resolve(res);
    })
  );

const hydrate = async () => {

    try {
        const tokenInstance = web3.eth.contract(tokenArtifacts.abi).at(token)
        const stakingInstance = web3.eth.contract(stakingArtifacts.abi).at(staking)
        const votingInstance = web3.eth.contract(votingArtifacts.abi).at(voting)

        const result = await promisify(cb => tokenInstance.transfer(alice, new BigNumber('100'), {from: contractOwner, gasPrice: 30000000, gas: 300000}, cb));
        console.log('txHash: ', result)
    }
    catch(e) {
        console.error(e);
    }
}

hydrate();


// const proxiedWeb3Handler = {
//     // override getter                               
//     get: (target, name) => {              
//       const inner = target[name];                            
//       if (inner instanceof Function) {                       
//         // Return a function with the callback already set.  
//         return (...args) => promisify(cb => inner(...args, cb));                                                         
//       } else if (typeof inner === 'object') {                
//         // wrap inner web3 stuff                             
//         return new Proxy(inner, proxiedWeb3Handler);         
//       } else {                                               
//         return inner;                                        
//       }                                                      
//     },                                                       
//   };                                                         
// const proxiedWeb3 = new Proxy(web3, proxiedWeb3Handler);
// const utils = require('../helpers/Utils.js');


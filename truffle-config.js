// web3 = require('web3');
// console.log(web3)
// A bug in 
const { infuraKey, contractOwner, contractOwnerPrivateKey, seed } = require(__dirname + '/app-config.js');
// const SignerProvider = require('ethjs-provider-signer');
const sign = require('ethjs-signer').sign;
const HookedWeb3Provider = require("hooked-web3-provider");
// const Eth = require('ethjs-query');
// we could simplly create a new provider and populate the from field
// that should default
// console.log(infuraKey)
// console.log(seed)
// const HDWalletProvider = require("truffle-hdwallet-provider");

// const HDWalletProvider = require("'@machinomy/hdwallet-provider'");

// const PrivateKeyProvider = require("truffle-privatekey-provider");
//const provider = Promise.resolve(async () => new PrivateKeyProvider(contractOwnerPrivateKey, "https://rinkeby.infura.io/v3/" + infuraKey))
// const seed = 'peanut grocery material tenant soccer love stereo trial leader mask sunny great'
// let mnemonic = "hollow reduce afford gaze blast oak entire essence fantasy man industry donkey six left avocado";
module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*",
      gas: 5000000,
    },
    rinkebyLocal: {
      provider: () => new HookedWeb3Provider({
        host: "http://localhost:8545",
        transaction_signer: {
          hasAddress: (address, cb) => cb(null, true),
          signTransaction: (rawTx, cb) => cb(null, sign(rawTx, '0x' + contractOwnerPrivateKey)),
        }
      }),
      network_id: "4",
      gas : 5000000,
      from: contractOwner,
      //gasPrice: 20000000,
    },
    // rinkebyLocal2: {
    //   provider: () => {
    //     return new HDWalletProvider("peanut grocery material tenant soccer love stereo trial leader mask sunny great", "https://rinkeby.infura.io/v3/" + infuraKey);
    //   },
    //   network_id: "4",
    //   gas : 4200000,
    //   from: contractOwner,
    //   //gasPrice: 20000000,
    // },
    ropstenInfura: {
      // host: "https://ropsten.infura.io/v3/" + infuraKey,
      // provider: provider,
      // provider: async () => await new PrivateKeyProvider(contractOwnerPrivateKey, "https://rinkeby.infura.io/v3/" + infuraKey),
      // provider: new HDWalletProvider(seed, "https://rinkeby.infura.io/v3/" + infuraKey),
      // provider: new HDWalletProvider(seed, "HTTP://127.0.0.1:7545"),
      // provider: new SignerProvider( "https://rinkeby.infura.io/v3/" + infuraKey, {
      //   provider: new SignerProvider( "http://localhost:7545", {
      //             signTransaction: (rawTx, cb) => cb(null, sign(rawTx, '0x' + contractOwnerPrivateKey)),
      //             hasAddress: (addr, cb) => cb(null, true)
      //             // accounts: (cb) => cb(null, [contractOwner]),
      //             // may need to addtionally implement, has address 
      //             // do we have to implement send?
      // }),
      provider: () => new HookedWeb3Provider({
        //host: "http://localhost:8545",
        host: "https://ropsten.infura.io/v3/" + infuraKey,
        transaction_signer: {
          hasAddress: (address, cb) => cb(null, true),
          signTransaction: (rawTx, cb) => cb(null, sign(rawTx, '0x' + contractOwnerPrivateKey)),
        }
      }),
      network_id: "4",
      gas : 5000000,
      from: contractOwner,
      //gasPrice: 20000000,
    },
    ropsten: {
      provider: async () => {
        return await new HDWalletProvider(seed, "https://ropsten.infura.io/v3/" + infuraKey)
      },
      network_id: 3,
      gas: 5000000      //make sure this gas allocation isn't over 4M, which is the max
    },
  },
  

  compilers: {
    solc: {
      version: "0.4.24"
    }
  }
};

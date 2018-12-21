let HDWalletProvider = require("truffle-hdwallet-provider");
let mnemonic = 'peanut grocery material tenant soccer love stereo trial leader mask sunny great'
// let mnemonic = "hollow reduce afford gaze blast oak entire essence fantasy man industry donkey six left avocado";
module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*",
      gas: 3000000,
   //   from: '0x3fabe74712f7cbaed335ba7b60c3493fc16c7bdb'
    },
    rinkeby: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "https://rinkeby.infura.io/v3/e418fc96660e461ba2979615bc2269ad")
      },
      network_id: 4,
      gas: 6712390,
      gasPrice: 2000000000000,
    }
  },
  compilers: {
    solc: {
      version: "^0.4.15"
    }
  }
};

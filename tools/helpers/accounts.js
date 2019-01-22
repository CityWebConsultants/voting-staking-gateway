const Web3 = require('web3');
const bip39 = require('bip39');
const hdkey = require('ethereumjs-wallet/hdkey');
const web3  = new Web3();

class Accounts {

  constructor(seed) {
      this.seed = seed.trim();
      this.path = "m/44'/60'/0'/0/";
      this.hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(this.seed));
  }

  getSeed() {
    return this.seed;
  }

  getWallet(index) {
    return this.hdwallet.derivePath(this.path + index).getWallet();
  }

  getPrivateKey(index) {
    return this.getWallet(index).getPrivateKey().toString('hex');
  }

  getAddress(index) {
    return '0x' + this.getWallet(index).getAddress().toString('hex');
  }

  getPrivateKeyFromAddress(address, accounts = 100) {

    for(let i=0; i<accounts; i++) {
      console.log(this.path+i)
        if (this.getAddress(i).toLowerCase() === address.toLowerCase()) {
            console.log('pvt: ', this.getPrivateKey(i))
            return this.getPrivateKey(i);
        }
    }
    return null;
  }
}

module.exports = Accounts;
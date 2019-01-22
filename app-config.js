const dotenv = require('dotenv');
dotenv.config({path: __dirname + '/app-config.env'});

// @todo add account 0 etc....
const v = process.env
// change these to v.SEED etc...
module.exports = {
  seed: process.env.SEED,
  maxGas: process.env.MAXGAS,
  infuraKey: process.env.INFURAKEY,
  contractOwner: process.env.CONTRACTOWNER,
  contractOwnerPrivateKey: process.env.CONTRACTOWNERPRIVATEKEY,
  token: process.env.TOKEN,
  staking: process.env.STAKING,
  voting: process.env.VOTING,
  sale:  process.env.SALE
};
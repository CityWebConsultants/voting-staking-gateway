require('dotenv').config()
// import {networks} from '../../../truffle-config.js'

// @todo make this more flexible
// options to derive from latest settings in truffle
// defaults etc...
// For the moment we just want
namespace EthPaymentGatewayConfig{
// amend this to get latest truffle values if a network name is passed
    export const config =  {
        networkId: process.env.NETWORKID,
        networkName: process.env.NETWORKNAME,
        ethNodeUrl: process.env.ETHNODEURL,
        ethNodeWsUrl: process.env.ETHNODEWSURL,
        gasPrice: process.env.GASPRICE,
        gas: process.env.GAS,
        seed: process.env.SEED,
        owner: process.env.CONTRACTOWNER,
        tokenContractAddress: process.env.TOKENCONTRACTADDRESS,
        merchantContractAddress: process.env.MERCHANTCONTRACTADDRESS,
        presaleContractAddress: process.env.PRESALECONTRACTADDRESS
    }
//export {config}
}


// const config = () => {
//     return {
//         networkId: process.env.NETWORKID,
//         networkName: process.env.NETWORKNAME,
//         ethNodeUrl: process.env.ETHNODEURL,
//         ethNodeWsUrl: process.env.ETHNODEWSURL,
//         gasPrice: process.env.GASPRICE,
//         gas: process.env.GAS,
//         seed: process.env.SEED,
//         owner: process.env.CONTRACTOWNER,
//         tokenContractAddress: process.env.TOKENCONTRACTADDRESS,
//         merchantContractAddress: process.env.MERCHANTCONTRACTADDRESS,
//         presaleContractAddress: process.env.PRESALECONTRACTADDRESS
//     }
// }

// export {config}


/*
const tokenArtifacts =  require('../../../build/contracts/PaymentGatewayContract.json')
const merchantArtifacts = require('../../../build/contracts/GatewayERC20Contract.json')
const presaleArtifacts = require('../../../build/contracts/PreSale.json')

const contractNames = ['someName', 'someName', 'someName'];
*/
// so the artifacts don't actually help that much...
// tidy this up and make it nice....
// kind of wishing i hadn't started refactoring this
// but toally ridiculous having to redo everytime
// is there any good reason to keep 15 work mnemonic
/*
export class ConfigFactory {

    getConfig() {
        return {
            networkName: 'develop'
        }
    }

*/
    // so perhaps it would be better to write a script 
    // how can we have two sets of env vars that say the same thing
    // can have defaults
    //

    // if network name is passed we grab that data from truffle 
    // ie if its just been deployed
    // else we populate it from environment vars!!!?
    // that should do the job
    /*
    getTruffleConfig(networkName?: string) {

        return {
            networkName: networkName,
            networkId: networks[networkName].network_id,
            host: networks[networkName].host,
            port: networks[networkName].port,
            provider: networks[networkName].provider,
            tokenContractAddress: tokenArtifacts.networks[networks[networkName].network_id].address,
            merchantContractAddress: merchantArtifacts.networks[networks[networkName].network_id].address,
            presaleContractAddress: presaleArtifacts.networks[networks[networkName].network_id].address
            // have to get contract addresses from the 
        }
    }
    */


    // right now, all we need is a single export default

    // really only need a single config function...
    // getEnvConfig() {
    //     return {
    //         networkId: process.env.NETWORKID,
    //         networkName: process.env.NETWORKNAME,
    //         ethNodeUrl: process.env.ETHNODEURL,
    //         ethNodeWsUrl: process.env.ETHNODEWSURL,
    //         gasPrice: process.env.GASPRICE,
    //         gas: process.env.GAS,
    //         seed: process.env.SEED,
    //         owner: process.env.CONTRACTOWNER,
    //         tokenContractAddress: process.env.TOKENCONTRACTADDRESS,
    //         merchantContractAddress: process.env.MERCHANTCONTRACTADDRESS,
    //         presaleContractAddress: process.env.PRESALECONTRACTADDRESS
    //     }
    // }
/*  
}
*/
  

    // hmmmmmmmmmmm.... just write it out and see what happens
    // private config = {
    //     network: '',
    //     networkName: '',
    //     merchantArtifcats: {},
    //     tokenArtifacts: {}
    // }

    // constructor(configType: string) {
        
    //     switch(configType) {
    //         case 'development':
    //             // Get the info from truffle
    //             // is there a last deployed...
    //             // truffle get config
    //         case 'environment':
    //             this.config.network = 'http://localhost:7545';
    //             this.config.networkName = 'development';
    //             break;
    //         // case y:
    //         //     code block
    //         //     break;
    //         // default:
    //         //     code block
    //     }
    //   this.name = name;
    //   this.health = health;
  //  }

//   export function createHero(configType: sting) {
//     return new HeroFactory(network, networkName);
//   }

// export function configFactory(configType: string) {
//     return new ConfigFactory(configType);
// }

// const network = process.env.ETHNODEURL || 'http://localhost:7545' // uhm what should that be
// const networkId = process.env.NETWORKID || 'development'


/*


const network: string = "https://rinkeby.infura.io/v3/e418fc96660e461ba2979615bc2269ad";
const contractAddress: string = "0x3ba0ed597573f9b1b962a70d920263a7f8750b35";
const contractAbiUrl: string = "/abis/PaymentGatewayContract.json";
const tokenAddress: string = "0x9c2319ae355f40015899bf6aac586d4c3c9d35b3";
const tokenAbiUrl: string = "/abis/erc20-contract-abi.json";

https://bitbucket.org/citywebconsultants/ethpaymentgateway/src/master/web/src/ts/EthPaymentGatewayAdmin.ts

*/
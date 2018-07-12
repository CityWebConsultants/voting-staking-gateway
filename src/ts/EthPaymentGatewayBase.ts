var Web3: any;
var Promise: any;

const priceDiscoveryUrl = "https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=GBP";

namespace EthPaymentGateway{
    export class EthPaymentGatewayBase{
        web3Instance: any;
        gatewayConfig: GatewayConfigObject;
    
        constructor(config: GatewayConfigObject){
            this.web3Instance = new Web3(new Web3.providers.HttpProvider(config.network));
            this.gatewayConfig = config;
        }
    
        async getContract(){
            let contractAbi = await this.getContractAbi();
            var contract = await new this.web3Instance.eth.Contract(contractAbi, this.gatewayConfig.contractAddress);
            return contract;
        }     
    
        async getContractAbi(){
            let response = await fetch(this.gatewayConfig.contractAbiUrl);
            let data = await response.json();
            return data.abi;
        }     


        /*
            Utility methods
        */

        async getCostInWeiFromCostInGbp(amountInGbp: number){
            let response = await fetch(priceDiscoveryUrl);
            let data = await response.json();
            let price = this.calculateCost(amountInGbp, data.GBP);
            return price;
        }      
        
        calculateCost(unitCostPerItem: number, unitsPerEth: number){
            let costInEth = unitCostPerItem / unitsPerEth;
            return costInEth;
        }         
    }

    export class GatewayConfigObject{
        network: string;
        contractAddress: string;
        contractAbiUrl: string;
        tokenAddress: string;
        tokenContractAbiUrl: string;

        constructor(network: string, contractAddress: string, contractAbiUrl: string, tokenAddress: string, tokenContractAbiUrl: string){
            this.network = network;
            this.contractAddress = contractAddress;
            this.contractAbiUrl = contractAbiUrl;
            this.tokenAddress = tokenAddress;
            this.tokenContractAbiUrl = tokenContractAbiUrl;            
        }
    }

    export function promisify(inner: any){
        return new Promise((resolve: any, reject: any) =>
                    inner((err: any, res: any) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(res);
                        }
                    })
        ); 
    }
}


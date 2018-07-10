var Web3: any;

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
}


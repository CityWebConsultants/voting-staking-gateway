///<reference path="EthPaymentGatewayBase.ts"/>

namespace EthPaymentGateway{
    const network: string = "http://localhost:7545";
    const contractAddress: string = "0x21b072d12ae68fc4ca02e3fea7a12bf5e001e79f";
    const contractAbiUrl: string = "http://127.0.0.1/src/gateway-contract-abi.json";
    const tokenAddress: string = "0xe186255319a4c5354e57ae553811498a5129e790";
    const tokenAbiUrl: string = "http://127.0.0.1/src/erc20-contract-abi.json";
    const gatewayConfig: GatewayConfigObject = new GatewayConfigObject(network, contractAddress, contractAbiUrl, tokenAddress, tokenAbiUrl);

    export class EthPaymentGatewayAdmin{
        baseClass: EthPaymentGatewayBase;

        constructor(){
            this.baseClass = new EthPaymentGatewayBase(gatewayConfig);
        }

        async getCostInWeiFromCostInGbp(amountInGbp: number){
            return await this.baseClass.getCostInWeiFromCostInGbp(amountInGbp);            
        }

        async addMerchant(address: string, name: string){
            let contract = await this.baseClass.getGatewayContract();
            var result = await contract.addMerchant(address, name);
            return result;
        }    

        async withdrawMerchantBalance(merchant: string){
            return await this.baseClass.withdrawMerchantBalance(merchant);
        }

        async getTransactionReceiptFromNetwork(txHash: string){
            return this.baseClass.getTransactionReceiptFromNetwork(txHash);
        }        
        
        async getPaymentStatusFromMerchantAndReference(merchant: string, reference: string){
            return await this.baseClass.getPaymentStatusFromMerchantAndReference(merchant, reference);
        }

        async setTokenContractAddress(address: string){
            let contract = await this.baseClass.getGatewayContract();
            var result = await contract.setTokenContract(address);
            return result;        
        }        

        async issueTokens(address: string, amount: number){
            let contract = await this.baseClass.getTokenContract();
            var result = await contract.issueTokens(address, amount);
            return result;          
        }  

        async getTokenBalance(address: string){
            return await this.baseClass.getTokenBalance(address);
        }

        async getTokenIssueEvents(){
            let contract = await this.baseClass.getTokenContract();
            let eventsCallback = promisify(cb => contract.IssueTokens({}, { fromBlock: 0, toBlock: 'latest' }).get(cb));
            let events = await eventsCallback;
            return events;          
        }          

        async setPaymentContractAddress(address: string){
            let contract = await this.baseClass.getTokenContract();
            var result = await contract.setPaymentGatewayAddress(address);
            return result;
        }        
    }
}
///<reference path="EthPaymentGatewayBase.ts"/>

namespace EthPaymentGateway{
    const network: string = "http://localhost:7545";
    const contractAddress: string = "0x43a8b19e042a774d95f0ac30b11780a343b6fa0c";
    const contractAbiUrl: string = "http://gateway.local/abis/gateway-contract-abi.json";
    const tokenAddress: string = "0x3f9d31616f5dfc0401116df0613b56ecf89966fc";
    const tokenAbiUrl: string = "http://gateway.local/abis/erc20-contract-abi.json";
    const gatewayConfig = new GatewayConfigObject(network, contractAddress, contractAbiUrl, tokenAddress, tokenAbiUrl);

    export class EthPaymentGatewayClient{
        baseClass: EthPaymentGatewayBase;
        merchant: string;
    
        constructor(merchant: string){
            this.baseClass = new EthPaymentGatewayBase(gatewayConfig);
            this.merchant = merchant;
        }

        async checkTransaction(txid: string) {
            return this.baseClass.web3Instance.eth.getTransaction(txid);
        }
    
        async makePayment(merchant: string, ether: string, reference: string){
            let contract: any = await this.baseClass.getGatewayContract();
            let priceInWei: number = this.baseClass.web3Instance.toWei(ether, 'ether');
            let result: any = await contract.makePayment(merchant, reference, {value : priceInWei});
            return result;
         }
    
         async makePaymentUsingTokens(merchant: string, reference: string, tokenAmount: string){
            let contract: any = await this.baseClass.getGatewayContract();
            let result: any = await contract.makePaymentInTokens(merchant, reference, tokenAmount);
            return result;      
         }

         getPaymentStatusFromMerchantAndReference = async (merchant: string, reference: string) => { return await this.baseClass.getPaymentStatusFromMerchantAndReference(merchant, reference); }

         getTokenBalance = async (address: string) => { return await this.baseClass.getTokenBalance(address); }         
    }
}



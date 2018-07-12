///<reference path="EthPaymentGatewayBase.ts"/>

namespace EthPaymentGateway{
    const network = "http://localhost:7545";
    const contractAddress = "0x21b072d12ae68fc4ca02e3fea7a12bf5e001e79f";
    const contractAbiUrl = "http://127.0.0.1/src/gateway-contract-abi.json";
    const tokenAddress = "0xe186255319a4c5354e57ae553811498a5129e790";
    const tokenAbiUrl = "http://127.0.0.1/src/erc20-contract-abi.json";
    const gatewayConfig = new GatewayConfigObject(network, contractAddress, contractAbiUrl, tokenAddress, tokenAbiUrl);

    export class EthPaymentGatewayClient{
        baseClass: EthPaymentGatewayBase;
        merchant: string;
    
        constructor(merchant: string){
            this.baseClass = new EthPaymentGatewayBase(gatewayConfig);
            this.merchant = merchant;
        }      
    
        async makePayment(merchant: string, ether: string, reference: string){
            let contract = await this.baseClass.getGatewayContract();
            let priceInWei = this.baseClass.web3Instance.toWei(ether, 'ether');
            var result = await contract.makePayment(merchant, reference, {value : priceInWei});
            return result;
         }
    
         async makePaymentUsingTokens(merchant: string, reference: string, tokenAmount: string){
            let contract = await this.baseClass.getGatewayContract();
            var result = await contract.makePaymentInTokens(merchant, reference, tokenAmount);
            return result;      
         }

         async getPaymentStatusFromMerchantAndReference(reference: string){
            return await this.baseClass.getPaymentStatusFromMerchantAndReference(this.merchant, reference);
        }   
        
        async getTokenBalance(address: string){
            return await this.baseClass.getTokenBalance(address);
        }        
    }
}



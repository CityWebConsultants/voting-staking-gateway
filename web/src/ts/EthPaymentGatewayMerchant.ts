///<reference path="EthPaymentGatewayBase.ts"/>

const network = "http://localhost:7545";
const contractAddress = "0x21b072d12ae68fc4ca02e3fea7a12bf5e001e79f";
const contractAbiUrl = "http://127.0.0.1/src/gateway-contract-abi.json";
const tokenAddress = "0xe186255319a4c5354e57ae553811498a5129e790";
const tokenAbiUrl = "http://127.0.0.1/src/erc20-contract-abi.json";


namespace EthPaymentGateway{

    const gatewayConfig = new GatewayConfigObject(network, contractAddress, contractAbiUrl, tokenAddress, tokenAbiUrl);

    export class EthPaymentGatewayMerchant{
        baseClass: EthPaymentGatewayBase;
        merchant: string;

        constructor(merchant: string){
            this.baseClass = new EthPaymentGatewayBase(gatewayConfig);
            this.merchant = merchant;
        }

        async withdrawMerchantBalance(merchant: string){
            return await this.baseClass.withdrawMerchantBalance(merchant);
        }

        async getTransactionReceiptFromNetwork(txHash: string){
            return this.baseClass.getTransactionReceiptFromNetwork(txHash);
        }   

        async getPaymentStatusFromMerchantAndReference(reference: string){
            return await this.baseClass.getPaymentStatusFromMerchantAndReference(this.merchant, reference);
        }

        async getCostInWeiFromCostInGbp(amountInGbp: number){
            return await this.baseClass.getCostInWeiFromCostInGbp(amountInGbp);            
        }  

        async getTokenBalance(address: string){
            return await this.baseClass.getTokenBalance(address);
        }        
    }
}
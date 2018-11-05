///<reference path="EthPaymentGatewayBase.ts"/>

require('dotenv').config()

namespace EthPaymentGateway{

    // const network = process.env.ETHNODEURL || ""
    // const contractAddress = process.env.MERCHANTCONTRACTADDRESS || "0x";
    // const contractAbiUrl = "abis/${process.env.MERCHANTCONTRACTNAME}/.json" || "";
    // const tokenAddress = process.env.TOKENCONTRACTADDRESS  || "0x"
    // const tokenAbiUrl =  "abis/${process.env.TOKENCONTRACTNAME}/.json" || ""; 

    const gatewayConfig = new GatewayConfigObject();

    export class EthPaymentGatewayMerchant{
        baseClass: EthPaymentGatewayBase;
        merchant: string;

        constructor(merchant: string){
            this.baseClass = new EthPaymentGatewayBase(gatewayConfig);
            this.merchant = merchant;
        }

        getCostInWeiFromCostInGbp = async (amountInGbp: number) => { return await this.baseClass.getCostInWeiFromCostInGbp(amountInGbp); }

        getTransactionReceiptFromNetwork = async (txHash: string) => { return this.baseClass.getTransactionReceiptFromNetwork(txHash); }

        getPaymentStatusFromMerchantAndReference = async (merchant: string, reference: string) => { return await this.baseClass.getPaymentStatusFromMerchantAndReference(merchant, reference); }

        getTokenBalance = async (address: string) => { return await this.baseClass.getTokenBalance(address); }       

        withdrawMerchantBalance = async (merchant: string) => { return await this.baseClass.withdrawMerchantBalance(merchant); } 
    }
}
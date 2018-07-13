///<reference path="EthPaymentGatewayBase.ts"/>

namespace EthPaymentGateway{
    const network: string = "http://localhost:7545";
    const contractAddress: string = "0x21b072d12ae68fc4ca02e3fea7a12bf5e001e79f";
    const contractAbiUrl: string = "http://127.0.0.1/abis/gateway-contract-abi.json";
    const tokenAddress: string = "0xe186255319a4c5354e57ae553811498a5129e790";
    const tokenAbiUrl: string = "http://127.0.0.1/abis/erc20-contract-abi.json";
    const gatewayConfig = new GatewayConfigObject(network, contractAddress, contractAbiUrl, tokenAddress, tokenAbiUrl);

    export class EthPaymentGatewayClient{
        baseClass: EthPaymentGatewayBase;
        merchant: string;
    
        constructor(merchant: string){
            this.baseClass = new EthPaymentGatewayBase(gatewayConfig);
            this.merchant = merchant;
        }      
    
        async makePayment(merchant: string, ether: string, reference: string){
            let contract: any = await this.baseClass.getGatewayContract();
            let priceInWei: number = this.baseClass.web3Instance.toWei(ether, 'ether');
            var result: any = await contract.makePayment(merchant, reference, {value : priceInWei});
            return result;
         }
    
         async makePaymentUsingTokens(merchant: string, reference: string, tokenAmount: string){
            let contract: any = await this.baseClass.getGatewayContract();
            var result: any = await contract.makePaymentInTokens(merchant, reference, tokenAmount);
            return result;      
         }

         getPaymentStatusFromMerchantAndReference = async (merchant: string, reference: string) => { return await this.baseClass.getPaymentStatusFromMerchantAndReference(merchant, reference); }

         getTokenBalance = async (address: string) => { return await this.baseClass.getTokenBalance(address); }         
    }
}



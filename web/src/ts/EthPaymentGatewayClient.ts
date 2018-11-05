///<reference path="EthPaymentGatewayBase.ts"/>

namespace EthPaymentGateway{

    const network = process.env.ETHNODEURL || ""
    const contractAddress = process.env.MERCHANTCONTRACTADDRESS || "0x";
    const contractAbiUrl = "abis/${process.env.MERCHANTCONTRACTNAME}/.json" || "";
    const tokenAddress = process.env.TOKENCONTRACTADDRESS  || "0x"
    const tokenAbiUrl =  "abis/${process.env.TOKENCONTRACTNAME}/.json" || ""; 
    const gatewayConfig = new GatewayConfigObject(network, contractAddress, contractAbiUrl, tokenAddress, tokenAbiUrl);

    export class EthPaymentGatewayClient{

        baseClass: EthPaymentGatewayBase;
        merchant: string;
    
        constructor(merchant: string){
            this.baseClass = new EthPaymentGatewayBase(gatewayConfig);
            this.merchant = merchant;
        }

        async checkTransaction(txid: string) {
            return this.baseClass.promisify(cb => this.baseClass.web3Instance.eth.getTransaction(txid, cb));
            //return this.baseClass.web3Instance.eth.getTransaction(txid);
        }
    
        async makePayment(merchant: string, ether: string, reference: string){
            let contract: any = await this.baseClass.getGatewayContract();
            //let priceInWei: number = this.baseClass.web3Instance.toWei(ether, 'ether');
            let priceInWei = await this.baseClass.web3Instance.toWei(ether, 'ether');
            let result = await this.baseClass.promisify(cb => contract.makePayment(merchant, reference, {value : priceInWei}, cb));
            return result;
            //let result: any = await contract.makePayment(merchant, reference, {value : priceInWei});

         }
    
         async makePaymentUsingTokens(merchant: string, reference: string, tokenAmount: string){
            let contract: any = await this.baseClass.getGatewayContract();
            //let result: any = await contract.makePaymentInTokens(merchant, reference, tokenAmount);
            console.log('merchant: ' + merchant, 'ref: ' + reference, 'amount: ' + tokenAmount);

            let result = this.baseClass.promisify(cb => contract.makePaymentInTokens(merchant, reference, tokenAmount, cb));
            console.log('payed with token', result);
            return result;      
         }

         getPaymentStatusFromMerchantAndReference = async (merchant: string, reference: string) => { return await this.baseClass.getPaymentStatusFromMerchantAndReference(merchant, reference); }

         getTokenBalance = async (address: string) => { return await this.baseClass.getTokenBalance(address); }         
    }
}



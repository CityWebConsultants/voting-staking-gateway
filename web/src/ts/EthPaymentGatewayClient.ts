///<reference path="EthPaymentGatewayBase.ts"/>

namespace EthPaymentGateway{
    const network: string = "https://rinkeby.infura.io/v3/e418fc96660e461ba2979615bc2269ad";
    const contractAddress: string = "0x6fcbf9822bcca91212ba58441ccae72aaadc9c7c";
    const contractAbiUrl: string = "/abis/gateway-contract-abi.json";
    const tokenAddress: string = "0x772f4e6eb507d5365e08c572b0e300f3dc074c1b";
    const tokenAbiUrl: string = "/abis/erc20-contract-abi.json";
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
            let priceInWei = this.baseClass.promisify(cb => this.baseClass.web3Instance.toWei(ether, 'ether', cb));
            //let result: any = await contract.makePayment(merchant, reference, {value : priceInWei});
            let result = this.baseClass.promisify(cb => contract.makePayment(merchant, reference, {value : priceInWei}, cb));
            return result;
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



///<reference path="EthPaymentGatewayBase.ts"/>

namespace EthPaymentGateway{
    const network: string = "https://rinkeby.infura.io/v3/e418fc96660e461ba2979615bc2269ad";
    const contractAddress: string = "0x6fcbf9822bcca91212ba58441ccae72aaadc9c7c";
    const contractAbiUrl: string = "/abis/gateway-contract-abi.json";
    const tokenAddress: string = "0x772f4e6eb507d5365e08c572b0e300f3dc074c1b";
    const tokenAbiUrl: string = "/abis/erc20-contract-abi.json";
    const gatewayConfig: GatewayConfigObject = new GatewayConfigObject(network, contractAddress, contractAbiUrl, tokenAddress, tokenAbiUrl);

    export class EthPaymentGatewayAdmin{
        baseClass: EthPaymentGatewayBase;

        constructor(){
            this.baseClass = new EthPaymentGatewayBase(gatewayConfig);
        }

        /*
            Merchant and token administration functions
        */
        async addMerchant(address: string, name: string){
            let contract: any = await this.baseClass.getGatewayContract();
            //let result: any = await contract.addMerchant(address, name);

            let result = this.baseClass.promisify(cb => contract.addMerchant(address, name, cb))
            return result;
        }  

        async issueTokens(address: string, amount: number){
            let contract: any = await this.baseClass.getTokenContract();
            //let result: any = await contract.issueTokens(address, amount);
            let result = this.baseClass.promisify(cb => contract.issueTokens(address, amount, cb))
            return result;          
        }  

        withdrawMerchantBalance = async (merchant: string) => { return await this.baseClass.withdrawMerchantBalance(merchant); } 


        /*
            Gateway administration functions
        */
        async withdrawGatewayFees(){
            let contract: any = await this.baseClass.getGatewayContract();
            //let tx: any = await contract.withdrawGatewayFees();
            let tx = this.baseClass.promisify(cb => contract.withdrawGatewayFees( cb));
            return tx;       
        }  

        async setTokenContractAddress(address: string){
            let contract: any = await this.baseClass.getGatewayContract();
            //let result: any = await contract.setTokenContract(address);
            let result = this.baseClass.promisify(cb => contract.setTokenContract(address, cb));
            return result;        
        }          

        async setPaymentContractAddress(address: string){
            let contract: any = await this.baseClass.getTokenContract();
            //let result: any = await contract.setPaymentGatewayAddress(address);
            let result = this.baseClass.promisify(cb => contract.setPaymentGatewayAddress(address, cb));
            return result;
        }          


        /*
            Read or retrieve data functions
        */       
        getCostInWeiFromCostInGbp = async (amountInGbp: number) => { return await this.baseClass.getCostInWeiFromCostInGbp(amountInGbp); }

        getTransactionReceiptFromNetwork = async (txHash: string) => { return this.baseClass.getTransactionReceiptFromNetwork(txHash); }

        getPaymentStatusFromMerchantAndReference = async (merchant: string, reference: string) => { return await this.baseClass.getPaymentStatusFromMerchantAndReference(merchant, reference); }

        getTokenBalance = async (address: string) => { return await this.baseClass.getTokenBalance(address); }      

        async getGatewayWithdrawalHistory(){
            let events: any = await this.baseClass.getEventsFromBlocks(EventType.WithdrawGatewayFundsEvent, 0, 'latest');
            return this.baseClass.createWithdrawalEventArray(events);       
        }       
        
        async getMerchantWithdrawalHistory(){
            let events: any = await this.baseClass.getEventsFromBlocks(EventType.WithdrawPaymentEvent, 0, 'latest');
            return this.baseClass.createWithdrawalEventArray(events);
        }        

        async getTokenIssueEvents(){
            let contract: any = await this.baseClass.getTokenContract();
            let eventsCallback: any = this.baseClass.promisify(cb => contract.IssueTokens({}, { fromBlock: 0, toBlock: 'latest' }).get(cb));
            let events: any = await eventsCallback;
            return events;          
        }          
    }
}
///<reference path="EthPaymentGatewayBase.ts"/>

namespace EthPaymentGateway{
    const network: string = "http://localhost:7545";
    const contractAddress: string = "0x43a8b19e042a774d95f0ac30b11780a343b6fa0c";
    const contractAbiUrl: string = "http://gateway.local/abis/gateway-contract-abi.json";
    const tokenAddress: string = "0x3f9d31616f5dfc0401116df0613b56ecf89966fc";
    const tokenAbiUrl: string = "http://gateway.local/abis/erc20-contract-abi.json";
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
            let result: any = await contract.addMerchant(address, name);
            return result;
        }  

        async issueTokens(address: string, amount: number){
            let contract: any = await this.baseClass.getTokenContract();
            let result: any = await contract.issueTokens(address, amount);
            return result;          
        }  

        withdrawMerchantBalance = async (merchant: string) => { return await this.baseClass.withdrawMerchantBalance(merchant); } 


        /*
            Gateway administration functions
        */
        async withdrawGatewayFees(){
            let contract: any = await this.baseClass.getGatewayContract();
            let tx: any = await contract.withdrawGatewayFees();
            return tx;       
        }  

        async setTokenContractAddress(address: string){
            let contract: any = await this.baseClass.getGatewayContract();
            let result: any = await contract.setTokenContract(address);
            return result;        
        }          

        async setPaymentContractAddress(address: string){
            let contract: any = await this.baseClass.getTokenContract();
            let result: any = await contract.setPaymentGatewayAddress(address);
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
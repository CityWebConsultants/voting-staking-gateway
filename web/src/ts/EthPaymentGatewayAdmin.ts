///<reference path="EthPaymentGatewayBase.ts"/>

namespace EthPaymentGateway{

    // const network = process.env.ETHNODEURL || ""
    // const contractAddress = process.env.MERCHANTCONTRACTADDRESS || "0x";
    // const contractAbiUrl = "abis/${process.env.MERCHANTCONTRACTNAME}/.json" || "";
    // const tokenAddress = process.env.TOKENCONTRACTADDRESS  || "0x"
    // const tokenAbiUrl =  "abis/${process.env.TOKENCONTRACTNAME}/.json" || ""; 
    // const gatewayConfig = new GatewayConfigObject(network, contractAddress, contractAbiUrl, tokenAddress, tokenAbiUrl);

    export class EthPaymentGatewayAdmin{
        baseClass: EthPaymentGatewayBase;

        constructor(){
            this.baseClass = new EthPaymentGatewayBase();
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

        async transfer(address: string, amount: number){
            let contract: any = await this.baseClass.getTokenContract();
            let result = this.baseClass.promisify(cb => contract.transfer(address, amount, cb))
            return result;
        }

        async transferGateway(address: string, amount: number){
            let contract: any = await this.baseClass.getTokenContract();
            // @todo web3 instantiation needs fixed
            // let result = this.baseClass.promisify(cb => contract.gatewayTokenTransfer(web3.eth.accounts[0], address, amount, cb));
            // return result;
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


        async getTokenContractAddress(){
            let contract: any = await this.baseClass.getGatewayContract();
            let tx = this.baseClass.promisify(cb => contract.getTokenContractAddress( cb));
            return tx;
        }


        /*
            Read or retrieve data functions
        */       
        getCostInWeiFromCostInGbp = async (amountInGbp: number) => { return await this.baseClass.getCostInWeiFromCostInGbp(amountInGbp); }

        getTransactionReceiptFromNetwork = async (txHash: string) => { return this.baseClass.getTransactionReceiptFromNetwork(txHash); }

        getPaymentStatusFromMerchantAndReference = async (merchant: string, reference: string) => { return await this.baseClass.getPaymentStatusFromMerchantAndReference(merchant, reference); }

        getTokenBalance = async (address: string) => { return await this.baseClass.getTokenBalance(address); }

        balanceOfGateway = async (address: string) => { return await this.baseClass.balanceOfGateway(address); }

        async getGatewayWithdrawalHistory(){
            let events: any = await this.baseClass.getEventsFromBlocks(EventType.WithdrawGatewayFundsEvent, 0, 'latest');
            return this.baseClass.createWithdrawalEventArray(events);       
        }       
        
        async getMerchantWithdrawalHistory(){
            let events: any = await this.baseClass.getEventsFromBlocks(EventType.WithdrawPaymentEvent, 0, 'latest');
            return this.baseClass.createWithdrawalEventArray(events);
        }              
    }
}
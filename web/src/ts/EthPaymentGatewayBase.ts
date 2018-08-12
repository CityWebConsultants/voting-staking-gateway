///<reference path="EthPaymentGatewayModels.ts"/>

var Web3: any;

const priceDiscoveryUrl: string = "https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=GBP";

namespace EthPaymentGateway{
    export class EthPaymentGatewayBase{
        web3Instance: any;
        gatewayConfig: GatewayConfigObject;
    
        constructor(config: GatewayConfigObject){

            //this.web3Instance = new Web3(new Web3.providers.HttpProvider(config.network));
            this.web3Instance = new Web3(web3.currentProvider);
            this.gatewayConfig = config;
        }     
        
        /*
            Read or retrieve data functions
        */
        async getCostInWeiFromCostInGbp(amountInGbp: number){
            let response: any = await fetch(priceDiscoveryUrl);
            let data: any = await response.json();
            let price: number = this.calculateCost(amountInGbp, data.GBP);
            return price;
        }  

        async getPaymentStatusFromMerchantAndReference(merchant: string, reference: string){
            let events: any = await this.getEventsFromBlocks(EventType.PaymentMadeEvent, 0, 'latest');
            for(let e = 0; e < events.length; e++){
                let event: any = events[e];
                if(event.args._merchant.toLowerCase() == merchant.toLowerCase() && event.args._reference == reference){
                    return paymentStatus(event);
                }
            }
            return paymentStatus(null);         
         }         
     
        async getTransactionReceiptFromNetwork(txHash: string){
            //let txReceipt: any = await this.web3Instance.eth.getTransactionReceipt(txHash);
            let txReceipt = this.promisify(cb => this.web3Instance.eth.getTransactionReceipt(txHash, cb));
            return txReceipt;
        }     

        async getPaymentReceivedStatusFromHash(txHash: string){
            let txReceipt: any = await this.getTransactionReceiptFromNetwork(txHash);
            if(!txReceipt){
                return paymentStatus(null);
            }         
    
            let blockNumber: number = txReceipt.blockNumber;
            let events: any = await this.getEventsFromBlocks(EventType.PaymentMadeEvent, blockNumber, blockNumber);
            let event: any = this.getEventFromListUsingTxHash(events, txHash);
            return paymentStatus(event);
        }           
         
        async getEventsFromBlocks(eventType: string, fromBlock: any, toBlock: any){
            let contract: any = await this.getGatewayContract();
            let eventsCallback: any = null;
            if(eventType == EventType.PaymentMadeEvent){
                eventsCallback = this.promisify(cb => contract.PaymentMadeEvent({}, { fromBlock: fromBlock, toBlock: toBlock }).get(cb));
            }
            if(eventType == EventType.WithdrawPaymentEvent){
                eventsCallback = this.promisify(cb => contract.WithdrawPaymentEvent({}, { fromBlock: fromBlock, toBlock: toBlock }).get(cb));
            }     
            if(eventType == EventType.WithdrawGatewayFundsEvent){
                eventsCallback = this.promisify(cb => contract.WithdrawGatewayFundsEvent({}, { fromBlock: fromBlock, toBlock: toBlock }).get(cb));            
            }

            if(!eventsCallback){
                return null;
            }
            let events: any = await eventsCallback;
            return events;          
        }
    
        async getTokenBalance(address: string){

            let contract: any = await this.getTokenContract();
            let result = this.promisify(cb => contract.balanceOf(address, cb))
            //let result: number = await contract.balanceOf(address);
            return result;
        }      


        /*
            Withdrawal methods
        */
        async withdrawMerchantBalance(merchant: string){
            let contract: any = await this.getGatewayContract();
            //return await contract.withdrawPayment(merchant);
            return this.promisify(cb => contract.withdrawPayment(merchant, cb));
        }        

        
        /*
            Utility methods
        */
        /// Contract
        async getGatewayContract(){
            return await this.getContract(this.gatewayConfig.contractAddress, this.gatewayConfig.contractAbiUrl);
        }

        async getTokenContract(){
            return await this.getContract(this.gatewayConfig.tokenAddress, this.gatewayConfig.tokenContractAbiUrl);
        }

        async getContract(address: string, abiUrl: string){
            let contractAbi = await this.getContractAbi(abiUrl);
            let contract = await this.web3Instance.eth.contract(contractAbi).at(address);
            return contract;
        }     
    
        async getContractAbi(abiUrl: string){
            let response = await fetch(abiUrl);
            let data = await response.json();
            return data.abi;
        }   
        
        /// Functional
        calculateCost(unitCostPerItem: number, unitsPerEth: number){
            let costInEth = unitCostPerItem / unitsPerEth;
            return costInEth;
        }     
        
        getEventFromListUsingTxHash(events, txHash){
            for(let e = 0; e < events.length; e++){
                let event = events[e];
                if(event.transactionHash == txHash){
                    return event;
                }
            }
            return null;
        }

        createWithdrawalEventArray(events: any){
            let eventArray: any[] = [];
            for(let e = 0; e < events.length; e++){
                let event = events[e];
                eventArray.push(withdrawalRecord(event));
            }
            return eventArray;          
        }    
        
        promisify(inner: any){
            return new Promise((resolve: any, reject: any) =>
                        inner((err: any, res: any) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(res);
                            }
                        })
            ); 
        }

    }
}
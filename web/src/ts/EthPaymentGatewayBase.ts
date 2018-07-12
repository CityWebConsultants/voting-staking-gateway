var Web3: any;
var Promise: any;

const priceDiscoveryUrl = "https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=GBP";

namespace EthPaymentGateway{
    export class EthPaymentGatewayBase{
        web3Instance: any;
        gatewayConfig: GatewayConfigObject;
    
        constructor(config: GatewayConfigObject){
            this.web3Instance = new Web3(new Web3.providers.HttpProvider(config.network));
            this.gatewayConfig = config;
        }       

        async getGatewayContract(){
            return await this.getContract(this.gatewayConfig.contractAddress, this.gatewayConfig.contractAbiUrl);
        }

        async getTokenContract(){
            return await this.getContract(this.gatewayConfig.tokenAddress, this.gatewayConfig.tokenContractAbiUrl);
        }

        async getContract(address: string, abiUrl: string){
            let contractAbi = await this.getContractAbi(abiUrl);
            var contract = await new this.web3Instance.eth.Contract(contractAbi, address);
            return contract;
        }     
    
        async getContractAbi(abiUrl: string){
            let response = await fetch(abiUrl);
            let data = await response.json();
            return data.abi;
        }          

        async getTransactionReceiptFromNetwork(txHash: string){
            let txReceipt = await this.web3Instance.eth.getTransactionReceipt(txHash);
            return txReceipt;
        }     

        async getPaymentStatusFromMerchantAndReference(merchant: string, reference: string){
            let events = await this.getEventsFromBlocks(EventType.PaymentMadeEvent, 0, 'latest');
            for(let e = 0; e < events.length; e++){
                let event = events[e];
                if(event.args._merchant.toLowerCase() == merchant.toLowerCase() && event.args._reference == reference){
                    return paymentStatus(event);
                }
            }
            return paymentStatus(null);         
         }        

         async getEventsFromBlocks(eventType: string, fromBlock: any, toBlock: any){
            let contract = await this.getGatewayContract();
            let eventsCallback: any = null;
            if(eventType == EventType.PaymentMadeEvent){
                eventsCallback = promisify(cb => contract.PaymentMadeEvent({}, { fromBlock: fromBlock, toBlock: toBlock }).get(cb));
            }
            if(eventType == EventType.WithdrawPaymentEvent){
                eventsCallback = promisify(cb => contract.WithdrawPaymentEvent({}, { fromBlock: fromBlock, toBlock: toBlock }).get(cb));
            }     
            if(eventType == EventType.WithdrawGatewayFundsEvent){
                eventsCallback = promisify(cb => contract.WithdrawGatewayFundsEvent({}, { fromBlock: fromBlock, toBlock: toBlock }).get(cb));            
            }
    
            if(!eventsCallback){
                return null;
            }
            let events = await eventsCallback;
            return events;          
        }

        async getTokenBalance(address: string){
            let contract = await this.getTokenContract();        
            var result = await contract.balanceOf(address);
            return result;
        }      
        
        async withdrawMerchantBalance(merchant: string){
            let contract = await this.getGatewayContract();
            return await contract.withdrawPayment(merchant);
        }        

        /*
            Utility methods
        */

        async getCostInWeiFromCostInGbp(amountInGbp: number){
            let response = await fetch(priceDiscoveryUrl);
            let data = await response.json();
            let price = this.calculateCost(amountInGbp, data.GBP);
            return price;
        }      
        
        calculateCost(unitCostPerItem: number, unitsPerEth: number){
            let costInEth = unitCostPerItem / unitsPerEth;
            return costInEth;
        }         
    }

    export class GatewayConfigObject{
        network: string;
        contractAddress: string;
        contractAbiUrl: string;
        tokenAddress: string;
        tokenContractAbiUrl: string;

        constructor(network: string, contractAddress: string, contractAbiUrl: string, tokenAddress: string, tokenContractAbiUrl: string){
            this.network = network;
            this.contractAddress = contractAddress;
            this.contractAbiUrl = contractAbiUrl;
            this.tokenAddress = tokenAddress;
            this.tokenContractAbiUrl = tokenContractAbiUrl;            
        }
    }

    export var EventType = {
        PaymentMadeEvent: "PaymentMadeEvent",
        WithdrawGatewayFundsEvent: "WithdrawGatewayFundsEvent",
        WithdrawPaymentEvent: "WithdrawPaymentEvent"  
    }    

    export function paymentStatus(paymentEvent: any){
        if(paymentEvent == undefined || paymentEvent == null){
            return {};
        }

        return {merchant: paymentEvent.args._merchant, 
                reference: paymentEvent.args._reference,
                amountInWei: paymentEvent.args._amount.c[0] };
    }   

    export function withdrawalRecord(merchantWithdrawalEvent: any){
        if(merchantWithdrawalEvent == undefined || merchantWithdrawalEvent == null){
            return {};
        }        

        return { merchant: merchantWithdrawalEvent.args._walletAddress,
                 amountInWei: merchantWithdrawalEvent.args._amount.c[0]};
    }    

    export function promisify(inner: any){
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


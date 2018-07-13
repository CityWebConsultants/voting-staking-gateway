export class EthPaymentGatewayBase{

    constructor(network, contractAddress){
        this.web3Instance = new Web3(new Web3.providers.HttpProvider(network));
        this.contractAddress = contractAddress;
    }

    async getCostInWeiFromCostInGbp(amountInGbp){
        let response = await fetch(this.priceDiscoveryUrl);
        let data = await response.json();
        let price = this.calculateCost(amountInGbp, data.GBP);
        return price;
    }

    async getContract(){
        this.contractAbi = await this.getContractAbi();
        var contract = await this.web3Instance.eth.contract(this.contractAbi).at(this.contractAddress);
        return contract;
    }    

    async getContractAbi(){
        let response = await fetch(this.contractAbiUrl);
        let data = await response.json();
        return data.abi;
    }      

    async getTransactionReceiptFromNetwork(txHash){
        let txReceipt = await this.web3Instance.eth.getTransactionReceipt(txHash);
        return txReceipt;
    }        

    async getEventsFromBlocks(eventType, fromBlock, toBlock){
        let contract = await this.getContract();
        let eventsCallback = null;
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
        let events = await eventsCallback;
        return events;          
    }

    createWithdrawalEventArrayBase(events){
        //some arbitary text here
        let eventArray = [];
        for(let e = 0; e < events.length; e++){
            let event = events[e];
            eventArray.push(this.withdrawalRecord(event));
        }
        return eventArray;          
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

    calculateCost(unitCostPerItem, unitsPerEth){
        let costInEth = unitCostPerItem / unitsPerEth;
        return costInEth;
    } 

}


export function promisify(inner){
    return new Promise((resolve, reject) =>
                inner((err, res) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(res);
                    }
                })
    ); 
}
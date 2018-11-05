namespace EthPaymentGateway{
    export class GatewayConfigObject{
        network: string;
        contractAddress: string;
        contractAbiUrl: string;
        tokenAddress: string;
        tokenContractAbiUrl: string;
        // we should be passing in a fully formed object instead of passing in lots of individual vars...
        // this should be done along the lines of dependency injection
        constructor(network: string, contractAddress: string, contractAbiUrl: string, tokenAddress: string, tokenContractAbiUrl: string){

            this.network = network;
            this.contractAddress = contractAddress;
            this.contractAbiUrl = contractAbiUrl;
            this.tokenAddress = tokenAddress;
            // Should we really be routing html in this context --- re 
            this.tokenContractAbiUrl = tokenContractAbiUrl;            
        }
    }

    export var EventType: any = {
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
                amountInWei: paymentEvent.args._amount.c[0] }; // !!!! afaict this won't scale to big numbers... need to use big number
    }   

    export function withdrawalRecord(merchantWithdrawalEvent: any){
        if(merchantWithdrawalEvent == undefined || merchantWithdrawalEvent == null){
            return {};
        }        

        return { merchant: merchantWithdrawalEvent.args._walletAddress,
                 amountInWei: merchantWithdrawalEvent.args._amount.c[0]};
    }    
}
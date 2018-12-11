namespace EthPaymentGateway{
    export class GatewayConfigObject{
        readonly network: string = 'https://localhost:7545';
        readonly contractAddress: string = '0xb469690cc97d84bf98098262fbe9a0f3e21fc7fc';
        readonly contractAbiUrl: string = 'abis/GatewayERC20Contract.json';
        readonly tokenAddress: string = '0x8c951fe19dbf212ae4c57198891ad9dd5f446d1c'
        readonly tokenContractAbiUrl: string = 'abis/PaymentGatewayContract.json';
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
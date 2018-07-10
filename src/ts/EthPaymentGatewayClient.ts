///<reference path="EthPaymentGatewayBase.ts"/>

namespace EthPaymentGateway{
    export class EthPaymentGatewayClient{
        baseClass: EthPaymentGatewayBase;
    
        constructor(network: string, contractAddress: string){
            this.baseClass = new EthPaymentGatewayBase(network, contractAddress);
        }
    
        tester(){
            alert("something");
        }

        testTwo(){
            this.baseClass.baseTest();
        }
    }
}



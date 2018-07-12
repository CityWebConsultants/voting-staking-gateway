///<reference path="EthPaymentGatewayBase.ts"/>

const network = "http://localhost:7545";
const contractAddress = "0x21b072d12ae68fc4ca02e3fea7a12bf5e001e79f";
const contractAbiUrl = "http://127.0.0.1/src/gateway-contract-abi.json";
const tokenAddress = "0xe186255319a4c5354e57ae553811498a5129e790";
const tokenAbiUrl = "http://127.0.0.1/src/erc20-contract-abi.json";


namespace EthPaymentGateway{

    const gatewayConfig = new GatewayConfigObject(network, contractAddress, contractAbiUrl, tokenAddress, tokenAbiUrl);

    export class EthPaymentGatewayAdmin{
        baseClass: EthPaymentGatewayBase;

        constructor(){
            this.baseClass = new EthPaymentGatewayBase(gatewayConfig);
        }

        testAdmin(){
            console.log("admin loaded");
            console.log(this.baseClass);

        }
    }
}
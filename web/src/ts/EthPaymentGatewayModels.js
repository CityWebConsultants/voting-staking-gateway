"use strict";
var EthPaymentGateway;
(function (EthPaymentGateway) {
    var GatewayConfigObject = /** @class */ (function () {
        function GatewayConfigObject(network, contractAddress, contractAbiUrl, tokenAddress, tokenContractAbiUrl) {
            this.network = network;
            this.contractAddress = contractAddress;
            this.contractAbiUrl = contractAbiUrl;
            this.tokenAddress = tokenAddress;
            this.tokenContractAbiUrl = tokenContractAbiUrl;
        }
        return GatewayConfigObject;
    }());
    EthPaymentGateway.GatewayConfigObject = GatewayConfigObject;
    EthPaymentGateway.EventType = {
        PaymentMadeEvent: "PaymentMadeEvent",
        WithdrawGatewayFundsEvent: "WithdrawGatewayFundsEvent",
        WithdrawPaymentEvent: "WithdrawPaymentEvent"
    };
    function paymentStatus(paymentEvent) {
        if (paymentEvent == undefined || paymentEvent == null) {
            return {};
        }
        return { merchant: paymentEvent.args._merchant,
            reference: paymentEvent.args._reference,
            amountInWei: paymentEvent.args._amount.c[0] };
    }
    EthPaymentGateway.paymentStatus = paymentStatus;
    function withdrawalRecord(merchantWithdrawalEvent) {
        if (merchantWithdrawalEvent == undefined || merchantWithdrawalEvent == null) {
            return {};
        }
        return { merchant: merchantWithdrawalEvent.args._walletAddress,
            amountInWei: merchantWithdrawalEvent.args._amount.c[0] };
    }
    EthPaymentGateway.withdrawalRecord = withdrawalRecord;
})(EthPaymentGateway || (EthPaymentGateway = {}));

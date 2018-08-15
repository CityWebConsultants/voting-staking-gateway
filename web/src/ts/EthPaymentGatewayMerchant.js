"use strict";
///<reference path="EthPaymentGatewayBase.ts"/>
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var EthPaymentGateway;
///<reference path="EthPaymentGatewayBase.ts"/>
(function (EthPaymentGateway) {
    var network = "http://localhost:7545";
    var contractAddress = "0x21b072d12ae68fc4ca02e3fea7a12bf5e001e79f";
    var contractAbiUrl = "http://127.0.0.1/src/gateway-contract-abi.json";
    var tokenAddress = "0xe186255319a4c5354e57ae553811498a5129e790";
    var tokenAbiUrl = "http://127.0.0.1/src/erc20-contract-abi.json";
    var gatewayConfig = new EthPaymentGateway.GatewayConfigObject(network, contractAddress, contractAbiUrl, tokenAddress, tokenAbiUrl);
    var EthPaymentGatewayMerchant = /** @class */ (function () {
        function EthPaymentGatewayMerchant(merchant) {
            var _this = this;
            this.getCostInWeiFromCostInGbp = function (amountInGbp) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.baseClass.getCostInWeiFromCostInGbp(amountInGbp)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            }); }); };
            this.getTransactionReceiptFromNetwork = function (txHash) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/, this.baseClass.getTransactionReceiptFromNetwork(txHash)];
            }); }); };
            this.getPaymentStatusFromMerchantAndReference = function (merchant, reference) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.baseClass.getPaymentStatusFromMerchantAndReference(merchant, reference)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            }); }); };
            this.getTokenBalance = function (address) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.baseClass.getTokenBalance(address)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            }); }); };
            this.withdrawMerchantBalance = function (merchant) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.baseClass.withdrawMerchantBalance(merchant)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            }); }); };
            this.baseClass = new EthPaymentGateway.EthPaymentGatewayBase(gatewayConfig);
            this.merchant = merchant;
        }
        return EthPaymentGatewayMerchant;
    }());
    EthPaymentGateway.EthPaymentGatewayMerchant = EthPaymentGatewayMerchant;
})(EthPaymentGateway || (EthPaymentGateway = {}));
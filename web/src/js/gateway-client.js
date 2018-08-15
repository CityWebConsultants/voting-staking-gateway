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
///<reference path="EthPaymentGatewayModels.ts"/>
var Web3;
var priceDiscoveryUrl = "https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=GBP";
var EthPaymentGateway;
(function (EthPaymentGateway) {
    var EthPaymentGatewayBase = /** @class */ (function () {
        function EthPaymentGatewayBase(config) {
            //this.web3Instance = new Web3(new Web3.providers.HttpProvider(config.network));
            this.web3Instance = new Web3(web3.currentProvider);
            this.gatewayConfig = config;
        }
        /*
            Read or retrieve data functions
        */
        EthPaymentGatewayBase.prototype.getCostInWeiFromCostInGbp = function (amountInGbp) {
            return __awaiter(this, void 0, void 0, function () {
                var response, data, price;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fetch(priceDiscoveryUrl)];
                        case 1:
                            response = _a.sent();
                            return [4 /*yield*/, response.json()];
                        case 2:
                            data = _a.sent();
                            price = this.calculateCost(amountInGbp, data.GBP);
                            return [2 /*return*/, price];
                    }
                });
            });
        };
        EthPaymentGatewayBase.prototype.getPaymentStatusFromMerchantAndReference = function (merchant, reference) {
            return __awaiter(this, void 0, void 0, function () {
                var events, e, event_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getEventsFromBlocks(EthPaymentGateway.EventType.PaymentMadeEvent, 0, 'latest')];
                        case 1:
                            events = _a.sent();
                            for (e = 0; e < events.length; e++) {
                                event_1 = events[e];
                                if (event_1.args._merchant.toLowerCase() == merchant.toLowerCase() && event_1.args._reference == reference) {
                                    return [2 /*return*/, EthPaymentGateway.paymentStatus(event_1)];
                                }
                            }
                            return [2 /*return*/, EthPaymentGateway.paymentStatus(null)];
                    }
                });
            });
        };
        EthPaymentGatewayBase.prototype.getTransactionReceiptFromNetwork = function (txHash) {
            return __awaiter(this, void 0, void 0, function () {
                var txReceipt;
                var _this = this;
                return __generator(this, function (_a) {
                    txReceipt = this.promisify(function (cb) { return _this.web3Instance.eth.getTransactionReceipt(txHash, cb); });
                    return [2 /*return*/, txReceipt];
                });
            });
        };
        EthPaymentGatewayBase.prototype.getPaymentReceivedStatusFromHash = function (txHash) {
            return __awaiter(this, void 0, void 0, function () {
                var txReceipt, blockNumber, events, event;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getTransactionReceiptFromNetwork(txHash)];
                        case 1:
                            txReceipt = _a.sent();
                            if (!txReceipt) {
                                return [2 /*return*/, EthPaymentGateway.paymentStatus(null)];
                            }
                            blockNumber = txReceipt.blockNumber;
                            return [4 /*yield*/, this.getEventsFromBlocks(EthPaymentGateway.EventType.PaymentMadeEvent, blockNumber, blockNumber)];
                        case 2:
                            events = _a.sent();
                            event = this.getEventFromListUsingTxHash(events, txHash);
                            return [2 /*return*/, EthPaymentGateway.paymentStatus(event)];
                    }
                });
            });
        };
        EthPaymentGatewayBase.prototype.getEventsFromBlocks = function (eventType, fromBlock, toBlock) {
            return __awaiter(this, void 0, void 0, function () {
                var contract, eventsCallback, events;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getGatewayContract()];
                        case 1:
                            contract = _a.sent();
                            eventsCallback = null;
                            if (eventType == EthPaymentGateway.EventType.PaymentMadeEvent) {
                                eventsCallback = this.promisify(function (cb) { return contract.PaymentMadeEvent({}, { fromBlock: fromBlock, toBlock: toBlock }).get(cb); });
                            }
                            if (eventType == EthPaymentGateway.EventType.WithdrawPaymentEvent) {
                                eventsCallback = this.promisify(function (cb) { return contract.WithdrawPaymentEvent({}, { fromBlock: fromBlock, toBlock: toBlock }).get(cb); });
                            }
                            if (eventType == EthPaymentGateway.EventType.WithdrawGatewayFundsEvent) {
                                eventsCallback = this.promisify(function (cb) { return contract.WithdrawGatewayFundsEvent({}, { fromBlock: fromBlock, toBlock: toBlock }).get(cb); });
                            }
                            if (!eventsCallback) {
                                return [2 /*return*/, null];
                            }
                            return [4 /*yield*/, eventsCallback];
                        case 2:
                            events = _a.sent();
                            return [2 /*return*/, events];
                    }
                });
            });
        };
        EthPaymentGatewayBase.prototype.getTokenBalance = function (address) {
            return __awaiter(this, void 0, void 0, function () {
                var contract, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getTokenContract()];
                        case 1:
                            contract = _a.sent();
                            this.promisify(function (cb) { return contract.totalSupply(cb); }).then(function (val) {
                                console.log('total supply: ' + val);
                            });
                            result = this.promisify(function (cb) { return contract.balanceOf(address, cb); });
                            //let result: number = await contract.balanceOf(address);
                            return [2 /*return*/, result];
                    }
                });
            });
        };
        EthPaymentGatewayBase.prototype.balanceOfGateway = function (address) {
            return __awaiter(this, void 0, void 0, function () {
                var contract, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getGatewayContract()];
                        case 1:
                            contract = _a.sent();
                            result = this.promisify(function (cb) { return contract.balanceOf(address, cb); });
                            //let result: number = await contract.balanceOf(address);
                            return [2 /*return*/, result];
                    }
                });
            });
        };
        /*
            Withdrawal methods
        */
        EthPaymentGatewayBase.prototype.withdrawMerchantBalance = function (merchant) {
            return __awaiter(this, void 0, void 0, function () {
                var contract;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getGatewayContract()];
                        case 1:
                            contract = _a.sent();
                            //return await contract.withdrawPayment(merchant);
                            return [2 /*return*/, this.promisify(function (cb) { return contract.withdrawPayment(merchant, cb); })];
                    }
                });
            });
        };
        /*
            Utility methods
        */
        /// Contract
        EthPaymentGatewayBase.prototype.getGatewayContract = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getContract(this.gatewayConfig.contractAddress, this.gatewayConfig.contractAbiUrl)];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        EthPaymentGatewayBase.prototype.getTokenContract = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getContract(this.gatewayConfig.tokenAddress, this.gatewayConfig.tokenContractAbiUrl)];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        EthPaymentGatewayBase.prototype.getContract = function (address, abiUrl) {
            return __awaiter(this, void 0, void 0, function () {
                var contractAbi, contract;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getContractAbi(abiUrl)];
                        case 1:
                            contractAbi = _a.sent();
                            return [4 /*yield*/, this.web3Instance.eth.contract(contractAbi).at(address)];
                        case 2:
                            contract = _a.sent();
                            return [2 /*return*/, contract];
                    }
                });
            });
        };
        EthPaymentGatewayBase.prototype.getContractAbi = function (abiUrl) {
            return __awaiter(this, void 0, void 0, function () {
                var response, data;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fetch(abiUrl)];
                        case 1:
                            response = _a.sent();
                            return [4 /*yield*/, response.json()];
                        case 2:
                            data = _a.sent();
                            return [2 /*return*/, data.abi];
                    }
                });
            });
        };
        /// Functional
        EthPaymentGatewayBase.prototype.calculateCost = function (unitCostPerItem, unitsPerEth) {
            var costInEth = unitCostPerItem / unitsPerEth;
            return costInEth;
        };
        EthPaymentGatewayBase.prototype.getEventFromListUsingTxHash = function (events, txHash) {
            for (var e = 0; e < events.length; e++) {
                var event_2 = events[e];
                if (event_2.transactionHash == txHash) {
                    return event_2;
                }
            }
            return null;
        };
        EthPaymentGatewayBase.prototype.createWithdrawalEventArray = function (events) {
            var eventArray = [];
            for (var e = 0; e < events.length; e++) {
                var event_3 = events[e];
                eventArray.push(EthPaymentGateway.withdrawalRecord(event_3));
            }
            return eventArray;
        };
        EthPaymentGatewayBase.prototype.promisify = function (inner) {
            return new Promise(function (resolve, reject) {
                return inner(function (err, res) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(res);
                    }
                });
            });
        };
        return EthPaymentGatewayBase;
    }());
    EthPaymentGateway.EthPaymentGatewayBase = EthPaymentGatewayBase;
})(EthPaymentGateway || (EthPaymentGateway = {}));
///<reference path="EthPaymentGatewayBase.ts"/>
var EthPaymentGateway;
(function (EthPaymentGateway) {
    var network = "https://rinkeby.infura.io/v3/e418fc96660e461ba2979615bc2269ad";
    var contractAddress = "0x3ba0ed597573f9b1b962a70d920263a7f8750b35";
    var contractAbiUrl = "/abis/PaymentGatewayContract.json";
    var tokenAddress = "0x9c2319ae355f40015899bf6aac586d4c3c9d35b3";
    var tokenAbiUrl = "/abis/erc20-contract-abi.json";
    var gatewayConfig = new EthPaymentGateway.GatewayConfigObject(network, contractAddress, contractAbiUrl, tokenAddress, tokenAbiUrl);
    var EthPaymentGatewayClient = /** @class */ (function () {
        function EthPaymentGatewayClient(merchant) {
            var _this = this;
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
            this.baseClass = new EthPaymentGateway.EthPaymentGatewayBase(gatewayConfig);
            this.merchant = merchant;
        }
        EthPaymentGatewayClient.prototype.checkTransaction = function (txid) {
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.baseClass.promisify(function (cb) { return _this.baseClass.web3Instance.eth.getTransaction(txid, cb); })];
                });
            });
        };
        EthPaymentGatewayClient.prototype.makePayment = function (merchant, ether, reference) {
            return __awaiter(this, void 0, void 0, function () {
                var contract, priceInWei, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.baseClass.getGatewayContract()];
                        case 1:
                            contract = _a.sent();
                            return [4 /*yield*/, this.baseClass.web3Instance.toWei(ether, 'ether')];
                        case 2:
                            priceInWei = _a.sent();
                            return [4 /*yield*/, this.baseClass.promisify(function (cb) { return contract.makePayment(merchant, reference, { value: priceInWei }, cb); })];
                        case 3:
                            result = _a.sent();
                            return [2 /*return*/, result];
                    }
                });
            });
        };
        EthPaymentGatewayClient.prototype.makePaymentUsingTokens = function (merchant, reference, tokenAmount) {
            return __awaiter(this, void 0, void 0, function () {
                var contract, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.baseClass.getGatewayContract()];
                        case 1:
                            contract = _a.sent();
                            //let result: any = await contract.makePaymentInTokens(merchant, reference, tokenAmount);
                            console.log('merchant: ' + merchant, 'ref: ' + reference, 'amount: ' + tokenAmount);
                            result = this.baseClass.promisify(function (cb) { return contract.makePaymentInTokens(merchant, reference, tokenAmount, cb); });
                            console.log('payed with token', result);
                            return [2 /*return*/, result];
                    }
                });
            });
        };
        return EthPaymentGatewayClient;
    }());
    EthPaymentGateway.EthPaymentGatewayClient = EthPaymentGatewayClient;
})(EthPaymentGateway || (EthPaymentGateway = {}));

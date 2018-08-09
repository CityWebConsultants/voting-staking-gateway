var Web3,__awaiter=this&&this.__awaiter||function(o,i,s,c){return new(s||(s=Promise))(function(t,e){function n(t){try{a(c.next(t))}catch(t){e(t)}}function r(t){try{a(c.throw(t))}catch(t){e(t)}}function a(e){e.done?t(e.value):new s(function(t){t(e.value)}).then(n,r)}a((c=c.apply(o,i||[])).next())})},__generator=this&&this.__generator||function(n,r){var a,o,i,t,s={label:0,sent:function(){if(1&i[0])throw i[1];return i[1]},trys:[],ops:[]};return t={next:e(0),throw:e(1),return:e(2)},"function"==typeof Symbol&&(t[Symbol.iterator]=function(){return this}),t;function e(e){return function(t){return function(e){if(a)throw new TypeError("Generator is already executing.");for(;s;)try{if(a=1,o&&(i=2&e[0]?o.return:e[0]?o.throw||((i=o.return)&&i.call(o),0):o.next)&&!(i=i.call(o,e[1])).done)return i;switch(o=0,i&&(e=[2&e[0],i.value]),e[0]){case 0:case 1:i=e;break;case 4:return s.label++,{value:e[1],done:!1};case 5:s.label++,o=e[1],e=[0];continue;case 7:e=s.ops.pop(),s.trys.pop();continue;default:if(!(i=0<(i=s.trys).length&&i[i.length-1])&&(6===e[0]||2===e[0])){s=0;continue}if(3===e[0]&&(!i||e[1]>i[0]&&e[1]<i[3])){s.label=e[1];break}if(6===e[0]&&s.label<i[1]){s.label=i[1],i=e;break}if(i&&s.label<i[2]){s.label=i[2],s.ops.push(e);break}i[2]&&s.ops.pop(),s.trys.pop();continue}e=r.call(n,s)}catch(t){e=[6,t],o=0}finally{a=i=0}if(5&e[0])throw e[1];return{value:e[0]?e[1]:void 0,done:!0}}([e,t])}}};!function(t){var e=function(t,e,n,r,a){this.network=t,this.contractAddress=e,this.contractAbiUrl=n,this.tokenAddress=r,this.tokenContractAbiUrl=a};t.GatewayConfigObject=e,t.EventType={PaymentMadeEvent:"PaymentMadeEvent",WithdrawGatewayFundsEvent:"WithdrawGatewayFundsEvent",WithdrawPaymentEvent:"WithdrawPaymentEvent"},t.paymentStatus=function(t){return null==t||null==t?{}:{merchant:t.args._merchant,reference:t.args._reference,amountInWei:t.args._amount.c[0]}},t.withdrawalRecord=function(t){return null==t||null==t?{}:{merchant:t.args._walletAddress,amountInWei:t.args._amount.c[0]}}}(EthPaymentGateway||(EthPaymentGateway={}));var EthPaymentGateway,priceDiscoveryUrl="https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=GBP";!function(i){var t=function(){function t(t){this.web3Instance=new Web3(new Web3.providers.HttpProvider(t.network)),this.gatewayConfig=t}return t.prototype.getCostInWeiFromCostInGbp=function(n){return __awaiter(this,void 0,void 0,function(){var e;return __generator(this,function(t){switch(t.label){case 0:return[4,fetch(priceDiscoveryUrl)];case 1:return[4,t.sent().json()];case 2:return e=t.sent(),[2,this.calculateCost(n,e.GBP)]}})})},t.prototype.getPaymentStatusFromMerchantAndReference=function(a,o){return __awaiter(this,void 0,void 0,function(){var e,n,r;return __generator(this,function(t){switch(t.label){case 0:return[4,this.getEventsFromBlocks(i.EventType.PaymentMadeEvent,0,"latest")];case 1:for(e=t.sent(),n=0;n<e.length;n++)if((r=e[n]).args._merchant.toLowerCase()==a.toLowerCase()&&r.args._reference==o)return[2,i.paymentStatus(r)];return[2,i.paymentStatus(null)]}})})},t.prototype.getTransactionReceiptFromNetwork=function(e){return __awaiter(this,void 0,void 0,function(){return __generator(this,function(t){switch(t.label){case 0:return[4,this.web3Instance.eth.getTransactionReceipt(e)];case 1:return[2,t.sent()]}})})},t.prototype.getPaymentReceivedStatusFromHash=function(o){return __awaiter(this,void 0,void 0,function(){var e,n,r,a;return __generator(this,function(t){switch(t.label){case 0:return[4,this.getTransactionReceiptFromNetwork(o)];case 1:return(e=t.sent())?(n=e.blockNumber,[4,this.getEventsFromBlocks(i.EventType.PaymentMadeEvent,n,n)]):[2,i.paymentStatus(null)];case 2:return r=t.sent(),a=this.getEventFromListUsingTxHash(r,o),[2,i.paymentStatus(a)]}})})},t.prototype.getEventsFromBlocks=function(r,a,o){return __awaiter(this,void 0,void 0,function(){var e,n;return __generator(this,function(t){switch(t.label){case 0:return[4,this.getGatewayContract()];case 1:return e=t.sent(),n=null,r==i.EventType.PaymentMadeEvent&&(n=this.promisify(function(t){return e.PaymentMadeEvent({},{fromBlock:a,toBlock:o}).get(t)})),r==i.EventType.WithdrawPaymentEvent&&(n=this.promisify(function(t){return e.WithdrawPaymentEvent({},{fromBlock:a,toBlock:o}).get(t)})),r==i.EventType.WithdrawGatewayFundsEvent&&(n=this.promisify(function(t){return e.WithdrawGatewayFundsEvent({},{fromBlock:a,toBlock:o}).get(t)})),n?[4,n]:[2,null];case 2:return[2,t.sent()]}})})},t.prototype.getTokenBalance=function(e){return __awaiter(this,void 0,void 0,function(){return __generator(this,function(t){switch(t.label){case 0:return[4,this.getTokenContract()];case 1:return[4,t.sent().balanceOf(e)];case 2:return[2,t.sent()]}})})},t.prototype.withdrawMerchantBalance=function(e){return __awaiter(this,void 0,void 0,function(){return __generator(this,function(t){switch(t.label){case 0:return[4,this.getGatewayContract()];case 1:return[4,t.sent().withdrawPayment(e)];case 2:return[2,t.sent()]}})})},t.prototype.getGatewayContract=function(){return __awaiter(this,void 0,void 0,function(){return __generator(this,function(t){switch(t.label){case 0:return[4,this.getContract(this.gatewayConfig.contractAddress,this.gatewayConfig.contractAbiUrl)];case 1:return[2,t.sent()]}})})},t.prototype.getTokenContract=function(){return __awaiter(this,void 0,void 0,function(){return __generator(this,function(t){switch(t.label){case 0:return[4,this.getContract(this.gatewayConfig.tokenAddress,this.gatewayConfig.tokenContractAbiUrl)];case 1:return[2,t.sent()]}})})},t.prototype.getContract=function(n,r){return __awaiter(this,void 0,void 0,function(){var e;return __generator(this,function(t){switch(t.label){case 0:return[4,this.getContractAbi(r)];case 1:return e=t.sent(),[4,this.web3Instance.eth.contract(e).at(n)];case 2:return[2,t.sent()]}})})},t.prototype.getContractAbi=function(e){return __awaiter(this,void 0,void 0,function(){return __generator(this,function(t){switch(t.label){case 0:return[4,fetch(e)];case 1:return[4,t.sent().json()];case 2:return[2,t.sent().abi]}})})},t.prototype.calculateCost=function(t,e){return t/e},t.prototype.getEventFromListUsingTxHash=function(t,e){for(var n=0;n<t.length;n++){var r=t[n];if(r.transactionHash==e)return r}return null},t.prototype.createWithdrawalEventArray=function(t){for(var e=[],n=0;n<t.length;n++){var r=t[n];e.push(i.withdrawalRecord(r))}return e},t.prototype.promisify=function(t){return new Promise(function(n,r){return t(function(t,e){t?r(t):n(e)})})},t}();i.EthPaymentGatewayBase=t}(EthPaymentGateway||(EthPaymentGateway={})),function(e){var n=new e.GatewayConfigObject("http://localhost:7545","0x43a8b19e042a774d95f0ac30b11780a343b6fa0c","http://gateway.local/abis/gateway-contract-abi.json","0x3f9d31616f5dfc0401116df0613b56ecf89966fc","http://gateway.local/abis/erc20-contract-abi.json"),t=function(){function t(t){var r=this;this.getPaymentStatusFromMerchantAndReference=function(e,n){return __awaiter(r,void 0,void 0,function(){return __generator(this,function(t){switch(t.label){case 0:return[4,this.baseClass.getPaymentStatusFromMerchantAndReference(e,n)];case 1:return[2,t.sent()]}})})},this.getTokenBalance=function(e){return __awaiter(r,void 0,void 0,function(){return __generator(this,function(t){switch(t.label){case 0:return[4,this.baseClass.getTokenBalance(e)];case 1:return[2,t.sent()]}})})},this.baseClass=new e.EthPaymentGatewayBase(n),this.merchant=t}return t.prototype.checkTransaction=function(e){return __awaiter(this,void 0,void 0,function(){return __generator(this,function(t){return[2,this.baseClass.web3Instance.eth.getTransaction(e)]})})},t.prototype.makePayment=function(r,a,o){return __awaiter(this,void 0,void 0,function(){var e,n;return __generator(this,function(t){switch(t.label){case 0:return[4,this.baseClass.getGatewayContract()];case 1:return e=t.sent(),n=this.baseClass.web3Instance.toWei(a,"ether"),[4,e.makePayment(r,o,{value:n})];case 2:return[2,t.sent()]}})})},t.prototype.makePaymentUsingTokens=function(e,n,r){return __awaiter(this,void 0,void 0,function(){return __generator(this,function(t){switch(t.label){case 0:return[4,this.baseClass.getGatewayContract()];case 1:return[4,t.sent().makePaymentInTokens(e,n,r)];case 2:return[2,t.sent()]}})})},t}();e.EthPaymentGatewayClient=t}(EthPaymentGateway||(EthPaymentGateway={}));
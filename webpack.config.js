var path = require('path');
var webpack = require('webpack');

 module.exports = {
     entry: ['babel-polyfill','./src/client-gateway.js'],
     output: {
         path: path.resolve(__dirname, './src'),
         filename: 'client-gateway-compiled.js',
         libraryTarget: "var",
         library: "EthPaymentGatewayLib"
     },
     module: {
         rules: [
             {
                 test: /\.js$/,
                 loader: 'babel-loader',
                 query: {
                     presets: ['es2015']
                 }
             }
         ]
     },
     stats: {
         colors: true
     },
     devtool: 'source-map'   
 };
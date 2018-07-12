var gulp = require('gulp');
var ts = require('gulp-typescript');
var uglify = require('gulp-uglify');
var pump = require('pump');

gulp.task('client', function(cb){
    pump([ 
        gulp.src('web/src/ts/EthPaymentGatewayClient.ts'),
        ts({
            noImplicitAny: false,
            outFile: 'gateway-client.js'
        }),
        uglify(),
        gulp.dest('web/src/js')
    ], cb);
});

gulp.task('merchant', function(cb){
    pump([ 
        gulp.src('web/src/ts/EthPaymentGatewayMerchant.ts'),
        ts({
            noImplicitAny: false,
            outFile: 'gateway-merchant.js'
        }),
        uglify(),
        gulp.dest('web/src/js')
    ], cb);
});

gulp.task('admin', function(cb){
    pump([ 
        gulp.src('web/src/ts/EthPaymentGatewayAdmin.ts'),
        ts({
            noImplicitAny: false,
            outFile: 'gateway-admin.js'
        }),
        uglify(),
        gulp.dest('web/src/js')
    ], cb);
});
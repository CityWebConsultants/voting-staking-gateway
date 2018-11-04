const gulp = require('gulp')
const ts = require('gulp-typescript')
const uglify = require('gulp-uglify')
const pump = require('pump')
const copy = require('gulp-copy')

gulp.task('client', (cb) => {
    pump([ 
        gulp.src('web/src/ts/EthPaymentGatewayClient.ts'),
        ts({
            noImplicitAny: false,
            outFile: 'gateway-client.js',
            lib: ["es2015","es2015.promise", "dom"]
        }),
        //uglify(),
        gulp.dest('web/src/js')
    ], cb);
});

gulp.task('merchant', (cb) => {
    pump([ 
        gulp.src('web/src/ts/EthPaymentGatewayMerchant.ts'),
        ts({
            noImplicitAny: false,
            outFile: 'gateway-merchant.js',
            lib: ["es2015","es2015.promise", "dom"]
        }),
        //uglify(),
        gulp.dest('web/src/js')
    ], cb);
});

gulp.task('admin', (cb) => {
    pump([ 
        gulp.src('web/src/ts/EthPaymentGatewayAdmin.ts'),
        ts({
            noImplicitAny: false,
            outFile: 'gateway-admin.js',
            lib: ["es2015","es2015.promise", "dom"]
        }),
        //uglify(),
        gulp.dest('web/src/js')
    ], cb);
});

gulp.task('copyArtifacts', () => {
    gulp.src(
    ['build/contracts/PaymentGatewayContract.json', 'build/contracts/GatewayERC20Contract.json'])
    .pipe(copy('web/src/abis',  { prefix: 2 }))
})
var gulp = require('gulp');
var ts = require('gulp-typescript');
var uglify = require('gulp-uglify');
var pump = require('pump');

gulp.task('client', function(cb){
    pump([ 
        gulp.src('src/ts/EthPaymentGatewayClient.ts'),
        ts({
            noImplicitAny: true,
            outFile: 'gateway-client.js'
        }),
        uglify(),
        gulp.dest('src/js')
    ], cb);
});

gulp.task('admin', function(cb){
    pump([ 
        gulp.src('src/ts/EthPaymentGatewayAdmin.ts'),
        ts({
            noImplicitAny: true,
            outFile: 'gateway-admin.js'
        }),
        uglify(),
        gulp.dest('src/js')
    ], cb);
});
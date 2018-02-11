var gulp = require('gulp');
var fs = require('fs-extra');
var browserify = require('gulp-browserify');
var rename = require("gulp-rename");


fs.emptyDirSync('./build');

gulp.src([
'./src/common/**',
'./src/nodejs/**',
]).pipe(gulp.dest('./build'));

gulp.src('./src/browser/index.js')
.pipe(browserify())
.pipe(rename('ctxjs.js'))
.pipe(gulp.dest('./build/dist'));

process.on('beforeExit', function(){
    fs.copySync('./build/dist/ctxjs.js',`./demos/generic/public/ctxjs.js`);
    //fs.copySync('./build/dist/ctxjs.js',`./demos/test/ctxjs.js`);
    //fs.copySync('./build/nodejs',`./test/node_modules/ctx-framework`);
});

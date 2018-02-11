try{
    require('gulp');
    require('gulp-concat');
    require('gulp-sourcemaps');
    require('gulp-sass');
    require('through2');
}catch(error){
    console.error(`CTX: Failed to start development, install development dependencies using "npm install ctx-framework --only=dev" and try again.`)
    console.error(error);
    return;
}

const gulp = require('gulp');
const concat = require('gulp-concat');
const sourcemaps = require('gulp-sourcemaps');
const sass = require('gulp-sass');
const parsePrecompiler = require('./parsePrecompiler.js');

const fs 		       	= require('fs-extra');
const path 		       	= require('path');

const PUBLIC_CACHE = path.join(CTX.root, '/public/cache');
const PRIVATE_CACHE = path.join(CTX.root, '/private/cache');

CTX.development = {
    compile : compile
}
gulp.watch(path.join(CTX.root,'app.ctx.json')).on('change', function(event){
    console.log('CTX: app.ctx.json modified, restarting application.');
    process.exit();
});

fs.readJson(path.join(CTX.root, 'app.ctx.json'), function(error, info){
    if(!error){
        try{
            gulp.watch(info.controllers.app).on('change', function(event){
                console.log('CTX: App controller modified, restarting application.');
                try{
                    process.send("restart");
                }catch(error){
                    console.log('ERROR',error)
                }
            });
        }catch(error){}
    }
});

fs.readdir(path.join(CTX.root, 'nodes'), function(error, nodes){
    if(!error){
        nodes.forEach(function(node){
            watchNode(node);
        });
    }
});

function watchNode(node){
    var node_path = path.join(CTX.root, 'nodes', node);
    fs.readJson(path.join(node_path, 'node.ctx.json'), function(error, info){
        if(error){
            return;
        }

        var watchers = [];
        try{
            watchers.push(gulp.watch(path.join(node_path, 'node.ctx.json')).on('change', function(event) {
                // Restart App.
                watchers.forEach(function(watcher){
                    watcher.end();
                });
                watchNode(node);
            }));
        }catch(error){}

        try{
            watchers.push(gulp.watch(info.controllers.foreground, {cwd:node_path}).on('change', function(event) {
                compileNode(node);
            }));
        }catch(error){}

        try{
            watchers.push(gulp.watch(info.controllers.background, {cwd:node_path}).on('change', function(event) {
                compileNode(node);
            }));
        }catch(error){}

        try{
            watchers.push(gulp.watch(info.template, {cwd:node_path}).on('change', function(event) {
                compileNode(node);
            }));
        }catch(error){}

        try{
            watchers.push(gulp.watch(info.stylesheet, {cwd:node_path}).on('change', function(event) {
                compileNode(node);
            }));
        }catch(error){}
    });
}

function compile(){
    var nodes, callback;

    if(typeof(arguments[0]) == "function"){
        callback = arguments[0];
    }else{
        nodes = arguments[0];
        callback = arguments[1];
    }

    callback = typeof(callback) == "function" ? callback : function(){};

    try{
        nodes = typeof(nodes) == "string" ? [nodes] : typeof(nodes) == "object" ? nodes : [];
        if(!nodes.length){
            nodes = fs.readdirSync(path.join(CTX.root, 'nodes'));

            // Recompiling all nodes causes cache to be cleared
            fs.emptyDirSync(PUBLIC_CACHE);
            fs.emptyDirSync(PRIVATE_CACHE);
        }
    }catch(error){
        console.error(`CTX: Couldn't to find nodes to compile.`);
        console.error(error);
        callback();
        return;
    }


    console.log(`CTX: Compiling ${nodes.length} ${nodes.length == 1 ? "node" : "nodes"} : (${new Date().toLocaleTimeString()})`);

    var tasks = [
        compileAppController
    ];
    nodes.forEach(function(name){
        tasks.push(compileNode.bind(this, name));
    });

    CTX.async.parallel(tasks, callback);
}

CTX.Node = require('./Node');
var argv = require('minimist')(process.argv.slice(3));
var nodes = argv._[0];
const fs = require('fs-extra');
const path = require('path');
// nodes = arguments[0]; get from argv

nodes = typeof nodes == "string" && nodes.length ? [nodes] : [];
if(!nodes.length){
    nodes = CLI.findNodes(process.cwd());
}

console.log(`CTX: Compiling ${nodes.length} ${nodes.length == 1 ? "node" : "nodes"} : (${new Date().toLocaleTimeString()})`);

var tasks = [];
nodes.forEach(function(node_path){
    tasks.push(compileNode.bind(this, node_path));
});

CTX.async.parallel(tasks);

var require_paths = {};
function compileNode(node_path, callback){
    callback = typeof callback == "function" ? callback : function(){};

    var name = path.basename(node_path);
    fs.readJson(path.join(node_path, 'node.ctx.json'), function(error, node){
        if(error){
            console.error(`CTX: Failed to read node data for "${name}".`);
            if(CTX.verbose) console.error(error);
            else console.error(error.message);
            callback();
        }else{
            node.name = name;
            node.path = node_path;
            node.controllers = typeof node.controllers == "object" ? node.controllers : {};
            if(node.controllers.compiler){
                var controller_path = path.resolve(node_path, node.controllers.compiler);

                fs.readFile(controller_path, 'utf8', function(error, file){
                    if(error){
                        console.error(`CTX: Failed to read compiler controller for "${name}".`);
                        if(CTX.verbose) console.error(error);
                        else console.error(error.message);
                        callback();
                    }else{
                        node.controller = file;
                        node = new CTX.Node(node);

                        if(node.hasEvents('load')){
                            node.fireAsync('load', function(){
                                callback();
                            });
                        }else{
                            callback();
                        }
                    }
                });
            }
        }
    })
}

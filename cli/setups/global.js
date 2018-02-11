var EventEmitter = require('../classes/EventEmitter');
var CTX = new EventEmitter();

CTX.constructor.name = "CTX";
global.CTX = CTX;

CTX.EventEmitter = EventEmitter;

require('./async.js');

const fs = require('fs-extra');
const path = require('path');

global.CLI = {
    findNodes : function findNodes(dir){
        var stat = fs.statSync(dir);
        if(stat.isFile()){
            if(path.basename(dir) == "node.ctx.json"){
                return path.dirname(dir);
            }else{
                return;
            }
        }else{
            var files = fs.readdirSync(dir);
            var nodes = [];
            for(var i in files){
                var result = findNodes(path.join(dir,files[i]));

                switch(typeof result){
                    case "string":
                        nodes.push(result);
                        break;
                    case "object":
                        nodes = nodes.concat(result);
                        break;
                }
            }
            return nodes;
        }
    }
}

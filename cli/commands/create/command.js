/*  @desc   Responsible for creating new projects and nodes.
 */

var fs = require('fs-extra');
var path = require('path');

var argv = require('minimist')(process.argv.slice(2));

var node_path = argv._[1];
var dir = path.join(process.cwd(), node_path);

try{
    fs.ensureDirSync(dir);
}catch(error){}

softCopy('background.js');
softCopy('foreground.js');
softCopy('service.ctx.json');

function softCopy(file){
    var dest = path.join(dir, file);

    fs.stat(dest, function(error){
        if(error){
            fs.copy(path.join(__dirname, `service/${file}`), dest);
        }
    });
}

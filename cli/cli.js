#!/usr/bin/env node



require('./setups/global.js');
var path = require('path');
var fs = require('fs-extra');

var argv = require('minimist')(process.argv.slice(2));
if(argv.verbose){
    CTX.verbose = true;
}else{
    CTX.verbose = false;
}

if(argv.help){
    console.log(fs.readFileSync(path.join(__dirname, 'help.txt')).toString());
    return;
}else if(argv.version){
    var package = require(path.join(__dirname, 'package.json'));
    console.log(package.version);
}else{
    var command = process.argv[2];
    try{
        var command_path = path.resolve(__dirname, `commands/${command}/command.js`);
        require(command_path);
    }catch(error){
        console.error(`CTX: CLI command "${command}" failed.`);
        if(CTX.verbose) console.error(error);
        else console.error(error.message);
    }
}

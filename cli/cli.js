#!/usr/bin/env node

var path = require('path');
var fs = require('fs-extra');

var argv = require('minimist')(process.argv.slice(2));
if(argv.verbose){
    global.verbose = true;
}else{
    global.verbose = false;
}

if(argv.help || argv.h){
    showHelp();
}else if(argv.version || argv.v){
    var _package = require(path.join(__dirname, 'package.json'));
    console.log(_package.version);
}else{
    var command = process.argv[2];
    try{
        var command_path = path.resolve(__dirname, `commands/${command}/command.js`);
        require(command_path);
    }catch(error){
        if(verbose) console.error(error);
        showHelp();
    }
}

function showHelp(){
    console.log(fs.readFileSync(path.join(__dirname, 'help.txt')).toString());
}

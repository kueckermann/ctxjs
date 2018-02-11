const fs = require('fs-extra');
const path = require('path');
const async = require('async');
const shortid = require('shortid');
const colors = require('colors');

var argv = require('minimist')(process.argv.slice(2));

var import_url = argv._[1];
import_url = import_url[import_url.length-1] == "/" ? import_url.slice(0,-1) : import_url;

var export_path = process.cwd();
if(!export_path){
    throw new Error('Please provide a CTX project path as the second argument.');
}

global.import_url = import_url;
global.export_path = export_path;
global.asset_path = path.join(export_path, 'public/assets');
global.asset_root = argv['asset-root'] || "";

global.pages = {};
global.exports = {};
global.cheerio_options = {
    decodeEntities: false
}
if(CTX.verbose) console.log(`Origin:`.cyan, `${import_url}`.green, ` Root:`.cyan, `${export_path}`.green);
if(CTX.verbose) console.log(`- - - - - - - - - - - - - - - - - - - -`);

async.series({
    pages : function(callback){
        require(`${__dirname}/scripts/pages.js`)(function(error){
            callback(error);
        });
    },
    assets : function(callback){
        require(`${__dirname}/scripts/assets.js`)(function(error){
            callback(error);
        });
    },
    parse : function(callback){
        require(`${__dirname}/scripts/parse.js`)(function(error){
            callback(error);
        });
    },
    map : function(callback){
        require(`${__dirname}/scripts/map.js`)(function(error){
            callback(error);
        });
    }
}, function(error){
    if(error){
        console.error(error);
    }
});
const fs = require('fs-extra');
const path = require('path');
const async = require('async');
const cheerio = require('cheerio');
const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();
const beautify = require('js-beautify').html;
const mime = require('mime-types');

module.exports = function(callback){
    // Find mappings
    if(CTX.verbose) console.log(`- - - - - - - - - - - - - - - - - - - -`);

    var tasks = [];

    var sorted_exports = Object.keys(global.exports).sort();
    sorted_exports.forEach(function(ex_path){
        var ex = global.exports[ex_path];
        if(CTX.verbose){
            console.log(`Export:`.cyan, `${ex.dest}`.green);

            for(var i in ex.mappings){
                var map = ex.mappings[i];
                console.log(`  » Map:`.cyan, map.id ? `${map.id}`.green : 'Overwriting'.red, ` Origin:`.cyan, `${map.origin}`.green);
            }

            console.log(``);
        }


        tasks.push(function(callback){
            var resolved_export_path = path.resolve(global.export_path, ex.dest);
            fs.readFile(resolved_export_path, function(error, file){
                file = file || "";

                switch(mime.lookup(ex.dest)){
                    case 'text/html':
                        file = mapHTML(ex, file);
                    break;
                    case 'application/json':
                        console.log(`Json mapping not implemented in this version.`);
                    break;
                    case 'application/javascript':
                        file = mapJS(ex, file);
                    break;
                    default:
                        file = content;
                    break;
                }

                fs.ensureDir(path.dirname(resolved_export_path), function(){
                    fs.writeFile(resolved_export_path, file, function(error){
                        if(error){
                            console.error(`Failed to write export to "${export_path}".`.bgRed);
                            if(CTX.verbose) console.log(error.toString().cyan);
                        }
                        callback();
                    });
                });
            });
        });
    });

    async.parallel(tasks, callback);
}

function mapJS(ex, file){
    file = file.toString();

    for(var id in maps){
        var map = ex.mappings[id];
        var map_reg = new RegExp(`(\\/\\*[\\s\\S]*?CTX\\(.*map=["']?${map.id}["']?.*\\)[\\s\\S]*?{[\\s\\S]*?\\*\\/)([\\s\\S]*?)(\\/\\*[\\s\\S]*?}[\\s\\S]*?\\*\\/)`, `g`);
        if(map_reg.test(file)){
            file = file.replace(map_reg, `$1${map.content}$3`);
        }else{
            file += `\n/*CTX(map="${map.id}"){*/${map.content}/*}*/`;
        }
    }

    return file;
}

function mapHTML(ex, file){
    file = file.toString();

    var reg =  /([\w\W]*?<\/head>[\w\W]*)(<body[\w\W]*<\/body>)([\w\W]*)/g;
    var hb = reg.exec(file);

    var dom = cheerio.load(hb ? hb[2] : `<body>${file}</body>`, cheerio_options)('body');

    for(var id in ex.mappings){
        var map = ex.mappings[id];

        if(!map.id){
            hb = reg.exec(map.content);
            file = map.content;
            dom = cheerio.load(hb ? hb[2] : map.content, cheerio_options)('body');
        }else{
            var els = dom.find(`[ctx-map="${map.id}"]`);
            var c = cheerio.load(map.content, cheerio_options)('body');
            c = /<body[\w\W]*<\/body>/g.test(map.content) ? c : c.children();

            if(els.length){
                els.replaceWith(c);
            }else{
                dom.append(c);
            }
        }
    }

    if(hb){
        file = file.replace(reg, `$1${dom.toString()}$3`);
        //file = cheerio(dom, cheerio_options).toString();
    }else{
        file = dom.html();
    }

    file = beautify(file, {
        content_unformatted : ['script', 'style'],
    });
    return file;
}

function findAttr(attr, val, node){
    var f = [];

    if(node && node.length){
        for(var i = 0; i < node.length; i++){
           f = f.concat(findAttr(attr, val, node[i]));
        }
   }else if(node && node.attribs){
        if(node.attribs && node.attribs[attr] === val) f.push(node);
        if(node.children && node.children.length){
            f = f.concat(findAttr(attr, val, node.children));
       }
    }

    return f;
}

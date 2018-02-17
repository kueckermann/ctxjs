const path = require('path');
const fs = require('fs-extra');
const async = require('async');
const cheerio = require('cheerio');
const colors = require('colors');
const htmlparser = require("htmlparser2");
const du = htmlparser.DomUtils;

var functions = {
    edit : function(el, page_url){
        var func = el.attr('ctx-edit');
        el.removeAttr('ctx-edit');

        try{
            var f = new Function(func);
            f.call(el);
        }catch(error){
            console.error(`Failed to evaluate ctx-edit in page "${page_url}".`);
            console.error(func);
            if(CTX.verbose) console.error(error);
            else console.error(error.message)
        }

        el.removeAttr('ctx-edit');
    },
    toggle : function(el){
        var logic = el.attr('ctx-toggle') || "true";
        el.removeAttr('ctx-toggle');
        el.replaceWith(`{{ if(${logic}){ }}${el.toString()}{{ } }}`);
    }
}

function parseFunctions(element, page_url){
    for(var f_name in functions){
        let f = functions[f_name];
        var elements = [];

        // Check if the current element has functions
        if(typeof(element[0].attribs[`ctx-${f_name}`]) == "string"){
            elements.push(element);
        }

        // Process sub elements
        let els = element.find(`[ctx-${f_name}]`);
        els.each(function(i, el){
            el = cheerio(el, global.cheerio_options);
            elements.push(el);
        });

        elements.reverse().forEach(function(el){
            try{
                f(el, page_url);
            }catch(error){
                console.error(error);
            }
        });
    }
}

module.exports = function(callback){
    for(var page_url in global.pages){
        var elements = [];
        var els = pages[page_url](`[ctx-export]`);
        els.each(function(i, el){
            elements.push(cheerio(el, global.cheerio_options));
        });

        elements.reverse().forEach(function(el){
            var export_path = el.attr(`ctx-export`);
            el.removeAttr('ctx-export');
            el.remove();

            parseFunctions(el, page_url);

            resolved_export_path = path.resolve(global.export_path, export_path);
            global.exports[resolved_export_path] = global.exports[resolved_export_path] || {
                dest     : path.relative(global.export_path, resolved_export_path),
                mappings  : {}
            }

            var src = page_url.replace(/[\s\S]*:\/\/[\s\S]*?(?=\/|$)/g, '');
            var ex = global.exports[resolved_export_path];
            var map = createMapping(el, src);

            ex.mappings[map.id] = map;

            var els = el.find(`[ctx-map]`);
            els.each(function(i, el){
                el = cheerio(el, global.cheerio_options);
                var map = createMapping(el, src);
                ex.mappings[map.id] =map;
            });
        });
    }

    callback();
}

function createMapping(el, src){
    var id = el.attr('ctx-map') || "ctx";
    el.attr('ctx-map', id); // Force mapping

    var type = el.attr('ctx-type') || 'html';
    el.removeAttr('ctx-type');

    var rule = el.attr('ctx-rule') || 'replace';
    el.removeAttr('ctx-rule');


    var content = "";
    switch(type){
        case 'text':
            content = el.text(); //du.getText(el[0]);
        break;
        default:
            content = el.toString();//du.getOuterHTML(el[0]);//el.toString();
        break;
    }

    var origin = `~${src}`;
    if(el[0].attribs.id){
        origin = `${origin} #${el[0].attribs.id}`;
    }else if(el[0].attribs.class){
        origin = `${origin} .${el[0].attribs.class.split(' ')[0]}`;
    }else{
        origin = `${origin} ${el[0].name}`;
    }

    var map = {
        id      : id,
        type    : type,
        rule    : rule,
        content : content,
        src     : src,
        origin  : origin,
    }

    return map;
}

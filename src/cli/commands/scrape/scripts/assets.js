const path = require('path');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const mime = require('mime-types');
const request = require('request');
request.defaults({
    timeout : 5*1000
});
const async = require('async-min');

var assets_to_fetch = {};
var css_assets_to_fetch = {};

module.exports = function(done){
    try{
        fs.ensureDirSync(asset_path);
    }catch(err){};

    async.series({
        html : function(cb){
            for(var i in pages){
                findAssetsInHtml(pages[i]);
            }

            var tasks = [];

            for(var i in assets_to_fetch){
                tasks.push(function(asset, cb){
                    fetchAsset(asset, cb);
                }.bind(this, assets_to_fetch[i]));
            }

            async.parallel(tasks, cb);
        },
        css : function(cb){
            var tasks = [];

            for(var i in css_assets_to_fetch){
                tasks.push(function(asset, cb){
                    fetchAsset(asset, cb);
                }.bind(this, css_assets_to_fetch[i]));
            }

            async.parallel(tasks, cb);
        }
    }, done);
}

function findAssetsInHtml(page){
    page('[srcset]').each(function(i, el){
        el = cheerio(el);

        el.removeAttr('srcset');
        el.removeAttr('sizes');
        // var srcset = el.attr('srcset');
        // var srcs = srcset.split(',');
        //
        // srcs.forEach(function(src, i){
        //     src = src.trim().split(' ');
        //
        //     var url = src[0].trim();
        //
        //     if(!/\w+:\/\//.test(url)){
        //         var asset = createAsset(url);
        //         assets_to_fetch[asset.url] = asset;
        //
        //         src[0] = `/public/assets/${asset.filename}`;
        //     }
        //
        //     srcs[i] = src.join(' ');
        // });
        //
        // srcs.filter(function(el){return el});
        // el.attr('srcset', srcs.join(', '));
    });

    page('[href], [src]').each(function(i, el){
        switch(el.name){
            case "a":
                var url = el.attribs.href;
                url = url == '#' ? '' : url;

                if(!/http/.test(url) && /\.html/.test(url)){
                    url = url.replace('.html', '');
                    url = url.length ? url[0] == '/' ? url : `/${url}` : '';
                    url = url == '/index' ? '/' : url;
                }

                if(!url.length){
                    delete el.attribs.href;
                }else{
                    el.attribs.href = url;
                }
            break;
            case "iframe":
                // Ignore
            break;
            default:
                var attr = el.attribs.href ? "href" : "src";
                el = cheerio(el);

                var url = el.attr(attr);
                if(/\w+:\/\//.test(url)){
                    var asset = createAsset(url);
                    assets_to_fetch[asset.url] = asset;

                    el.attr(attr, `${asset_root}/public/assets/${asset.filename}`);
                }
            break;
        }
    });
}

function findAssetsInCss(content){
    content = content || "";

    return content.replace(/url\(.*?\)/g, function(el){
        if(!/https?:\/\//.test(el)) return el;
        var url = el.slice(4,-1);
        if(/['"]/.test(url[0])){
            url = url.slice(1,-1);
        }

        var asset = createAsset(url);

        css_assets_to_fetch[asset.url] = asset;
        return `url(./${asset.filename})`;
    });
}

function fetchAsset(asset, done){
    callback = typeof callback == "function" ? callback : function(){};

    request({
        url : asset.url,
        gzip : true,
        encoding : null,
    }, function(err, res, content){
        if(err){
            console.error(`Failed to download asset: ${asset.url}`);
            if(CTX.verbose) console.error(err);
            done();
        }else{
            var type = mime.lookup(asset.filename);
            if(type == 'text/css'){
                content = findAssetsInCss(content.toString());
            }

            fs.writeFile(path.join(asset_path, asset.filename), content, function(err){
                done();
            });
        }
    });
}

function createAsset(url){
    var asset = {
        url : url,
        filename : path.basename(url)
    }


    asset.filename = decodeURIComponent(asset.filename);
    var version_number_reg = /\.[a-zA-Z0-9]+?\.(?=css|js)/g;
    if(version_number_reg.test(asset.filename)){
        asset.filename = asset.filename.replace(version_number_reg, '.');
    }

    // Clean out version number
    //asset.filename = asset.filename.replace(version_number_reg, ".");
    return asset;
}

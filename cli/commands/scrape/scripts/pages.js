const path = require('path');
const fs = require('fs-extra');
const cheerio = require('cheerio');
const request = require('request');
const colors = require('colors');
const async = require('async-min');
const xml2json = require('xml2js').parseString;

var pages_to_get = [];

module.exports = function(done){
    async.series({
        sitemap : function(cb){
            request(`${import_url}/sitemap.xml`, function(err, response, xml){
                // if(!err && response.statusCode < 400){
                //     try{
                //         fs.emptyDirSync(asset_path);
                //     }catch(err){}
                // }

                xml2json(xml, function (err, sitemap){
                    try{
                        sitemap.urlset.url.forEach(function(url){
                            pages_to_get.push(url.loc[0]);
                        });
                    }catch(err){
                        pages_to_get.push(import_url);
                    }
                    cb();
                });
            });
        },
        pages : function(cb){
            var tasks = [];
            pages_to_get.forEach(function(url){
                if(verbose) console.log(`Downloading:`.cyan, `${url}`.green);

                tasks.push(function(cb){
                    request(url, function(error, response, html){
                        if(error){
                            if(verbose) console.error(error);
                        }else{
                            pages[url] = cheerio.load(html);
                        }
                        cb();
                    });
                });
            });

            async.parallel(tasks, cb);
        }
    }, done);
}

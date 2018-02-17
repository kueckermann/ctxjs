var fs = require('fs-extra');
var path = require('path');

// Rename background and foreground to backend and frontend
    var files = findFiles('service.ctx.json', process.cwd());
    files.forEach(function(fpath){
        var js = fs.readJson(fpath, function(err, json){
            try{
                if(json.controllers.background){
                    json.controllers.backend = json.controllers.background;
                    delete json.controllers.background;
                    json.controllers.backend = json.controllers.backend ? json.controllers.backend.replace('background', 'backend') : json.controllers.backend;
                }

                if(json.controllers.foreground){
                    json.controllers.frontend = json.controllers.foreground;
                    delete json.controllers.foreground;
                    json.controllers.frontend = json.controllers.frontend ? json.controllers.frontend.replace('foreground', 'frontend') : json.controllers.frontend;
                }
                fs.writeJson(fpath, json);
            }catch(err){};
        });
    });

    var files = findFiles('foreground.js', process.cwd());
    files.forEach(function(fpath){
        fs.move(fpath, path.join(path.dirname(fpath), 'frontend.js'));
    });

    var files = findFiles('background.js', process.cwd());
    files.forEach(function(fpath){
        fs.move(fpath, path.join(path.dirname(fpath), 'backend.js'));
    });







function findFiles(fname, cpath){
    var found = [];
    try{
        var s = fs.statSync(cpath);
        if(s.isDirectory()){
            var dir = fs.readdirSync(cpath);
            for(var i in dir){
                found = found.concat(findFiles(fname, path.join(cpath, dir[i])));
            }
        }else{
            if(path.basename(cpath) == fname){
                return [cpath];
            }
        }
    }catch(err){
        console.error(err);
    }
    return found;
}

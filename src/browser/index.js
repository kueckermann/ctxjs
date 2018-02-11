// Default browserify next tick has issues with messaging system.
process.nextTick = null;
process.nextTick = require('next-tick');

require('../common/setups/interface.js');

var location = global.location instanceof Object ? global.location : {};
switch (location.protocol) {
    case 'file:':
        //CTX.config.origin = CTX._path.dirname(location.href || '');
        CTX.config.path = CTX._path.dirname(location.href || '');
        CTX.Module.paths.push(CTX._path.join(CTX.config.path, 'node_modules'));
        break;
    case 'http:':
    case 'https:':
        //CTX.config.origin = location.origin || '';
        CTX.config.path = location.origin || '';
        break;
}

CTX._fs.readFile = function(file, cb){
	var req = new XMLHttpRequest();
	req.open("GET", file, true);
    req.setRequestHeader("Content-type", "text/plain");

	req.onload = function(){
		if(req.status < 400){
			cb(undefined, req.responseText, req);
		}else{
            var err = new Error(req.responseText);
            err.status = req.status;
			cb(err, undefined, req);
		}
	}
	req.onerror = function(err){
		cb(err);
	}
	req.send('');
}

module.exports = CTX;

var fs = require('fs');
var async = require('async-min');
require('./setups/interface.js');

CTX.Module.paths.push(CTX._path.join(CTX.config.path, 'node_modules'));

CTX.listen = function(){
    var io = require('socket.io');
        io = io.apply(io, arguments);

    var nsp = io.of('/__CTX__');
    nsp.on('connection', function(socket){
        // What happens when a new connection comes in??
        // - Could be requesting connection to an active service
        // - Cloud be requesting to start a new service
        // - Could be requesting to restart a
        // Bridge protocols
        CTX.localhost.connect(socket);
    });

    return io;
}

CTX._fs.readFile = function(file, cb){
    fs.readFile(file, 'utf8', cb);
}

module.exports = CTX;

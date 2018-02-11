// GLOBAL PROTOCOLS
// __CTX__START        Start a background process
// __CTX__CONNECT      Start a background process
// __CTX__RESTART      Restart a service background process
// __CTX__SERVICE_#ID          Protocol layer to communicate with a service.
// __CTX__REQUIRE              Require a module

var io = require('socket.io-client');
var toArray = require('to-array');
var Emitter = require('component-emitter');
var async = require('async-min');
var localhost = new Emitter();

Object.defineProperty(CTX, 'localhost', {
    set : function(socket){
        CTX._origins[''] = socket;
    },
    get : function(){
        return CTX._origins[''];
    }
});

CTX.localhost = localhost;
localhost.on('__CTX__REQUIRE', function(requests, done){
    CTX.Module._fetch(requests, done);
});

localhost.on('__CTX__START', function(options, done){
    var _package = CTX.Service._cache[options.path];
    if(_package && CTX.config.cache !== false){
        done(null, _package);
    }else{
        // Need to remove any protocols and add them back later.
        var base_path = CTX._path.join(CTX.config.path, options.path);
        CTX._fs.readFile(base_path+'/service.ctx.json', function(error, file){
            // Starts building compiling assets package
            if(error){
                done(error);
                return;
            }

            var _descriptor = {};
            try{
                _descriptor = JSON.parse(file);
            }catch(error){
                done(error);
                return;
            }

            var _package = {
                path    : options.path,
                controllers : {},
                _descriptor : _descriptor
            }

            _descriptor.controllers = _descriptor.controllers instanceof Object ? _descriptor.controllers : {};

            async.parallel({
                bg : function(cb){
                    if(_descriptor.controllers.background){
                        CTX._fs.readFile(CTX._path.join(base_path, _descriptor.controllers.background), function(error, file){
                            if(error){
                                console.error('CTX: Failed to read controller for "'+_package.path+'".');
                                if(CTX.config.verbose) console.error(error);
                                else console.error(error.message);
                            }else{
                                try{
                                    if(!/sourceURL=/g.test(file)){
                                        file += '\n//# sourceURL='+_package.path
                                    }

                                    _package.controllers.background = file;
                                }catch(error){
                                    console.error('CTX: Failed to evaluate controller for "'+_package.path+'".');
                                    if(CTX.config.verbose) console.error(error);
                                    else console.error(error.message);
                                }
                            }

                            cb();
                        });
                    }else{
                        cb();
                    }
                },
                fg : function(cb){
                    if(_descriptor.controllers.foreground){
                        CTX._fs.readFile(CTX._path.join(base_path, _descriptor.controllers.foreground), function(error, file){
                            if(error){
                                console.error('CTX: Failed to read controller for "'+_package.path+'".');
                                if(CTX.config.verbose) console.error(error);
                                else console.error(error.message);
                            }else{
                                if(!/sourceURL=/g.test(file)){
                                    file += '\n//# sourceURL='+_package.path;
                                }
                                _package.controllers.foreground = file;
                            }

                            cb();
                        });
                    }else{
                        cb();
                    }
                }
            }, function(error, data){
                if(error){
                    done(error);
                }else{
                    try{
                        _package.controller = new Function('require', 'global', 'process',_package.controllers.background);
                    }catch(error){
                        console.error('CTX: Failed to evaluate controller for "'+_package.path+'".');
                        if(CTX.config.verbose) console.error(error);
                        else console.error(error.message);
                    }

                    CTX.Service._cache[_package.path] = _package;
                    done(undefined,  _package);
                }
            });
        });
    }
});

localhost.connect = function(socket){
    // Bridges socket protocol events from a socket to localhost
    // for CTX based functions.

    socket.on('__CTX__CONNECT', function(_id){
        try{
            CTX.Service._running[_id]._socket = socket;
        }catch(error){}
    });

    socket.on('__CTX__START', function(options, done){
        // We have arrived at the origin, so delete the origin request.
        var origin = options.origin;
        delete options.origin;

        // Force new incoming requests from clients to be unique.
        options.unique = true;
        CTX.start(options, function(error, service){
            if(error){
                done(error);
            }else{
                var _package = service.toJSON();
                _package.origin = origin;
                done(undefined, _package);
            }
        });
    });


    socket.on('__CTX__REQUIRE', function(requests, done){
        CTX.Module._fetch(requests, done);
    });
}



module.exports = localhost;

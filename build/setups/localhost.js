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
    var assets = CTX.Service._cache[options.path];
    if(assets && CTX.config.cache !== false){
        done(null, assets);
    }else{
        // Need to remove any protocols and add them back later.
        var base_path = CTX._path.join(CTX.config.path, options.path);
        CTX._fs.readFile(base_path+'/service.ctx.json', function(error, file){
            // Starts building compiling assets package
            if(error){
                done(error);
                return;
            }

            var descriptor = {};
            try{
                descriptor = JSON.parse(file);
            }catch(error){
                done(error);
                return;
            }

            var assets = {
                path    : options.path,
                descriptor : descriptor,
                controllers : {},
            }

            descriptor.controllers = descriptor.controllers instanceof Object ? descriptor.controllers : {};

            async.parallel({
                local : function(cb){
                    if(descriptor.controllers.local){
                        CTX._fs.readFile(CTX._path.join(base_path, descriptor.controllers.local), function(error, file){
                            if(error){
                                console.error('CTX: Failed to read controller for "'+assets.path+'".');
                                if(CTX.config.verbose) console.error(error);
                                else console.error(error.message);
                            }else{
                                try{
                                    if(!/sourceURL=/g.test(file)){
                                        file += '\n//# sourceURL='+CTX._path.join(assets.path, 'controller');
                                    }

                                    assets.controllers.local = file;
                                }catch(error){
                                    console.error('CTX: Failed to evaluate controller for "'+assets.path+'".');
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
                remote : function(cb){
                    if(descriptor.controllers.remote){
                        CTX._fs.readFile(CTX._path.join(base_path, descriptor.controllers.remote), function(error, file){
                            if(error){
                                console.error('CTX: Failed to read controller for "'+assets.path+'".');
                                if(CTX.config.verbose) console.error(error);
                                else console.error(error.message);
                            }else{
                                if(!/sourceURL=/g.test(file)){
                                    file += '\n//# sourceURL='+CTX._path.join(assets.path, 'interface');
                                }
                                assets.controllers.remote = file;
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
                    done(undefined,  assets);
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
        options.reference = false;
        CTX.start(options, function(error, service){
            if(error){
                done(error);
            }else{
                var assets = service.toJSON();
                assets.origin = origin;
                done(undefined, assets);
            }
        });
    });


    socket.on('__CTX__REQUIRE', function(requests, done){
        CTX.Module._fetch(requests, done);
    });
}



module.exports = localhost;

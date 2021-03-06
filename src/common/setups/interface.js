var io = require('socket.io-client');
var Emitter = require('component-emitter');
var toArray = require('to-array');
var parseuri = require('parseuri');

// Namespace
var CTX = new Emitter();
global.CTX = CTX;

// Parameters
CTX.config = {
    verbose : false,
    cache : true,
    path : process.cwd(),
    //origin : "", // This gets defined better by localhost.
}

CTX._origins = {};

require('./localhost.js');


// Functions
CTX._fs = {
    readFile : function(){}
}

CTX._generateId = function(arg){
    var type = typeof arguments[0];
    var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    var n_chars = chars.length;
    var length = 32;

    switch (type) {
        case 'string':
            length = typeof arguments[1] == 'number' ? arguments[1] : length;
            var id = new Array(length);

            var arg_length = arg.length;
            var diff = Math.max(length-arg_length, 0);

            for(var i=0; i<diff; i++){
                arg += arg[i%arg_length];
            }

            for(var i=0; i<arg.length; i++){
                id[i%length] = chars[arg.charCodeAt(i)%n_chars];
            }
            return id.join('');
        case 'number':
            length = arg;
        default:
            var id = new Array(length);
            for(var i=0; i<length; i++){
                id[i] = chars[Math.floor(Math.random()*n_chars)];
            }
            return id.join('');
    }
}

var proto_reg = /^\w+:\/{2,}/;
CTX._path = {
    join : function(a, b){
        var args = toArray(arguments);
        var join = [];

        var proto = args[0].match(proto_reg);
        proto = proto ? proto[0] : '';

        args.forEach(function(el){
            el = CTX._path.normalize(el).replace(proto_reg, '').split('/');
            el.forEach(function(seg){
                switch(seg){
                    case '..':
                        var last = join[join.length-1];
                        if(last.length && last !== '..'){
                            join.pop();
                        }else{
                            join.push('..');
                        }
                        break;
                    case '.':
                        // Ignore
                        break;
                    default:
                        join.push(seg);
                        break;
                }
            });
        });

        return CTX._path.normalize(proto+(join.join('/')));
    },
    isAbsolute : function(a){
        return /^(\/|(\w+\:\/))/.test(CTX._path.normalize(a));
    },
    extname : function(a){
        var b = CTX._path.normalize(a).match(/\.\w+$/);
        return b ? b[0] : '';
    },
    dirname : function(a){
        return CTX._path.normalize(a).replace(/\/+[\w\.]*$/, '');
    },
    basename : function(a){
        var b = CTX._path.normalize(a).match(/\/+[\w\.]*$/, '');
        return b ? b[0].slice(1) : a;
    },
    normalize : function(a){
        // Keep protocols.
        var proto = a.match(proto_reg);
        proto = proto ? proto[0] : '';
        a = a.replace(proto_reg, '');
        return proto+(a.replace(/\\/g, '/').replace(/\/{2,}/g,'/').replace(/\/$/, ''));
    }
}


// Classes
CTX.Service = require('../classes/Service.js');
CTX.Module = require('../classes/Module.js');

CTX.start = function start(){
    // Starts a new instance of a service.
    var options = {};
    var done = function(error){
        if(error){
            console.error('CTX: Failed to start service "'+options.path+'".');
            if(CTX.config.verbose) console.error(error);
        }
    }

    switch(typeof arguments[0]){
        case 'object':
            // argument 0 is options
            options = arguments[0];
        break;
        case 'string':
            // argument 0 is path
            if(typeof arguments[1] == 'object'){
                options = arguments[1];
            }
            options.path = arguments[0];
        break;
    }

    if(typeof arguments[1] == 'function'){
        done = arguments[1];
    }else if(typeof arguments[2] == 'function'){
        done = arguments[2];
    }

    options.path = '/'+CTX._path.normalize(options.path).replace(/^\//g, '');

    var socket = CTX.connect(options.origin);
    var events = new Emitter();

    process.nextTick(function(){
        var reference;

        // Check if a service is already running via the discrete reference.
        // The default is unless is to use the same discrete reference unless
        // true is specified or a different discrete reference.

        if(options.reference !== false){
            reference = CTX._generateId((options.origin || '')+':'+(options.reference || options.path));
            options.reference = reference; // Dont pass reference to onwards.

            if(CTX.Service._reference[reference]){
                var service = CTX.Service._reference[reference];
                events.emit('complete', undefined, service);
                events.emit('success', service);
                events.off();
                done(undefined, service);
                return;
            }
        }

        // Fetch service package
        if(options.cache !== false && CTX.config.cache === true && CTX.Service._cache[options.path]){
            // Look up cached assets
            startService(undefined, CTX.Service._cache[options.path]);
        }else{
            socket.emit('__CTX__START', options, startService);
        }

        function startService(error, assets){
            var service;
            if(!error){
                try{
                    options.assets = assets;
                    options._reference = reference;
                    service = new CTX.Service(options);
                }catch(caught){
                    error = caught;
                }
            }

            events.emit('complete', error, service);

            if(error){
                events.emit('error', error);
                done(error);
                return;
            }else{
                events.emit('success', service);
            }
            events.off();

            service.on('running', function(error){
                done(error, service);
            });
        }
    });

    return events;
}

CTX.connect = function(origin){
    origin = typeof origin == 'string' ? parseuri(origin).source : '';

    var socket = CTX._origins[origin];
    if(!socket){
        socket = io(origin+'/__CTX__');
        CTX._origins[origin] = socket;
    }

    return socket;
}

CTX.listen = function listen(){};

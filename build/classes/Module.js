var NativeModule = require('module');
var async = require('async-min');

function Module(content, path){
    this.content = typeof content == 'string' ? content : "";
    this.path = typeof path == 'string' ? path : "";

    if(!/sourceURL=/g.test(this.content)){
        this.content += '\n//# sourceURL='+this.path
    }

    this.extension = CTX._path.extname(this.path);
    this.loaded = false;
    this.exports = {};
}

Module.cache = {};
Module.natives = {};

try{
    var natives = {};
    Object.keys(process.binding('natives')).forEach(function(key){
        // True signifies to do a lookup.
        natives[key] = true;
    });
    Module.natives = natives;
}catch(err){};

Module.paths = [];

Module.prototype._compile = function(){
    if(this.loaded) return;

    // Strip shebang.
    var content = this.content.replace(/#!.*/, '');

    switch(this.extension){
        case ".json":
            this.exports = JSON.parse(this.content);
        break;
        case ".js":
            if(typeof NativeModule == 'function' && NativeModule._nodeModulePaths){
                // Use the native module compiler.
                console.log('MODULE', this);
                var faux_module = new NativeModule(this.path);
                faux_module.filename = this.path;
                faux_module.paths =  NativeModule._nodeModulePaths(this.path);
                faux_module._compile(this.content, this.path);
                this.exports = faux_module.exports;
            }else{
                var f = new Function('exports', 'require', 'module', '__filename', '__dirname', content);
                f.call(this.exports, this.exports, function(request){
                    // Check natives
                    switch(typeof Module.natives[request]){
                        case 'boolean':
                        case 'undefined':
                            return require(request);
                            break;
                        default:
                            return Module.natives[request];
                            break;
                    }
                }, this, CTX._path.basename(this.path), CTX._path.dirname(this.path));
            }
        break;
        default:
            // Default is plain text
            this.exports = this.content;
        break;
    }

    this.loaded = true;
}

Module.prototype.toJSON =
Module.prototype.toString = function (){
    return this.content;
}

var native_require_cache = {};
Module._nrc = native_require_cache;

var fallback_require = function(request){
    if(Module.natives[request]){
        if(Module.natives[request] === true){
            return require(request);
        }else{
            return Module.natives[request];
        }
    }else{
        return require(request);
    }
}

Module._makeNativeRequire = function (path){
    if(typeof NativeModule == 'function'){
        path = path || '';
        var base_path = CTX._path.join(CTX.config.path, CTX._path.dirname(path));
        // This needs to be setup in a more solid way.
        // Perhaps caching the native modules to base paths;
        if(native_require_cache[base_path]){
            return native_require_cache[base_path];
        }else{
            var n_module = new NativeModule(base_path, require);
            n_module.filename = base_path;
            n_module.paths = NativeModule._nodeModulePaths(base_path)
            native_require_cache[base_path] = n_module.require;
            return n_module.require;
        }
    }else{
        return fallback_require;
    }
}

Module.require = Module._makeNativeRequire();

Module._fetch = function(requests, done){
    // Bind require to a service to have service specific requirements
    requests = requests instanceof Object ? requests : [requests];
    done = done instanceof Function ? done : function(){};

    var self = this;
    var errors = requests instanceof Array ? [] : {};
    var fetched_modules = {};

    var lookup_requests = {};
    var native_requests = {};

    var cache_mapping = {};

    // The next look will organize the requests into different categories.
    for(var key in requests){
        fetched_modules[key] = undefined; // Requirment should be fulfilled.
        var request = requests[key];

		if(Module.cache[request] && CTX.config.cache !== false){
			fetched_modules[key] = Module.cache[request];
		}else if(Module.natives[request]){
            native_requests[key] = request;
        }else{
            lookup_requests[key] = request;
        }
    }

    async.parallel({
        lookup : function(cb){
            if(Object.keys(lookup_requests).length){
                var tasks = {};
                for(var key in lookup_requests){
                    tasks[key] = function(key, cb){
                        lookup.call(self, lookup_requests[key], function(err, _module){
                            if(err){
                                errors[key] = err;
                            }else{
    							//Module.cache[cache_mapping[key]] = _module;
    		                    fetched_modules[key] = _module;
                            }
                            cb();
                        });
                    }.bind(this, key);
                }

                async.parallel(tasks, cb);
            }else{
                cb();
            }
        },
        native : function(cb){
            if(Object.keys(native_requests).length){
                for(var key in native_requests){
                    var request = native_requests[key];
                    var faux_module = new Module();
                    faux_module.loaded = true;

                    if(Module.natives[request] === true){
                        // Do native lookup
                        try{
                            faux_module.exports = require(native_requests[request]);
                        }catch(err){
                            errors[key] = err;
                        }
                    }else{
                        // Use provided module
    					faux_module.exports = Module.natives[request];
                        fetched_modules[key] = faux_module
                    }
                }

                cb();
            }else{
                cb();
            }
        }
    }, function(){
		done(errors, fetched_modules);
    });
}

function lookup(request, done){
	// Looksup a module from filesystem and returns the module.
    request = CTX._path.normalize(request);

    var module_lookup = !/^((\.\.?\/)|\/)/.test(request);
    var package_lookup = !CTX._path.extname(request) ? true : false;
    if(package_lookup) request = CTX._path.join(request, 'package.json');

    var paths = [];
    if(module_lookup){
        // Create module lookup paths
        Module.paths.forEach(function(path){
            paths.push(CTX._path.join(path, request));
        });
    }else{
		paths.push(CTX._path.join(CTX.config.path, request));
    }

    paths = paths.reverse();
    // Reverse to allow popping first off the end.
    // If request is absolute then lookup just with request otherwise use paths.

    var file_path = paths.pop();
    CTX._fs.readFile(file_path, checkFile.bind(this, file_path));

    function checkFile(file_path, err, content){
		if(err){
			// If there is still remaining directory, go ahead and perform next lookup
			if(!paths.length){
				// In this case we have reached the end of the search.
				done(err);
			}else{
				var file_path = paths.pop();
				CTX._fs.readFile(file_path, checkFile.bind(this, file_path));
			}
		}else{
			// Found a file.
        	if(package_lookup){
                // Found an npm module, go ahead and parse package.json
                try{
                    // Get the entry point for npm modules
                    var entry_point = JSON.parse(content);
                    entry_point = entry_point.main;
                    file_path = CTX._path.join(CTX._path.dirname(file_path), entry_point);

                    CTX._fs.readFile(file_path, function(err, content){
                        if(err){
                            done(err);
                        }else{
                            done(null, new Module(content, file_path));
                        }
                    });
                }catch(err){
                    done(err);
                }
	        }else{
				done(undefined, new Module(content, file_path));
			}
		}
    }
}


module.exports = Module;

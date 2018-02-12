
var toArray = require('to-array');
var Emitter = require('component-emitter');
var async = require('async-min');
var io = require('socket.io-client');

var pseudo_emitter = new Emitter();

function Service(_package){ // _package contains all relevant assets for the service.
	Emitter.apply(this);
	var self = this;
	_package = _package instanceof Object ? _package : {};

	if(!Service._cache[_package.path] && CTX.config.cache){
		// Store a cached version of the supplied package.
		Service._cache[_package.path] = _package;
	}

	// Immutable properties
	Object.defineProperty(this, 'path', {
		value: typeof _package.path == 'string' ? _package.path : ""
	});

	Object.defineProperty(this, 'origin', {
		value: typeof _package.origin == 'string' ? _package.origin : ''
	});

	Object.defineProperty(this, '_context', {
		value: _package._context == 'foreground' ? 'foreground' : 'background'
	});

	Object.defineProperty(this, '_package', {
		value : _package,
	});

	Object.defineProperty(this, '_id', {
		value : typeof _package._id == 'string' ? _package._id : CTX._generateId(),
	});

	Object.defineProperty(this, '_protocol', {
		get: function(){
			return '__CTX__SERVICE_'+this._id;
		}
	});

	// Mutable properties
	var socket = null;

	Object.defineProperty(this, '_socket', {
		get : function(){
			return socket;
		},
		set : function(new_socket){
			new_socket = new_socket || {};
			var cur_socket = socket;

			if(cur_socket){
				cur_socket.off(self._protocol);
			}

			switch (new_socket.constructor.name){
				case 'Socket':
					// Allow sockets
					socket = new_socket;
					break;
				default:
					// If no socket set then replace
					if(!socket) socket = CTX._origins[self.origin] || new io.Socket({});
					break;
			}

			socket.on(self._protocol, function(){
				var args = toArray(arguments);
				var protocol = args.shift();

				switch (protocol) {
					case '__CTX__SERVICE_MESSAGE':
						args.unshift('message');
						self.emit.apply(self, args);
						break;

					case '__CTX__SERVICE_STOP':
						self.stop(false);
						break;
					default:
						// Ignore unrecognized protocols
						break;
				}
			});
		}
	});
	this._socket 	= null; // Force setting of socket

	this._flags		= {
		created : false,
		started : false,
		stopped : false,
	}

	var data = {};
	Object.defineProperty(this, 'data', {
		get : function(){
			return data;
		},
		set : function(set_data) {
			data = set_data !== undefined ? set_data : data;
		}
	});

	// Initialization routine
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	var self = this;
	process.nextTick(function(){
		self._socket.emit('__CTX__CONNECT', self._id);

		switch(typeof _package.controller){
			case 'function': break;
			case 'string':
				// The string gets updated in the package causing it to update
				// also in the cache. So next time it won't need to re-evaluate.
				try{
					_package.controller = new Function('require', 'global', 'process', _package.controller);
				}catch(error){
					console.error('CTX: Failed to evaluate controller for "'+self.path+'".');

					if(CTX.config.verbose) console.error(error);
					else console.error(error.message);

					_package.controller = new Function("");
				}
				break;
			default:
	        	_package.controller = new Function("");
			break;

		}

		// controller.displayName = self.name;

		async.series({
			create : function(cb){
				CTX.emit('service-create', self);
				var events = self.listeners('create');
				if(events.length){
					events.forEach(function(ev, i, arr){ arr[i] = ev.bind(self); });
					async.parallel(events, cb);
				}else{
					cb();
				}
			},
			init : function(cb){
				self._flags.created = true;
				self.off('create');

				try{
					controller.call(self, CTX.Module._makeNativeRequire(self.path), global, process);
				}catch(error){
					cb(error);
					return;
				}

				cb();
			},
			start : function(cb){
				var events = self.listeners('start');
				if(events.length){
					events.forEach(function(ev, i, arr){ arr[i] = ev.bind(self); });
					async.parallel(events, cb);
				}else{
					cb();
				}
			}
		}, function(error){
			Service._running[self._id] = self;
			self._flags.started = true;
			self.emit('running', error);
			self.off('running');
		});
	});
}

Service.prototype = Object.create(Emitter.prototype);
Service.prototype.constructor = Service;

Service._cache = {};
Service._running = {};

Service.prototype.stop = function(transmit){
	if(!this._flags.stopped){
		this._socket.off('__CTX__SERVICE_'+this._id);
		this.emit('stop');
		if(transmit !== false) this._socket.emit('stop');

		this.off();
		this._status = -1;
		delete Service._running[this._id];
	}
}


Service.prototype.send = function(){
	var args = toArray(arguments);
	args.unshift(this._protocol, '__CTX__SERVICE_MESSAGE');
	this._socket.emit.apply(this._socket, args);
}

Service.prototype.require = function(requests, done){
	var single = typeof requests == 'string' ?  true : false;
	requests = requests instanceof Object ? requests : [requests];

	for(var key in requests){
		// Rework relative paths to be relative from service path.
		var _path = requests[key];
		if(/^\.\.?\/|\\/.test(_path)){
			_path = CTX._path.join(this.path, _path);
			requests[key] = _path;
		}
	}

	switch(this._context){
		case 'foreground':
			// Request from background socket.
			this._socket.emit('__CTX__REQUIRE', requests, function(errors, requests){
				// parse requests into CTX.Modules and compile
				for(var key in requests){
					requests[key] = new CTX.Module(requests[key], key);
				}
				compileModules(errors, requests);
			});
		break;
		case 'background':
			// Emit on self so that the localhost require protocol
			// will handle the task.
			pseudo_emitter.emit.call(this._socket, '__CTX__REQUIRE', requests, compileModules);
		break;
	}

	function compileModules(errors, requests){
		for(var key in requests){
			if(!requests[key]) continue;

			try{
				requests[key]._compile();
				requests[key] = requests[key].exports;
			}catch(error){
				errors[key] = error;
			}
		}

		var err_keys = Object.keys(errors);
		if(single){
			var request_keys = Object.keys(requests);
			done(err_keys.length ? errors[err_keys[0]] : undefined, requests[request_keys[0]]);
		}else{
			done(err_keys.length ? errors : undefined, requests);
		}
	}
}

Service.prototype.toInterface = function(){
	return new Service(this.toJSON());
}

Service.prototype.toJSON = function(){
	var _package = {
		_id : this._id,
		_context : 'foreground',
		origin : this.origin,
		path : this.path,
		controller : this._package.controllers.foreground,
		data : this.data,
	}

	return _package;
}

Service.prototype.toString = function(){
	return JSON.stringify(this);
}

module.exports = Service;

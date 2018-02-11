function EventEmitter(options){
	options 	= typeof(options) == "object" ? options : {};
	this._id 	= typeof(options._id) == "string" ? options._id : EventEmitter.generateId();
	this._events = {};
}

EventEmitter.DEFAULT_NAMESPACE 	= "__namespace__";
EventEmitter.DEFAULT_ID_LENGTH 	= 16;
EventEmitter.generateId = function(length){
	length = typeof(length) == "number" ? length : EventEmitter.DEFAULT_ID_LENGTH;

	var id = "";
	for(var i = 0; i < length; i++){
		var random_num = Math.ceil(Math.random() * 3);

		switch(random_num){
			case 1: // NUMS 48 - 57
				random_num = 48 + Math.round(Math.random() * 9);
			break;
			case 2: // CHARS 65 - 90
				random_num = 65 + Math.round(Math.random() * 25);
			break;
			case 3: // chars 97 - 122
				random_num = 97 + Math.round(Math.random() * 25);
			break;
		}

		id += String.fromCharCode(random_num);
	}

	return id;
}

EventEmitter.prototype._parseEventNames = function(event_names){
	event_names = event_names.split(/(\s|,)+/g).filter(function(e){return e;});

	var events = [];
	event_names.forEach(function(event){
		var parts 		= event.split('.').filter(function(e){return e;});
		var name 		= parts[0];
		var namespace 	= parts[1];

		if(name){
			events.push({
				name 			: name,
				namespace 		: namespace
			});
		}
	});

	return events;
}


// Public
EventEmitter.prototype.on = function(events, callback, once){
	if(typeof(callback) != "function"){ return; }

	var self = this;

	events = this._parseEventNames(events);
	events.forEach(function(event){
		// Create event name object.
		if(!self._events[event.name]){
			self._events[event.name] = {};
		}

		event.callback = function(){
			if(event.once){
				event.remove();
			}

			callback.apply(this, arguments);
		};
		event.once = typeof( once ) == "boolean" ? once : false;
		event.remove = function(){
			if(self._events[event.name]){
				delete self._events[event.name][event.namespace || EventEmitter.DEFAULT_NAMESPACE];
			}
		}

		self._events[event.name][event.namespace || EventEmitter.DEFAULT_NAMESPACE] = event
	});

	return this;
}

EventEmitter.prototype.once = function(events, callback){
	return this.on(events, callback, true);
}

EventEmitter.prototype.off = function(events){
	var self = this;

	events = this._parseEventNames(events);
	events.forEach(function(event){
		if(self._events[event.name]){
			if(event.namespace){
				delete self._events[event.name][event.namespace || EventEmitter.DEFAULT_NAMESPACE];
			}else{
				delete self._events[event.name];
			}
		}
	});

	return this;
}

EventEmitter.prototype.fire = function(events){
	// Get all events to be fired
	var events = this.getEvents(events);

	var args = [];
	for(var i = 1, length = arguments.length; i<length; i++){
		args.push(arguments[i]);
	}

	for(var i = 0, length = events.length; i < length; i++){
		var event = events[i];
		try{
			event.callback.apply(this, args.concat([event]));
		}catch(error){
			console.error(this.constructor.name+
			(this.name ? ' ('+this.name+')' : this.base ?  ' ('+this.base+')' : '')+ // Used for Node and Router reference
			' event "'+event.name+(event.namespace ? "."+event.namespace : "")+'" encounted an error.\n', error);
		}
	}

	return this;
}

EventEmitter.prototype.fireAsync = function(event_names){
    var events 	= this.getEvents(event_names);
	var callback = arguments[arguments.length-1];

	if(typeof(callback) != "function"){
		callback = function(){};
	}

	var self 	= this;

	var args = [];
	for(var i = 1, length = arguments.length-1; i<length; i++){
		args.push(arguments[i]);
	}

	var tasks 	= {};
	events.forEach(function(event){
		tasks[event.name+"."+(event.namespace || EventEmitter.DEFAULT_NAMESPACE)] = function(callback){
			var called = false;
			try{
				event.callback.apply(self, args.concat([function(){
					called = true;
					callback.apply(self, arguments);
				}, event]));
			}catch(error){
				console.error('Event "'+event.name+(event.namespace ? "."+event.namespace : "")+'" encounted an error.\n', error);
				if(!called){
					callback();
				}
			}
	    };
	});

	var timeout = setTimeout(function(){
		console.warn(self.constructor.name+
		(self.name ? ' ('+self.name+')' : self.base ?  ' ('+self.base+')' : '')+ // Used for Node and Router reference
		(events.length == 1 ? " event" : " events" )+' "'+event_names+'" '+(events.length == 1 ? "is" : "are" )+' taking long to complete.');
	}, 5000);

    var done = false;
    try{
		CTX.async.parallel(tasks, function(){
			clearTimeout(timeout);

			if(done){ return; }
			done = true;

			callback.apply(self, arguments);
		});
    }catch(error){
        clearTimeout(timeout);

        if(done){
			console.error('Error in CTX.async '+(events.length == 1 ? "event" : "events" )+' "'+event_names+'".', error);
        }else{
            done = true;
            callback.call(self, error);
        }
    }
}

EventEmitter.prototype.getEvents = function(events){
	var event_objects = [];
	var self = this;
	var events = this._parseEventNames(events);


	events.forEach(function(event){
		if(self._events[event.name]){
			if(event.namespace){
				/* 	@note 	with_namespace is used to check if the event was fired
				 * 			with a namespace in the name. eg: this.on('event.namespace')
				 * 			If it was it only fires events on that namespace. Otherwise
				 * 			it will fire all the namespaces events.
				 */
				if(self._events[event.name][event.namespace || EventEmitter.DEFAULT_NAMESPACE]){
					var event = self._events[event.name][event.namespace || EventEmitter.DEFAULT_NAMESPACE];
					event_objects.push(event);
				}
			}else{
				for(var namespace in self._events[event.name]){
					var event = self._events[event.name][namespace];
					event_objects.push(event);
				}
			}
		}
	});

	return event_objects;
}

EventEmitter.prototype.hasEvents = function(events){
	var events = this.getEvents(events);
	return events.length ? true : false;
}

module.exports = EventEmitter;

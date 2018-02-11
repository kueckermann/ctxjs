# API Docs
## *@global* **CTX**    
CTX
The CTX global variable gives access to parameters, methods and classes for interacting with CTX.

```javascript
// Parameters
CTX.Service // A reference to the Service class.
CTX.config = {
	verbose : false, // Turn on or off verbose logs.
	cache : true // Disable caching for all CTX processes. Bad idea on a hosted site, good idea for local development.
	origin : location.origin || "", // The default origin for services. location.origin if available otherwise an empty string.
	root : process.cwd(), // The root directory for CTX, defaults to the current working directory.
}

// Functions
CTX.start([path String, options Object, callback Function]); // Starts a new Service instance.
CTX.listen(arg0 Number|Server); // Allow CTX to serve public Services from a port or an already existing server. https://socket.io/docs/server-api/#server-listen-httpserver-options
```

## *@class* **Service**

Service is the class controlling the lifecycle of the service.
Service class declaration can be accessed at CTX.Service.

**@public**
```javascript
// Parameters
Service.path // The path to the service from CTX.config.root.
Service.data // The data required for the service to start up and restart if it dies. WARNING: Don't store private information in data.

static Service.cache // Service asset cache.
static Service.running // All services that are currently running.

// Methods
Service.stop(); // Permanently stops the service from running in all contexts.
Service.send([arg0, ..., argN, callback Function]); // Send message between service contexts.
Service.require(requests String|Object|Array, callback Function); // Asynchronous module loader that works accross contexts.

// Events
Service.on('init', function(callback Function){...}); // Fired after service controller is initialized. Callback must be executed when startup is complete.
Service.on('start', function(callback Function){...}); // Fired after service controller is initialized. Callback must be executed when startup is complete.
Service.on('stop', function(){...}); // Fired when a service is stopped. Useful for cleanup and memory management.
Service.on('running', function(){...}); // Fired after all 'start' events have called their respective callbacks.
```

**@private**
```javascript
```

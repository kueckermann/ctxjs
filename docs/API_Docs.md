# API Docs
## *@global* **CTX**    
**@public**
```javascript
CTX.Service Class // Reference to the Service class.
CTX.Module Class // Reference to the Module class.
CTX.config Object // Global CTX configuration options.
	↳ verbose Boolean (false) // Turn on or off verbose logs.
	↳ cache Boolean (true) // Disable caching for all services.
	↳ root String ($CWD) // The root directory for CTX

CTX.start Function ([path String, options Object, callback Function]) // Starts a new Service instance.
CTX.listen Function (arg0 Number|Server) // Attach socket.io listener to a server or port.
```

**@private**
```javascript
CTX._origins Object // All currently active origins.
CTX._path Object // Simple path parsing tools which support url protocols.
	↳ normalize Function (path String)
	↳ join Function (path String)

CTX._fs Object
	↳ readFile Function (path String, callback Function) // Read a file from the local file system.

CTX._generateId Function ([from String, length Number]) // Generate a random id or basic hash from string "from" to length (default:32).
CTX.start._reference Object // Stores discrete references for start.
```

## *@class* **Service**
Service is the class controlling the lifecycle of the service.

**@public**
```javascript
Service.path String // The path to the service from CTX.config.root.
Service.data Object // The data required for the service to start up and restart if it dies. WARNING: Don't store private information in data.

Service.stop Function // Permanently stops the service from running in all contexts.
Service.send Function ([arg0, ..., argN, callback Function]) // Send message between service contexts.
Service.require Function (requests String|Object|Array, callback Function) // Asynchronous module loader that works accross contexts.
Service.on Function (event String, callback Function) // Add an event listener.
Service.emit Function (event String [,arg0, ..., argN]) // Emit an event.

// Events
Service.on('init', function(callback Function){...}); // Fired after service controller is initialized. Callback must be executed when startup is complete.
Service.on('start', function(callback Function){...}); // Fired after service controller is initialized. Callback must be executed when startup is complete.
Service.on('stop', function(){...}); // Fired when a service is stopped. Useful for cleanup and memory management.
Service.on('running', function(){...}); // Fired after all 'start' events have called their respective callbacks.
```

**@private**
```javascript
static Service._cache Object // Service asset cache.
static Service._running Object // All services that are currently running.
```


## *@class* **Module**
Module is an asynchronous module loader loosely based on the node.js module loader.

**@public**
```javascript
Module.content String // The raw text for the module.
Module.path String // The file path to the module.
Module.exports Object // The exported data from the module.
Module.compile Function // Compiles a module.

static Module.natives Object // Module names that are native to the current context.
static Module.paths Array // Lookup path to search for modules.
static Module.require Function (requests String)// A wrapper for the native require.
```

**@private**
```javascript
static Module._cache Object // Module cache.
static Module._fetch Function (requests String|Object|Array, callback Function) // Fetches the modules from disk/cache and passes them to callback.

```

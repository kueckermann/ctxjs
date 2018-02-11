# Developer Docs
## Project Structure
asd

# Classes
## Module
**@class** Module    
The Module class is based apon the node js module loader but works asyncronously in order to provide a module loader for any context.
Module class declaration can be accessed at CTX.Module.

 ```javascript
// Parameters
Module.content // The raw text for the module.
Module.path // The file path to the module.
Module.exports // The exported data from the module.

static Module.cache // Module cache.
static Module.natives // Module names that are native to the current context.
static Module.paths // Lookup path to search for modules.

// Methods
Module.compile(); // Compiles a module.

static Module.fetch(requests String|Object|Array, callback Function); // Fetches the modules from disk/cache and passes them to callback.

// Events
```

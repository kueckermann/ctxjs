# Getting Started
## Creating a service
A service exists as a folder on your local file system that contains a service descriptor. A service descriptor is a json file called service.ctx.json that tells CTX configuration options for the service.

A service can be created manually or via the cli if ctxjs has been installed globally via npm.

```
$ ctx create ./example
```
The command above would create a folder called example in our current working directory with the following contents.

* **example**
    * service.ctx.json
    * controller.js
    * interface.js

The internal structure of the service descriptor would be the following:

```json
{
    "controller" : "./controller.js",
    "interface" : "./interface.js"
}
```

## Starting a service
Assuming that we created the example service in our current directory, as mentioned above, we could start the service from node js as follows.

```javascript
require('ctxjs'); // Exposes CTX global variable

CTX.start('example', function(error, service){
    // Our running service would be passed to this callback,
    // as well as any errors that may have occurred.
});
```

## What next?
To get a deeper understanding of CTX and building nano-service applications, take a look at one of the provided [demos](../demos/Demos.md) or dive deeper with the [API Docs](API_Docs.md).

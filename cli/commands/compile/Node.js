const Module = require('module');
const path = require('path');

function Node(options){
	CTX.EventEmitter.call(this, options);
	options = typeof options == "object" ? options : {};
    this.name = options.name;
    this.path = options.path;


    try{
		// TODO 	- Need a way to prevent flooding the lookup directory with paths,
		// 			Since currently this is adding paths everytime it loads the controller.
		// 			- I have since just started replacing the paths, but this means that
		// 			If you require something after async function then it might not
		// 			be found if the root path has changed.

		// TODO 	Is it possible to create the controller as a module with its own
		// 			require and paths?

	
		if(options.controllers.compiler){
			module.paths = Module._nodeModulePaths(path.resolve(this.path, options.controllers.compiler));
		}

        var controller = new Function('require', '__dirname', options.controller);
        controller.call(this, require, this.path);
    }catch(error){
        console.error(`CTX: Failed to evaluate controller for "${this.name}".`);
        if(CTX.verbose) console.error(error);
        else console.error(error.message);
    }
}

Node.prototype = Object.create(CTX.EventEmitter.prototype);
Node.prototype.constructor = Node;

module.exports = Node;

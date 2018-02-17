module.exports = function(service){
    switch(service._context){
        case "foreground":
            attachForeground(service);
            break;
        case "background":
            attachBackground(service);
            break;
    }
}

function attachForeground(service){

}

function attachBackground(service){
    setParameters(service);
    service.routing.first = service;
    service.routing.last = service;

    service.route = function(route, done){
        done = typeof done == 'function' ? done : {};

        parseRoute.call(service, service, route, done);
    }
}

function parseRoute(service, route, done){
    var self = this;

    var connection = getConnection(service, route);
    service.emit('route', connection);

    if(connection.path){
        if(!CTX._path.isAbsolute(connection.path)){
            connection.path = CTX._path.join(service.path, connection.path);
        }

        CTX.start(connection.path, function oncreate(err, next_service){
            if(err){
                done(err);
            }else{
                setParameters(next_service);
                // Fires routing event on base service passing the next service.
                // if(service.next){
                //     // service.removeChild(service.next);
                //     service.next.kill(false);
                //     delete service.next;
                // }

                service.routing.next = next_service;
                next_service.routing.prev = service;
                next_service.routing.first = service.routing.first;

                self.emit('routing-service', next_service);

                // Fire each function
                next_service.once('hook-before-running', function(cb){
                    parseRoute.call(self, next_service, connection.route, done);
                    cb();
                });
            }
        });
    }else{
        // Bottom of stack
        // resolveRoute(service, service);
        done(undefined, service);
    }
}

var trim_reg = /^\/+|\/+$/g;

function getConnection(service, route){
    route = (route || '').replace(trim_reg, '');

    for(var glob in service.assets.routing){
        var connection = service.assets.routing[glob];

        var match = connection._glob.exec(route);
        if(match){
            var path = connection.path.replace(/\$(\d+)/g, function(el, i){
                return match[i];
            });

            return {
                in : route.slice(0, match.index+match[0].length).replace(trim_reg, ''),
                out : route.slice(match.index+match[0].length).replace(trim_reg, ''),
                path : path,
                match : match
            }
        }
    }

    return {
        in : route,
        out : '',
        path : '',
        match : undefined,
    }
}

function setParameters(service){
    var micromatch = require('micromatch');

    // Prepare routing data when service is attached.
    if(!service.assets.routing){
        service.assets.routing = service.assets.descriptor.routing || {};
        var connections = service.assets.routing;

        for(var glob in connections){
            var connection = connections[glob];
            if(!(connection instanceof Object)){
                connection = {
                    path : connection
                }
            }

            var i = connection.strict === false ? false : true; // Case insensitive is default. Set strict to true for strict routing.

            // Remove trailing slashes.
            connection._glob = new RegExp(micromatch.makeRe(glob.replace(/^\/+|\/+$/g, ''),{capture:true}).toString().slice(1,-2), i ? 'i' : '');
            connections[glob] = connection;
        }
    }

    service.routing = {
        slug : undefined,
        next : undefined,
        prev : undefined,
        running : {},
        first : undefined,
        last : undefined,
    }
}

function resolveRoute(service /*Current Service*/, ls /*Last Service*/){
    // Resolve route should go through the chain backwards from the last service
    // and set the last service
    if(service._route_pending) service._route_pending();

    service.last = ls;
    if(service.prev) resolveRoute(service.prev, ls);
}

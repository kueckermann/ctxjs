global.$ = require('jquery');

var Self = this;
this.on('start', function(done){
    this.require({
        template : 'ctx-ext-template'
    }, function(err, req){
        CTX.on('service-create', function(service){
            req.template(service);
        });

        req.template(Self, function(){
            done();
        });
    });
});

this.on('running', function(error){
    document.write(this.render());
    document.close();

    require('fastclick')(document.body);

    CTX.start('/app/modules/welcome');
})

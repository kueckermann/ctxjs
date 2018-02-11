var Self = this;
this.on('start', function(done){
    this.require({
        template : '/extensions/ctx-ext-template'
    }, function(err, ext){
        ext.template(Self);
        done();
    });
});

this.on('running', function(){
    $('#page_wrapper').prepend(this.render());
});
this.on('stop', function(){
    $('.tap-full').remove();
});

this.on('render', function(render){
    render.template = $(render.template);
    render.template.click(function(){
        render.template.removeClass('open');

        setTimeout(function(){
            Self.stop();
        },500);
    });

    setTimeout(function(){
        render.template.addClass('open');
    },50);
})

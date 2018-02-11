var Self = this;
this.on('start', function(done){
    this.template = $(this.render());
    $('body').append(this.template);
    done();
});

this.on('running', function(){
    setTimeout(function(){
        $('.loader').hide();
        launchWidget();
    },1000);

    $('.widget-button').click(launchWidget)
});

function launchWidget(){
    CTX.start('/app/widgets/stocks', function(err, service){
        Self.template.find('.templates-wrapper').append(service.render());
    });
}

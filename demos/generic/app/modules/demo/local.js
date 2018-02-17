var Self = this;
this.on('start', function(done){
    console.log(this.data.test_data ? 'Test data exists: '+this.data.test_data : 'Test data missing!')
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

var Self = this;
this.on('start', function(done){
    this.template = $(this.render());
    $('body').append(this.template);

    var Swiper = require('swiper');
    this.swiper = new Swiper(this.template[0], {
      speed: 600,
      parallax: true
    });

    $('.explore-button').click(function(){
        CTX.start('/app/modules/demo', function(){
            Self.stop();
        });
    });

    done();
});

this.on('stop', function(){
    // this.template.remove();
    this.swiper.destroy(true, false);
});

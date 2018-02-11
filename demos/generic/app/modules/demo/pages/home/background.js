this.on('start', function(done){
    done();
    CTX.start('/generic/templates/person', function(err, person){
        var list = $('#list');
        for(var i=0; i<10; i++){
            list.append(person.render())
        }
    });
})

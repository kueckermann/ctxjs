var chart = require('chart')

this.on('render', function(render){
    render.template = $(render.template);

    process.nextTick(function(){
        var data = [];
        var line = new Chart(render.template.find('canvas')[0].getContext('2d'), {
            type: 'line',
            data : {
              labels: data,
              datasets: [{
                data: data,
                lineTension:0,
                fill:false
              }]
            },
            options: {
                animation: false,
                responsive : true,
                legend : {
                    display : false
                },
                elements: {
                    point: {
                        radius: 0
                    }
                },
                tooltips: {
                     enabled: false
                },
                layout: {
                    padding: {
                        left: 0,
                        right: 0,
                        top: 20,
                        bottom: 0
                    }
                },
                scales: {
                    xAxes: [{
                        ticks: {
                            display: false,
                            beginAtZero:false
                        },
                        gridLines: {
                            display:false
                        }
                    }],
                    yAxes: [{
                        ticks: {
                            display: false,
                            beginAtZero:true
                        },
                        gridLines: {
                            display:false
                        }
                    }]
                }
            }
        });

        var offset = Math.random()*10000;
        setInterval(function(){
            data.push(Math.sin(Date.now()/offset)+Math.random()/10);
            if(data.length>200) data.shift();

            line.update();
        },1000/30)
    });
});

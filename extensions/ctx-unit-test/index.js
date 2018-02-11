var log = console.log.bind(console);
var warn = console.warn.bind(console);
var error = console.error.bind(console);
var info = console.info.bind(console);

module.exports = {
    run : function(tests, done){
        done = typeof done == 'function' ? done : function(){};
        disableLogs();

        var first = null;
        var previous = null;
        var unit = {
            passed : 0,
            failed : 0,
            total : 0,
        }

        for(var name in tests){
            if(typeof tests[name] !== 'function'){
                //log('%cSkipping test "'+name+'", test must be a function.', 'color:orange');
                continue;
            }

            unit.total++;
            var ut = new UnitTest(name, tests[name], unit);
            if(!first) first = ut;
            if(previous) previous.next = ut;

            previous = ut;
        }

        log('\n\n%c🏃 Running '+unit.total+' unit tests.', 'color:orange; font-size:15px; font-weight:800');
        log('%c                                                         ', 'color:grey; text-decoration: line-through;');
        if(first) first.run(cb);
        else cb();


        function cb(){
            log('%c                                                         ', 'color:grey; text-decoration: line-through;');
            if(unit.total)  log((unit.passed > 0 ? '%c✔ '+unit.passed+' '+(unit.passed == 1 ? 'test' : 'tests')+' passed.\t' : '')+
                                (unit.failed > 0 ? '%c✔ '+unit.failed+' '+(unit.failed == 1 ? 'test' : 'tests')+' failed.' : ''),
                                (unit.passed > 0 ? 'color:green; font-weight:800' : ''),
                                (unit.failed > 0 ? 'color:red; font-weight:800' : ''));

            enableLogs();
            done(unit.failed > 0 ? 'UNIT_TEST_FAILED' : undefined);
        }
    }
}

UnitTest = function(name, test, unit){
    this._unit = unit;
    this.name = name;
    this.test = test;
    this.next = null;
}

UnitTest.prototype.run = function(done){
    done = typeof done == 'function' ? done : function(){};

    log('%c▸ '+this.name, 'font-weight:800');

    var self = this;
    try{
        this.test(function(err){
            if(err){
                failTest.call(self, err, done);
            }else{
                passTest.call(self, done);
            }
        }, this);
    }catch(err){
        failTest.call(this, err, done);
    }

    function cb(err){
        done(err);
    }
}

function failTest(err, done){
    this._unit.failed++;
    log('%c\t✘ Failed: '+(typeof err == 'string' ? err : typeof err == 'object' && err.message ? err.message : err), 'color:red');
    if(CTX.config.verbose && typeof err == 'object' && err.stack){
        log('%c\t'+err.stack.replace(/\n/g, '\n\t'), 'color:red');
    }

    done();
}

function passTest(done){
    this._unit.passed++;
    log('%c\t✔ Passed', 'color:green');
    if(this.next){
        this.next.run(done);
    }else{
        done();
    }
}

function disableLogs(){
    console.log = console.warn = console.error = console.info = function(){};
}

function enableLogs(){
    console.log = log;
    console.warn = warn;
    console.error = error;
    console.info = info;
}

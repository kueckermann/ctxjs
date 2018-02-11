CTX.async = {
    parallel : function(tasks, callback){
        callback = typeof callback == 'function' ? callback : function(){};

        var n_tasks_left    = Object.keys(tasks).length;
        var task_data       = {};
        var complete        = false;

        if(n_tasks_left == 0){
            complete    = true;
            callback();
        }else{
            for(var id in tasks){
                var task = new Task(id, tasks[id]);
                tasks[id] = task;

                task.do(function(id, error, data){
                    n_tasks_left--;

                    if(!complete){
                        if(error){
                            complete = true;
                            callback(error, task_data);
                        }else {
                            task_data[id] = data;

                            if(n_tasks_left === 0){
                                complete = true;
                                callback(null, task_data);
                            }
                        }
                    }
                }.bind(this, id));
            }
        }

        return tasks;
    },
    series : function(tasks, callback){
        callback = typeof callback == 'function' ? callback : function(){};
        
        var task_ids        = Object.keys(tasks);
        var task_data       = {};
        var complete        = false;

        if(task_ids.length === 0){
            complete    = true;
            callback(null, task_data);
        }else{
            for(var id in tasks){
                var task = new Task(id, tasks[id]);
                tasks[id] = task;
            }

            //  NOTE    I am reversing the task_ids so I can pop them off.
            task_ids = task_ids.reverse();
            next();

            function next(){
                var id = task_ids.pop();
                var next_task = tasks[id];
                next_task.do(function(error, data){
                    if(!complete){
                        if(error){
                            complete = true;
                            callback(error, task_data);
                        }else {
                            task_data[id] = data;

                            if(task_ids.length === 0){
                                complete = true;
                                callback(null, task_data);
                            }else{
                                next();
                            }
                        }
                    }
                })
            }
        }

        return tasks;
    }
}

var Task = function(id, task){
    this.id     = id;
    this.task   = task;
}

Task.prototype.do = function(callback){
    var done = false;
    var self = this;
    try{
        this.task(function(error, data){
            if(done){
                console.error('CTX: Async task callback already called.', self);
            }else{
                done   = true;
                callback(error, data);
            }
        });
    }catch(error){
        if(done){
            console.error('CTX: Async caught an error after task had executed callback.', self);
            if(CTX.config.verbose) console.error(error);
            else console.error(error.message);
        }else{
            done   = true;
            callback(error);
        }
    }
}

module.exports = function(service, done){
    done = typeof done == 'function' ? done : function(){};

    service.render = function(data){
        try{
            var render = {
                data : data instanceof Object ? data : service,
                template : service._package.template,
            }

            render.template = render.template.call(render.data, require);
            service.emit('render', render);

            return render.template;
        }catch(error){
            console.error('CTX Addon Templating: Failed to render template for "'+service.path+'".');
            if(CTX.verbose) console.error(error);
            else console.error(error.message);
            return "";
        }
    }

    if(!service._flags.created){
        service.on('create', function(cb){
            loadTemplate(service, function(){
                cb();
                done();
            });
        });
    }else{
        loadTemplate(service, done);
    }
}

function loadTemplate(service, done){
    if(typeof service._package._descriptor.template !== "string"){
        console.error('CTX Template Extension: Template declaration missing in service descriptor for "'+service.path+'".');
        done();
    }else{
        var template_path = CTX._path.join(CTX.config.path, service.path, service._package._descriptor.template);

        CTX._fs.readFile(template_path, function(error, template){
            if(error){
                // Allows you to write template directly in the path location.
                console.error('CTX Template Extension: Failed to read template for "'+service.path+'".');
                if(CTX.config.verbose) console.error(error);
            }else{
                template = template || "";

                if(CTX._path.extname(template_path) !== '.js'){
                    // If template is raw text (not a script) then parse it for mustache templates.
                    template = parse(template);
                }

                try{
                    service._package.template = new Function(template);
                }catch(error){
                    console.error('CTX Template Extension: Failed to evaluate template for "'+service.path+'".');
                    if(CTX.config.verbose) console.error(error);
                }

                done();
            }
        });
    }
}

function parse(content){
	content = typeof content == 'string' ? content : "";
	var buffer = "";

	while(content.length){
		var start = content.indexOf('{{');

		if(start===-1){
			// No tags
			buffer += '__p('+JSON.stringify(content)+');';
			break;
		}else{
			// Parse tag

			// Add on all previous content up till the tag.
            var leading_content = content.slice(0, start);
			buffer += '__p('+JSON.stringify(leading_content)+');';

			// Find end tag
			var end = content.slice(start).indexOf('}}');
			if(end===-1){
				// No end tag found
				buffer += '__p('+JSON.stringify(content)+')';
				break;
			}else{
                end = start+end;
				// Get the tag content and remove ending ";" if present.
				var tag = content.slice(start+2, end).trim();
				tag = tag.replace(/(;|\s)+$/g, '');

				switch(tag[0]){
					case "/":
						// {{/ }} is escaped
						buffer += '__p('+JSON.stringify('{{'+tag.slice(1)+'}}')+');';
						break;
					case "!":
						// {{! }} is commented so ignore
						break;
					case ">":
						// {{> }} is echoed
						buffer += 'try{__p('+tag.slice(1).trim()+')}catch(e){__e(e)}';
						break;
					default:
						// {{ }} is a javascript code
						buffer += 'try{'+tag+'}catch(e){__e(e)}';
						break
				}

				content = content.slice(end+2);
			}
		}
	}

	return 'var __o=[],__p=function(e){if(e){__o.push(e)}}.bind(this),__e=console.error,echo=__p;'+buffer+'return __o.join("");';
}

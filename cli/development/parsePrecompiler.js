
const through2 = require('through2');
const path 	= require('path');

module.exports = function parsePrecompiler(out){
	var contents = "";
	return through2.obj(function(file, enc, callback){
	    if (file.isNull()){
	      callback();
	      return;
	    }

		if (file.isStream()) {
	      callback();
	      return;
	    }

		var content = file.contents.toString();
		var code = "";

		while(content.length){
			var i = content.indexOf('{{');
			if(i===-1){
				// No more tags
				code += `__e(${JSON.stringify(content.slice(0, content.length))});`;
				content = "";
			}else{
				// Parse tag
				code += `__e(${JSON.stringify(content.slice(0, i))});`;
				content = content.slice(i);

				var data = parse(content);
				code += data.code;
				content = data.content;
			}
		}

		contents += code;
		callback();
	}, function(callback){
		var Vinyl = require('vinyl');
		var outfile = new Vinyl({
		  cwd: CTX.root,
		  base: path.join(CTX.root, 'cache'),
		  path: path.join(CTX.root, 'cache', out),
		  contents: Buffer.from(`var __o=[],__e=function(e){if(e){__o.push(e)}}.bind(this);echo=__e;${contents}return __o.join('');`,'utf8')
		});

		this.push(outfile);
		callback();
	});
}

function parse(content){
	var code = "";

	var j = content.indexOf('}}');
	if(j===-1){
		// No end tag found
		code = `__e(${JSON.stringify(content)})`;
		content = "";
	}else{
		code = content.slice(2,j).trim();
		content = content.slice(j+2);
	}

	code = code[code.length-1] == ";" ? code.slice(0,-1) : code;


	switch(code[0]){
		case "/":
			// {{/ }} is escaped
			code = `__e(${JSON.stringify(`{{${code}}}`)});`;
			break;
		case "!":
			// {{! }} is commented so ignore
			code = "";
			break;
		case ">":
			// {{> }} is echoed
			code = `__e(${code.slice(1).trim()});`;
			break;
		default:
			// {{ }} is a javascript code
			code += ";" // Append line break
			break
	}

	return {
		content : content,
		code : code
	}
}

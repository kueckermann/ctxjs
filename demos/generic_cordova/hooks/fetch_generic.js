var fs = require('fs-extra');
var path = require('path');
module.exports = function(context) {
    fs.copySync(path.resolve(__dirname, '../../generic'), path.resolve(__dirname, '../www'));
}

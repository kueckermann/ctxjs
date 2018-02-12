require('../../build');
var express = require('express');
var app = express();

app.use(express.static('.'))
var server = app.listen(8080);

CTX.listen(server);

// CTX.start("services/messages", function (error, service) {})
// var server = CTX.listen(8080);
// server.set('origins', '*:*');

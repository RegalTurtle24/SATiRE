// The main server side script

var express = require('express');
express.json("Access-Control-Allow-Origin", "*");

var mime = require('mime-types'); 

var app = express();
app.get('/', function (req, res) { // Sends the basic webpage if GET not speficied
    res.sendFile(process.cwd() + '/client/index.html');
});
app.get('/client/*', function (req, res) { // If a client file is asked for, give it and specify the correct MIME type
    var mimeType = mime.lookup(req.url);
    res.setHeader('Content-Type', mimeType);
});

var server = require('http').createServer(app).listen(8080);

var socket = require('socket.io');

const io = socket(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    }
    
});

io.sockets.on('connection', function (socket) {
    console.log('connected to client!!!');
});

console.log('this code is running, right?');
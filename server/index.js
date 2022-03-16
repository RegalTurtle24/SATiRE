// The main server side script

// var express = require('express');
// var app = express();

// var server = require('http').createServer(app).listen(8080);

// var socket = require('socket.io');
// var io = socket().listen(server);


const io = require('socket.io')(8080);

io.sockets.on('connection', function (socket) {
    console.log('connected to client!!!');
});

console.log('this code is running, right?');
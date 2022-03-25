// The main server side script
const port = 8000;

var express = require('express');
express.json("Access-Control-Allow-Origin", "*");

var mime = require('mime-types'); 

var app = express();
app.get('/', function (req, res) { // Sends the basic webpage if GET not speficied
    SendFile('/client/index.html', res);
});
app.get('/client/*', function (req, res) { // If a client file is asked for, give it and specify the correct MIME type
    SendFile(req.url, res);
});

function SendFile(fileName, res)
{
    var mimeType = mime.lookup(fileName);
    res.setHeader('Content-Type', mimeType);
    res.sendFile(__dirname + fileName, function (error) {
        if (error)
        {
            console.log(error);
        }
        else
        {
            console.log('Sent file: ' + fileName + ' successfully')
        }
    })
}

var server = require('http').createServer(app).listen(port, function (error){
    if (error){
        console.log(error);
    }
    console.log('Listening on port: ' + port);
});

const { Server } = require("socket.io");
const io = new Server(server);

io.on('connection', function (socket) {
    
    console.log('Connected to client at socket id [' + socket.id + ']');
    io.emit('connection', 'New user has joined: [' + socket.id + ']');
    
    socket.on('message', (message) => {
        console.log('Message received from client: ', + message);
    });

    socket.on('chat-message', (message) => {
        console.log('Relaying chat message: [' + message + ']');
        socket.rooms.forEach(function (value) {
            socket.to(value).emit('chat-message', String(message));
        })
    })

    socket.on('join-req', (message) => {
        console.log('Joining Room: [' + message + ']');
        socket.join(message);
        console.log(socket.rooms);
        let str2 = "";
        socket.rooms.forEach(function (value) {
            str2 = str2 + value + ", ";
        })
        str2 = str2.substring(22, str2.length - 2)
        console.log(str2);
        socket.emit('rooms-req', str2);
    })

    socket.on('leave-rooms', (message) => {
        socket.rooms.forEach(function (value) {
            socket.leave(value);
        })
        socket.emit('rooms-req', "");
    })
});

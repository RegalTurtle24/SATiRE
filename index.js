// The main server side script
const port = 8000;
const globalRoom = 'GLOBAL';

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
    socket.emit('message', 'Only to client?');
    io.emit('connection', 'New user has joined: [' + socket.id + ']');
    
    socket.on('message', (message) => {
        console.log('Message received from client: ', + message);
    });
});

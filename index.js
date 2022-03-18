// The main server side script
const port = 8080;

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
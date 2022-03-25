// The main server side script
const port = 8000;

var express = require('express');
express.json("Access-Control-Allow-Origin", "*");

var mime = require('mime-types'); 
const { hasUncaughtExceptionCaptureCallback } = require('process');

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

const { Server, Socket, Namespace } = require("socket.io");
const io = new Server(server);

class DataSender {
    constructor(tag, defaultRecipients, ...args)
    {
        this.tag = tag;
        this.args = args;
        this.defaultRecipients = defaultRecipients;
    }

    sendTo(recipients)
    {
        recipients.emit(tag, ...args);
    }

    // Sends the data to all default recipients
    send()
    {
        this.sendTo(defaultRecipients);
    }
}

class DataReceiver {
    constructor(tag, sockets, callback)
    {
        this.tag = tag;
        this.callback = callback;
        this.socketList = [];
        this.addSockets(sockets);
    }

    // Converts a namespace into an array of sockets if it isn't already
    #getSocketArray(sockets)
    {
        if (sockets instanceof Namespace) return sockets.fetchSockets();
        if (sockets instanceof Socket) return [sockets];
        if (Array.isArray(sockets)) return sockets;
        throw new Error("Unrecognized type: " + sockets.constructor.name);
    }

    addSockets(sockets)
    {
        if (sockets == null) return;
        sockets = this.#getSocketArray(sockets);

        // Only adds it if it isn't already added
        sockets.forEach((socket) => {
            if (!this.socketList.includes(socket))
            {
                this.socketList.push(socket);
                socket.on(this.tag, (...args) => {
                    this.callback(socket, ...args);
                })
            }
        })
    }

    // Removes a socket from the receiver (returns true if successful)
    remove(socket)
    {
        var index = this.socketList.indexOf(socket);
        if (index === -1) return false;
        this.socketList.splice(index);
        return true;
    }

    removeAll()
    {
        for (var i = this.socketList.length - 1; i >= 0; i--)
        {
            this.remove(socketList.at(i));
        }
    }
}

chatReceiver = new DataReceiver('chat-message', null, (socket, message) => {
    console.log('Relaying chat message: [' + message + ']');
    socket.rooms.forEach(function (value) {
        socket.to(value).emit('chat-message', message);
    })
});
roomReqReceiver = new DataReceiver('join-req', null, (socket, message) => {
    console.log('Joining Room: [' + message + ']');
    socket.join(message);
    console.log(socket.rooms);
    let str2 = "";
    socket.rooms.forEach(function (value) {
        str2 = str2 + value + ", ";
    })
    str2 = str2.substring(22, str2.length - 2)
    socket.emit('rooms-req', str2);
});
roomLeaveReceiver = new DataReceiver('leave-rooms', (socket, message) => {
    socket.rooms.forEach(function (value) {
        socket.leave(value);
    })
    socket.emit('rooms-req', "");
})

io.on('connection', function (socket) {
    
    console.log('Connected to client at socket id [' + socket.id + ']');
    socket.emit('connection', 'Hello client with id [' + socket.id + ']')
    socket.broadcast.emit('message', 'New user has joined: [' + socket.id + ']');
    
    chatReceiver.addSockets(socket);
    roomReqReceiver.addSockets(socket);
    roomLeaveReceiver.addSockets(socket);
    socket.on('disconnect', (reason) => {
        chatReceiver.remove(reason);
        console.log('Disconnected from client at socket id [' + socket.id + ']');
    });
});

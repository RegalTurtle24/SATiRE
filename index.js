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

const { Server, Socket, Namespace } = require("socket.io");
const io = new Server(server);

/**
 * An object that handles sending a set tagged message to arbitrary client sockets
 */
class DataSender {
    /**
     * @param {*} tag The tag that is to be sent to the client with the message 
     * @param {*} defaultRecipients The sockets that the sender defaults to when none are specified
     * @param  {...any} args The arguments to pass to the client (the data that is sent)
     */
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

/**
 * An object that handles tagged messages received from arbitrary client sockets 
 */
class DataReceiver {
    /**
     * @param {*} tag The tag that the receiver looks for when detecting messages
     * @param {*} sockets Sockets to be automatically added to the receiver
     * @param {*} callback The method that's called when a message is received
     *  (FIRST PARAMATER MUST TAKE THE SOCKET SENDING THE MESSAGE)
     */
    constructor(tag, sockets, callback)
    {
        this.tag = tag;
        this.callback = callback;
        this.socketList = [];
        this.addSockets(sockets);
    }

    /**
     * Converts a namespace into an array of sockets if it isn't already
     * @returns the array version of "sockets"
     */
    getSocketArray(sockets)
    {
        if (sockets instanceof Namespace) return sockets.fetchSockets();
        if (sockets instanceof Socket) return [sockets];
        if (Array.isArray(sockets)) return sockets;
        throw new Error("Unrecognized type: " + sockets.constructor.name);
    }

    addSockets(sockets)
    {
        if (sockets == null) return;
        sockets = this.getSocketArray(sockets);
        
        sockets.forEach((socket) => {
            // Only adds it if it isn't already added
            if (!this.socketList.includes(socket))
            {
                this.socketList.push(socket);
                socket.on(this.tag, (...args) => {
                    this.callback(socket, ...args);
                })
            }
        })
    }

    /**
     * Stops detecting messages from a given socket
     * @param socket The socket that is to be removed
     * @returns true if successful
     */ 
    remove(socket)
    {
        var index = this.socketList.indexOf(socket);
        if (index === -1) return false;
        this.socketList.splice(index);
        return true;
    }

    /** 
     * Stops detecting messages sent from all sockets
     */
    removeAll()
    {
        for (var i = this.socketList.length - 1; i >= 0; i--)
        {
            this.remove(socketList.at(i));
        }
    }
}

// For handling passing chat messages between clients:
chatReceiver = new DataReceiver('chat-message', null, (socket, message) => {
    console.log('Relaying chat message: [' + message + ']');
    socket.rooms.forEach(function (value) {
        socket.to(value).emit('chat-message', message);
    })
});
// For when a client requests to join a room:
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
// For when a client requests to leave a room:
roomLeaveReceiver = new DataReceiver('leave-rooms', null, (socket, message) => {
    socket.rooms.forEach(function (value) {
        socket.leave(value);
    })
    socket.emit('rooms-req', "");
})

// Whenever a new client connects:
io.on('connection', function (socket) {
    // Log info and inform other clients that the connection was successful
    console.log('Connected to client at socket id [' + socket.id + ']');
    socket.emit('connection', 'Hello client with id [' + socket.id + ']')
    socket.broadcast.emit('message', 'New user has joined: [' + socket.id + ']');
    
    // Adds this new client to the global sockets
    chatReceiver.addSockets(socket);
    roomReqReceiver.addSockets(socket);
    roomLeaveReceiver.addSockets(socket);
    socket.on('disconnect', (reason) => {
        chatReceiver.remove(reason);
        console.log('Disconnected from client at socket id [' + socket.id + ']');
    });
});

// The main server side script

const port = 8000;
const { Server, Socket, Namespace } = require("socket.io");
var io;
// Server initialization
{

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
    
    io = new Server(server);
}

  
/**
 * Converts a namespace into an array of sockets if it isn't already
 * @returns the array version of "sockets"
 */
function getSocketArray(sockets)
{
    if (sockets instanceof Namespace) return sockets.fetchSockets();
    if (sockets instanceof Socket) return [sockets];
    if (Array.isArray(sockets)) return sockets;
    throw new Error("Unrecognized type: " + sockets.constructor.name);
}

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
        this.defaultRecipients;
    }

    sendTo(recipients)
    {
        getSocketArray(recipients)
            .forEach((recipient) => recipient.emit(tag, ...args));
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

    addSockets(sockets)
    {
        if (sockets == null) return;
        sockets = getSocketArray(sockets);
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
        if(socket.id != value){
            socket.leave(value);
        }
    })
    socket.emit('rooms-req', "");
});

class Player
{
    constructor(id, name)
    {
        this.id = id;
        this.name = name;
    }

    emit()
    {
        io.in()
    }
}

// purpose: GameMode class that is parent for all gamemodes
// input: players that are going to play in the instance of a game
// output: can retrieve the players in game
class GameMode
{
	constructor(players) 
	{
        if (players == null)
            throw Error("Cannot start game with zero players");
		// players should be stored in an array
		this.players = players;
	}
	
	// return players, used by GameMode subclasses
	returnPlayers() 
	{
		return this.players
	}
}

// purpose: Telephone class that is intialized when starting a game of telephone
// input: the players that are playing the game
// output: randomize the order of players and can return current player
class Telephone extends GameMode
{
	constructor(room, players) 
	{
		super(randomizePlayers(players));
        this.room = room;
		this.currPlayerIn = 0;
        this.messageChain = [];
		// keep track off if the game returned to first player
		this.isFinish = false;

        this.InitSender = new DataSender('telephone-init', [...io.to(this.players.id)], [...this.players.name]);
        this.InitSender.send();

        this.CallReceiver = new DataReceiver('telephone-call', players[0].id, (socket, message) => {
            // Double check that the word the client sent is legal
            charLimit = this.wordLimOfCurr(); 
            if (message instanceof string && message.length > charLimit)
            {
                // Tell the client to try again
                socket.emit('telephone-message-error', this.charLimit);
                return;
            }

            this.messageChain.push(message);
            this.CallReceiver.remove(socket);
            this.nextPlayer();
            this.CallReceiver.addSockets(io.to(this.currentPlayer().id));
            // If the chain is ended, inform all players that the game has ended and
            // show everybody the progressiom of the messages
            if (this.isFinish)
            {
                socket.in(room).emit('telephone-game-end', this.messageChain);
                this.CallReceiver.removeAll();
                return;
            }

            // Inform all players that the turn has ended
            io.in(room).emit('telephone-turn-end', this.currentPlayer().name);
            // Only tell the next player the previous message
            io.to(this.currentPlayer().id).emit('telephone-your-turn', message, this.wordLimOfCurr());
        })
	}
	
	// return players, used by GameMode subclasses
	returnPlayers() 
	{
		return this.players;
	}
	
	
	// set current player index to next player
	// will be run any time a game message is sent by a client.
	nextPlayer() 
	{
		if (this.currPlayerIn < this.players.length - 1) {
			this.currPlayerIn += 1;
		} else { // if return to the first player the game has been completed
			this.currPlayerIn = 0;
			this.isFinish = true;
		}
	}
	
	// it's open that the server runs this method when ever it recieves information from a player indicating
	// that they have ended their turn. In the case of telephone it's when the player sends a message
	whenPlayerTurnEnd() 
	{
		this.nextPlayer();
		// what ever is going to message to player (probably server data sender)
		// needs to send wordLimOfCurr() to current player
	}
	
	// return the character limit for the current player of the game
	// the HTML page recievering this information from the server should know that when
	// recieving "50" the game just started, when recieving "0" the game has ended.
	wordLimOfCurr()
	{
		if (this.currPlayerIn === 0) {
			if (this.isFinish) {
				return 0; // know that the game ended.
			} else {
				return 50;
			} 
		} else if (this.currPlayerIn % 2 === 1) {
			return 15;
		} else {
			return 30;
		}
	}
	
	// return the current player
	currentPlayer() 
	{
		return this.players[this.currPlayerIn];
	}
	
	// randomizes the order of players.
	randomizePlayers(players) 
	{
        playersCopy = [...players];
        newPlayers = [ ];
        while (newPlayers.length < players.length)
        {
            newPlayers.push(newPlayers.splice(Math.random() * newPlayers.length)[0]);
        }

        return newPlayers;
    }
}



var i = 1;
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

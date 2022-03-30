// The main server side script

const port = 8000;
const { toNamespacedPath } = require("path");
const { Server, Socket, Namespace, BroadcastOperator } = require("socket.io");
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
                console.log("Error getting file at: " + fileName);
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
 * Represents a user connected to the server
 */
class Player
{
    constructor(id, name)
    {
        this.id = id;
        this.name = name;
        allPlayers.push(this);
        //console.log('Player created. id [' + id + ']' + ', name: ' + name)
    }

    /**
     * To be called whenever a player disconnects 
     */
    remove()
    {
        allPlayers.splice(allPlayers.indexOf(this));
    }
}
function getPlayer(id)
{
    return allPlayers.find((item) => item.id == id)
}
const allPlayers = [];
const allSockets = [];

function getSocket(id)
{
    return allSockets.find((item) => item.id == id);
}
function getSocketsInRoom(room)
{
    return allSockets.filter((item) => item.rooms.has(room));
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
    if (sockets instanceof Server)
    {
        console.log('Begin fetching...');
        sockets = sockets.fetchSockets();
        console.log('Ended fetch');
        return sockets;
    }
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
        this.defaultRecipients = defaultRecipients;
    }

    sendTo(recipients)
    {
        getSocketArray(recipients)
            .forEach((recipient) => recipient.emit(this.tag, ...this.args));
    }

    // Sends the data to all default recipients
    send()
    {
        this.sendTo(this.defaultRecipients);
    }
}

/**
 * An object that handles tagged messages received from arbitrary client sockets 
 */
class DataReceiver {

    /**
     * @param {*} tag The tag that the receiver looks for when detecting messages
     * @param {*} game The game the receiver was created for (null if unapplicable)
     * @param {*} sockets Sockets to be automatically added to the receiver
     * @param {*} callback The method that's called when a message is received
     *  (FIRST PARAMATER MUST TAKE THE SOCKET SENDING THE MESSAGE)
     */
    constructor(tag, game, sockets, callback)
    {
        this.tag = tag;
        if (game != null)
        {
            game.dataReceivers.push(this);
        }
        this.callback = callback;
        this.socketList = [];
        this.addSockets(sockets);
    }

    addSockets(sockets)
    {
        if (sockets == null) return;
        // console.log(sockets.constructor.name);
        sockets = getSocketArray(sockets);
        // console.log(sockets.constructor.name);
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
        socket.removeListener(this.tag, (...args) => {
            this.callback(socket, ...args);
        });
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

// For handling requests to change one's name:
let nameReceiver = new DataReceiver('name-req', null, null, (socket, newName) => {
    var nameInUse = false;
    allPlayers.forEach((item) => {
        if (item.name === newName)
        {
            nameInUse = true;
        }
    })
    if (nameInUse) return;
    let player = getPlayer(socket.id);
    console.log('Player with id [' + socket.id + '] changed name from [' + player.name + '] to [' + newName + ']');
    player.name = newName;
    socket.emit('name-change', newName)
});
// For handling passing chat messages between clients:
let chatReceiver = new DataReceiver('chat-message', null, null, (socket, message) => {
    console.log('Relaying chat message: [' + message + ']');
    socket.rooms.forEach(function (value) {
        socket.to(value).emit('chat-message', getPlayer(socket.id).name, message);
    })
});
// For when a client requests to join a room:
let roomReqReceiver = new DataReceiver('join-req', null, null, (socket, message) => {
    if(message.trim().length === 0)
    {
        return;
    }
    console.log('Joining Room: [' + message + ']');
    // Leaves all other rooms
    socket.rooms.forEach((value) => {
        if(socket.id != value){
            socket.leave(value);
        }
    });
    // Joins the current room
    socket.join(message);
    let str2 = "";
    socket.rooms.forEach(function (value) {
        str2 = str2 + value + ", ";
    })
    str2 = str2.substring(22, str2.length - 2)
    socket.emit('rooms-req', str2);
});
// For when a client requests to leave a room:
let roomLeaveReceiver = new DataReceiver('leave-rooms', null, null, (socket) => {
    socket.rooms.forEach(function (value) {
        if(socket.id != value){
            socket.leave(value);
        }
    })
    socket.emit('rooms-req', "");
});
// For when a client wants to start a game of telephone in their room:
let startTelephoneReceiver = new DataReceiver('telephone-start', null, null, (socket, room) => {
    // let players = [];
    // console.log(io.rooms);
    // console.log('~~~~~~~~~~~~~~~~~~~~~~~~~');
    // console.log(getAllSockets(room, socket));
    // console.log('~~~~~~~~~~~~~~~~~~~~~~~~~');
    // getSocketsInRoom(room).forEach((socket) => {
    //     players.push(getPlayer(socket.id));
    // })
    new Telephone(allPlayers, room);
});

const allCurrentGames = [];
// purpose: GameMode class that is parent for all gamemodes
// input: players that are going to play in the instance of a game
// output: can retrieve the players in game
class GameMode
{
	// Returns a randomized order of the given players.
	static randomizePlayers = (players) => 
	{
        let playersCopy = [...players];
        let newPlayers = [ ];
        while (newPlayers.length < players.length)
        {
            newPlayers.push(playersCopy.splice(Math.random() * playersCopy.length)[0]);
        }

        return newPlayers;
    }
    
    constructor(players, room) 
	{
        if (allCurrentGames.find((item) => item.room == room))
        {
            // Don't start the game if a game is already running in that room
            console.log("Couldn't start Game in room [" + room + "], there's one already running");
            return;
        }
        this.room = room;
        if (players == null || players.length == 0)
            throw Error("Cannot start game with zero players");
		this.players = players;
        this.dataReceivers = [];
        allCurrentGames.push(this);
	}
	
	// return players, used by GameMode subclasses
	returnPlayers() 
	{
		return this.players;
	}

    // Ends the current game 
    endGame()
    {
        this.dataReceivers.forEach((item) => {
            item.removeAll();
        })
        allCurrentGames.splice(allCurrentGames.indexOf(this));
    }
}

// purpose: Telephone class that is intialized when starting a game of telephone
// input: the players that are playing the game
// output: randomize the order of players and can return current player
class Telephone extends GameMode
{
	constructor(players, room) 
	{
		super(players, room);
		this.currPlayerIn = 0;
        this.messageChain = [];
        this.charLimit = this.wordLimOfCurr();
		this.isFinish = false;

        let playerSockets = [];
        let playerNames = [];
        this.players.forEach((item) => {
            playerSockets.push(getSocket(item.id));
            playerNames.push(item.name);
        })
        this.InitSender = new DataSender('telephone-init', playerSockets, playerNames);
        this.InitSender.send();

        this.message = "PLACEHOLDER PROMPT: say something, idk";
        this.yourTurnSender = new DataSender('telephone-your-turn', [], this.message, this.charLimit);
        this.yourTurnSender.sendTo(playerSockets[0] /*getSocket(this.currentPlayer().id)*/);

        this.CallReceiver = new DataReceiver('telephone-call', this, allSockets,
                (socket, mes) => {
            this.message = mes;
            if (socket.id != this.currentPlayer().id)
            {
                console.log("Just received a call from someone who shouldn't be calling: " + this.message);
                return;
            } 
            console.log("Just received a call: " + this.message);
            
            // Double check that the word the client sent is legal
            this.charLimit = this.wordLimOfCurr(); 
            if (this.message.length > this.charLimit)
            {
                // Tell the client to try again
                socket.emit('telephone-message-error', this.charLimit);
                console.log("Last telephone call was invalid. Message: [" + this.message +
                    "], character limit: " + this.charLimit);
                return;
            }

            this.messageChain.push(this.message);
            this.CallReceiver.remove(socket);
            this.nextPlayer();
            // this.CallReceiver.addSockets(getSocket(this.currentPlayer().id));
            
            // If the chain is ended, inform all players that the game has ended and
            // show everybody the progressiom of the messages
            if (this.isFinish)
            {
                getSocketsInRoom(room).forEach((item) => item.emit('telephone-game-end', this.messageChain));
                this.CallReceiver.removeAll();
                console.log("Game of telephone in room [" + room + "] has ended");
                return;
            }

            // Inform all players that the turn has ended
            getSocketsInRoom(room).forEach((item) => item.emit('telephone-turn-end', this.currentPlayer().name));
            // Only tell the next player the previous message
            this.yourTurnSender.sendTo(getSocket(this.currentPlayer().id));
        })

        console.log('Telephone game initialized in room [' + room + ']');
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
}



let globalPlayerCount = 1;
// Whenever a new client connects:
io.on('connection', function (socket)
{
    allSockets.push(socket);

    player = new Player(socket.id, 'Player #' + globalPlayerCount);
    globalPlayerCount = globalPlayerCount + 1;

    // Log info and inform other clients that the connection was successful
    console.log('Connected to client at socket id [' + socket.id + ']');
    socket.emit('connection', 'Hello client with id [' + socket.id + ']', player.name);
    socket.broadcast.emit('message', 'New user has joined: [' + socket.id + ']');
    

    // Adds this new client to the global sockets
    nameReceiver.addSockets(socket);
    chatReceiver.addSockets(socket);
    roomReqReceiver.addSockets(socket);
    roomLeaveReceiver.addSockets(socket);
    startTelephoneReceiver.addSockets(socket);
    socket.on('disconnect', (reason) => {
        allSockets.splice(allSockets.indexOf(socket));
        chatReceiver.remove(socket);
        lostPlayer = getPlayer(socket.id);
        if (lostPlayer != null)
        {
            lostPlayer.remove();
        }
        console.log('Disconnected from client at socket id [' + socket.id + '] for reason [' + reason + ']');
    });
});

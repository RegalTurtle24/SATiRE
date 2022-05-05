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
    app.get('/*', function (req, res) { // If a client file is asked for, give it and specify the correct MIME type
        // Connect to the correct dir of the file hierarchy
        var url = req.url;
        if (url.length > 0 && !url.endsWith('socket.io.js'))
        {
            url = url.replace('/', '/client/');
        }

        SendFile(url, res);
    });
    
    function SendFile(fileName, res)
    {
        // Sniff the MIME
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
function getSocketsFromPlayers(players)
{
    let sockets = new Array(players.length);
    for (var i = 0; i < players.length; i++)
    {
        sockets[i] = players[i].socket;
    }
    return sockets;
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
            this.remove(this.socketList[i]);
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
    if (nameInUse)
    {
        socket.emit('error-display', 'Failed to change name: \"' + '\" is already in use');
        return;
    }
    if (newName.trim() === 0)
    {
        socket.emit('error-display', 'Failed to change name: You cannot have empty name');
        return;
    }
    let player = getPlayer(socket.id);
    console.log('Player with id [' + socket.id + '] changed name from [' + player.name + '] to [' + newName + ']');
    player.name = newName;
    socket.emit('name-change', newName)
});
// For handling passing chat messages between clients:
let chatReceiver = new DataReceiver('chat-message', null, null, (socket, message) => {
    try
    {
        console.log('Relaying chat message: [' + message + ']');
        socket.rooms.forEach(function (value) {
            socket.to(value).emit('chat-message', getPlayer(socket.id).name, message);
        })
        socket.emit('chat-message', getPlayer(socket.id).name, message);
    }
    catch (error)
    {
        socket.emit('error-display', 'Failed to send chat message');
    }
});
// For when a client requests to join a room:
let roomReqReceiver = new DataReceiver('join-req', null, null, (socket, message) => {
    let error = null;
    message = message.trim();
    if (message.length === 0)
    {
        error = 'Cannot join a room without a name';
    }
    // Disallows joining other people's id's
    allSockets.forEach((item) => {
        if (item.id == message)
        {
            error = "Sorry, that room is already someone's id.";
        }
    })
    // Disallows joining a room with a game currently running
    allCurrentGames.forEach((item) => {
        if (item.room == message)
        {
            error = "Sorry, room [" + message + "] already has a game running. Please wait until it has ended.";
        }
    })
    
    if (error != null)
    {
        socket.emit('error-display', error);
        console.log('Join room request refused: [' + message + ']');
        return;
    }
    
    // If it made it to this point, it is a valid room
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
// For when a client wants to start a game in their room:
let startGameReceiver = new DataReceiver('game-start', null, null,
        (socket, gamemode, room, other) => {
    try
    {
        let players = [];
        getSocketsInRoom(room).forEach((socket) => {
            players.push(getPlayer(socket.id));
        })
        if (gamemode === 'telephone')
        {
            new Telephone(players, room, other[0], other[1], other[2]);
            // other contains char policies, the policy tester, and a prompt respectively
        }
        else if (gamemode === 'draw')
        {
            new CollabDraw(players, room, other[0]);
            // other contains the time limit for the game
        }
        else
        {
            throw new Error('Requested gamemode of \"' + gamemode + '\"unknown');
        }
    }
    catch (error)
    {
        console.log('Something went wrong when starting a game: ' + error);
        socket.emit('error-display', 'Failed to start requested game');
    }
});
let disconnectReceiver = new DataReceiver('disconnect', null, null, (socket, reason) => {
    lostPlayer = getPlayer(socket.id);
    if (lostPlayer != null)
    {
        lostPlayer.remove();
    }
    chatReceiver.remove(socket);
    allSockets.splice(allSockets.indexOf(socket));
    console.log('Disconnected from client at socket id [' + socket.id + '] for reason [' + reason + ']');
    allCurrentGames.forEach((game) => {
        if (game.players.includes(lostPlayer))
        {
            game.forceEndGame('player \"' + lostPlayer.name + '\" was disconnected for reason [' + reason + ']')
        }
    })
})

const allCurrentGames = [];
// purpose: GameMode class that is parent for all gamemodes
// input: players that are going to play in the instance of a game
// output: can retrieve the players in game
class GameMode
{
	// Returns a randomized order of the given players.
	static randomizePlayers = (players) => 
	{
        // let playersCopy = [...players];
        // let newPlayers = [ ];
        // while (newPlayers.length < players.length)
        // {
        //     newPlayers.push(playersCopy.splice(Math.random() * playersCopy.length)[0]);
        // }

        // return newPlayers;
        return players;
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

        this.onEnd = [];
	}
	
	// return players, used by GameMode subclasses
	returnPlayers() 
	{
		return this.players;
	}

    // Ends the current game 
    endGame()
    {
        this.onEnd.forEach((item) => item());
        this.dataReceivers.forEach((item) => {
            item.removeAll();
        })
        allCurrentGames.splice(allCurrentGames.indexOf(this));
    }

    /**
     * Abruptly ends a game, in case of emergencies
     * @param {*} reason The reason that is given to the clients 
     */
    forceEndGame(reason)
    {
        getSocketsInRoom(this.room).forEach((socket) => {
            if (socket != null)
            {
                socket.emit('error-display', 'Game has ended. ' + reason);
            }
        })
        this.endGame();
    }
}

/** A game where players try to pass along a message with major restrictions */
class Telephone extends GameMode
{
	constructor(players, room, charPolicies = null, policyTester = () => null, prompt = null) 
	{
		super(GameMode.randomizePlayers(players), room);
        this.onEnd.push(() => this.endTelephone(room));

        // the character policy for phrase sent in the game
        this.charPolicies = charPolicies;
        this.isRandomPolicy = true;
        this.currentCharPolicies = null;
        this.randomizeCharacterPolicy();
        this.policyTester = policyTester;
       

		this.currPlayerIn = 0;
        this.messageChain = [];
		this.isFinish = false;

        let playerSockets = [];
        let playerNames = [];
        let mode = "telephone";
        this.players.forEach((item) => {
            playerSockets.push(getSocket(item.id));
            playerNames.push(item.name);
        })
		
		// sent to gameLogic, lets it know the game started
        this.InitSender = new DataSender('game-init', playerSockets, playerNames , mode);
        this.InitSender.send();

        if (prompt == null)
            prompt = "Start the telephone chain with a your own secret message!";
        this.message = prompt;
        this.yourTurnSender = new DataSender('telephone-your-turn', [], this.message,
            this.getCharMin(), this.getCharMax(), this.currentCharPolicies);
        this.yourTurnSender.sendTo(playerSockets[0] /*getSocket(this.currentPlayer().id)*/);


        // callReciever handles when a player send a message to another player on the server 
        // I.E when a new turn starts. If your dealing with code that updates turn to turn, here's 
        // where you want to look.
        this.callReceiver = new DataReceiver('telephone-call', this, getSocketsFromPlayers(players),
                (socket, mes) => {
            this.message = mes.trim();
            this.yourTurnSender.args[0] = this.message;
            if (socket.id != this.currentPlayer().id)
            {
                console.log("Just received a call from someone who shouldn't be calling: " + this.message);
                return;
            } 
            console.log("Just received a call: " + this.message);
            
            // Double check that the word the client sent is legal
            let min = this.getCharMin();
            let max = this.getCharMax();
            let error = null;
                    // error messages that are sent to player
            if (this.message.length < min)
            {
                let dif = min - this.message.length;
                error = 'Message is ' + dif + ' character' + (dif !== 1 ? 's' : '') + ' too short';
            }
            else if (this.message.length > max)
            {
                let dif = this.message.length - max;
                error = 'Message is ' + dif + ' character' + (dif !== 1 ? 's' : '') + ' too long.'; 
            }

            else if (this.currentCharPolicies != null)
            {
                this.currentCharPolicies.forEach((policy) => {
                    error = this.testPolicy(policy, this.message);
                    if (error != null)
                    {
                        return;
                    }
                });
            }
            if (error != null)
            {
                socket.emit('telephone-message-error', error);
                return;
            }

            // The message passes if it makes it to here
            this.messageChain.push(this.message);
            this.callReceiver.remove(socket);
            this.nextPlayer();
            // Refreshes the character domain
            min = this.getCharMin();
            max = this.getCharMax();
            this.yourTurnSender.args[1] = min;
            this.yourTurnSender.args[2] = max;
            // this.callReceiver.addSockets(getSocket(this.currentPlayer().id));
            
            // If the chain is ended, inform all players that the game has ended and
            // show everybody the progressiom of the messages
            if (this.isFinish)
            {
                this.endTelephone(this.room);
                return;
            }
            // randomize restriction
            this.randomizeCharacterPolicy()
            this.yourTurnSender.args[3] = this.currentCharPolicies;
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
	}

    getCharMin()
    {
        return 1;
    }
	
	/**
     *  @returns the character limit for the current player of the game
	*/
    getCharMax()
	{
		if (this.currPlayerIn === 0) {
			if (this.isFinish) {
				return 0; // know that the game ended.
			} else {
				return 32;
			} 
		} else if (this.currPlayerIn % 2 === 1) {
			return 8;
		} else {
			return 16;
		}
	}
	
	// return the current player
	currentPlayer() 
	{
		return this.players[this.currPlayerIn];
	}

    randomizeCharacterPolicy() {
        // choose one random policy if it exist in charPolicies list, assign it to current policies.
        // if the setting is not on random policy, it will just set to charPolicy
        if (!this.isRandomPolicy) {
            this.currentCharPolicies = this.charPolicies;
        } else if (this.charPolicies != null) {
            this.currentCharPolicies = new Array();
            let index = Math.trunc(Math.random() * this.charPolicies.length);
            this.currentCharPolicies.push(this.charPolicies[index]);
        }
    }

    /**
     * Tests an artbitrary string against the policy
     * @param {*} string The string that is tested against the policy
     * @returns {*} The error message to be sent to the user (null if passes) 
     */
    testPolicy(charPol, string)
    {
        const ALLOWED = 'ALLOWED';
        const REQUIRED = 'REQUIRED';
        const EXCLUSIVE = 'EXCLUSIVE';

        /**
         * Scans a string for this policy's given characters
         * @returns [char-by-char passes array, number of total occurrences] 
         */
        function scanString(characters, string)
        {
            let passes = Array(string.length).fill(false); // Make it a boolean array of default falses??????
            let occurrences = 0;
            characters.forEach((char) => {
                for (let i = 0; i <= string.length - char.length; i++)
                {
                    if (string.substring(i, i + char.length) === char)
                    {
                        for (let j = i; j < i + char.length; j++)
                        {
                            passes[j] = true;
                        }
                        occurrences++;
                    }
                }
            });
            return [passes, occurrences];
        }

        /**
         * @returns String containing a grammatically correct list of all policed characters
         */
        function getCharacterList(characters)
        {
            let allChars = '';
            for (let i = 0; i < characters.length; i++)
            {
                if (i != 0)
                {
                    if (i === characters.length - 1)
                    {
                        allChars += ', or ';
                    }
                    else
                    {
                        allChars += ', ';
                    }
                }
                allChars += '"' + characters[i] + '"'
            }
            return allChars;
        }

        // Special case for bypassing logic
        if (charPol.policy === ALLOWED && charPol.count === -1)
            return null;
            
        // Test the string
        let testString = charPol.caseSensitive ? string : string.toLowerCase();
        var out = scanString(charPol.characters, testString);
        let passes = out[0];
        let occurrences = out[1];

        // Interprets the results based on given policy
        switch (charPol.policy)
        {
            case ALLOWED:
                if (occurrences > charPol.count)
                {
                    return (occurrences - charPol.count) + ' too many occurrences of ' + getCharacterList(charPol.characters);
                }
                return null;
            case REQUIRED:
                if (occurrences < charPol.count)
                {
                    return 'Minimum  of ' + charPol.count + ' ' + getCharacterList(charPol.characters) +
                        ' not met. Missing ' + (charPol.count - occurrences);
                }
                return null;
            case EXCLUSIVE:
                if (occurrences < charPol.count)
                {
                    return 'Minimum  of ' + charPol.count + ' ' + getCharacterList(charPol.characters) +
                        ' not met. Missing ' + (charPol.count - occurrences);
                }
                for (let i = 0; i < passes.length; i++)
                {
                    if (!passes[i])
                    {
                        let badString = '';
                        for (let j = i; j < passes.length; j++)
                        {
                            // If the bad string is too long, just shorten it
                            if (j - i >= 6)
                            {
                                badString += '...'
                                break;
                            }

                            if (!passes[j])
                            {
                                badString += string[j];
                            } 
                            else
                                break;
                        }
                        return 'Detected use of non-permitted characters. First occurance: "' + badString + '"';
                    }
                }
                return null;
        }
    }

    /**
     * Wraps up and completes a game of telephone 
     * @param {*} room Because of weird scope stuff, just enter the room id of this game here
     */
    endTelephone(room)
    {
        getSocketsInRoom(room).forEach((item) => item.emit('telephone-game-end', this.messageChain));
        this.callReceiver.removeAll();
        console.log("Game of telephone in room [" + room + "] has ended");
    }
}

/** A game where players work together to each create part of a larger picture */
class CollabDraw extends GameMode
{
    /**
     * @param {*} timeLimit The time limit of the game in seconds (-1 if unlimited) 
     */
    constructor(players, room, timeLimit)
    {
        super(GameMode.randomizePlayers(players), room);
        this.onEnd.push(() => this.endDraw(room));

        const PORTION_OF_PLAYERS_NEEDED_TO_FINISH_GAME_EARLY = 2.0 / 3.0; 

        class CanvasTile
        {
            constructor(x, y, player, lastChange = null)
            {
                this.x = x;
                this.y = y;
                this.player = player;
                this.socket = getSocket(player.id);
                this.lastChange = lastChange;
            }
        }

        // Initializes the gridboard and assigns each player a space
        var gridWidth = Math.floor(Math.sqrt(players.length));
        var gridHeight = Math.ceil(players.length / gridWidth);
        var lastRowWidth = players % gridWidth;
        this.canvasGrid = new Array(gridHeight);
        let pIndex = 0;
        // Loops through each row of regular size
        for (var y = 0; y < gridHeight - 1; y++)
        {
            this.canvasGrid.push(new Array(gridWidth));
            for (var x = 0; x < gridWidth; x++)
            {
                this.canvasGrid[y][x] = new CanvasTile(x, y, players[pIndex]);
                pIndex++;
            }
        }
        // Loops through the final row of possibly different size
        this.canvasGrid.push(new Array(lastRowWidth));
        for (var x = 0; x < lastRowWidth; x++)
        {
            var y = gridHeight - 1
            this.canvasGrid[y][x] = new CanvasTile(x, y, players[pIndex]);
            pIndex++;
        }

        // Initializes some local variables
        let playerSockets = [];
        let playerNames = [];
        let mode = "draw";
        this.players.forEach((item) => {
            playerSockets.push(getSocket(item.id));
            playerNames.push(item.name);
        })

        // Initializes data receiver for relaying canvas updates between adjacent players
        var canvasUpdaateReceiver = new DataReceiver('draw-canvas-update', this, playerSockets,
                (socket, x, y, newChanges) => {
            let tile = this.canvasGrid[y][x];
            tile.lastChange = newChanges;
            sendTileUpdatesToAdjacents(this.canvasGrid, tile);
        });

        // Initializes the data receiver for if players wish to end the drawing session early
        var socketsRequestingEnd = [];
        var drawEndReqReceiver = new DataReceiver('draw-finalize-req', this, playerSockets,
                (socket) => {
            if (!socketsRequestingEnd.includes(socket))
            {
                socketsRequestingEnd.push(socket);
                if (socketsRequestingEnd.length >= this.players.length * PORTION_OF_PLAYERS_NEEDED_TO_FINISH_GAME_EARLY)
                {
                    this.finalizeCanvas();
                }
            }
        });

        // Tells each player that the game is starting, and optionally gives them a prompt
        for (var i = 0; i < this.players.length; i++)
        {
            playerSockets[i].emit('game-init', playerNames, mode, i % gridWidth, i / gridWidth, timeLimit);
        }

        // Starts a timer for given number of seconds (and/or listens for more than half of players requesting
        // to quit the current game)
        if (timeLimit > 0)
        {
            setTimeout(this.finalizeCanvas, timeLimit * 1000);
        }
    }

    /**
     * Sends the updated tiles to all player adjacent to the given tile
     */
    sendTileUpdatesToAdjacents(grid, tile)
    {
        // Left
        if (tile.x > 0)
        {
            grid[tile.y, tile.x - 1].socket.emit('draw-tile-update', 'right', tile.lastImage);
        }
        // Right
        if (tile.x < grid[tile.y].length - 1)
        {
            grid[tile.y, tile.x + 1].socket.emit('draw-tile-update', 'left', tile.lastImage);
        }
        // Up
        if (tile.y > 0)
        {
            grid[tile.y - 1, tile.x].socket.emit('draw-tile-update', 'down', tile.lastImage);
        }
        // Down
        if (tile.y < grid.length - 1 && !(tile.y == grid.length - 2 && tile.x >= lastRowWidth))
        {
            grid[tile.y + 1, tile.x].socket.emit('draw-tile-update', 'up', tile.lastImage);
        }
    }

    /**
     * Puts all the player's tiles together and sends them to each player,
     * it also ends the game
     */
    finalizeCanvas()
    {
        var fullCanvas;
        // Adds each canvas tile to the full canvas image
        for (var y = 0; y < this.canvasGrid.length; y++)
        {
            for (var x = 0; x < this.canvasGrid[y].length; x++)
            {
                // Has yet to be implemented ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            }
        }

        // Informs players of the game having ended and sends the full image to everybody in the room
        getSocketsInRoom(room).forEach((item) => item.emit('draw-game-end', fullCanvas));
        this.endDraw(this.room);
    }

    /** Ends the game of collaborative draw in the given room */
    endDraw(room)
    {
        console.log("Game of collaborative draw in room [" + room + "] has ended");
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
    startGameReceiver.addSockets(socket);
    disconnectReceiver.addSockets(socket);
});

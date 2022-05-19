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
    constructor(id, name, socket)
    {
        this.id = id;
        this.name = name;
        this.socket = socket
        allPlayers.push(this);
    }

    /**
     * To be called whenever a player disconnects 
     */
    remove()
    {
        allPlayers.splice(allPlayers.indexOf(this), 1);
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
    static globalReceivers = [];

    /**
     * @param {*} tag The tag that the receiver looks for when detecting messages -- DON'T USE DUPLICATE TAGS
     * @param {*} game The game the receiver was created for (null if unapplicable)
     * @param {*} sockets Sockets to be automatically added to the receiver
     * @param {*} callback The method that's called when a message is received
     * @param {*} isGlobal Whether or not all sockets should automatically be added to this receiver
     *  (FIRST PARAMATER MUST TAKE THE SOCKET SENDING THE MESSAGE)
     */
    constructor(tag, game, sockets, callback, isGlobal = false)
    {
        this.tag = tag;
        if (game != null)
        {
            game.dataReceivers.push(this);
        }
        this.callback = callback;
        this.socketList = [];
        this.addSockets(sockets);

        this.isGlobal = isGlobal;
        if (isGlobal)
        {
            DataReceiver.globalReceivers.push(this);
            this.addSockets(allSockets);
        }
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
                });
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
        this.socketList[index].removeAllListeners(this.tag);
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
}, isGlobal = true);
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
}, isGlobal = true);
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
    console.log('Socket "' + socket.id + '" is joining room: [' + message + ']');
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
}, isGlobal = true);
// For when a client requests to leave a room:
let roomLeaveReceiver = new DataReceiver('leave-rooms', null, null, (socket) => {
    socket.rooms.forEach(function (value) {
        if(socket.id != value){
            socket.leave(value);
        }
    })
    socket.emit('rooms-req', "");
}, isGlobal = true);
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
        console.log(error);
        socket.emit('error-display', 'Failed to start requested game\nReason: "' + error + '"');
    }
}, isGlobal = true);
let disconnectReceiver = new DataReceiver('disconnect', null, null, (socket, reason) => {
    lostPlayer = getPlayer(socket.id);
    if (lostPlayer != null)
    {
        lostPlayer.remove();
    }
    allSockets.splice(allSockets.indexOf(socket), 1);
    console.log('Disconnected from client at socket id [' + socket.id + '] for reason [' + reason + ']');
    allCurrentGames.forEach((game) => {
        if (game.players.includes(lostPlayer))
        {
            game.forceEndGame('player \"' + lostPlayer.name + '\" was disconnected for reason [' + reason + ']')
        }
    })
}, isGlobal = true);

const allCurrentGames = [];
// purpose: GameMode class that is parent for all gamemodes
// input: players that are going to play in the instance of a game
// output: can retrieve the players in game
class GameMode
{
	// Returns a randomized order of the given players.
	static randomizePlayers = (players) => 
	{
        let playersCopy = new Array(players.length);
        for (var i = 0; i < playersCopy.length; i++)
        {
            playersCopy[i] = players[i];
        }
        let newPlayers = new Array(players.length);
        for (var i = 0; i < newPlayers.length; i++)
        {
            // This algorithm took me 840 hours to make, you better appreciate it.
            let index = Math.floor(Math.random() * playersCopy.length);
            newPlayers[i] = playersCopy[index];
            playersCopy.splice(index, 1);
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
            playerSockets.push(item.socket);
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
        this.callReceiver = new DataReceiver('telephone-call', this, playerSockets,
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
                this.endGame();
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
                this.socket = player.socket;
                this.lastChange = lastChange;
                this.allChanges = lastChange == null ? [ ] : [ ...lastChange ];
            }
        }

        // Initializes the gridboard and assigns each player a space
        var gridWidth = Math.ceil(Math.sqrt(this.players.length));
        var gridHeight = Math.ceil(this.players.length / gridWidth);
        var lastRowWidth = this.players.length % gridWidth;
        if (lastRowWidth === 0) lastRowWidth = gridWidth;
        this.canvasGrid = new Array(gridHeight);
        let pIndex = 0;
        console.log(`Grid dimensions: width: ${gridWidth}, height: ${gridHeight}, lastRowWidth:
            ${lastRowWidth}, player num: ${this.players.length} -- and stuff`);
        // Loops through each row of regular size
        for (var y = 0; y < gridHeight - 1; y++)
        {
            this.canvasGrid[y] = new Array(gridWidth);
            for (var x = 0; x < gridWidth; x++)
            {
                var player = this.players[pIndex];
                this.canvasGrid[y][x] = new CanvasTile(x, y, player);
                pIndex++;
            }
        }
        // Loops through the final row of possibly different size
        this.canvasGrid[gridHeight - 1] = new Array(lastRowWidth);
        for (var x = 0; x < lastRowWidth; x++)
        {
            var y = gridHeight - 1
            this.canvasGrid[y][x] = new CanvasTile(x, y, this.players[pIndex]);
            pIndex++;
        }
        console.log(`Height: ${this.canvasGrid.length}, Width: ${this.canvasGrid[0].length}`);

        // Initializes some local variables
        let playerSockets = [];
        let playerNames = [];
        let mode = "draw";
        this.players.forEach((item) => {
            playerSockets.push(item.socket);
            playerNames.push(item.name);
        })

        // Initializes data receiver for relaying canvas updates between adjacent players
        let canvasGridScopeGetArounder = this.canvasGrid;
        var canvasUpdateReceiver = new DataReceiver('draw-canvas-update', this, playerSockets,
                (socket, x, y, newChanges) => {
            if (Math.round(x) == x && Math.round(y) == y && x >= 0 && y >= 0 &&
                y < canvasGridScopeGetArounder.length && x < canvasGridScopeGetArounder[y].length)
            {
                let tile = canvasGridScopeGetArounder[y][x];
                tile.lastChange = newChanges;
                for (var i = 0; i < tile.lastChange.length; i++)
                {
                    tile.allChanges.push(tile.lastChange[i]);
                }
                this.sendTileUpdatesToAdjacents(canvasGridScopeGetArounder, tile);
            }
        });

        // Initializes the data receiver for if players wish to end the drawing session early
        var socketsRequestingEnd = [];
        var drawEndReqReceiver = new DataReceiver('draw-finalize-req', this, playerSockets,
                (socket) => {
            if (!socketsRequestingEnd.includes(socket))
            {
                socketsRequestingEnd.push(socket);
                let playersNeededToFinishEarly = this.players.length * PORTION_OF_PLAYERS_NEEDED_TO_FINISH_GAME_EARLY;
                console.log(socketsRequestingEnd.length +  ' of ' + playersNeededToFinishEarly +
                    ' requesting to end CollabDraw in room [' + room + ']');
                if (socketsRequestingEnd.length >= playersNeededToFinishEarly)
                {
                    this.finalizeCanvas(this);
                }
            }
        });

        // Tells each player that the game is starting, and optionally gives them a prompt
        for (var i = 0; i < this.players.length; i++)
        {
            playerSockets[i].emit('game-init', playerNames, mode, Math.floor(i % gridWidth),
                Math.floor(i / gridWidth), timeLimit, gridWidth, gridHeight, lastRowWidth);
        }

        // Starts a timer for given number of seconds (and/or listens for more than half of players requesting
        // to quit the current game)
        if (timeLimit > 0)
        {
            setTimeout(() => {
                this.finalizeCanvas(this)
            }, timeLimit * 1000);
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
            grid[tile.y][tile.x - 1].socket.emit('draw-tile-update', 'right', tile.lastChange);
        }
        // Right
        if (tile.x < grid[tile.y].length - 1)
        {
            grid[tile.y][tile.x + 1].socket.emit('draw-tile-update', 'left', tile.lastChange);
        }
        // Up
        if (tile.y > 0)
        {
            grid[tile.y - 1][tile.x].socket.emit('draw-tile-update', 'down', tile.lastChange);
        }
        // Down
        if (tile.y < grid.length - 1 && !(tile.y == grid.length - 2 && tile.x > grid[grid.length - 1].length - 1))
        {
            grid[tile.y + 1][tile.x].socket.emit('draw-tile-update', 'up', tile.lastChange);
        }
    }

    /**
     * Puts all the player's tiles together and sends them to each player,
     * it also ends the game
     */
    finalizeCanvas(game)
    {
        var fullCanvas = new Array();
		
		
        // Adds each canvas tile to the full canvas image
        for (var y = 0; y < game.canvasGrid.length; y++)
        {
			for (var x = 0; x < game.canvasGrid[y].length; x++)
            {
                var tileContents = [game.canvasGrid[y][x].allChanges, x, y];
                fullCanvas.push(tileContents);
            }
        }

        console.log(`Number of tiles sent over: ${fullCanvas.length}. canvasGrid.length: ${game.canvasGrid.length}. canvasGrid[0].length: ${game.canvasGrid[0].length}`);

        // Informs players of the game having ended and sends the full image to everybody in the room
        getSocketsInRoom(game.room).forEach((item) => item.emit('draw-game-end', fullCanvas));
        game.endGame();
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

    player = new Player(socket.id, 'Player #' + globalPlayerCount, socket);
    globalPlayerCount = globalPlayerCount + 1;

    // Log info and inform other clients that the connection was successful
    console.log('Connected to client at socket id [' + socket.id + ']');
    socket.emit('connection', 'Hello client with id [' + socket.id + ']', player.name);
    socket.broadcast.emit('message', 'New user has joined: [' + socket.id + ']');
    

    // Adds this new client to the global receivers
    for (var i = 0; i < DataReceiver.globalReceivers.length; i++)
    {
        DataReceiver.globalReceivers[i].addSockets(socket);
    }
});

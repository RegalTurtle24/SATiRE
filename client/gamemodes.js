// the purpose of this document is to include the client side code for all Gamemodes
// each class must include a startGame function.

// Constants for special message policies
class CharPolicy
{
    static ALLOWED = 'ALLOWED';
    static REQUIRED = 'REQUIRED';
    static EXCLUSIVE = 'EXCLUSIVE';
    /**
     * Creates a character policy that can be repeatedly tested against
     * @param {*} characters The character(s) that this policy polices
     * @param {*} policy The allowance of the preceding characters (use the constants)
     * @param {*} count The maximum/minimum count for the character, exclusive (-1 means not counted)
     * @param {*} caseSensitive If it cares whether the characters are upper/lower case (defaults to false)
     */
    constructor(characters, policy, count = -1, caseSensitive = false)
    {
        if (characters instanceof String)
            characters = [ characters ];
        this.characters = characters;
        this.policy = policy;
        if (count === -1) // Sets a default value for count if one isn't given
        {
            switch (this.policy)
            {
                case CharPolicy.ALLOWED:
                    count = -1; // Maximum (w/ special case)
                    break;
                case CharPolicy.REQUIRED:
                    count = 1; // Minimum
                    break;
                case CharPolicy.EXCLUSIVE:
                    count = 0; // Minimum
                    break;
            }
        }
        this.count = count;
        this.caseSensitive = caseSensitive;
    }
}

/**
 * Tests an artbitrary string against the policy
 * @param {*} string The string that is tested against the policy
 * @returns {*} The error message to be sent to the user (null if passes) 
 */
function testPolicy(charPol, string)
{
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
    if (charPol.policy === CharPolicy.ALLOWED && charPol.count === -1)
        return null;
        
    // Test the string
    let testString = charPol.caseSensitive ? string : string.toLowerCase();
    var out = scanString(charPol.characters, testString);
    let passes = out[0];
    let occurrences = out[1];

    // Interprets the results based on given policy
    switch (charPol.policy)
    {
        case CharPolicy.ALLOWED:
            if (occurrences > charPol.count)
            {
                return (occurrences - charPol.count) + ' too many occurrences of ' + getCharacterList(charPol.characters);
            }
            return null;
        case CharPolicy.REQUIRED:
            if (occurrences < charPol.count)
            {
                return 'Minimum  of ' + charPol.count + ' ' + getCharacterList(charPol.characters) +
                    ' not met. Missing ' + (charPol.count - occurrences);
            }
            return null;
        case CharPolicy.EXCLUSIVE:
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

class ClientSideTelephone
{
    constructor() { }

	// purpose: a method that sets up data Recievers which handles the client side game logic for 
	// telephone.
	// inputs: An array with the list of players
	// outputs: creates data Senders for the html page, so players can submit information 
	startGame(players)
	{
        chatEnabled = false;
        allowedToChangeRoom = false;
        currentlyPlayingGame = true;

        this.players = players;
        this.setPlayersText(this.players, 0);

        // Variable setup/HTML integration
        var lobbyButton = document.getElementById('p6BackToGameSelect');
        lobbyButton.hidden = true;

        this.playerMessage = document.getElementById('p6subtitle');
        this.callBox = document.getElementById('p6callBox');
        this.callSubmit = document.getElementById('p6callSubmit');
        this.messageErrorBox = document.getElementById('p6teleError');

        this.charMin = -1;
        this.charMax = -1;
        this.policies = [ ];
        this.playerIndex = 0;
        this.myTurn = false;
        
        function getStringLength(string)
        {
            if (string === null) return 0;
            if (string.length === NaN) return 0;
            return string.length;
        }
        function validateCall(message, min, max, policies)
        {
            // Makes any necessary edits to the 
            message = message.trim();

            // Checks message length
            let length = getStringLength(message);
            if (length < min)
            {
                let dif = min - length;
                return [false, message, 'Message is ' + dif + ' character' + (dif !== 1 ? 's' : '') + ' too short'];
            }
            // Checks if the message is over the limit
            if (length > max)
            {
                let dif = length - max;
                return [false, message, 'Message is ' + dif + ' character' + (dif !== 1 ? 's' : '') + ' too long.'];
            }

            // Checks against all policies
            let error = null;
            for (let i = 0; i < policies.length; i++)
            {
                error = testPolicy(policies[i], message);
                if (error != null)
                    return [false, message, error];
            }

            return [true, message, 'Message is acceptable'];
        }
        /** Informs the user on the stats/validity of their call as currently typed out */
        function updateCharacterCount(telephoneGame)
        {
            if (telephoneGame.myTurn)
            {
                let output = validateCall(game.callBox.value, telephoneGame.charMin, telephoneGame.charMax,
                    telephoneGame.policies);
                telephoneGame.messageErrorBox.textContent = 'Character Count: [' + getStringLength(output[1]) +
                    '] - ' + output[2];
            }
            else
            {
                // Can't check a message if you don't know what to check it by
                telephoneGame.messageErrorBox.textContent = '';
            }
        }
        this.callBox.addEventListener('input', () => updateCharacterCount(this));
        updateCharacterCount(this);

        // Passing the call on in the telephone chain
        function submitCall(callBox)
        {
            let call = callBox.value.trim();
            
            console.log('Telephone call sent to server');
            socket.emit('telephone-call', call);
        }
        this.callSubmit.addEventListener('click', () => { submitCall(this.callBox); this.myTurn = false; });

        // The data receivers: AKA, the actual game logic
        let turnEndReceiver = new DataReciever('telephone-turn-end', DataReciever.LOCAL_GAME, (currPlayer) => {
            // Updates the view of the telephone chain for the user
            this.playerIndex = this.players.indexOf(currPlayer);
            if (this.playerIndex == -1)
            {
                alert("Current player received from server isn't recognized");
                return;
            }
            this.setPlayersText(this.players, this.playerIndex);

            // Teaches the user patience
            this.playerMessage.textContent = "It's not your turn yet";

            console.log('The current turn has ended');
        })
        let callErrorReceiver = new DataReciever('telephone-message-error', DataReciever.LOCAL_GAME,
                (error) => {
            this.myTurn = true; // They aren't getting off that easily...

            // Diplays an error message to the user
            let userMessage = 'Telephone call not accepted.';
            if (error != null && error !== '')
            {
                userMessage += '\n' + error;
            }
            alert(userMessage);
        })
        let yourTurnReceiver = new DataReciever('telephone-your-turn', DataReciever.LOCAL_GAME,
                (message, characterMin, characterMax, charPolicies) => {

            this.myTurn = true;
            this.charMin = characterMin;
            this.charMax = characterMax;
            
            this.policies = charPolicies;
            
            updateCharacterCount(this);
            
            // Displays the previous player's message to the user
            this.playerMessage.textContent = (this.playerIndex == 0 ?
                "Start the telephone chain by responding to this prompt: \"" :
                "Decipher this message and pass it on: \"")
                + message + "\" in [" + characterMin + "] to [" + characterMax + "] characters";
            
            console.log("It's your turn now! Previous message: [" + message +
                "], character domain: [" + this.charMin + ', ' + this.charMax + "]");
        })
        let gameEndReceiver = new DataReciever('telephone-game-end', DataReciever.LOCAL_GAME, (messageChain) => {
            // Reveals to the user the results of the game
            let completeChain = "";
            for (let i = 0; i < messageChain.length; i++)
            {
                if (i != 0)
                {
                    completeChain += ' --> ';
                }
                completeChain += messageChain[i];
            }
            this.playerMessage.textContent = "Telephone game ended. The complete telephone chain was: " + completeChain;
            
            this.messageErrorBox.textContent = "";

            this.callSubmit.removeEventListener('click', () => { submitCall(this.callBox); this.myTurn = false; });
            this.callBox.removeEventListener('input', () => updateCharacterCount(this));

            this.endGame();
            lobbyButton.hidden = false;
            

            console.log('The game of telephone in room has ended :)');
        })
	}
    
    setPlayersText(players, playerIndex)
    {
        let playersText = "Players in game: ";
        for (let i = 0; i < players.length; i++)
        {
            if (i != 0)
            {
                playersText += ' --> '
            }
            playersText += this.getPlayerText(players[i], i === playerIndex);
        }
        playerOrder.textContent = playersText;
    }
	
    getPlayerText(name, isCurrent)
    {
        if (isCurrent) return '[' + name + ']';
        return name;
	}
	
	// reenables chat, allow player to change room, and removes dataRecievers established by telephone
	endGame()
    {
        chatEnabled = true;
        currentlyPlayingGame = false;
        allowedToChangeRoom = true;
        DataReciever.closeAllLocalGameReceivers();
    }
	
}

class ClientSideCollabDraw
{
    constructor(numPlayers, x, y, timeLimit, gridWidth, gridHeight, lastRowWidth)
    {
        this.tilePos = [x, y];
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.lastRowWidth = lastRowWidth;
        this.timeLimit = timeLimit;
    }

    startGame()
    {
        // Overhead/local variables
        chatEnabled = true;
        allowedToChangeRoom = false;
        currentlyPlayingGame = true;

        // Initializes and fetches the GUI for the game
        var lobbyButton = document.getElementById('p8BackToGameSelect');
        lobbyButton.hidden = true;

        var drawTimer = document.getElementById('p8drawTimer');
        drawTimer.textContent = this.timeLimit;
        
        var drawingPad = new DrawingPad('p8drawingPad');
        var topCanvas = new VisualDisplay('p8displayTop', [0, -75]);
        if (this.tilePos[1] <= 0) topCanvas.canvas.hidden = true;
        var bottomCanvas = new VisualDisplay('p8displayBottom', [0, 75]);
        if (this.tilePos[1] >= this.gridHeight - 1 ||
            (this.tilePos[1] == this.gridHeight - 2 && this.tilePos[0] >= this.lastRowWidth))
                bottomCanvas.canvas.hidden = true;
        var leftCanvas = new VisualDisplay('p8displayLeft', [-75, 0]);
        if (this.tilePos[0] <= 0) leftCanvas.canvas.hidden = true;
        var rightCanvas = new VisualDisplay('p8displayRight', [75, 0]);
        if (this.tilePos[0] >= this.gridWidth - 1 ||
            (this.tilePos[1] == this.gridHeight - 1 && this.tilePos[0] >= this.lastRowWidth - 1))
                rightCanvas.canvas.hidden = true;
		var finalCanvas = new VisualDisplay('p9finalDisplay', [0, 0]);

        drawingPad.reset();
        topCanvas.reset();
        bottomCanvas.reset();
        leftCanvas.reset();
        rightCanvas.reset();
        finalCanvas.reset();

        var buttonBlack = new padColorSetting('p8BlackColor', drawingPad, '#000000');
        var buttonRed = new padColorSetting('p8RedColor', drawingPad, '#FF0000');
        var buttonLime = new padColorSetting('p8LimeColor', drawingPad, '#53FF45');
        var buttonGreen = new padColorSetting('p8GreenColor', drawingPad, '#198733');
        var buttonBlue = new padColorSetting('p8BlueColor', drawingPad, '#1356E4');
        var buttonPurple = new padColorSetting('p8PurpleColor', drawingPad, '#9D41FF');
        var buttonCyan = new padColorSetting('p8CyanColor', drawingPad, '#21FFF5');

        var endEarlyButton = document.getElementById('p8endGameReq');
        endEarlyButton.addEventListener('click', () => {
            // Asks the server nicely to end the game early
            socket.emit('draw-finalize-req');
        });


        var widthSlider = new padWidthSetting('p8widthSlider', drawingPad);

        // Data sender to update other players on tile updates
        var tileUpdateSender = new DataSender('draw-canvas-update', () => {
            // Sends the current canvas changes to the server, for adjacent players to see parts of
            var changes = drawingPad.mostRecentChanges;
            drawingPad.mostRecentChanges = [];

            return [this.tilePos[0], this.tilePos[1], changes];
        });
        // Makes it update the server on the canvas
        function trySendChanges(timeout)
        {
            setTimeout(() =>
            {
                if (drawingPad.mostRecentChanges != null && drawingPad.mostRecentChanges.length != 0)
                {
                    tileUpdateSender.sendToServer();
                }
                trySendChanges(timeout);
            }, timeout)
        }
        trySendChanges(1000);

        // Data receivers to dynamically change game while drawing
        var tileUpdateReceiver = new DataReciever('draw-tile-update', DataReciever.LOCAL_GAME,
                (direction, lastChanges) => {
            // Update the preview edges of the adjacent tiles
            switch (direction)
            {
                case 'up':
                    topCanvas.drawAllData(lastChanges, 1);
                    break;
                case 'down':
                    bottomCanvas.drawAllData(lastChanges, 1);
                    break;
                case 'left':
                    leftCanvas.drawAllData(lastChanges, 1);
                    break;
                case 'right':
                    rightCanvas.drawAllData(lastChanges, 1);
                    break;
            }
        });
		
        var gameEndReceiver = new DataReciever('draw-game-end', DataReciever.LOCAL_GAME,
            (finalImage) => {
            // Shows the user the masterpiece they helped build
			for (var i = 0; i < finalImage.length; i++) {
				var offSetX = (finalCanvas.bounds.width / this.gridWidth) * finalImage[i][1];
				var offSetY = (finalCanvas.bounds.height / this.gridHeight) * finalImage[i][2];
				finalCanvas.extraOffset = [offSetX, offSetY];
                console.log(`Offset: [${offSetX},${offSetY}], Final Bounds:
                    [${finalCanvas.bounds.width},${finalCanvas.bounds.height}], TilePos: [${finalImage[i][1]},${finalImage[i][2]}]`);
				finalCanvas.drawAllData(finalImage[i][0],
                    finalCanvas.bounds.width / (drawingPad.bounds.width * this.gridWidth));
			}

            this.endGame();
            lobbyButton.hidden = false;

            console.log('The game of collaborative drawing in room has ended :)');
        });

        // Starts ticking down the timer
        function pollTimer(timeLeft)
        {
            setTimeout(() =>
            {
                timeLeft -= 1.0;
                drawTimer.textContent = timeLeft;
                if (timeLeft > 0 && currentlyPlayingGame)
                {
                    pollTimer(timeLeft);
                }
            }, 1000.0);
        }
        pollTimer(this.timeLimit);
    }

    endGame()
    {
        chatEnabled = true;
        currentlyPlayingGame = false;
        allowedToChangeRoom = true;
        DataReciever.closeAllLocalGameReceivers();
    }
}

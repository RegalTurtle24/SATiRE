
function gameLogicInit()
{
    console.log('game logic init is running');

    var startGameButton = document.getElementById('startGame');
    startGameButton.addEventListener('click', (event) => {
        if (joinedRoom == '')
        {
            alert("Can't start game without a room selected");
            return;
        }
        socket.emit('telephone-start', joinedRoom);
    });
    
    var playerOrder = document.getElementById('chat');
    let initReceiver = new DataReciever('telephone-init', DataReciever.LOCAL_GAME, (playerNames) => {
        startTelephone(playerNames);
        setPlayersText(playerNames, 0);
        console.log('Telephone game data initialized');
    })
    
    // Helper functions
    function setPlayersText(players, playerIndex)
    {
        let playersText = "Players in game: ";
        for (let i = 0; i < players.length; i++)
        {
            if (i != 0)
            {
                playersText += ' --> '
            }
            playersText += getPlayerText(players[i], i === playerIndex);
        }
        playerOrder.textContent = playersText;
    }
    function getPlayerText(name, isCurrent)
    {
        if (isCurrent) return '[' + name + ']';
        return name;
    }

    // The real deal
    function startTelephone(players)
    {
        chatEnabled = false;
        allowedToChangeRoom = false;

        // Variable setup/HTML integration
        var playerMessage = document.getElementById('subtitle');
        var callBox = document.getElementById('textBox');
        var callSubmit = document.getElementById('submit');
        var messageErrorBox = document.getElementById('messageErrorBox');

        // Constants for special message policies
        const ALLOWED = 'ALLOWED';
        const REQUIRED = 'REQUIRED';
        const EXCLUSIVE = 'EXCLUSIVE';
        class CharPolicy
        {
            /**
             * Created a policy that can be repeatedly tested against
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
                        case ALLOWED:
                            count = -1; // Maximum (w/ special case)
                            break;
                        case REQUIRED:
                            count = 1; // Minimum
                            break;
                        case EXCLUSIVE:
                            count = 0; // Minimum
                            break;
                    }
                }
                this.count = count;
                this.caseSensitive = caseSensitive;
            }

            /**
             * Tests an artbitrary string against the policy
             * @param {*} string The string that is tested against the policy
             * @returns {*} The error message to be sent to the user (null if passes) 
             */
            testPolicy(string)
            {
                // Special case for bypassing logic
                if (this.policy === ALLOWED && this.count === -1)
                    return null;
                    
                // Test the string
                let testString = this.caseSensitive ? string : string.toLowerCase();
                var out = this.scanString(testString);
                let passes = out[0];
                let occurrences = out[1];

                // Interprets the results based on given policy
                switch (this.policy)
                {
                    case ALLOWED:
                        if (occurrences > this.count)
                        {
                            return (occurrences - this.count) + ' too many occurrences of ' + this.getCharacterList();
                        }
                        return null;
                    case REQUIRED:
                        if (occurrences < this.count)
                        {
                            return 'Minimum  of ' + this.count + ' ' + this.getCharacterList() +
                                ' not met. Missing ' + (this.count - occurrences);
                        }
                        return null;
                    case EXCLUSIVE:
                        if (occurrences < this.count)
                        {
                            return 'Minimum  of ' + this.count + ' ' + this.getCharacterList() +
                                ' not met. Missing ' + (this.count - occurrences);
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
             * Scans a string for this policy's given characters
             * @returns [char-by-char passes array, number of total occurrences] 
             */
            scanString(string)
            {
                let passes = Array(string.length).fill(false); // Make it a boolean array of default falses??????
                let occurrences = 0;
                this.characters.forEach((char) => {
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
            getCharacterList()
            {
                let allChars = '';
                for (let i = 0; i < this.characters.length; i++)
                {
                    if (i != 0)
                    {
                        if (i === this.characters.length - 1)
                        {
                            allChars += ', or ';
                        }
                        else
                        {
                            allChars += ', ';
                        }
                    }
                    allChars += '"' + this.characters[i] + '"'
                }
                return allChars;
            }
        }

        var charMin = -1;
        var charMax = -1;
        var policies = [ ];
        var lastSentCall = '';
        var playerIndex = 0;
        var myTurn = false;
        
        function getStringLength(string)
        {
            if (string === null) return 0;
            if (string.length === NaN) return 0;
            return string.length;
        }
        function validateCall(message)
        {
            // Makes any necessary edits to the 
            message = message.trim();

            // Checks message length
            let length = getStringLength(message);
            if (length < charMin)
            {
                let dif = charMin - length;
                return [false, message, 'Message is ' + dif + ' character' + (dif !== 1 ? 's' : '') + ' too short'];
            }
            // Checks if the message is over the limit
            if (length > charMax)
            {
                let dif = length - charMax;
                return [false, message, 'Message is ' + dif + ' character' + (dif !== 1 ? 's' : '') + ' too long.'];
            }

            // Checks against all policies
            let error = null;
            for (let i = 0; i < policies.length; i++)
            {
                error = policies[i].testPolicy(message);
                if (error != null)
                    return [false, message, error];
            }

            return [true, message, 'Message is acceptable'];
        }
        function updateCharacterCount()
        {
            output = validateCall(callBox.value);
            messageErrorBox.textContent = 'Character Count: [' + getStringLength(output[1]) + '] - ' + output[2];
        }
        callBox.addEventListener('input', updateCharacterCount);
        updateCharacterCount();

        // Passing the call on in the telephone chain
        function submitCall(event)
        {
            output = validateCall(callBox.value);
            if (!output[0])
            {
                alert('Invalid call: ' + output[2]);
                return;
            }

            console.log('clicked submit!!!!');
            lastSentCall = callBox.value;
            socket.emit('telephone-call', lastSentCall);
            myTurn = false;
        }
        callSubmit.addEventListener('click', submitCall)

        // The data receivers: AKA, the actual game logic
        let turnEndReceiver = new DataReciever('telephone-turn-end', DataReciever.LOCAL_GAME, (currPlayer) => {
            // Updates the view of the telephone chain for the user
            playerIndex = players.indexOf(currPlayer);
            if (playerIndex == -1)
            {
                alert("Current player received from server isn't recognized");
                return;
            }
            setPlayersText(players, playerIndex);

            // Teaches the user patience
            playerMessage.textContent = "It's not your turn yet";

            console.log('The current turn has ended');
        })
        let callErrorReceiver = new DataReciever('telephone-message-error', DataReciever.LOCAL_GAME, (newCharMax) => {
            myTurn = true; // They aren't getting off that easily...

            // Diplays an error message to the user
            charMax = newCharMax;
            let userMessage = 'Telephone call not accepted.';
            if (lastSentCall.length > charMax)
            {
                userMessage += '\nRemember, the acceptable character count is [' + charMin + ', ' + charMax + ']!'
            }
            alert(userMessage);
        })
        let yourTurnReceiver = new DataReciever('telephone-your-turn', DataReciever.LOCAL_GAME,
                (message, characterLimit) => {
            myTurn = true;
            charMax = characterLimit;
            
            // Debug rules for testing ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            charMin = 5;
            policies = [new CharPolicy(['a', 'e', 'i', 'o', 'u'], ALLOWED, 6),
                new CharPolicy(['1984'], ALLOWED, 0),
                new CharPolicy(['bazinga'], REQUIRED, 1, true)];
            
            // Displays the previous player's message to the user
            playerMessage.textContent = "Decipher this message and pass it on: [" + message + "] in [" +
                characterLimit + "] characters or less";
            
            console.log("It's your turn now! Previous message: [" + message + "], character limit: [" + characterLimit + "]");
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
            playerMessage.textContent = "Telephone game ended. The complete telephone chain was: " + completeChain;
            
            messageErrorBox.textContent = "";

            callSubmit.removeEventListener('click', submitCall);
            callBox.removeEventListener('input', updateCharacterCount);

            endGame();
            

            console.log('The game of telephone in room has ended :)');
        })
    }
    
    function endGame()
    {
        chatEnabled = true;
        allowedToChangeRoom = true;
        DataReciever.closeAllLocalGameReceivers();
    }
}

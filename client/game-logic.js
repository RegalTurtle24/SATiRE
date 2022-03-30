
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

        var charLimit = -1;
        var lastSentCall = '';
        var playerIndex = 0;
        var myTurn = false;
        
        // Passing the call on in the telephone chain
        function submitCall(event)
        {
            let actualLength = callBox.value.length;
            if (actualLength > charLimit)
            {
                alert('Invalid call, your message was [' + actualLength + '], when the target is [' + charLimit + ']');
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
        let callErrorReceiver = new DataReciever('telephone-message-error', DataReciever.LOCAL_GAME, (newCharLimit) => {
            myTurn = true; // They aren't getting off that easily...

            // Diplays an error message to the user
            charLimit = newCharLimit;
            let userMessage = 'Telephone call not accepted.';
            if (lastSentCall.length > charLimit)
            {
                userMessage += '\nRemember, the character limit is ' + charLimit + '!'
            }
            alert(userMessage);
        })
        let yourTurnReceiver = new DataReciever('telephone-your-turn', DataReciever.LOCAL_GAME,
                (message, characterLimit) => {
            myTurn = true;
            charLimit = characterLimit;
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

            callSubmit.removeEventListener('click', submitCall);

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
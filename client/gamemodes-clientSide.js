// the purpose of this document is to include the client side code for all Gamemodes
// each class must include a startGame function.

class ClientSideTelephone {
	
	// purpose: a method that sets up data Recievers which handles the client side game logic for 
	// telephone.
	// inputs: An array with the list of players
	// outputs: creates data Senders for the html page, so players can submit information 
	function startGame(players) 
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
	
	// reenables chat, allow player to change room, and removes dataRecievers established by telephone
	function endGame()
    {
        chatEnabled = true;
        allowedToChangeRoom = true;
        DataReciever.closeAllLocalGameReceivers();
    }
	
}


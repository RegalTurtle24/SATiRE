
function gameLogicInit()
{
    console.log('game logic init is running');
	
	// attach event listener to the gamemode start buttons
	// so far this just adds it to telephone start game 
	// will need to be its on method or class so we have mutiple buttons
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
    
	// runs gamemode when recieve that gamemode
	let initReceiver = new DataReciever('game-init', DataReciever.LOCAL_GAME, (playerNames, mode) => {
        if (mode === "telephone") 
		{
            let game = new ClientSideTelephone();
            game.startGame(playerNames);
		}
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
}

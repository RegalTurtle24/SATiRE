var playerOrder;
/** The current game (if one is running) */
var game = null;

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
        
        //Debug rules for testing ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        policies = [new CharPolicy(['a', 'e', 'i', 'o', 'u'], CharPolicy.ALLOWED, 6),
            new CharPolicy(['1984'], CharPolicy.ALLOWED, 0),
            new CharPolicy(['bazinga'], CharPolicy.REQUIRED, 1, true)];
        
        socket.emit('telephone-start', joinedRoom, policies, testPolicy);
    });
    
    playerOrder = document.getElementById('chat');
    
	// runs gamemode when recieve that gamemode
	let initReceiver = new DataReciever('game-init', DataReciever.LOCAL_GAME, (playerNames, mode) => {
        if (mode === "telephone") 
		{
            game = new ClientSideTelephone();
            game.startGame(playerNames);
            console.log('Telephone game data initialized');
		}
    })
}

var playerOrder;

// purpose:
// input:
// ouput:
class GameStartButton 
{
	constructor(buttonID, emitMessage) 
	{
		this.box = document.getElementById(buttonID);
		box.addEventListener('click', (event) => {
			if (joinedRoom == '') 
			{
				alert("Can't start game without a room selected");
            	return;
			}
			socket.emit(emitMessage, joinedRoom);
		});
	}
}

function gameLogicInit()
{
    console.log('game logic init is running');
	
	// attach event listener to the gamemode start buttons
	// so far this just adds it to telephone start game 
	// will need to be its on method or class so we have mutiple buttons
    var startGameButton = GameStartButton('startGame', 'telephone-start');
    /*startGameButton.addEventListener('click', (event) => {
        if (joinedRoom == '')
        {
            alert("Can't start game without a room selected");
            return;
        }
        socket.emit('telephone-start', joinedRoom);
    });*/
    
    playerOrder = document.getElementById('chat');
    
	// runs gamemode when recieve that gamemode
	let initReceiver = new DataReciever('game-init', DataReciever.LOCAL_GAME, (playerNames, mode) => {
        if (mode === "telephone") 
		{
            let game = new ClientSideTelephone();
            game.startGame(playerNames);
            console.log('Telephone game data initialized');
		}
    })
}

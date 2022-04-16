var playerOrder;

// purpose:
// input:
// ouput:
class GameStartButton 
{
	constructor(buttonID, emitMessage) 
	{
		this.box = document.getElementById(buttonID);
		this.box.addEventListener('click', (event) => {
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
	
	// telephone event listener
    startTeleButton = new GameStartButton('startGame', 'telephone-start');
    
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

var playerOrder;
/** The current game (if one is running) */
var game = null;

// purpose:
// input:
// output: 
class GameStartButton {

	constructor(buttonID, emitMessage, other) {
		this.box = document.getElementById(buttonID);
		// a parameter that could be used to define anything not used in the code. 
		this.other = other;

		this.box.addEventListener('click', (event) => {
			if (joinedRoom == '') {
				alert("Can't start game without a room selected");
				return;
			}

			socket.emit(emitMessage, joinedRoom, this.other, testPolicy);
		});
	}
}

function gameLogicInit() {
	console.log('game logic init is running');

	// ------- Telephone ------------- //
	//Debug rules for testing ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	policies = [new CharPolicy(['a', 'e', 'i', 'o', 'u'], CharPolicy.ALLOWED, 6),
			new CharPolicy(['1984'], CharPolicy.ALLOWED, 0)];

	document.getElementById('require').addEventListener('click', (event) => {
		var phrase = document.getElementById("restrictBox").value;
		policies.push(new CharPolicy([phrase], CharPolicy.REQUIRED, 1, true));
	});
	document.getElementById('ban').addEventListener('click', (event) => {
		var phrase = document.getElementById("restrictBox").value;
		policies.push(new CharPolicy([phrase], CharPolicy.ALLOWED, 0));
	});

	var startGameButton = new GameStartButton('startGame', 'telephone-start', policies)


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

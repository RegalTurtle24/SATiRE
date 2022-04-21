var playerOrder;
/** The current game (if one is running) */
var game = null;

// purpose: this is an abstractable button used for buttons that start game modes
// input: the HTML ID of the button, the message the button should emit, any other information the gamemode needs
// output: adds event listener to the HTML button, and allows for the message and other information to be send when 
// hitting that button
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

			socket.emit(emitMessage, joinedRoom, this.other);

		});
	}
}
// purpose: A class that handles starting gamemode or applying settings to gamemodes.
function gameLogicInit() {
	console.log('game logic init is running');

	// ------------------------------- Telephone --------------------------- //
	//Debug rules for testing ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	policies = [new CharPolicy(['a', 'e', 'i', 'o', 'u'], CharPolicy.ALLOWED, 6),
		new CharPolicy(['1984'], CharPolicy.ALLOWED, 0)];

	// purpose: for apply custom character policies within telephone
	class policyButton {
		constructor(ButtonID, policyType) {
			document.getElementById(ButtonID).addEventListener('click', (reqfunc) => {
				var phrase = document.getElementById("restrictBox").value;
				var telephoneNumberLimit = document.getElementById("teleNumLimit").value;
				policies.push(new CharPolicy([phrase], policyType, telephoneNumberLimit, true));
			});
        }
	}

	var limitButton = new policyButton('telerequire', CharPolicy.REQUIRED);
	var requireButton = new policyButton('telelimit', CharPolicy.ALLOWED);

	var startGameButton = new GameStartButton('startGame', 'telephone-start', [policies, testPolicy])
	// ---------------------------------------------------------------------//

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

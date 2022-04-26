var playerOrder;
/** The current game (if one is running) */
var game = null;

// purpose: this is an abstractable button used for buttons that start game modes
// input: the HTML ID of the button, the message the button should emit, any other information the gamemode needs
// output: adds event listener to the HTML button, and allows for the message and other information to be send when 
// hitting that button
class GameStartButton {

	constructor(buttonID, emitMessage, gamemode, getOtherParameters) {
		this.box = document.getElementById(buttonID);
		// a parameter that could be used to define anything not used in the code. 
		this.getOtherParameters = getOtherParameters;
		this.box.addEventListener('click', (event) => {
			if (joinedRoom == '') {
				alert("Can't start game without a room selected");
				return;
			}

			let other = null;
			if (this.getOtherParameters() != null)
			{
				other = this.getOtherParameters();
			}

			socket.emit(emitMessage, gamemode, joinedRoom, other);
		});
	}
}

// purpose: A class that handles starting gamemode or applying settings to gamemodes.
function gameLogicInit() {
	
	console.log('game logic init is running');

	// ------------------------------- Telephone --------------------------- //
	policies = [];
	prompts = null;

	// purpose: for apply custom character policies within telephone
	class policyButton {
		constructor(ButtonID, policyType) {
			document.getElementById(ButtonID).addEventListener('click', (reqfunc) => {
				var phrase = document.getElementById("p5restrictBox").value;
				var telephoneNumberLimit = document.getElementById("p5teleNumLimit").value;
				document.getElementById("p5restrictBox").value = '';
				document.getElementById("p5teleNumLimit").value = '';
				policies.push(new CharPolicy([phrase], policyType, telephoneNumberLimit, true));
			});
        }
	}
	class PrompFileInput {
		/**
		 * Makes a button prompt the user in a popup when pressed
		 * @param {*} id the ID of the button
		 * @param {*} inputHandler the function that handles user text input once it has been submitted
		 */
		constructor(id, inputHandler)
		{
			this.fileSelector = document.getElementById(id);
			this.fileSelector.addEventListener('change', (event) => {
				inputHandler(this.fileSelector.files[0]);
			})
		}
	} 

	var limitButton = new policyButton('p5telerequire', CharPolicy.REQUIRED);
	var requireButton = new policyButton('p5telelimit', CharPolicy.ALLOWED);

	var promptInput = new PrompFileInput('teleprompt', (file) => {
		if (file == null)
		{
			this.prompts = null;
			return;
		}
		fr = new FileReader();
		fr.onload = () => {
			prompts = fr.result.split('\n');
		}
		fr.readAsText(file);
	});

<<<<<<< HEAD
	var startTelephoneButton = new GameStartButton('p5startGame', 'game-start', 'telephone', () => {
		if (policies.length == 0)
		{
			let emptyCharPol = new CharPolicy([""], CharPolicy.REQUIRED, 1, true);
			policies.push(emptyCharPol);
		}

=======
	var startTelephoneButton = new GameStartButton('startGame', 'game-start', 'telephone', () => {
>>>>>>> e749972 (Created outline for server side CollabDraw)
		let params = [policies, testPolicy, prompts];
		// Randomly picks a prompt
		if (params[2] != null)
		{
			let index = Math.trunc(Math.random() * params[2].length);
			params[2] = params[2][index];
		}
		return params;
	});
	// __________________________________________________________________________//



	// runs gamemode when recieve that gamemode
	let initReceiver = new DataReciever('game-init', DataReciever.LOCAL_GAME, (playerNames, mode, ...args) => {
        if (mode === "telephone") 
		{
			playerOrder = document.getElementById('p6playerOrder');
			jumpTo('telephone_now_playing');
            game = new ClientSideTelephone(...args);
            game.startGame(playerNames);
            console.log('Telephone game data initialized');
		}
		else if (mode === "draw");
		{
			game = new ClientSideCollabDraw(playerNames.length, ...args);
			game.startGame();
			console.log('Collaborative drawing game initialized');
		}
    })
}

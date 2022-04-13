


//////////////////////////////////////////////////////////////////////////////
///                                                                        ///
///                        DECLARATION OF GLOBALS                          ///
///                                                                        ///
//////////////////////////////////////////////////////////////////////////////

var socket = null;
var chatEnabled = true;
var allowedToChangeRoom = true;
var playerName = "PLACEHOLDER_NAME";
var joinedRoom = "";








function initializeSocket()
{

	//////////////////////////////////////////////////////////////////////////////
	///                                                                        ///
	///                        INITIALIZE GLOBAL VARS                          ///
	///                                                                        ///
	//////////////////////////////////////////////////////////////////////////////

	socket = io();
	chatEnabled = true;
	currentlyPlayingGame = false;
	playerName = "PLACEHOLDER_NAME";
	joinedRoom = "";
	






	/// CHANGE SOCKET LISTENERS TO DATA RECIEVERS!!!!

	//////////////////////////////////////////////////////////////////////////////
	///                                                                        ///
	///                          SOCKET LISTENERS                              ///
	///                                                                        ///
	//////////////////////////////////////////////////////////////////////////////

	socket.on('connection', function (event, defaultName) {
		console.log("Socket connected, initial message: \"" + event + "\"");

		nameLabelUpdater.update(defaultName);
		
		socket.onAny((tag, data) => {
			console.log('Message from server: tag: \"' + tag + '\", data: ' + data);
		});
		
		chatMessageReciever = new DataReciever('chat-message', 'BACKEND-LISTENER', (name, data) => {
			chatFieldUpdater.update(name, data);
		})
		roomChangeReciever = new DataReciever('rooms-req', 'BACKEND-LISTENER', (rooms) => {
			joinedRoomsTextUpdater.update(rooms);
			console.log('Recieved rooms-req, ' + rooms);
		})
		nameChangeReciever = new DataReciever('name-change', 'BACKEND-LISTENER', (name) => {
			console.log('Name successfully changed to: ' + name);
			nameLabelUpdater.update(name);
		})
	})




	//////////////////////////////////////////////////////////////////////////////
	///                                                                        ///
	///                           HELPER CLASSES                               ///
	///                                                                        ///
	//////////////////////////////////////////////////////////////////////////////

	class TextFieldAndButton
	{
		constructor(textBoxID, buttonID, onClickMethod)
		{
			this.textField = document.getElementById(textBoxID);
			this.submitButton = document.getElementById(buttonID);

			this.submitButton.addEventListener('click', onClickMethod);

			addSubmitToEnter(this.textField, this.submitButton);
		}
	}

	class ChangingTextField
	{
		constructor(textFieldID, updateFunction)
		{
			this.textField = document.getElementById(textFieldID);
			this.update = updateFunction;
		}

		update(...args)
		{
			this.args = args;
			this.update(this.args);
		}
	}











	


	


	//////////////////////////////////////////////////////////////////////////////
	///                                                                        ///
	///                 CREATION OF LISTENERS ON TEXTBOXES                     ///
	///                                                                        ///
	//////////////////////////////////////////////////////////////////////////////

	// For the name changer
	nameFieldListener = new TextFieldAndButton('nameBox', 'nameSubmit', () => {
		var requestedName = nameFieldListener.textField.value;
		socket.emit('name-req', requestedName);
		nameFieldListener.textField.value = '';
	})

	// For the chat feature
	chatFieldListener = new TextFieldAndButton('textBox', 'submit', () => {
		if (chatEnabled)
		{
			var message = chatFieldListener.textField.value;
			socket.emit('chat-message', message);
			chatFieldListener.textField.value = '';
			console.log("Sent chat message: " + message);
		}
	})

	// For the join box
	joinFieldListener = new TextFieldAndButton('roomJoinBox', 'roomJoinSubmit', () => {
		console.log('testing');
		if (allowedToChangeRoom)
		{
			var message = joinFieldListener.textField.value;
			socket.emit('join-req', message);
			joinFieldListener.textField.value = '';
			console.log("Sent join req: " + message);
		}
	})








	// THESE 3 ARE THE SAME!!!!
	// ABSTRACT!!!!

	//////////////////////////////////////////////////////////////////////////////
	///                                                                        ///
	///             TEXT FIELDS THAT CHANGE AND THEIR UPDATES                  ///
	///                                                                        ///
	//////////////////////////////////////////////////////////////////////////////

	var chatFieldUpdater = new ChangingTextField('chat', (requestedName, message) => {
		if (chatEnabled)
		{
			chatFieldUpdater.textField.textContent = '[' + requestedName + '] ' + message;
		}
	})

	var joinedRoomsTextUpdater = new ChangingTextField('rooms', (data) => {
		joinedRoom = data;
		if (data === "")
		{
			console.log('hello world');
			joinedRoomsTextUpdater.textField.textContent = "No current rooms";
		} else {
			joinedRoomsTextUpdater.textField.textContent = data;
		}
	})

	var nameLabelUpdater = new ChangingTextField('nameLabel', (newName) => {
		playerName = newName;
		nameLabelUpdater.textField.textContent = '(Current name: ' + newName + ')';
	})
	














	//////////////////////////////////////////////////////////////////////////////
	///                                                                        ///
	///                           HELPER METHODS                               ///
	///                                                                        ///
	//////////////////////////////////////////////////////////////////////////////	

	function addSubmitToEnter(textBox, button)
	{
		// https://www.w3schools.com/howto/howto_js_trigger_button_enter.asp
		textBox.addEventListener('keydown', function(event) {
		if (event.key === 'Enter') {
		  // Cancel the default action, if needed
		  event.preventDefault();
		  // Trigger the button element with a click
		  button.click();
		}
	  });
	}
	


















	//////////////////////////////////////////////////////////////////////////////
	///                                                                        ///
	///                           OTHER LISTENERS                              ///
	///                                                                        ///
	//////////////////////////////////////////////////////////////////////////////

	var roomLeaveButton = document.getElementById('leaveRoom');
	roomLeaveButton.addEventListener('click', () => {
		socket.emit('leave-rooms');
	});
















    //////////////////////////////////////////////////////////////////////////////
	///                                                                        ///
	///                        STARTING OTHER LOGIC                            ///
	///                                                                        ///
	//////////////////////////////////////////////////////////////////////////////

	// Call to game-logic.js, starts up the logic for starting a game
	gameLogicInit();
}
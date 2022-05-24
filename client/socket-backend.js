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
	currentlyPlayingGame = false;
	
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

		chatMessageReciever = new DataReciever('chat-message', DataReciever.BACKEND, (name, data) => {
			chatFieldUpdater.update(name, data);
		})
		roomChangeReciever = new DataReciever('rooms-req', DataReciever.BACKEND, (rooms) => {
			p4roomDisplay.update(rooms);
			console.log('Recieved rooms-req, ' + rooms);
			if(rooms === "")
			{
				slide('prev');
			} else {
				slide('next');
			}
		})
		nameChangeReciever = new DataReciever('name-change', DataReciever.BACKEND, (name) => {
			console.log('Name successfully changed to: ' + name);
			nameLabelUpdater.update(name);
			slide('next');
		})
		errorReciever = new DataReciever('error-display', DataReciever.BACKEND, (error) => {
			alert(error);
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
	nameFieldListener = new TextFieldAndButton('p2nameBox', 'p2nameSubmit', () => {
		var requestedName = nameFieldListener.textField.value;
		socket.emit('name-req', requestedName);
		nameFieldListener.textField.value = '';
	})

	// For the chat feature
	chatFieldListener = new TextFieldAndButton('p4textBox', 'p4submit', () => {
		if (chatEnabled)
		{
			var message = chatFieldListener.textField.value;
			socket.emit('chat-message', message);
			chatFieldListener.textField.value = '';
			console.log("Sent chat message: " + message);
		}
	})

	// For the join box
	joinFieldListener = new TextFieldAndButton('p3roomJoinBox', 'p3roomJoinSubmit', () => {
		if (allowedToChangeRoom)
		{
			var message = joinFieldListener.textField.value;
			socket.emit('join-req', message);
			joinFieldListener.textField.value = '';
			console.log("Sent join req: " + message);
		}
	})

	telephoneGameListener = new TextFieldAndButton('p6callBox', 'p6callSubmit', () => {})

	//////////////////////////////////////////////////////////////////////////////
	///                                                                        ///
	///             TEXT FIELDS THAT CHANGE AND THEIR UPDATES                  ///
	///                                                                        ///
	//////////////////////////////////////////////////////////////////////////////

	var chatFieldUpdater = new ChangingTextField('p4chat', (requestedName, message) => {
		if (chatEnabled)
		{
			chatFieldUpdater.textField.textContent = '[' + requestedName + '] ' + message;
		}
	})

	var p4roomDisplay = new ChangingTextField('p4roomDisplay', (data) => {
		joinedRoom = data;
		if (data === "")
		{
			p4roomDisplay.textField.textContent = "Your Room: No Current Room";
		} else {
			p4roomDisplay.textField.textContent = "Your Room: " + data;
		}
	})

	var nameLabelUpdater = new ChangingTextField('p2nameLabel', (newName) => {
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

	var roomLeaveButton = document.getElementById('p4leaveRoom');
	roomLeaveButton.addEventListener('click', () => {
		if(allowedToChangeRoom)
		{
			socket.emit('leave-rooms');
		}
	});

    //////////////////////////////////////////////////////////////////////////////
	///                                                                        ///
	///                        STARTING OTHER LOGIC                            ///
	///                                                                        ///
	//////////////////////////////////////////////////////////////////////////////

	// Call to game-logic.js, starts up the logic for starting a game
	gameLogicInit();
}



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
		
		socket.onAny((tag, data) => {
			console.log('Message from server: tag: \"' + tag + '\", data: ' + data);
		});
		socket.on('chat-message', (name, data) => {
			updateChat(name, data);
		});
		socket.on('rooms-req', (rooms) => {
			updateRooms(rooms);
			console.log('Recieved rooms-req, ' + rooms);
		})
		updateName(defaultName);
		socket.on('name-change', (name) => {
			console.log('Name successfully changed to: ' + name);
			updateName(name);
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













	


	


	//////////////////////////////////////////////////////////////////////////////
	///                                                                        ///
	///                  CREATION OF LISTENERS ON FIELDS                       ///
	///                                                                        ///
	//////////////////////////////////////////////////////////////////////////////

	// For the name changer
	nameField = new TextFieldAndButton('nameBox', 'nameSubmit', () => {
		var requestedName = nameField.textField.value;
		socket.emit('name-req', requestedName);
		nameField.textField.value = '';
	})

	// For the chat feature
	chatField = new TextFieldAndButton('textBox', 'submit', () => {
		if (chatEnabled)
		{
			var message = chatField.textField.value;
			socket.emit('chat-message', message);
			chatField.textField.value = '';
			console.log("Sent chat message: " + message);
		}
	})

	// For the join box
	joinField = new TextFieldAndButton('roomJoinBox', 'roomJoinSubmit', () => {
		if (allowedToChangeRoom)
		{
			var message = joinField.textBox.value;
			socket.emit('join-req', message);
			joinField.textBox.value = '';
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

	var chatBox = document.getElementById('chat');
	function updateChat(name, message)
	{
		if (chatEnabled)
		{
			chatBox.textContent = '[' + name + ']' + message;
		}
	}

	var joinedRoomsText = document.getElementById('rooms');
	function updateRooms(data)
	{
		joinedRoom = data;
		if (data === "")
		{
			joinedRoomsText.textContent = "No current rooms";
		} else {
			joinedRoomsText.textContent = data;
		}
	}

	var nameLabel = document.getElementById('nameLabel');
	function updateName(newName)
	{
		playerName = newName;
		nameLabel.textContent = '(Current name: ' + newName + ')';
	}
	














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
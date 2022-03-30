var socket = null;
var chatEnabled = true;
var allowedToChangeRoom = true;
var playerName = "PLACEHOLDER_NAME";
var joinedRoom = "";

function initializeSocket()
{
	socket = io();
	chatEnabled = true;
	playerName = "PLACEHOLDER_NAME";
	joinedRoom = "";
	
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
	
	var nameLabel = document.getElementById('nameLabel');
	var nameBox = document.getElementById('nameBox');
	var nameSumbit = document.getElementById('nameSubmit');
	nameSumbit.addEventListener('click', (event) => {
		var requestedName = nameBox.value;
		socket.emit('name-req', requestedName);
	});
	function updateName(newName)
	{
		playerName = newName;
		nameLabel.textContent = '(Current name: ' + newName + ')';
	}
	
	var chatTextBox = document.getElementById('textBox');
	var chatSubmitButton = document.getElementById('submit');
	chatSubmitButton.addEventListener('click', submitMessage);
	addSubmitToEnter(chatTextBox, chatSubmitButton)
	
	function submitMessage()
	{
		if (chatEnabled)
		{
			var message = chatTextBox.value;
			socket.emit('chat-message', message);
			console.log("Sent chat message: " + message);
		}
	}
	var chatBox = document.getElementById('chat');
	function updateChat(name, message)
	{
		if (chatEnabled)
		{
			chatBox.textContent = '[' + name + ']' + message;
		}
	}
	
	var roomJoinBox = document.getElementById('roomJoinBox');
	var roomJoinSubmit = document.getElementById('roomJoinSubmit');
	roomJoinSubmit.addEventListener('click', submitJoinRoomReq);
	addSubmitToEnter(roomJoinBox, roomJoinSubmit)
	
	function submitJoinRoomReq()
	{
		if (allowedToChangeRoom)
		{
			var message = roomJoinBox.value;
			socket.emit('join-req', message);
			console.log("Sent join req: " + message);
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
	
	var roomLeaveButton = document.getElementById('leaveRoom');
	roomLeaveButton.addEventListener('click', leaveRooms);
	function leaveRooms()
	{
		socket.emit('leave-rooms');
	}

	gameLogicInit();
}
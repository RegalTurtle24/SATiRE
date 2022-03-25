const socket = io();

socket.on('connection', function (event) {
	console.log("Socket connected, initial message: \"" + event + "\"");
	
	socket.onAny((tag, data) => {
		console.log('Message from server: tag: \"' + tag + '\", data: ' + data);
	});
	socket.on('chat-message', (data) => {
		updateChat(data);
	});
	socket.on('rooms-req', (rooms) => {
		updateRooms(rooms);
		console.log('Recieved rooms-req, ' + rooms);
	})
})

var chatTextBox = document.getElementById('textBox');
var chatSubmitButton = document.getElementById('submit');
chatSubmitButton.addEventListener('click', submitMessage);
addSubmitToEnter(chatTextBox, chatSubmitButton)

function submitMessage()
{
	var message = chatTextBox.value;
	socket.emit('chat-message', message);
	console.log("Sent chat message: " + message);
}
var chatBox = document.getElementById('chat');
function updateChat(message)
{
	chatBox.textContent = message;
}

var roomJoinBox = document.getElementById('roomJoinBox');
var roomJoinSubmit = document.getElementById('roomJoinSubmit');
roomJoinSubmit.addEventListener('click', submitJoinRoomReq);
addSubmitToEnter(roomJoinBox, roomJoinSubmit)

function submitJoinRoomReq()
{
	var message = roomJoinBox.value;
	socket.emit('join-req', message);
	console.log("Sent join req: " + message);
}
var joinedRooms = document.getElementById('rooms');
function updateRooms(data)
{
	if(data === "")
	{
		joinedRooms.textContent = "No current rooms";
	} else {
		joinedRooms.textContent = data;
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
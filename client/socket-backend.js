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

var textBox = document.getElementById('textBox');
var submitButton = document.getElementById('submit');
submitButton.addEventListener('click', submitMessage);
function submitMessage()
{
	var message = textBox.value;
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

var roomLeaveButton = document.getElementById('leaveRoom');
roomLeaveButton.addEventListener('click', leaveRooms);
function leaveRooms()
{
	socket.emit('leave-rooms');
}
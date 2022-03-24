const socket = io();

let i = 0;
socket.on('connection', function (event) {
	socket.emit('message',"Test message to server");
	
	console.log("Socket connected, initial message: \"" + event + "\"");
	
	socket.onAny((data) => {
		console.log('Message from server: ' + data);
	});
	socket.on('chat-message', (data) => {
		updateChat(data);
	});
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

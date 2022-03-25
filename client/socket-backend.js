const socket = io();

socket.on('connection', function (event) {
	console.log("Socket connected, initial message: \"" + event + "\"");
	
	socket.onAny((tag, data) => {
		console.log('Message from server: tag: \"' + tag + '\", data: ' + data);
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

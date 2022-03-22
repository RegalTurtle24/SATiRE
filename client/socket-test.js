const socket = io();

let i = 0;
socket.on('connection', function (event) {
	socket.emit('message',"Test message to server");
	
	console.log("Socket connected, initial message: \"" + event + "\"");
	
	socket.on('message', (data) => {
		console.log('Message from server: ' + data);
	});
})


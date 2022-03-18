const socket = io('http://localhost:8080');

let i = 0;
socket.addEventListener('open', function (event) {
	socket.send("Test message to server");
	
	console.log("You seein' this? We got a functioning socket!");
	alert("IT CONNECTED!!!");
	
	setInterval(function() {
		i++;
		socket.send("data " + i);
	}, 2000);
});

socket.addEventListener('message', function (event) {
	socket.send("Message received!!!", event.data);
});

console.log('got to the end of socket-test.js');

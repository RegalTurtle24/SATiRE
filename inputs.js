// classes to deal with different type of input the player sends to server
// includes text or images

// purpose: retrieves string or an image from some html class and send to server
// input: string or image is submit from html
// output: sends that data to the server
class dataSender 
{
	let dSocket;
	
	constructor(serverURL) 
	{
		dSocket = new WebSocket(serverURL);
	}
	
	// purpose:
	// input:
	// output:
	sendToServer(data) 
	{
		dSocket.send(data);
	}
	
}
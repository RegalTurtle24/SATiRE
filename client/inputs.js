// classes to deal with different type of input the player sends to server
// includes text or images

// purpose: retrieves string or an image from some html class and send to server
// input: string or image is submit from html
// output: sends that data to the server
class DataSender 
{
	//let socket;
	
	// for the constructor pass in a WebSocket 
	constructor(socket, tag) 
	{
		this.socket = socket;
		this.tag = tag;
	}
	
	// purpose: sends to server and to what else it needs to be sent to
	// input: what ever data the player inputted
	// output: the player 
	sendToServer(data, receptiant) 
	{
		
	}
}

// purpose: A class that recieves data and calls a function based off of it
// input: the function that wants to be called, a websocket
// output: run recieveFunction
class DataReciever
{
	//let socket;
	
	constructor(socket, recieveFunction, tag) 
	{
		// this.socket = socket
		this.recieveFunction = recieveFunction;
		this.tag = tag;
	}
	
	// purpose: run the recieveFunction function when data is sent though this method 
	// input: data
	// output: run recieveFunction;
	recieveFromServer(data, tag) // this class might need to be changed to accommodate how the websocket works. 
	{
		if (tag === this.tag) // if the data has the wrong tag, and doesn't use it.
		{
			this.recieveFunction(data);
		}
	}
}
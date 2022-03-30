const socket = require("socket.io-client") // import client socket library

// classes to deal with different type of input the player sends to server
// includes text or images

// purpose: retrieves string or an image from some html class and send to server
// input: string or image is submit from html
// output: sends that data to the server
class DataSender 
{
	// for the constructor pass in a WebSocket 
	constructor(tag, getData) 
	{
		this.tag = tag;
		this.getData = getData;
	}
	
	// purpose: sends to server and to what else it needs to be sent to
	sendToServer()
	{
		// what ever code needs to be done to send the data with tag to receptiant
		// requires websocket
		socket.emit(this.tag, ...this.getData());
	}
}

// purpose: A class that recieves data and calls a function based off of it
// input: the function that wants to be called, a websocket
// output: run recieveFunction
class DataReciever
{
	static GLOBAL = 'GLOBAL';
	static LOCAL_GAME = 'GAME';
	static #localGameReceivers = [];
	static closeAllLocalGameReceivers()
	{
		for (var i = this.#localGameReceivers.length - 1; i >= 0; i--)
		{
			this.#localGameReceivers[i].remove();
			this.#localGameReceivers.pop();
		}
	}

	// tag: something signify the type of data the dataReciever receives 
	// recieveFunction: the method that is run when data is recieved
	constructor(tag, type, recieveFunction) 
	{
		this.tag = tag;
		this.type = type;
		if (this.type === DataReciever.LOCAL_GAME)
		{
			DataReciever.#localGameReceivers.push(this);
		}
		this.recieveFunction = recieveFunction;

		socket.on(this.tag, this.recieveFunction)
	}
	
	/**
	 * Removes this DataReceiver's associated listners from the global websocket
	 */
	remove()
	{
		socket.off(this.tag, this.recieveFunction);
	}
}


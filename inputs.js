// classes to deal with different type of input the player sends to server
// includes text or images

// purpose: retrieves string or an image from some html class and send to server
// input: string or image is submit from html
// output: sends that data to the server
class DataSender 
{
	let dSocket;
	
	// for the constructor pass in a WebSocket 
	constructor(dSocket) 
	{
		//this.dSocket = dSocket;
	}
	
	// purpose: sends to server and to what else it needs to be sent to
	// input: what ever data the player inputted
	// output: the player 
	sendToServer(data) 
	{
		//dSocket.send(data);
	}
}

// purpose: retrieve inputted text and output it to the server and the chat box
// input: the websocket and chat box 
// output: any user inputs can be sent though websocket and to the chat box
class ChatDataSender extends DataSender
{
	let dSocket;
	let chatBox;
	
	// for the constructor pass in a WebSocket and the chatBox
	constructor(dSocket, chatBox) 
	{
		//this.dSocket = dSocket;
		this.chatBox = chatBox;
	}
	
	// purpose: sends to server and to what else it needs to be sent to
	// input: what ever data the player inputted
	// output: the player 
	sendToServer(data) 
	{
		//dSocket.send(data);
		chatBox.retrieveChat(data);
	}
}

//purpose: a chat box that displays messages made by the player, and other players
//input: create object
//output: the ability to send data to the chat box and have it display in HTML.
class ChatBox 
{
	let chatHistory;
	
	// the constructor creates a list which stores previous messages
	// NOTE FOR PROGRAMMERS: you probably want to have a system to remove messages
	// that were sent long enough ago that they no longer display
	constructor() 
	{
		chatHistory = new Array();
	}
	
	retrieveChat(data) 
	{
		chatHistory.add(data);
	}
	
	getChatHistory() 
	{
		return chatHistory;
	}
}
// JavaScript Document

///for client and server use to display chat on all player screenss

//socketback - windows.unload to get code working 
class Chatbox
{
	constructor()
	{
		
		//get player input for test text
		//var t = readLine("Enter a message to send to our server");
		
		
		///test text field var from socket///
		//send text to server, change 2nd perameter to var t when its ready
		
		//var chatdataS = new DataSender("textInputChat", "text for server");
		//chatdataS.sendToServer();
		
		/*
		//receive and print same tag from server(text should be what is in the chatdata var)
		//refer to socket-backend text field sections
		var chatdataR = new DataReciever("textInputChat", String, recieveFunction)
		chatdataR.recieveFunction();
		*/
		
		var canv = document.getElementById("myCanvas");
		canv.text.value = "hello";
		
		this.c = document.getElementById("myCanvas");
		this.ctx = this.c.getContext("2d");
		
		
		this.ctx.beginPath();
		
		this.ctx.fillStyle = 'white';
		this.ctx.fillrect(0, 0, 250, 400);
		this.ctx.fill();	
		//ctx.strokeText("Type in chat",10,50);
		//ctx.font = "15px Comic Sans MS";
		
		
	
		
		//have text wrap around in box//
		
		
		//var textInput = <input type="text" id="demo">
		
		document.write("0");
		
		
	
	
	//on submission to input field	
		
		
	
	
		
	
	
	
	}
}

// this file is for storing the DrawingPad and VisualDisplay classes for the 
// collab draw gamemode



//new DrawingPad("drawingPad");

// purpose: a DrawingPad that 
// input: users stokes on canvas, colors they choose
// output:
class DrawingPad {
	
	// variables for color, pen, stroke, etc. settings 
	
	constructor(canvasID /*,dataSender*/) {
		// variable to use when drawing.
		this.color = '#000000'; // when messing with this always use hex 
		this.isCurrentlyDrawing = false;
		
		// creating eventListener so we can draw
		this.canvas = document.getElementById(canvasID);
		this.bounds = this.canvas.getBoundingClientRect();
		this.canvas.addEventListener("mousedown", (event) => this.startDraw(event));
		this.canvas.addEventListener("mousemove", (event) => this.draw(event));
		this.canvas.addEventListener("mouseup", (event) => this.cancelDraw(event));
		
		console.log("ok");
	}
	
	addSetting(/*colorSettingID, submittionID, function*/) {
		// run function, allows to grab class variables
	}
	
	// purpose: starting drawing when click down, get intial cooridinates 
	startDraw(event) {
		this.isCurrentlyDrawing = true;
		this.setCooridinates(event);
		console.log("draw started");
	}
	
	// purpose:
	
	draw(event) {
		if (this.isCurrentlyDrawing) {
			// initialize necessar variables
			this.context = this.canvas.getContext("2d");
			
			//set stuff
			this.context.lineWidth = 20;
			this.context.lineCap = "round";
			
			// -----			
			this.context.moveTo(this.mouseCooridinatesX, this.mouseCooridinatesY);
			this.setCooridinates(event);
			this.context.lineTo(this.mouseCooridinatesX, this.mouseCooridinatesY);
			this.context.stroke();
			console.log("drawing");
		}
	}
	
	setCooridinates(event) {
		this.mouseCooridinatesX = event.clientX - this.bounds.left;
		this.mouseCooridinatesY = event.clientY - this.bounds.top;
		console.log(this.mouseCooridinatesX + "" + this.mouseCooridinatesY);
	}
	
	cancelDraw(event) {
		this.isCurrentlyDrawing = false;
		console.log("draw cancelled");
	}
}

// purpose: the visual display is meant to show the 
// input:
// output:
class VisualDisplay {
	
	constructor(canvasID, cutOff) {
		this.canvas = document.getElementByID(canvasID);
		this.bounds = this.canvas.getBoundingClientRect();
		
		this.cutOffLeft = cutOff[0];
		this.cutOffRight = cutOff[1];
		this.cutOffTop = cutOff[2];
		this.cutOffBottom = cutOff[3];
		
	}
	
	drawData(/*color,*/ lineWidth, drawPathCoor) {
		// add data to canvas.
		this.context = this.canvas.getContext("2d");
			
		//set stuff
		this.context.lineWidth = lineWidth;
		this.context.lineCap = "round";
		
		/*
			offset by cutOffLeft and cutOffTop
			if the entire line is outside bounds of cutOff don't draw
		*/
		
		// -----			
		this.context.moveTo(drawPathCoor[0], drawPathCoor[1]);
		this.context.lineTo(drawPathCoor[2], drawPathCoor[3]);
		this.context.stroke();
		console.log(" got drawing");
	}
}
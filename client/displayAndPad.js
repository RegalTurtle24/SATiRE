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
		this.canvas.addEventListener("mousedown", this.startDraw);
		this.canvas.addEventListener("mousemove", this.draw);
		this.canvas.addEventListener("mouseup", this.cancelDraw);
	}
	
	addSetting(/*colorSettingID, submittionID, function*/) {
		// run function, allows to grab class variables
	}
	
	// purpose: starting drawing when click down, get intial cooridinates 
	startDraw(event) {
		this.isCurrentlyDrawing = true;
		this.setPositionAsCurrent(event);
	}
	
	// purpose:
	
	draw(event) {
		if (this.isCurrentlyDrawing) {
			// initialize necessar variables
			this.context = this.canvas.getContext("2d");

			this.context.beginPath();
			this.context.moveTo(this.mouseCooridinatesX, this.mouseCooridinatesY);
			this.setPositionAsCurrent(event);
			this.context.lineTo(this.mouseCooridinatesX, this.mouseCooridinatesY);
			this.context.stroke();
		}
	}

	setPositionAsCurrent(event) {
		this.mouseCooridinatesX = event.clientX - this.bounds.left;
		this.mouseCooridinatesY = event.clientY - this.bounds.top;
    }
	
	cancelDraw(event) {
		this.isCurrentlyDrawing = false;
	}
}

// purpose:
// input:
// output:
class VisualDisplay {
	
	constructor(/*canvasID, dataReciever*/) {
		// let data reciever do work.
	}
	
	recieveData(/*some how get server data*/) {
		// add data to canvas.
	}
}
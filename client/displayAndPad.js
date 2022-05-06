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
			this.context.lineWidth = 2;
			this.context.lineCap = "round";
			
			// -----			
			this.context.moveTo(this.mouseCooridinatesX, this.mouseCooridinatesY);
			this.setCooridinates(event);
			if (this.mouseCooridinatesX > this.bounds.width || this.mouseCooridinatesX < 0 || this.mouseCooridinatesY > this.bounds.height || this.mouseCooridinatesY < 0) {
				this.cancelDraw(event);
			}
			this.context.lineTo(this.mouseCooridinatesX, this.mouseCooridinatesY);
			this.context.stroke();
			console.log("drawing");
		}
	}
	
	setCooridinates(event) {
		if (this.mouseCooridinatesX != null && this.this.mouseCooridinatesY != null) {
			this.previousX = this.mouseCooridinatesX;
			this.previousY = this.mouseCorridinatesY;
        }
		this.mouseCooridinatesX = event.pageX - this.bounds.left;
		this.mouseCooridinatesY = event.pageY - this.bounds.top;
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
		this.cutOffTop = cutOff[1];
		
	}
	
	drawData(/*color,*/ lineWidth, drawPathCoor) {
		// add data to canvas.
		this.context = this.canvas.getContext("2d");
			
		//set stuff
		this.context.lineWidth = lineWidth;
		this.context.lineCap = "round";
		
		this.context.moveTo(drawPathCoor[0] - cutOffLeft, drawPathCoor[1] - cutOffTop);
		this.context.lineTo(drawPathCoor[2] - cutOffLeft, drawPathCoor[3] - cutOffTop);
		this.context.stroke();
		console.log(" got drawing");
	}
}
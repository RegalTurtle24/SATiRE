// this file is for storing the DrawingPad and VisualDisplay classes for the 
// collab draw gamemode



// purpose: this class is to create a canvas in which a user can directly draw images on using their cursor
// input: the element ID for the canvas your using
// output: a canvas that you can drawing own by holding down your cursor and moving across it.
class DrawingPad {
	
	// variables for color, pen, stroke, etc. settings 
	
	constructor(canvasID) {
		// variable to use when drawing.
		this.color = '#000000'; // when messing with this always use hex 
		this.isCurrentlyDrawing = false;
		
		// creating eventListener so we can draw
		this.canvas = document.getElementById(canvasID);
		this.bounds = this.canvas.getBoundingClientRect();
		this.canvas.addEventListener("mousedown", (event) => this.startDraw(event));
		this.canvas.addEventListener("mousemove", (event) => this.draw(event));
		this.canvas.addEventListener("mouseup", (event) => this.cancelDraw(event));
		this.canvas.addEventListener("mouseout", (event) => this.cancelDraw(event));
		
		this.context = this.canvas.getContext("2d");

		// creating variables for other code to get/send drawing changes
		this.onStrokeEnd = null;
		this.mostRecentChanges = [ ];
	}
	
	addSetting(/*colorSettingID, submittionID, function*/) {
		// run function, allows to grab class variables
	}
	
	// purpose: starting drawing when click down, get intial cooridinates 
	startDraw(event) {
		this.isCurrentlyDrawing = true;
		this.setCooridinates(event);
		this.mostRecentChanges.push([this.color, [[this.mouseCooridinatesX, this.mouseCooridinatesY]] ]);
	}
	
	// purpose: draw a line for one cooridinate to another, typically when the mouse moves.
	draw(event) {

		if (this.isCurrentlyDrawing) {
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

			// Updates the changes array
			if (this.mostRecentChanges.length === 0)
			{
				this.mostRecentChanges.push([this.color, [[this.mouseCooridinatesX, this.mouseCooridinatesY]] ]);
			}
			this.mostRecentChanges[this.mostRecentChanges.length - 1][1].push(
				[this.mouseCooridinatesX, this.mouseCooridinatesY]);
		}
	}

	// purpose: sets new cooridinate based on mouse position relative to canvas
	// store previous position, if needed to be used.
	setCooridinates(event) {
		if (this.mouseCooridinatesX != null && this.mouseCooridinatesY != null) {
			this.previousX = this.mouseCooridinatesX;
			this.previousY = this.mouseCorridinatesY;
        }
		this.mouseCooridinatesX = event.pageX - this.bounds.left;
		this.mouseCooridinatesY = event.pageY - this.bounds.top;
	}

	// purpose: cancels drawing, usual when mouse is released
	cancelDraw(event) {
		this.isCurrentlyDrawing = false;

		if (this.onStrokeEnd != null)
		{
			this.onStrokeEnd();
		}
	}
}

// purpose: this class is meant to be a visual display that a program can draw on in real time for the user.
// primarly this is used to display the drawings of other players, however their could also be used for other programs.
// input: the element ID for the canvas you want to use, and the off set for what ever cooridinates are inputted.
// output: when given a set of cooridinates and other parameter such as lineWidth and color, the drawData function should 
// be able to draw an image on the given canvas using inputted cooridinate data.
class VisualDisplay {
	
	/**
	 * 
	 * @param {*} cutOff [x cut off (+ for left, - for right), y cut off (+ for top, - for left)]
	 */
	constructor(canvasID, cutOff) {
		this.canvas = document.getElementById(canvasID);
		this.bounds = this.canvas.getBoundingClientRect();
		this.context = this.canvas.getContext("2d");

		this.cutOffLeft = 0;
		this.cutOffRight = 0;
		this.cutOffTop = 0;
		this.cutOffBottom = 0;
		if (cutOff != null) {
			if (cutOff[0] < 0)
				this.cutOffLeft = cutOff[0];
			else
				this.cutOffRight = -cutOff[0]
			if (cutOff[1] < 0)
				this.cutOffTop = cutOff[1];
			else
				this.cutOffBottom = -cutOff[1];
        }
		
	}
	
	drawData(/*color,*/ lineWidth, drawPathCoor) {
		// add data to canvas.
		
		if (drawPathCoor == null || drawPathCoor[0] == null || drawPathCoor[1] == null || drawPathCoor[2] == null || drawPathCoor[3] == null) {
			//set stuff
			this.context.lineWidth = lineWidth;
			this.context.lineCap = "round";
			//console.log("previous cooridinates " + drawPathCoor[0] + " : " + drawPathCoor[1]);
			//console.log("current cooridinates " + drawPathCoor[2] + " : " + drawPathCoor[3]);
		
			var offset = [this.cutOffRight - this.cutOffLeft, this.cutOffBottom - this.cutOffTop];
			this.context.moveTo(drawPathCoor[0] + offset[0], drawPathCoor[1] + offset[1]);
			this.context.lineTo(drawPathCoor[2] + offset[0], drawPathCoor[3] + offset[1]);
			this.context.stroke();
		}
	}

	drawAllData(changes)
	{
		for (var i = 0; i < changes.length; i++)
		{
			let color = changes[i][0];
			let line = changes[i][1];
			
			
			this.context.lineWidth = 2;
			this.context.lineCap = "round";
			
			var offset = [this.cutOffRight - this.cutOffLeft, this.cutOffBottom - this.cutOffTop];
			this.context.moveTo(line[0][0] + offset[0], line[0][1] + offset[1]);
			for (var j = 0; j < line.length; j++)
			{
				this.context.lineTo(line[j][0] + offset[0], line[j][1] + offset[1]);
			}
			this.context.stroke;
		}
	}
}
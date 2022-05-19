// this file is for storing the DrawingPad and VisualDisplay classes for the 
// collab draw gamemode



// purpose: this class is to create a canvas in which a user can directly draw images on using their cursor
// input: the element ID for the canvas your using
// output: a canvas that you can drawing own by holding down your cursor and moving across it.
class DrawingPad {
	
	// variables for color, pen, stroke, etc. settings 

	// for your information most resent changes include
	// color, array[contains cooridinates and line width], and if it was still drawing

	constructor(canvasID) {
		// variable to use when drawing.
		this.color = '#000000'; // when messing with this always use hex
		this.lineWidth = 2;
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
	
	// purpose: starting drawing when click down, get intial cooridinates 
	startDraw(event) {
		this.isCurrentlyDrawing = true;
		this.setCooridinates(event);
		this.mostRecentChanges.push([this.color, [[this.mouseCooridinatesX, this.mouseCooridinatesY, this.lineWidth]]]);
	}
	
	// purpose: draw a line for one cooridinate to another, typically when the mouse moves.
	draw(event) {

		if (this.isCurrentlyDrawing) {
			//get components set up
			this.context.lineWidth = this.lineWidth;
			this.context.lineCap = "round";
			this.context.strokeStyle = this.color;

			// actually drawing
			this.context.beginPath();			
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
				console.log(this.previousX + " : " + this.previousY);
				this.mostRecentChanges.push([this.color, [[this.previousX, this.previousY, this.lineWidth]]]);
				//this.mostRecentChanges[0][1].push([this.mouseCooridinatesX, this.mouseCooridinatesY, this.lineWidth]);
			}
			this.mostRecentChanges[this.mostRecentChanges.length - 1][1].push(
				[this.mouseCooridinatesX, this.mouseCooridinatesY, this.lineWidth]);
		}
	}

	// purpose: sets new cooridinate based on mouse position relative to canvas
	// store previous position, if needed to be used.
	setCooridinates(event) {
		if (this.mouseCooridinatesX != null && this.mouseCooridinatesY != null) {
			this.previousX = this.mouseCooridinatesX;
			this.previousY = this.mouseCorridinatesY;
        }
		this.mouseCooridinatesX = event.pageX - (this.bounds.left);
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

// purpose: give a button the capability to change the color used on a canvas
// input: button element Id, and drawing Pad
// ouput: you can click on button, and it change draw color on drawing Pad
class padColorSetting {
	constructor(colorId, drawPad, color) {
		this.colorButton = document.getElementById(colorId);
		this.colorButton.addEventListener("click", function() {
			drawPad.color = color;
		});
    }
}

// purpose: allow for a slider to change the width of draw stroke on the drawing pad
// input: allow for a slider to change lineWidth
// output: line width changes with slider
class padWidthSetting {
	constructor(widthId, drawPad) {
		this.widthSlider = document.getElementById(widthId);
		this.widthSlider.addEventListener("mouseup", function() {
			drawPad.lineWidth = this.value;
		});
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

		this.setCutOff(cutOff);
		
	}
	
	// purpose:
	// input:
	// output:
	setCutOff(cutOff) {
		this.cutOffLeft = 0;
		this.cutOffRight = 0;
		this.cutOffTop = 0;
		this.cutOffBottom = 0;
		if (cutOff != null) {
			if (cutOff[0] < 0)
				this.cutOffLeft = -cutOff[0];
			else
				this.cutOffRight = -cutOff[0]
			if (cutOff[1] < 0)
				this.cutOffTop = -cutOff[1];
			else
				this.cutOffBottom = -cutOff[1];
        }
	}
	
	// purpose: draw a line on the canvas from one point the other
	// input: set of cooridinate, lineWidth, and color of line
	// output: a line with the respective color, width, and cooridinates is drawn out.
	drawData(color, lineWidth, drawPathCoor) {
		this.context.beginPath();
		this.context.lineWidth = lineWidth;
		this.context.lineCap = "round";
		this.context.strokeStyle = color;
		
		var offset = [this.cutOffRight - this.cutOffLeft, this.cutOffBottom - this.cutOffTop];
		this.context.moveTo(drawPathCoor[0] + offset[0], drawPathCoor[1] + offset[1]);
		this.context.lineTo(drawPathCoor[2] + offset[0], drawPathCoor[3] + offset[1]);
		this.context.stroke();
	}

	// purpose: draws alls changes made by other player to the visual display
	// input: all changes that had been made to the representive canvas since last checked
	// output: changes are drawn on canvas
	drawAllData(changes, scale)
	{
		for (var i = 0; i < changes.length; i++)
		{
			let color = changes[i][0];
			let line = changes[i][1];

			console.log(line[0][0] + " : " + line[0][1] + " -> " + line[1][0] + " : " + line[1][1]);
			for (var j = 1; j < line.length; j++) {
				this.drawData(color, line[j][2] * scale, [line[j - 1][0] * scale, line[j - 1][1] * scale, line[j][0] * scale, line[j][1] * scale]);

			}
		}
	}
}
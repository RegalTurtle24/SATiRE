// this file is for storing the DrawingPad and VisualDisplay classes for the 
// collab draw gamemode

// purpose: a DrawingPad that 
// input: users stokes on canvas, colors they choose
// output:
class DrawingPad {
	
	// variables for color, pen, stroke, etc. settings 
	
	constructor(/*canvasID, dataSender*/) {
		// setup dataSender for drawing pad 
		// addEventListener on canvas release to active dataSender
		// addEventListener on canvas to activate draw method when click and drag
		// addEventListner to colorSetting object.
	}
	
	addSetting(/*colorSettingID, submittionID, function*/) {
		// run function, allows to grab class variables
	}
	
	draw(/*some how get user data*/) {
		// add user data to canvas
	}
}

// purpose:
// input:
// output:
class VisualDisplay {
	
	constructor(/*canvasID, dataReciever*/) {
		// let data reciever do work.
	}
	
	draw(/*some how get server data*/) {
		// add data to canvas.
	}
}
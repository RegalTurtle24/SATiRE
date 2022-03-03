// variable to keep track of textBox upon loading
//let textBox = document.getElementById("textBox");

//load function upon creation.
window.onload = function () {
	alert ("Hello");
	
	let textBox = document.getElementById("textBox");
	textBox.addEventListener("click", takeUserInput(), false);
	
	// purpose: takeUserInput when run will take a type input and return a string
	// input: what user types
	// ouptut: String of what the user typed
	function takeUserInput() {
		alert ("Hello");
		/*if (textBox.text === 'Type here') {
			textBox.text = 'gaming';
		} else {
			textBox.text = 'Type here';
		}*/	
	}
}

/*
// purpose: takeUserInput when run will take a type input and return a string
// input: what user types
// ouptut: String of what the user typed
function takeUserInput() {
	if (textBox.text === 'Type here') {
		textBox.text = 'gaming';
	} else {
		textBox.text = 'Type here';
	}
		
	
}
*/
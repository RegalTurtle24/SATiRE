// I am making a new file to test how JavaScript works with this program
//let Console = new console;
//Console.log(takeUserInput());


let textBox = document.getElementById("textBox");
textBox.addEventListener("click", takeUserInput);

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
// This is a file full of all the possible games on the server

// purpose: GameMode class that is parent for all gamemodes
// input: players that are going to play in the instance of a game
// output: can retrieve the players in game
class GameMode
{
	
	constructor(players) 
	{
		// players should be stored in an array
		this.players = players;
	}
	
	// return players, used by GameMode subclasses
	returnPlayers() 
	{
		
	}
}

// purpose: Telephone class that is intialized when starting a game of telephone
// input: the players that are playing the game
// output: randomize the order of players and can return current player
class Telephone extends GameMode
{
	
	constructor(players) 
	{
		super()
		this.players = players;
		this.currPlayerIn = 0;
		// keep track off if the game returned to first player
		this.isFinish = false;
		// randomizePlayers();
	}
	
	// return players, used by GameMode subclasses
	returnPlayers() 
	{
		return this.players;
	}
	
	// set current player index to next player
	// will be run any time a game message is sent by a client.
	nextPlayer() 
	{
		if (this.currPlayerIn < this.players.length - 1) {
			this.currPlayerIn += 1;
		} else { // if return to the first player the game has been completed
			this.currPlayerIn = 0;
			this.isFinish = true;
		}
	}
	
	// return the character limit for the current player of the game
	// the HTML page recievering this information from the server should know that when
	// recieving "50" the game just started, when recieving "0" the game has ended.
	WordLimOfCurr()
	{
		if (this.currPlayerIn === 0) {
			if (this.isFinish) {
				return 0; // know that the game ended.
			} else {
				return 50;
			} 
		} else if (this.currPlayerIn % 2 === 1) {
			return 15;
		} else {
			return 30;
		}
	}
	
	// return the current player
	returnCurrentPlayer() 
	{
		return this.players[this.currPlayerIn];
	}
	
	// randomize the order of players.
	randomizePlayers() 
	{
		// take the players array and create a second array of same size
		// for each player in the first array (loops though)
		// will choose a random number 0 <= n < size of array
		//if the spot isn't taken, then takes it.
		// if the spot is taken adds 1 and checks again (loop with previous step)
			// remeber to return to beginning if hit end of array. stop if hit original spot.
	}
}
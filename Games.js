// This is a file full of all the possible games on the server

// purpose: GameMode class that is parent for all gamemodes
// input: players that are going to play in the instance of a game
// output: can retrieve the players in game
class GameMode
{
	// let players;
	
	constructor(players) 
	{
		// this.players = players;
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
	// let players;
	// let currPlayerIn;
	
	constructor(players) 
	{
		// this.players = players;
		// randomizePlayers();
	}
	
	// return players, used by GameMode subclasses
	returnPlayers() 
	{
		// return players;
	}
	
	// set current player index to next player
	// will be run any time a game message is sent by a client.
	nextPlayer() 
	{
		// if (currPlayerIn < players.length - 1) {
			// currPlayerIn += 1;
		//} else {
			// currPlayerIn = 0;
		//}
	}
	
	// return the current player
	returnCurrentPlayer() 
	{
		// return players[currPlayerIn];
	}
	
	// randomize the order of players.
	#randomizePlayers() 
	{
		// take the players array and create a second array of same size
		// for each player in the first array (loops though)
		// will choose a random number 0 <= n < size of array
		//if the spot isn't taken, then takes it.
		// if the spot is taken adds 1 and checks again (loop with previous step)
			// remeber to return to beginning if hit end of array. stop if hit original spot.
	}
}
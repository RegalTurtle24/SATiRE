// File that deals with connecting players together in a lobby

const Host = 0;
const Guest = 1;

class Lobby
{
	constructor(name, playerCap, password = null)
	{
		this.name = name;
		this.playerCap = playerCap;
		this.players = Array.of(Player);
		this.password = password;
	}
	static sendDataTo(player)
	{
		// This is going to be a dosey...
	}
}

class Player
{
	constructor(type, name, ip)
	{
		this.type = type;
		this.name = name;
		this.ip;
	}
}

/**
 * Game subscribes to gameId events and handles them posting moves
 * generated by player object that must implement two methods:
 * 
 * getNextMove(array of uciMoves) returns uciMove
 * getReply(chat event) returns chat message  
 * 
 */
class Game {

  /**
   * Initialise with interface to lichess.
   */
  constructor(api, name, player) {
    this.api = api;
    this.name = name;
    this.player = player;
  }

  start(gameId) {
    this.gameId = gameId;
    this.api.streamGame(gameId, (event) => this.handler(event));
  }

  handleChatLine(event) {
    if (event.username !== this.name) {
      const reply = this.player.getReply(event);
      if (reply) {
        this.api.chat(this.gameId, event.room, reply);
      }
    }
  }

  handler(event) {
    switch (event.type) {
      case "chatLine":
        this.handleChatLine(event);
        break;
      case "gameFull":
        this.colour = this.playingAs(event);
        this.playNextMove(event.state.moves);
        break;
      case "gameState":
        this.playNextMove(event.moves);
        break;
      default:
        console.log("Unhandled game event : " + JSON.stringify(event));
    }
  }

  playNextMove(previousMoves) {
    const moves = (previousMoves === "") ? [] : previousMoves.split(" ");
    if (this.isTurn(this.colour, moves)) {
      const nextMove = this.player.getNextMove(moves);
      if (nextMove) {
        console.log(this.name + " as " + this.colour + " to move " + nextMove);
        this.api.makeMove(this.gameId, nextMove);
      }
    }
  }

  playingAs(event) {
    return (event.white.id === this.name) ? "white" : "black";
  }

  isTurn(colour, moves) {
    var parity = moves.length % 2;
    return (colour === "white") ? (parity === 0) : (parity === 1);
  }
}

module.exports = Game;

import {newGame} from './newGame';
import {RoomHandler} from './roomHandler';
import {GameState} from './state';

/** The main entry point of the game. */
function play() {
  // TODO: Load a saved state here.
  const gameState = newGame();

  const roomHandler = new RoomHandler(gameState);

  console.log(gameState);
}

play();
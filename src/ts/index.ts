import { InventoryHandler } from './inventoryHandler';
import {RoomHandler} from './roomHandler';
import {GameState} from './state';

/** The main entry point of the game. */
function play() {
  // TODO: Load a saved state here.
  const gameState = new GameState();

  const roomHandler = new RoomHandler(gameState);
  const inventoryHandler = new InventoryHandler(gameState);

  document.getElementById('reset-room-btn')
      ?.addEventListener('click', async () => {
        gameState.resetRoomState();
      });

  console.log(gameState);
}

play();
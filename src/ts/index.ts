import {InventoryHandler} from './inventoryHandler';
import {RoomHandler} from './roomHandler';
import {GameState} from './state';

/** The main entry point of the game. */
function play() {
  // TODO: Load a saved state here.
  const gameState = new GameState();

  const roomHandler = new RoomHandler(gameState);
  const inventoryHandler = new InventoryHandler(gameState);

  document
    .getElementById('reset-room-btn')
    ?.addEventListener('click', async () => {
      gameState.resetRoomState();
    });

  document
    .getElementById('reset-save-btn')
    ?.addEventListener('click', async () => {
      window.localStorage.clear();
      window.location.reload();
    });

  console.log(gameState);
}

play();

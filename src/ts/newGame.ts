import {bedroom_1} from './content/rooms/bedroom_1';
import {GameState} from './state';

export function newGame(): GameState {
  const state = new GameState();
  state.setRoom(bedroom_1);
  return state;
}
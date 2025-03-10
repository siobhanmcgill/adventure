import {bedroom_1} from './content/rooms/bedroom_1';
import {GameState} from './state';
import {injectHtmlFromTemplate} from './svg_utils';

export function newGame(): GameState {
  const state = new GameState();

  const {htmlObject} = injectHtmlFromTemplate(
      '.input', {x: 0, y: 0, width: '100%', height: '100%'});
  htmlObject.querySelector('.text')!.innerHTML = `
  <img src="" />
  <p>What is her name?</p>
  `;
  const button = htmlObject.querySelector('button')!;
  button.textContent = 'Play';
  button.addEventListener('click', () => {
    state.setProtagonistName(htmlObject.querySelector('input')?.value ?? '');
    state.setRoom(bedroom_1);
  });

  return state;
}
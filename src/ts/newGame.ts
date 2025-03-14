import {FIRST_ROOM} from './constants';
import {getCharacter, getRoom} from './lazyLoaders';
import {GameState} from './state';
import {injectHtmlFromTemplate, loadSvgString} from './svg_utils';

export async function newGame(state: GameState) {
  const {htmlObject} = injectHtmlFromTemplate(
      '.input', {x: 0, y: 0, width: '100%', height: '100%'});

  htmlObject.querySelector('.text')!.innerHTML = `
  <svg></svg>
  <p>This is your protagonist.</p>
  `;

  const p = await getCharacter('protagonist');

  const artData = p!.main;
  const svg = htmlObject.querySelector('svg')!;
  svg.setAttribute('viewBox', artData.artwork.viewBox)
  loadSvgString(artData.artwork.url, artData.artwork.layerId)
      .then(svgString => {
        svg.innerHTML = svgString;
      });
  svg.classList.add('svg', 'protagonist', artData.artwork.layerId!);

  htmlObject.querySelector('input')!.placeholder = 'Give her a name';

  const button = htmlObject.querySelector('button')!;
  button.addEventListener('click', async () => {
    const name = htmlObject.querySelector('input')?.value ?? '';
    if (!name) {
      return;
    }
    state.setProtagonistName(htmlObject.querySelector('input')?.value ?? '');
    state.setRoom((await getRoom(FIRST_ROOM))!);
    htmlObject.remove();
  });
}
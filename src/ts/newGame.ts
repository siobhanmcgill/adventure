import {FIRST_ROOM} from './constants';
import {getCharacter, getRoom} from './lazyLoaders';
import {GameState} from './state';
import {injectHtmlFromTemplate, loadSvgString} from './svg_utils';

export async function newGame(state: GameState) {
  const {htmlObject} = injectHtmlFromTemplate('.input', {
    x: 0,
    y: 0,
    width: '100%',
    height: '100%',
  });

  htmlObject.querySelector('.text')!.innerHTML = `
  <svg></svg>
  <p>This is your protagonist.</p>
  `;

  const p = await getCharacter('protagonist');

  const artData = p!.styles.main;
  const svg = htmlObject.querySelector('svg')!;
  svg.setAttribute('viewBox', artData.artwork.viewBox);
  loadSvgString(artData.artwork.url, artData.artwork.layerId).then(
    (svgString) => {
      svg.innerHTML = svgString;
    }
  );
  svg.classList.add('svg', 'protagonist', artData.artwork.layerId!);

  const input = htmlObject.querySelector('input')! as HTMLInputElement;
  input.placeholder = 'Give her a name';
  input.addEventListener('keypress', async (event) => {
    if (event.key === 'Enter') {
      await submit(input, htmlObject, state);
    }
  });

  const button = htmlObject.querySelector('button')!;
  button.addEventListener('click', async () => {
    await submit(input, htmlObject, state);
  });
}

async function submit(
  input: HTMLInputElement,
  dialog: HTMLElement,
  state: GameState
) {
  const name = input.value ?? '';
  if (!name) {
    return;
  }
  state.setProtagonistName(input.value ?? '');
  state.setRoom((await getRoom(FIRST_ROOM))!);
  dialog.classList.add('remove-me');
  setTimeout(() => {
    dialog.parentElement?.remove();

    state.markReady();
  }, 1700);
}

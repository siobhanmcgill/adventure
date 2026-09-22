import {afterEach, beforeEach, vi} from 'vitest';
import { loadStyles, setStorage } from '../utils/utils';
import { LOCALSTORAGE_DEBUG } from '../game-state';

let cleanBody: HTMLBodyElement;

function cleanup() {
  window.localStorage.clear();
  // const styles = page.getEl('.loaded-style');

  // if (styles.elements().length) {
  //   for (const style of styles.elements() ?? []) {
  //     style?.remove();
  //   }
  // }
  // const svg = getTestSvg();
  // svg.innerHTML = '';

  // const panels = page.getEl('.panel-wrapper');
  // if (panels.elements().length) {
  //   for (const panel of panels.elements() ?? []) {
  //     panel.remove();
  //   }
  // }

  // // This will remove all event handlers.
  // document.body = document.body.cloneNode(true) as HTMLBodyElement;
  if (cleanBody) {
    document.body = cleanBody;
  }
  cleanBody = document.body.cloneNode(true) as HTMLBodyElement;
}

beforeEach(async () => {
  // console.log('////////////////// TEST //////////////////////');
  vi.useFakeTimers();

  // Cleanup before each test so the state remains for debugging.
  cleanup();

  // Use this line to spam console log messages.
  setStorage(LOCALSTORAGE_DEBUG, true);

  // Load all the global stylesheets.
  await loadStyles('main', new URL('../../styles/main.scss', import.meta.url));
  // await loadStyles(
  //   'cursor',
  //   new URL('../../styles/cursor.scss', import.meta.url)
  // );
  await loadStyles(
    'panel',
    new URL('../../styles/panel.scss', import.meta.url)
  );
  await loadStyles(
    'animations',
    new URL('../../styles/animations.scss', import.meta.url)
  );
  await loadStyles(
    'textmode',
    new URL('../../styles/textmode.scss', import.meta.url)
  );
  // await loadStyles(
  //   'popups',
  //   new URL('../../styles/popups.scss', import.meta.url)
  // );
  // await loadStyles(
  //   'protagonist',
  //   new URL('../../styles/protagonist.scss', import.meta.url)
  // );

  document.body.classList.add('disable-animations');
});

afterEach(async () => {
  await vi.advanceTimersByTimeAsync(1000);
  vi.restoreAllMocks();
  cleanup();
  // console.log('\\\\\\\\\\\\\\\\\\ END OF TEST \\\\\\\\\\\\\\\\\\\\\\\\');
});

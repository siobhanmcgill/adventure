import { Observable } from 'rxjs';
import { bedroom_1 } from './content/rooms/bedroom_1';
import { bedroom_1_hall } from './content/rooms/bedroom_1_hall';
import { ConvoHandler } from './convoHandler';
import { InventoryWithId } from './inventoryHandler';
import { GameState } from './state';
import {
  ActionOptions,
  ConvoList,
  ConvoResponseOption,
  Coord,
  Quote,
  Room,
} from './types';
import { printDialog, printResponseOptions } from './svg_utils';
import {
  formatString,
  onBodyClick,
  parseQuote,
  parseStateControls,
  typeEffect,
} from './utils';

function scrollToBottom() {
  document
    .querySelector('.convo-output .convo-text-scroll')!
    .scrollTo(0, 1000000);
}

const debugPrintDialog: typeof printDialog = async (
  quote: Quote,
  state: GameState,
  roomData: Room
) => {
  const { dialogText, remainingText, speakerName, effects, stateControls } =
    await parseQuote(quote, roomData, state);

  const container = document.createElement('div');
  container.innerHTML = `
  <div class="speaker">${speakerName}</div>
  <div class="text-wrapper">
    <div class="effect">${effects ?? ''}</div>
    <div class="text">${dialogText}</div>
    <div class="states">${stateControls ?? ''}</div>
  </div>
  `;

  container.classList.add('convo-quote');

  const convoText = document.querySelector('.convo-output .convo-text')!;
  convoText.appendChild(container);

  scrollToBottom();

  await typeEffect(
    container.querySelector('.text')!,
    effects?.includes('slow')
  );

  if (stateControls) {
    parseStateControls(state, stateControls);
  }

  console.log(window.localStorage.getItem('auto-enter'));
  if (!window.localStorage.getItem('auto-enter')) {
    await onBodyClick(true);
  } else {
    await Promise.resolve();
  }

  if (remainingText.length) {
    await debugPrintDialog(remainingText, state, roomData);
  }
};

const printResponses: typeof printResponseOptions = async (
  responses: ConvoResponseOption[],
  state: GameState,
  onClick: (response: ConvoResponseOption) => Promise<void>
) => {
  const convoText = document.querySelector('.convo-output .convo-text')!;
  const responseContainer = document.createElement('div');
  responseContainer.classList.add('response-container');
  convoText.appendChild(responseContainer);

  const optionElements: HTMLElement[] = [];

  for (const response of responses) {
    const thisOption = document.createElement('div');
    thisOption.classList.add('response-option');
    thisOption.innerHTML = formatString(response.text, state);
    responseContainer.appendChild(thisOption);

    thisOption.addEventListener('click', () => {
      onClick(response);
    });

    scrollToBottom();

    await typeEffect(thisOption);
  }

  return optionElements;
};

function play() {
  const autoCheckbox = document.getElementById(
    'auto-enter'
  ) as HTMLInputElement;
  autoCheckbox.checked = !!window.localStorage.getItem('auto-enter') ?? '';

  autoCheckbox.addEventListener('change', () => {
    window.localStorage.setItem('auto-enter', autoCheckbox.checked ? 'checked' : '');
  });

  const gameState = new GameState();
  gameState.setProtagonistName('Fon Protag');

  gameState.roomStates$.subscribe((states) => {
    const stateList = document.querySelector(
      '.convo-output .states-pane ul'
    ) as HTMLUListElement;
    stateList.innerHTML = '';
    for (const state of states) {
      const li = document.createElement('li');
      li.innerText = state;
      stateList.appendChild(li);
    }
  });

  const rooms: Room[] = [bedroom_1, bedroom_1_hall];
  const ids: Array<[string, string]> = [];

  for (const room of rooms) {
    for (const [id, convo] of Object.entries(room.convos ?? {})) {
      ids.push([room.roomId, id]);
    }
  }

  const convoSelector = document.getElementById(
    'convo-option-list'
  ) as HTMLSelectElement;

  for (const id of ids) {
    const option = document.createElement('option');
    option.innerText = id.join(' > ');
    convoSelector?.appendChild(option);
  }

  document.getElementById('start')?.addEventListener('click', async () => {
    const id = convoSelector.value;

    const [roomId, convoId] = id.split(' > ');

    const roomData = rooms.find((r) => r.roomId === roomId)!;

    const convoHandler = new ConvoHandler(
      convoId,
      gameState,
      roomData,
      debugPrintDialog,
      printResponses,
      () => {
        debugPrintDialog(
          'n::------- end of line --------------',
          gameState,
          roomData
        );
      }
    );

    await convoHandler.converse();
  });
}

play();

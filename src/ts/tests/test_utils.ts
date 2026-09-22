import {filter, firstValueFrom} from 'rxjs';
import {expect, vi} from 'vitest';
import {Locator, locators, page, userEvent} from 'vitest/browser';
import {AnyGameMode} from '..';
import {AGENCY_SAVE_STATE, GameState, SavedState} from '../game-state';
import {AGENCY_ROOM_SAVE_STATE, SavedRoomState} from '../roomHandler';
import {ActionOptions, Popup, Room} from '../types';
import {formatString, setStorage} from '../utils/utils';

export function getTestSvg() {
  return page.getEl('#svg').element() as SVGSVGElement;
}

export function getEl(selector: string) {
  return page.getEl(selector).element();
}

export function getEls(selector: string) {
  return page.getEl(selector).elements();
}

locators.extend({
  getStylesheet(id: string) {
    return `style.loaded-styles-${id}`;
  },
  getEl(selector: string) {
    return selector;
  },
});

declare module 'vitest/browser' {
  interface LocatorSelectors {
    getStylesheet(id: string): Locator;
    getEl(selector: string): Locator;
  }
}

export async function flush() {
  await vi.advanceTimersByTimeAsync(1000);
}

export const PROTAGONIST_NAME = 'Testy McTestington';

export async function setupRoom(
  game: AnyGameMode,
  room: Room,
  saveState?: Partial<SavedState>,
  roomState?: Partial<SavedRoomState>
) {
  vi.useFakeTimers();

  if (saveState || roomState) {
    setStorage<SavedState>(AGENCY_SAVE_STATE, {
      protagonistName: {
        first: PROTAGONIST_NAME.split(' ')[0],
        last: PROTAGONIST_NAME.split(' ')[1],
      },
      currentRoomId: 'bedroom_1',
      activeAction: 'look',
      tags: [],
      chapter: 'Prologue',
      ...(saveState ?? {}),
    });
    setStorage<SavedRoomState>(AGENCY_ROOM_SAVE_STATE + room.roomId, {
      states: [],
      objectIds: [],
      ...(roomState ?? {}),
    });
    game.state.start();
    game.play();
  } else {
    game.state.start();
    game.state.setProtagonistName(PROTAGONIST_NAME);
    game.state.setRoom(room);
    game.play();
  }

  game.state.markReady();

  await vi.waitFor(async () => {
    await firstValueFrom(game.roomHandler.isRoomReady$.pipe(filter(Boolean)));
  });
  await vi.advanceTimersByTimeAsync(500);

  return {};
}

export async function expectHasState(
  gameState: GameState,
  state: string,
  has = true
) {
  const states = await firstValueFrom(gameState.roomStates$);
  let e = expect(states);
  if (!has) {
    e = e.not;
  }
  e.toContain(state);
}

export async function expectHasTag(
  gameState: GameState,
  tag: string,
  has = true
) {
  const tags = gameState.getTags();
  let e = expect(tags);
  if (!has) {
    e = e.not;
  }
  e.toContain(tag);
}

export async function expectQuoteText(...quotes: string[]) {
  for (const quote of quotes) {
    expect(
      page.getEl('.main-game-stream').getByText(quote).element()
    ).toBeTruthy();
  }
}

export async function expectPopup(popup: Popup, gameState: GameState) {
  if (popup.quote) {
    await expectQuoteText(
      ...(typeof popup.quote === 'string' ? [popup.quote] : popup.quote)
    );
  }

  expect(getEl('svg .popup-wrapper')).toHaveClass(popup.popupStyle);
  expect(getEl('svg .popup-wrapper .popup .text')).toContainHTML(
    formatString(popup.text, gameState)
  );
  await userEvent.click(page.getEl('body'));
  await vi.runAllTimersAsync();

  if (popup.quoteAfter) {
    await expectQuoteText(
      ...(typeof popup.quoteAfter === 'string'
        ? [popup.quoteAfter]
        : popup.quoteAfter)
    );
  }
}

export function expectInkscapeLabelVisible(
  label: string,
  visible = true,
  selector = ''
) {
  const exp = expect(
    getTestSvg().querySelector(`${selector} [inkscape\\:label="${label}"]`)
  );
  if (visible) {
    exp.toBeVisible();
  } else {
    exp.not.toBeVisible();
  }
}

export function expectInkscapeLabelAnimation(
  label: string,
  animation: string,
  not = false,
  selector = ''
) {
  const exp = expect(
    getTestSvg()
      .querySelector(`${selector} [inkscape\\:label="${label}"]`)
      ?.computedStyleMap()
      .get('animation-name')
      ?.toString()
  );
  if (not) {
    exp.not.toBe(animation);
  } else {
    exp.toBe(animation);
  }
}

// export async function switchToAction(action: ActionOptions) {
//   await page.getEl(`.action-buttons .button-${action}`).click();
// }

// export async function clickRoomObject(label: string) {
//   await page.getEl(`svg #${label}`).first().click();
// }

export async function command(game: AnyGameMode, command: string) {
  const input = getEl('.text-prompt') as HTMLInputElement;
  input.value = command;
  input.dispatchEvent(new KeyboardEvent('keypress', {key: 'Enter'}));
  await flush();
}

export function expectObjectVisible(
  game: AnyGameMode,
  object: string,
  visible = true
) {
  let e = expect(game.roomHandler.lookUpObject(object));
  if (!visible) {
    e = e.not;
  }
  e.toBeTruthy();
}

export async function expectInventoryIncludes(
  state: GameState,
  object: string,
  expected = true
) {
  const inventory = await firstValueFrom(state.inventory$);
  let exp = expect(inventory);
  if (!expected) {
    exp = exp.not;
  }
  exp.toContain(object);
}

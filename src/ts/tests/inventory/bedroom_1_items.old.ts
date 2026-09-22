import {beforeEach, describe, expect, it} from 'vitest';
import {GameState} from '../../state';
import {
  clearQuotes,
  clickRoomObject,
  expectInkscapeLabelVisible,
  expectInventoryIncludes,
  expectQuoteText,
  flush,
  getTestSvg,
  setupRoom,
  switchToAction,
} from '../test_utils';
import {bedroom_1} from '../../../../../content/rooms/bedroom_1';
import {page} from 'vitest/browser';
import {firstValueFrom} from 'rxjs';

describe('bedroom_1', () => {
  let gameState: GameState;

  beforeEach(async () => {
    gameState = new GameState(getTestSvg());
    await setupRoom(gameState, bedroom_1);
    gameState.removeRoomState('alarm_on');
    await clearQuotes();
  });

  async function pickup(item: string) {
    await page.getEl('.inventory .toggle').click();
    await page.getEl(`.inventory .item-list .item-${item}`).click();
    await page.getEl('.inventory .toggle').click();
  }

  async function useActiveItemOn(label?: string) {
    if (!label) {
      await page.getEl('.protagonist').click();
    } else {
      await clickRoomObject(label);
    }
    await flush();
  }

  async function useItem(item: string, on?: string) {
    await switchToAction('interact');

    gameState.addToInventory(item);

    await pickup(item);
    await useActiveItemOn(on);
  }

  it('can take a pill', async () => {
    await useItem('pill');
    await expectQuoteText(
      'Under the tongue with you...',
      'I feel more feminized already.'
    );
    // TODO: Check for the animation between the quotes.

    await expectInventoryIncludes(gameState, 'pill', false);
  });

  it('can put her ding dang pants on', async () => {
    await useItem('pants');

    await expectQuoteText('Uh...', `Don't ask me where I was keeping those.`);

    await expectInventoryIncludes(gameState, 'pants', false);

    const states = await firstValueFrom(gameState.roomStates$);
    expect(states).not.toContain('no_pants');

    expectInkscapeLabelVisible('no-pants', false, '.protagonist');
    expectInkscapeLabelVisible('pants', true, '.protagonist');
  });

  it('will comment about using the cup', async () => {
    await useItem('cup');

    await expectQuoteText(`I don't have to. There's a toilet in my room.`);
  });

  it('will not put on the sweater', async () => {
    await useItem('sweater');

    await expectQuoteText(`I don't feel like wearing that today.`);
  });

  it('can drink a cup of water', async () => {
    await useItem('cup_of_water');
    await expectQuoteText(
      'Down the hatch.',
      `I feel hydrated already. You can't even taste the reclamation system.`
    );
    // TODO: Check for the animation between the quotes.

    await expectInventoryIncludes(gameState, 'cup_of_water', false);
  });

  it('can fill the cup at the sink', async () => {
    await useItem('cup', 'sink');

    // TODO: Check for the animation.

    await expectInventoryIncludes(gameState, 'cup_of_water');
    await expectInventoryIncludes(gameState, 'cup', false);
  });

  it('can toss the sweater in the hamper', async () => {
    await useItem('sweater', 'hamper');

    // TODO: Check for the animation
    await expectQuoteText('I feel tidier already.');

    await expectInventoryIncludes(gameState, 'sweater', false);
  });

  it('refuses to toss the pants away', async () => {
    await useItem('pants', 'hamper');

    await expectQuoteText(
      `I've only worn these a few days in a row, so they're still good.`,
      ' ',
      'Also they might be my only pants right now.'
    );
    await expectInventoryIncludes(gameState, 'pants');
  });

  it('refuses to toss the capsule away', async () => {
    await useItem('empty_thc_capsule', 'hamper');

    await expectQuoteText(`That's for clothes, not trash, silly.`);
    await expectInventoryIncludes(gameState, 'empty_thc_capsule');
  });

  it('refuses to toss water on the hamper', async () => {
    await useItem('cup_of_water', 'hamper');

    await expectQuoteText(
      `I don't have to. There's a laundry machine down the hall.`
    );
    await expectInventoryIncludes(gameState, 'cup_of_water');
  });
});

import {beforeEach, describe, expect, it, Mock, vi} from 'vitest';
import {GameState} from '../../game-state';
import {disectQuoteString, formatString, parseStateControls} from '../../utils/utils';

describe('utils', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = new GameState();
  });

  describe('disectQuoteString', () => {
    it('gets all the bits', () => {
      const quote: Quote =
        'p::{slow,type}This sure is a test.::+.tested%%Totally';
      expect(disectQuoteString(quote)).toEqual({
        characterId: 'p',
        effects: ['slow', 'type'],
        dialogText: 'This sure is a test.',
        stateControls: '+.tested',
        tooltipText: 'Totally',
      });
    });
    it('gets text alone', () => {
      const quote: Quote = 'She then ran a test and it passed.';
      expect(disectQuoteString(quote)).toEqual({
        characterId: '',
        dialogText: 'She then ran a test and it passed.',
      });
    });
    it('gets bits without effects', () => {
      const quote: Quote = 'p::This sure is a test.::+.tested%%Totally';
      expect(disectQuoteString(quote)).toEqual({
        characterId: 'p',
        dialogText: 'This sure is a test.',
        stateControls: '+.tested',
        tooltipText: 'Totally',
      });
    });

    it.each`
      stateControls
      ${'+$quest_id'}
      ${'+#player-tag'}
      ${'+@inventoryItem'}
      ${'-.bad-state'}
    `('$stateControls works', async ({stateControls}) => {
      const quote: Quote =
        'p::{slow,type}This sure is a test.::' + stateControls;
      expect(disectQuoteString(quote)).toEqual({
        characterId: 'p',
        effects: ['slow', 'type'],
        dialogText: 'This sure is a test.',
        stateControls,
      });
    });
  });

  describe('parseStateControls', () => {
    let gameState: GameState;

    beforeEach(() => {
      gameState = new GameState();
    });

    // TODO: add tests for conversation tags.

    it('adds a player tag', () => {
      parseStateControls(gameState, '+#testing-queen');

      expect(gameState.countTag('testing-queen')).toBe(1);
    });

    it('removes a player tag', () => {
      gameState.addTag('testing-loser');

      parseStateControls(gameState, '-#testing-loser');

      expect(gameState.countTag('testing-loser')).toBe(0);
    });

    it('adds an inventory item', () => {
      parseStateControls(gameState, '+@screwdriver');

      expect(gameState.checkInventory('screwdriver')).toBeTruthy();
    });

    it('removes an inventory item', () => {
      gameState.addToInventory('screwdriver');
      parseStateControls(gameState, '-@screwdriver');

      expect(gameState.checkInventory('screwdriver')).toBeFalsy();
    });

    it('adds a room state', () => {
      parseStateControls(gameState, '+.fully-tested');

      expect(gameState.checkRoomState('fully-tested')).toBeTruthy();
    });

    it('removes an inventory item', () => {
      gameState.addRoomState('not-tested');
      parseStateControls(gameState, '-.not-tested');

      expect(gameState.checkRoomState('not-tested')).toBeFalsy();
    });

    // TODO: add test for quest flags
  });

  describe('formatString()', () => {
    it('replaces _ with italics', () => {
      const formatted = formatString('now _this_ is podracing!', gameState);
      expect(formatted).toBe('<p>now <em>this</em> is podracing!</p>');
    });

    it('replaces _ with italics at start of string', () => {
      const formatted = formatString('_this_ is podracing!', gameState);
      expect(formatted).toBe('<p><em>this</em> is podracing!</p>');
    });

    it('does not replace _ with italics when inside a string', () => {
      const formatted = formatString('this_is_podracing.png', gameState);
      expect(formatted).toBe('<p>this_is_podracing.png</p>');
    });

    it('replaces ~~ with strikethrough', () => {
      const formatted = formatString('I ~~like~~ love this!', gameState);
      expect(formatted).toBe('<p>I <s>like</s> love this!</p>');
    });

    it('replaces ~~ with strikethrough at start of string', () => {
      const formatted = formatString('~~hello~~ goodbye', gameState);
      expect(formatted).toBe('<p><s>hello</s> goodbye</p>');
    });
  });
});

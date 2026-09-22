import {beforeEach, describe, expect, it, Mock, vi} from 'vitest';
import {GameState} from '../../game-state';
import {formatString} from '../../utils/utils';

describe('utils', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = new GameState();
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

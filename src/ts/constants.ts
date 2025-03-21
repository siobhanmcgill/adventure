import {ActionOptions} from './types';

export const FALLBACTIONS: {[index in ActionOptions]: string} = {
  look: `I don't see anything special.`,
  interact: `How does one use that?`,
  pickup: `I can't pick that up.`,
  talk: `I don't feel like talking. Er, forget I said this.`,
};

export const FALLBACK_USE_ITEM_WITH = `These things don't go together.`;

export const FIRST_ROOM = 'bedroom_1';

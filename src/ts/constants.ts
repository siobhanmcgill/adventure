import {ActionOptions, Quote} from './types';

export const VERSION = '0.01a';

export const REM = 16;

// These are used if the command specifies an object that hasn't been seen.
export const NULL_ACTIONS: {[index in ActionOptions]: string} = {
  look: `p::Look at what now?`,
  interact: `p::I can't touch what I can't see.`,
  pickup: `p::Shall I pretend to pick that up? I don't think that thing exists.`,
  talk: `p::I generally avoid talking to nothing.`,
  sit: `p::You're just trying to get me to fall on my butt.`
};

export const FALLBACTIONS: {[index in ActionOptions]: string} = {
  look: `p::I don't see anything special.`,
  interact: `p::How does one use that?`,
  pickup: `p::I can't pick that up.`,
  talk: `p::I don't feel like talking. Er, forget I said this.`,
  sit: `p::I'm not going to sit on that.`
};

export const FALLBACK_FALLBACK = `p::I can't make heads nor tails of that idea.`;

export const FALLBACK_USE_ITEM_WITH = `p::I don't think I can use those things together.`;

export const FALLBACK_PICK_UP_AGAIN = 'p::I already picked that up.';

export const FIRST_ROOM = 'bedroom_1';

export const DIALOG_TEXT_DURATION = 750;

export const DEAD_NAME = 'Eric';

export const NEW_GAME_PROMPT: Quote = [
  `Welcome to a new game. This is a fresh start, if you will.`,
  `In this game, you will guide the actions of a young woman who is getting a fresh start of her own. You, through her, will meet many interesting people in this strange utopia. You may even help her make a friend or two along the way.`,
  '{nowait,float-left}![Your protagonist](pictures/protagonist-intro.svg)%%Incidentally if you know any artists who might be willing to create a lot of original, human-created artwork for a web-based interactive narrative adventure game for probably no money, please reach out...',
  `Please find enclosed this picture of your protagonist, along with an example why this is primarily a text-based game. Clearly, our hero is tall and striking. She has long hair and a confidently cheeky gleam in her eyes, like she's never too far from a lighthearted joke (often at her own expense). She looks like a friend - someone you can really depend on in a pinch. That's her hope, at least. She has left her old life behind to pursue her true passion: helping people.`,
  `Behind those cheeky eyes is a lingering sadness, though. She recently walked away from a lot, and has undergone a transformation that would be hard for anyone. She is hopeful - as is the world around her. Sometimes hope comes at a great, painful cost.`,
  `{type}Now, what was her name again?`,
];

export const PROTAGONIST_MESSAGE_READER_APP = 'Message Reader Deluxe v1.9';
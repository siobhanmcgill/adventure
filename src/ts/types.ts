export type Quote = string | string[];

export type ActionOptions = 'look' | 'interact' | 'pickup' | 'talk';
export type ActionOptionsWithState = `${'name' | ActionOptions}${
  | '.'
  | '#'}${string}`;
export type RoomObjectKey = 'name' | ActionOptionsWithState | ActionOptions;

export interface SvgSource {
  url: URL;
  layerId?: string;
  viewBox: string;
  // Indicates the position in the artwork that is treated as the origin.
  coords?: { x: number; y: number };
}

export interface Action {
  // The Protagonist will say something.
  quote?: Quote;
  // Trigger a popup defined in popups.json
  // Popup opens after the quote is done.
  popup?: string;
  // Remove a state from the current room
  removeState?: string;
  // Add a state to the current room
  addState?: string;
  // Actions will be taken in order, once per time the user interacts.
  queue?: Action[];
  onQueueFinish?: Action;
  // Adds an inventory item with the given ID.
  addItem?: string;
  // Play an animation - this will play after the quote shows, but before
  // anything else is set.
  animation?: string;
  quoteAfterAnimation?: Quote;
  // Removes an inventory item with the given ID.
  removeItem?: string;
}

export interface StateList {
  // The state ID is applied as a class to the SVG.
  [stateId: string]: {
    // These messages will show on an interval
    idle?: Quote;
  };
}

export type RoomObject = {
  // If not set, the room object ID will be used
  // name?: string;

  // If string or string[] it will be treated as a quote
  // Could be action.state to apply only to a specific state.
  // Could also be use#itemId to trigger an action when that item is used on
  // this.
  [index in 'name' | ActionOptionsWithState | ActionOptions]?: Quote | Action;
};

export interface RoomObjectList {
  [roomObjectId: string]: RoomObject;
}

// Data to set up a room.
export interface RoomInit {
  states: string[];
  artwork: SvgSource;
  styles: URL[];
  protagonistScale: number;
}

export interface RoomEntry {
  coords: { x: number; y: number };
  quote: Quote;
}

export interface Room {
  roomId: string;
  init: RoomInit;
  states: StateList;
  // The SVG markup to draw this room.
  // artwork: string;
  // Text shown when the Protagonist enters the room.
  enter: {
    [from: string | 'default']: RoomEntry;
  };

  objects: RoomObjectList;
  popups?: PopupList;
}

export interface RoomList {
  [roomId: string]: Room;
}

// Will probably add artwork and coords
export interface Popup {
  quote?: Quote;
  popupStyle: string;
  text: string;
  quoteAfter?: Quote;
}

export interface PopupList {
  [popupId: string]: Popup;
}

export interface InventoryItem {
  name?: string;
  description?: Quote;
  artwork: SvgSource;

  fallbackUse?: Quote;
  use?: {
    // Another Item ID, which if used with this item, triggers this action.
    // This could be dropped on it, or it can be dropped on this.
    // Also includes the unique id 'protagonist' which is what happens if this
    // is
    // dropped on the protagonist.
    [itemId: string | 'protagonist' | 'this' | 'talk']: Quote | Action;
  };
}

export interface InventoryList {
  [itemId: string]: InventoryItem;
}

export interface CharacterStyle {
  artwork: SvgSource;
  styles?: URL[];
}

export interface Character {
  id: string;
  styles: { [style: string]: CharacterStyle };
}

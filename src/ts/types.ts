import {AnyGameMode} from '.';
import {ObjectHandler} from './objectHandler';

export type Coord = {x: number; y: number};

// TODO: Rename this to "snippet" or "text?"
export type Quote = string | string[];

/** Special delimiter characters used to denote game state. 
 * 
 * ! - "not" when using a flag in a conditional
 * @ - inventory-id - relates to a given item, either in the player's inventory or the current room
 * # - player-tag (scoped to the player, to remember stuff that should follow the player)
 *   - # is also used in quotes to designate a visible object
 * ## - convo-tag (scoped to current convo when in a conversation)
 * $ - quest-id  (relates to a quest, either starting it or applying only if that quest is active)
 * $quest-id:quest-phase  (relates to a given phase of a quest) - if the quest isn't active, nothing happens but if a text line specifies a quest phase it will be tracked for when / if the quest ever actually is active
 * % - Designates tooltip text in a quote string
 * ^ - unused
 * & - unused
 * * - unused
 * < - unused
 * > - a certain flow of the conversation (relates to a conversation step flow)
 * ? - unused
 * | - unused
 * : - used to separate some flags, like $quest:phase - also used in mention, like mention:person
 * :: - used to separate functional blocks of a quote string
 * 
 * + - adds the given thing
 * - (minus) - removes the given thing
 * 
 * . - room-state (scoped to the current room)
 * 
*/
export const FLAG_DELIMITERS = ['##', '#', '>', '@', '.', '$'];

/**
 * 
 * Quote format:
 *
 * '[speaker]::{[option]}[dialog]::[state controls]%%[tooltiptext]'
 * ex: `p::{slow}Here's an example line ![some image](image.svg)::+.spoken%%Some tooltip`
 *
 * speaker, option, and states are optional
 *
 * If [speaker] is not set, it will default to nothing (the narrative).
 * If [speaker] is set, the text will be shown in a speech bubble.
 *
 * [speaker] should be the ID of a speaker - the system will look up what their name is
 * from the room object list.
 *
 * 'p' is the protagonist.
 * 'n' is the narrator.
 * 'me' will use the convo ID (so if that matches a character, it will work).
 *
 * Options include:
 * 'slow' - text appears slowly
 * 'nowait' - text mode will not wait for a keypress to go on to the next paragraph.
 * 'left' - float left
 * 'type' - force the typing effect (in text mode)
 * any other string here will be treated as the name of an animation
 *
 * In dialog string,
 *  {{p}} will be replaced by the protagonist's name.
 *  {{pp}} will be the protagonist's full name.
 *  {{me}} will be the name of whoever the player is in a conversation with
 *  (see utils.ts formatString for details)
 *
 * State controls:
 * Prepend with + or - to add or remove a state using the delimiters above
 * 
 * Multiple controls can be separated with a comma. Each comma-separated command
 * needs its own '+' or '-'
 * 
 * For legacy compatibility (I'm lazy), no delimiter is treated as a room state.
 * 
 * examples:
 * "::+.room-state" > adds 'room-state' to the current room
 * "::-.room-state" > removes 'room-state' from the current room
 * "::+@item-id" > adds the given item to the player's inventory
 * "::+$quest-id" > starts the quest labeled "quest-id" (I don't think - means anything for quests)
 * "::+$quest-id:phase" > initiates the given quest phase
 * "::+.room-state,+#player-tag" > adds both the room state and the player tag
 * "::+room-state" > without a delimiter, it is the same as '.'
 *
 * Within the text, you can also insert a picture (a file in the assets dir):
 * . . . !\[alt text\](./assets/[whatever]) . . .
 *
 * You can also specify objects to be added to the set of current room objects:
 * . . . #[objectId]>[object name]# . . .
 * ObjectID will be used to look up the object data in the room data, and the text in object
 * name will be clickable.
 */

export interface SvgSource {
  url: URL;
  layerId?: string;
  // Width and height
  dimensions: Coord;
  // Indicates the position in the artwork that is treated as the origin for positioning.
  coords?: Coord;
  // Indicates the top left corner of the artwork for viewbox purposes. If not set, we assume 0,0.
  offset?: Coord;
}

export interface Action {
  // In text mode, these are other verbs that the player can type to trigger this action.
  alias?: string[];
  // In text mode, this is what gets printed to the stream.
  // This will probably be a longer, more verbose version of the quote.
  text?: Quote;
  // The Protagonist will say something. Text mode will use this if no text is set.
  quote?: Quote;
  // Trigger a popup defined in popups.json
  // Popup opens after the quote is done.
  popup?: string;
  // Run custom code, after any popups but before the "afterAnimation" options.
  custom?: (
    game: AnyGameMode,
    matchingObjects?: ObjectHandler[]
  ) => Promise<void>;
  // Play an animation - this will play after the quote shows, but before
  // anything else is set. Ignored in text mode.
  animation?: string;
  // Remove a state from the current room. This will happen immediately. If you want it
  // after the text shows, add a line to the text / quote array with a state change (`::-somestate`)
  removeState?: string;
  // Add a state to the current room
  addState?: string;
  // Actions will be taken in order, once per time the user interacts.
  queue?: ActionType[];
  onQueueFinish?: ActionType;
  // Adds an inventory item with the given ID.
  addItem?: string;
  // Verbose narrative text that is shown after the animation in text mode.
  textAfterAnimation?: Quote;
  // Text that is shown after the animation. Text mode uses this if textAfterAnimation is not set.
  quoteAfterAnimation?: Quote;
  // Removes an inventory item with the given ID.
  removeItem?: string;
  // Initiates a dialog with the given ID (if it matches a dialog in the current room).
  // TODO: this.
  dialog?: string;
  // Adds a tag to the player, for future reference.
  // TODO: This.
  addTag?: string;
  // Sends the player to a different room after any given quotes or animations are played.
  loadRoom?: string;
}

export type ActionType = Quote | Action;

/** Metadata about states applied to a room. */
export interface StateList {
  // The state ID is applied as a class to the game container.
  [stateId: string]: {
    // These messages will show on an interval
    idle?: Quote;
    // Intercept all actions to change them or do something else.
    actionFilter?: (
      game: AnyGameMode,
      attemptedAction: ActionType,
      verb: string,
      noun?: string,
      otherNoun?: string
    ) => Promise<ActionType>;
    objectNameFilter?: (
      targetId: string,
      attemptedName: string
    ) => Promise<string>;
    onApply?: (game: AnyGameMode) => any;
    onRemove?: (game: AnyGameMode, fromApply?: any) => void;
  };
}

// The verbs the player can do.
// FIXME: # should be @
export type ActionOptions = 'look' | 'interact' | 'pickup' | 'talk' | 'sit';
export type ActionOptionsWithState = `${'name' | ActionOptions}${
  | '.'
  | '#'}${string}`;
export type RoomObjectKey =
  | 'name'
  | 'aka'
  | 'icon'
  | ActionOptionsWithState
  | ActionOptions;

/** An interactive object in a room. */
export type RoomObject = {
  // If name not set, the room object ID will be used
  // The AKA field is used in text mode to match other things the player could type.
  // Name does not have to be unique, but AKA does.

  // If string or string[] it will be treated as a quote

  // Could be action.state to apply only to a specific state.

  // Could also be interact#objectId to trigger an action when that item is used on
  // this (technically could be any verb#objectId, but that''s not tested)

  // Could also also be look#inventory to provide a special look action when in
  // the player's inventory.

  [index in RoomObjectKey]?: ActionType;
};

/** A list of objects in a room. */
export interface RoomObjectList {
  [roomObjectId: string]: RoomObject;
}

/** Data to set up a room. */
export interface RoomInit {
  // States applied initially.
  states: string[];
  // Object IDs to seed the object set with (stuff you can look and interact with to begin with)
  objects: string[];
  // The SVG to render this room. Ignored in text mode, obviously.
  artwork?: SvgSource;
  // CSS / SCSS files to load for this room.
  styles?: URL[];
  // The scale of the protagonist when she is at the bottom and then top of the accessible area
  // ie the first number is when she's close, and the second is when she's far. Ignored in text mode.
  protagonistScale?: [number, number];
}

/** What happens when the protagonist enters a room. */
export interface RoomEntry {
  // Where in the SVG is the player placed (graphical mode only, obviously).
  coords?: Coord;
  // What gets said in text mode.
  text?: Quote;
  // What gets said in graphic mode, or if the text is not set.
  quote?: Quote;
}

export interface Room {
  roomId: string;
  // The default name will be used, but you can specify a name based on the state.
  // like 'default.some_state'
  name?: {[index: string | 'default']: string};
  init: RoomInit;
  states: StateList;
  // The SVG markup to draw this room.
  // artwork: string;
  // Text shown when the Protagonist enters the room.
  // From should match either the room they just left - it can include states (default.alarm_off)
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
  title: string;
  quote?: Quote;
  popupStyle: string;
  popupContent: string;
  quoteAfter?: Quote;
}

export interface PopupList {
  [popupId: string]: Popup;
}

/**
 * Canonical conversation flags
 * These can be used in the condition of a response option
 * These can be appended to a convo step
 * Add an ! to negate it (#!tag means it counts only if the player doesn't have that tag)
 *
 * ##convo-tag
 * #player-tag
 * >previous-step - this can also be prepended to a step (previous-step>this-step)
 * @inventory-item-id
 * .room-state
 * $quest-id  (visible if this quest is active)
 * $quest-id:quest-phase  (visible if that phase of that quest is active)
 */

type ConvoFlagDelimiter = typeof FLAG_DELIMITERS[number];

type ConvoFlagKey<K extends string> =
  | `${K}${ConvoFlagDelimiter}${string}`
  // For a quest phase (somestep$quest:phase2)
  | `${K}$${string}:${string}`
  // For a previous conversation step.
  | `${string}>${K}`;

/**
 * Response options
 * if “mention-friend” - the option will open a list of friends for the player to choose from
 * Potentially other “smart” options? Offer item?
 *
 * Otherwise, options can be shown or hidden based on
 * convo tag
 * player tag
 * convo flow (what steps have been seen so far)
 * room state
 * active quests
 * known friends
 */
export interface ConvoResponseOption {
  // A conversation flag to determine if this option is available
  condition?: ConvoFlagKey<''>;
  text: string;
  // Optionally trigger some sort of more granular action.
  action?: Action;
  // goto: 'something' continues the convo at the something path
  goto?: string;
  // Include a conversation flag to trigger a goto under different circumstances
  // FIXME: This may or may not work or be useful
  [gotoWithFlag: ConvoFlagKey<'goto'>]: string;
}

export interface ConvoStep {
  text?: Quote;
  responses?: ConvoResponseOption[];
  goto?: string;
  queue?: Quote[];
  onQueueFinishGoto?: string;
  action?: Action;
}

export interface Convo {
  /**
   * Step name can be:
   * 'default' is the entry point
   * Any conversation flag can be added to the step name.
   *
   * If a step has “core” in the name, it’s a core sort of “holding pattern”
   *
   * Core steps always add “mention friend”, “show item”, and “play crash” options,
   * even if there are no other responses. Then all characters should have a “crash”
   * convo step that covers the “Play crash” option
   *
   * “crash_win” covers if the character beats you at crash
   * “crash_lose” covers if the character loses to you at crash
   * “mention:character_id” to mention a character
   * “item+object_id” to cover showing items to them.
   * “item+default” is the fallback if an object has no effect.
   * “characterId+crash_dice” is always an alias for “characterId_crash”
   *
   * So a convo has to have at minimum:
   * %core%
   * crash
   * crash_win
   * crash_lose
   * item+default
   * mention:default
   *
   */
  [stepName: string | ConvoFlagKey<string>]: ConvoStep;
}

// export interface InventoryItem {
//   name?: string;
//   description?: Quote;
//   artwork: SvgSource;

//   fallbackUse?: Quote;
//   use?: {
//     // Another Item ID, which if used with this item, triggers this action.
//     // This could be dropped on it, or it can be dropped on this.
//     // Also includes the unique id 'protagonist' which is what happens if this
//     // is
//     // dropped on the protagonist.
//     [itemId: string | 'protagonist' | 'this' | 'talk']: ActionType;
//   };
// }

// export interface InventoryList {
//   [itemId: string]: InventoryItem;
// }

// export interface InventoryWithId extends InventoryItem {
//   id: string;
// }

export interface CharacterStyle {
  artwork: SvgSource;
  styles?: URL[];
  // How fast this character's walk cycle should move, in pixels per second.
  speed?: number;
  animations?: string[];
  scss?: string;

  dialogImagePos?: Coord;
  dialogImageScale?: number;
}

export interface Character {
  id: string;
  styles: {[style: string]: CharacterStyle};
}

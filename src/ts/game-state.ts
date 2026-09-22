import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  filter,
  ReplaySubject,
} from 'rxjs';
import {AssetHandler} from './assetHandler';
import {DEAD_NAME} from './constants';
import {getRoom} from './lazyLoaders';
import {ActionOptions, Coord, Room} from './types';
import {getStorage, setStorage, showActionButtons} from './utils/utils';

export const AGENCY_SAVE_STATE = 'agency_save_state';

export const LOCALSTORAGE_DEBUG = 'debug';

export interface SavedState {
  protagonistName: {first: string; last: string};
  currentRoomId: string;
  activeAction: ActionOptions;
  protagonistPosition?: Coord;
  tags: string[];
  chapter: string;
}

/** The single source of truth for game state! */
export class GameState {
  private debugMode = getStorage<boolean>(LOCALSTORAGE_DEBUG, false);

  readonly assetHandler = new AssetHandler();

  private readonly protagonistName: {first: string; last: string} = {
    first: '',
    last: '',
  };

  private readonly tags: string[] = [];

  private readonly roomSource = new BehaviorSubject<Room | undefined>(
    undefined
  );
  readonly room$ = this.roomSource.asObservable().pipe(filter(Boolean));

  // A list of object IDs that are in the player's inventory.
  private readonly inventorySource = new BehaviorSubject<Set<string>>(
    new Set()
  );
  readonly inventory$ = this.inventorySource.asObservable();

  private readonly roomStatesSource = new BehaviorSubject<string[]>([]);
  readonly roomStates$ = this.roomStatesSource.asObservable();

  private readonly readySource = new ReplaySubject<boolean>(1);
  readonly ready$ = this.readySource.asObservable();

  private activeAction: ActionOptions = 'look';

  // For graphical mode, this is where the protagonist is in the scene.
  private protagonistPosition?: Coord;

  private chapter = '';

  isDebug(): boolean {
    return this.debugMode;
  }

  debug(...data: any[]) {
    if (this.debugMode) {
      console.log('DEBUG:', ...data);
    }
  }

  toggleDebug() {
    this.debugMode = !this.debugMode;
    setStorage(LOCALSTORAGE_DEBUG, this.debugMode);
  }

  // Indicate that the various states are set up and ready to roll.
  markReady() {
    this.readySource.next(true);
  }

  // Returns the action selected by the player, which will be triggered when they click on something.
  getActiveAction() {
    return this.activeAction;
  }

  // Returns the entire save state, which is a snapshot of the player's current progress.
  getSaveState() {
    const rawState = window.localStorage.getItem(AGENCY_SAVE_STATE);
    if (!rawState) {
      return;
    }
    return JSON.parse(rawState) as SavedState;
  }

  getChapter() {
    return this.chapter;
  }

  setChapter(chap: string) {
    this.chapter = chap;
    this.save();
  }

  // Pulls the save state from local storage. If there is no save state, it will start a new game.
  start() {
    const savedState = this.getSaveState();
    // let wait: Promise<unknown>;
    if (savedState) {
      this.chapter = savedState.chapter;

      this.setProtagonistName(
        savedState.protagonistName.first + ' ' + savedState.protagonistName.last
      );

      this.protagonistPosition = savedState.protagonistPosition;

      this.loadRoomById(savedState.currentRoomId);
      // this.inventorySource.next(new Set(savedState.inventory));

      this.setupActions(savedState.activeAction);
      this.markReady();
    }

    setTimeout(() => {
      combineLatest([this.room$, this.inventory$])
        .pipe(debounceTime(100))
        .subscribe(() => {
          this.save();
          console.log('game state saved');
        });
    }, 1000);
  }

  // Set that the protagonist is holding this item.
  // TODO: Move to inventoryHandler.
  // grabItem(item: InventoryWithId) {
  //   this.grabbedItem = item;
  //   document.body.classList.add('grabbing');
  // }

  // Set that the protagonist is no longer holding anything.
  // TODO: Move to inventoryHandler
  // dropItem() {
  //   this.grabbedItem = undefined;
  //   document.body.classList.remove('grabbing');
  // }

  // Return the item currently held by the protagonist.
  // getGrabbedItem() {
  //   return this.grabbedItem;
  // }

  // Add an item to the player's active inventory.
  addToInventory(itemId?: string | string[]) {
    if (!itemId) {
      return;
    }
    const itemArray = ([] as string[]).concat(itemId);
    this.inventorySource.next(
      new Set([...this.inventorySource.value, ...itemArray])
    );
  }

  // Remove an item from the player's active inventory.
  removeFromInventory(itemId?: string) {
    if (!itemId) {
      return;
    }
    const items = this.inventorySource.value;
    items.delete(itemId);
    this.inventorySource.next(items);
  }

  // Load room data for the given room ID. This will include any state from when the player last left there.
  async loadRoomById(roomId: string) {
    const room = await getRoom(roomId);
    if (!room) {
      console.error('Unable to load the room!?', roomId);
      // something has gone horribly wrong
      return;
    }
    this.setRoom(room);
  }

  // Set that the protagonist has entered a room.
  setRoom(room: Room) {
    this.roomSource.next(room);
  }

  // Room states effect what happens in a room or what a player can interact with.
  // In graphical mode they change what is visible or what animations are playing.

  // Replace all room states with these.
  setRoomStates(states: string[]) {
    this.roomStatesSource.next(states);
  }

  // Add a state to the current room.
  addRoomState(state?: string) {
    if (!state) {
      return;
    }
    const states = [...this.roomStatesSource.getValue()];
    if (!states.includes(state)) {
      states.push(state);
    }
    this.roomStatesSource.next(states);
  }

  // Remove a state from the current room.
  removeRoomState(state?: string) {
    if (!state) {
      return;
    }
    const states = this.roomStatesSource.getValue().filter((s) => s !== state);
    this.roomStatesSource.next(states);
  }

  // Takes a combined string and applies it - +addstate,-removestate
  parseRoomStateControls(stateControls?: string) {
    if (!stateControls) {
      return;
    }
    const actions = stateControls.split(',');
    for (const action of actions) {
      if (action.charAt(0) === '-') {
        this.removeRoomState(action.substring(1));
      } else {
        let state = action;
        if (action.charAt(0) === '+') {
          state = action.substring(1);
        }
        this.addRoomState(state);
      }
    }
  }

  // Protagonist information...
  setProtagonistName(name: string) {
    const names = name.split(' ');
    this.protagonistName.first = names.shift() ?? '';
    this.protagonistName.last = names.join(' ');
  }

  getProtagonistName() {
    return this.protagonistName.first;
  }

  getProtagonistFullName() {
    return `${this.protagonistName.first} ${this.protagonistName.last}`;
  }

  getProtagonistLastName() {
    return this.protagonistName.last ?? this.protagonistName.first;
  }

  getProtagonistDeadname() {
    return DEAD_NAME;
  }

  getProtagonistDeadFullName() {
    return `${DEAD_NAME} ${this.protagonistName.last}`;
  }

  // Tags are a global attribute used to track player actions - FOR CONSEQUENCES.

  // Replace all tags with these - usually used only on load or new game.
  setTags(tags: string[]) {
    this.tags.length = 0;
    this.tags.push(...tags);
  }

  // Add a tag.
  addTag(tag: string) {
    this.tags.push(tag);
    this.save();
  }

  // Return all tags applied to the player.
  getTags(): string[] {
    return this.tags;
  }

  // Return the number of tags that match a search string.
  countTag(tag: string): number {
    return this.tags.filter((t) => t === tag).length;
  }

  setProtagonistPosition(pos: Coord) {
    this.protagonistPosition = pos;
    this.save();
  }

  getProtagonistPosition() {
    return this.protagonistPosition;
  }

  // Trigger a save of the current state.
  protected save() {
    // TODO: incorporate other rooms in the save data.
    const currentRoomId = this.roomSource.value?.roomId ?? '';
    const bundle: SavedState = {
      protagonistName: this.protagonistName,
      currentRoomId,
      // roomData: {
      //   [currentRoomId]: {states: this.roomStatesSource.value, objectIds: []},
      // },
      // inventory: [...this.inventorySource.value.values()],
      activeAction: this.getActiveAction(),
      tags: this.tags,
      protagonistPosition: this.protagonistPosition,
      chapter: this.chapter,
    };

    window.localStorage.setItem(AGENCY_SAVE_STATE, JSON.stringify(bundle));
  }

  private setupActions(initial: ActionOptions = 'look') {
    for (const action of [
      'look',
      'interact',
      'pickup',
      'talk',
    ] as ActionOptions[]) {
      const button = document.querySelector(
        `.action-buttons .button-${action}`
      )!;
      button?.addEventListener('click', (event) => {
        if (!document.body.classList.contains('actions-available')) {
          return;
        }
        this.setActiveAction(action);
        this.save();

        event.stopImmediatePropagation();
        event.stopPropagation();
      });
    }

    showActionButtons();
    this.setActiveAction(initial);
  }

  private setActiveAction(action: ActionOptions) {
    document
      .querySelectorAll('.action-buttons button')
      .forEach((otherButton) => {
        otherButton.classList.remove('active');
      });
    document.querySelector(`.button-${action}`)?.classList.add('active');
    this.activeAction = action;

    document.body.classList.remove('active-action-look');
    document.body.classList.remove('active-action-interact');
    document.body.classList.remove('active-action-pickup');
    document.body.classList.remove('active-action-talk');

    document.body.classList.add(`active-action-${action}`);
  }
}

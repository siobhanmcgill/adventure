import {BehaviorSubject, combineLatest, firstValueFrom, ReplaySubject, Subject,} from 'rxjs';
import {debounceTime, filter} from 'rxjs/operators';

import {InventoryWithId} from './inventoryHandler';
import {getRoom} from './lazyLoaders';
import {newGame} from './newGame';
import {RecurringPromiseSource} from './recurringPromise';
// import {ROOMS} from './artworkMap';
import {getSvg} from './svg_utils';
import {ActionOptions, InventoryItem, Room} from './types';
import { Action } from 'rxjs/internal/scheduler/Action';

export const AGENCY_SAVE_STATE = 'agency_save_state';

interface SavedState {
  protagonistName: {first: string; last: string};
  currentRoomId: string;
  roomStates: {[index: string]: string[]};
  inventory: string[];
}

export class GameState {
  private readonly protagonistName: {first: string; last: string} = {
    first: '',
    last: '',
  };

  private readonly roomSource = new BehaviorSubject<Room|undefined>(undefined);
  readonly room$ = this.roomSource.asObservable().pipe(filter(Boolean));

  private readonly inventorySource =
      new BehaviorSubject<Set<string>>(new Set());
  readonly inventory$ = this.inventorySource.asObservable();

  private readonly roomStatesSource = new BehaviorSubject<string[]>([]);
  readonly roomStates$ = this.roomStatesSource.asObservable();

  private readonly readySource = new ReplaySubject<boolean>(1);
  readonly ready$ = this.readySource.asObservable();

  private readonly svgElement = getSvg();

  private grabbedItem?: InventoryWithId;

  private activeAction: ActionOptions = 'look';

  constructor() {
    const savedState = this.getSaveState();
    let wait: Promise<unknown>;
    if (savedState) {
      this.setProtagonistName(
          savedState.protagonistName.first + ' ' +
          savedState.protagonistName.last);
      wait = this.loadSavedRoom(savedState);
    } else {
      wait = newGame(this);
    }

    wait.then(() => {
      this.setupActions();

      setTimeout(() => {
        combineLatest([this.room$, this.inventory$, this.roomStates$])
            .pipe(debounceTime(100))
            .subscribe(() => {
              this.save();
              console.log('game state saved');
            });
      }, 1000);
    });
  }

  grabItem(item: InventoryWithId) {
    this.grabbedItem = item;
    document.body.classList.add('grabbing');
  }

  dropItem() {
    this.grabbedItem = undefined;
    document.body.classList.remove('grabbing');
  }

  getGrabbedItem() {
    return this.grabbedItem;
  }

  markReady() {
    this.readySource.next(true);
  }

  async resetRoomState() {
    const room = await firstValueFrom(this.room$);
    this.setRoomStates(room.init.states);
  }

  getSaveState(): SavedState|undefined {
    const savedState = window.localStorage.getItem(AGENCY_SAVE_STATE);
    if (!savedState) {
      return;
    }
    return JSON.parse(savedState) as SavedState;
  }

  private async loadSavedRoom(loadedState: SavedState) {
    const room = await getRoom(loadedState.currentRoomId);
    if (!room) {
      // something has gone horribly wrong
      return;
    }
    this.roomSource.next(room);
    this.inventorySource.next(new Set(loadedState.inventory));

    this.markReady();
  }

  getSvgElement() {
    return this.svgElement;
  }

  setProtagonistName(name: string) {
    const names = name.split(' ');
    this.protagonistName.first = names.shift() ?? '';
    this.protagonistName.last = names.join(' ');
  }

  getProtagonistName() {
    return this.protagonistName.first;
  }

  setRoom(room: Room) {
    this.roomSource.next(room);
  }

  setRoomStates(states: string[]) {
    this.roomStatesSource.next(states);
  }

  addRoomState(state?: string) {
    if (!state) {
      return;
    }
    this.roomStatesSource.next([...this.roomStatesSource.value, state]);
  }

  removeRoomState(state?: string) {
    if (!state) {
      return;
    }
    const states = this.roomStatesSource.value;
    if (states.includes(state)) {
      states.splice(states.indexOf(state), 1);
    }
    this.roomStatesSource.next(states);
  }

  addToInventory(itemId?: string) {
    if (!itemId) {
      return;
    }
    this.inventorySource.next(new Set([...this.inventorySource.value, itemId]));
  }

  removeFromInventory(itemId?: string) {
    if (!itemId) {
      return;
    }
    const items = this.inventorySource.value;
    items.delete(itemId);
    this.inventorySource.next(items);
  }

  private save() {
    const currentRoomId = this.roomSource.value?.roomId ?? '';
    const bundle: SavedState = {
      protagonistName: this.protagonistName,
      currentRoomId,
      roomStates: {[currentRoomId]: this.roomStatesSource.value},
      inventory: [...this.inventorySource.value.values()],
    };

    window.localStorage.setItem(AGENCY_SAVE_STATE, JSON.stringify(bundle));
  }

  getActiveAction() {
    return this.activeAction;
  }

  private setupActions(initial: ActionOptions = 'look') {
    for (const action of ['look','interact','pickup','talk'] as ActionOptions[]) {
      const button = document.querySelector(`.action-buttons .button-${action}`)!;
      button.addEventListener('click', (event) => {
        document.querySelectorAll('.action-buttons button').forEach(otherButton => {
          otherButton.classList.remove('active');
        });
        button.classList.add('active');
        this.activeAction = action;

        document.body.classList.remove('active-action-look');
        document.body.classList.remove('active-action-interact');
        document.body.classList.remove('active-action-pickup');
        document.body.classList.remove('active-action-talk');

        document.body.classList.add(`active-action-${action}`);

        event.stopImmediatePropagation();
        event.stopPropagation();
      });
    }

    (document.querySelector(`.action-buttons .button-${initial}`) as HTMLButtonElement).click();
  }
}

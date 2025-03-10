import {BehaviorSubject, combineLatest, Subject} from 'rxjs';
import {filter} from 'rxjs/operators';

import {ROOMS} from './artworkMap';
import {getSvg} from './svg_utils';
import {InventoryItem, Room} from './types';

export const AGENCY_SAVE_STATE = 'agency_save_state';

interface SavedState {
  protagonistName: {first: string; last: string};
  currentRoomId: string;
  roomStates: {[index: string]: string[]};
  inventory: string[];
}

export class GameState {
  private readonly protagonistName:
      {first: string, last: string} = {first: '', last: ''};

  private readonly roomSource = new BehaviorSubject<Room|undefined>(undefined);
  readonly room$ = this.roomSource.asObservable().pipe(filter(Boolean));

  private readonly inventorySource = new BehaviorSubject<string[]>([]);
  private readonly inventory$ = this.inventorySource.asObservable();

  private readonly roomStatesSource = new BehaviorSubject<string[]>([]);
  private readonly roomStates$ = this.inventorySource.asObservable();

  private readonly svgElement = getSvg();

  constructor() {
    combineLatest([
      this.room$, this.inventory$, this.roomStates$
    ]).subscribe(() => {
      this.save();
    });

    const savedState = window.localStorage.getItem(AGENCY_SAVE_STATE);
    if (savedState) {
      const loadedState = JSON.parse(savedState) as SavedState;
      this.setProtagonistName(
          loadedState.protagonistName.first + ' ' +
          loadedState.protagonistName.last);

      this.roomSource.next(ROOMS[loadedState.currentRoomId]);
      this.roomStatesSource.next(
          loadedState.roomStates[loadedState.currentRoomId]);
      this.inventorySource.next(loadedState.inventory);
    }
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
    this.inventorySource.next([...this.inventorySource.value, itemId]);
  }

  removeFromInventory(itemId?: string) {
    if (!itemId) {
      return;
    }
    const items = this.inventorySource.value;
    if (items.includes(itemId)) {
      items.splice(items.indexOf(itemId), 1);
    }
    this.inventorySource.next(items);
  }

  private save() {
    const currentRoomId = this.roomSource.value?.roomId ?? '';
    const bundle: SavedState = {
      protagonistName: this.protagonistName,
      currentRoomId,
      roomStates: {[currentRoomId]: this.roomStatesSource.value},
      inventory: this.inventorySource.value,
    };

    window.localStorage.setItem(AGENCY_SAVE_STATE, JSON.stringify(bundle));
  }
}
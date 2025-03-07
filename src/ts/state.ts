import {BehaviorSubject} from 'rxjs';
import {filter} from 'rxjs/operators';

import {getSvg} from './svg_utils';
import {InventoryItem, Room} from './types';

export class GameState {
  private readonly roomSource = new BehaviorSubject<Room|undefined>(undefined);
  readonly room$ = this.roomSource.asObservable().pipe(filter(Boolean));

  private readonly inventorySource = new BehaviorSubject<string[]>([]);
  private readonly inventory$ = this.inventorySource.asObservable();

  private readonly svgElement = getSvg();

  getSvgElement() {
    return this.svgElement;
  }

  setRoom(room: Room) {
    this.roomSource.next(room);
  }

  addToInventory(itemId: string) {
    this.inventorySource.next([...this.inventorySource.value, itemId]);
  }

  removeFromInventory(itemId: string) {
    const items = this.inventorySource.value;
    if (items.includes(itemId)) {
      items.splice(items.indexOf(itemId), 1);
    }
    this.inventorySource.next(items);
  }
}
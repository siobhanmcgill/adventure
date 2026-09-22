import {firstValueFrom, Observable, Subject, withLatestFrom} from 'rxjs';
import {AnyGameMode} from '.';
import {ObjectHandler} from './objectHandler';
import {getStorage, setStorage} from './utils/utils';
import {RoomObject} from './types';

export const STORAGE_INVENTORY = 'agency_inventory';

export class InventoryHandler {
  private readonly inventoryListElement = document.querySelector(
    '.inventory .item-list'
  )!;
  private readonly inventory = document.querySelector('.inventory')!;
  private readonly inventoryToggle =
    document.querySelector('.inventory .toggle')!;

  private readonly loadedArtwork = new Map<URL, string>();

  private readonly inventoryObjects = new Map<string, ObjectHandler>();

  private readonly inventoryUpdatedSource = new Subject<boolean>();
  readonly inventoryUpdated$: Observable<boolean> = this.inventoryUpdatedSource;

  private readonly objectLookupMap = new Map<string, string>();

  constructor(private readonly game: AnyGameMode) {
    const savedInventory = getStorage<{[index: string]: RoomObject}>(
      STORAGE_INVENTORY,
      {}
    );
    if (Object.keys(savedInventory).length) {
      const ids: string[] = [];
      for (const [id, data] of Object.entries(savedInventory)) {
        this.inventoryObjects.set(id, new ObjectHandler(id, this.game, data));
        ids.push(id);
      }
      this.populateLoookupMap();
      this.populateInventoryUi();

      this.game.state.addToInventory(ids);
    }

    this.game.state.inventory$.subscribe(async (inventoryIds) => {
      this.updateInventoryList(inventoryIds);
    });

    this.inventoryUpdatedSource.subscribe(() => {
      this.populateInventoryUi();

      const extractedData: {[index: string]: RoomObject} = {};
      for (const [id, object] of this.inventoryObjects.entries()) {
        extractedData[id] = object.getData();
      }
      setStorage<{[index: string]: RoomObject}>(
        STORAGE_INVENTORY,
        extractedData
      );
    });

    this.game.state.room$.subscribe((room) => {
      // When a room is loaded, sync the inventory objects in case there are updates.
      for (const id of this.inventoryObjects.keys()) {
        if (room.objects[id]) {
          this.inventoryObjects.set(
            id,
            new ObjectHandler(id, this.game, room.objects[id])
          );
        }
      }
      this.inventoryUpdatedSource.next(true);
    });
  }

  getInventory(): readonly ObjectHandler[] {
    return [...this.inventoryObjects.values()];
  }

  /**
   * Returns an object whose name is contained in a string,
   * as well as the string with the matching name removed.
   */
  lookUpObject(text: string): [ObjectHandler, string] | undefined {
    // Sort by name length so the more specific match will be found first.
    const match = [...this.objectLookupMap.entries()]
      .sort((a, b) => a[0].length - b[0].length)
      .find(([name]) => text.match(new RegExp(`\\b${name}\\b`, 'gi')));
    if (!match || !this.inventoryObjects.has(match[1])) {
      return undefined;
    }
    return [this.inventoryObjects.get(match[1])!, text.replace(match[0], '')];
  }

  private async updateInventoryList(inventoryIds: Set<string>) {
    const newIds = [...inventoryIds.values()].filter(
      (id) => !this.inventoryObjects.has(id)
    );
    const removeIds = [...this.inventoryObjects.keys()].filter(
      (id) => !inventoryIds.has(id)
    );

    const roomData = await firstValueFrom(this.game.state.room$);
    for (const objectId of newIds) {
      if (roomData.objects[objectId]) {
        this.inventoryObjects.set(
          objectId,
          new ObjectHandler(objectId, this.game, roomData.objects[objectId])
        );
      }
    }
    for (const objectId of removeIds) {
      this.inventoryObjects.delete(objectId);
    }

    this.populateLoookupMap();

    this.inventoryUpdatedSource.next(true);
  }

  private populateLoookupMap() {
    // Create the map of object names to IDs.
    this.objectLookupMap.clear();
    for (const [key, object] of this.inventoryObjects) {
      const names: string[] = object.getLookupNames().filter(Boolean);
      for (const name of names) {
        this.objectLookupMap.set(name.toLowerCase(), key);
      }
    }
  }

  private populateInventoryUi() {
    // TODO: put the inventory items in the UI
  }
}

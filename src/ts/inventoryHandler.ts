import { map } from 'rxjs/operators';

import { FALLBACK_USE_ITEM_WITH, FALLBACTIONS } from './constants';
import { inventory } from './content/inventory';
import { doAction } from './objectHandler';
import { RoomHandler } from './roomHandler';
import { GameState } from './state';
import {
  extractIdFromSvg,
  getSvg,
  loadSvgString,
  printDialog,
} from './svg_utils';
import { Character, InventoryItem, RoomObject } from './types';

export interface InventoryWithId extends InventoryItem {
  id: string;
}

export class InventoryHandler {
  private readonly inventoryListElement = document.querySelector(
    '.inventory .item-list'
  )!;
  private readonly inventory = document.querySelector('.inventory')!;
  private readonly inventoryToggle =
    document.querySelector('.inventory .toggle')!;

  private readonly loadedArtwork = new Map<URL, string>();

  constructor(
    private readonly state: GameState,
    private readonly roomHandler: RoomHandler
  ) {
    this.inventoryToggle.addEventListener('click', () => {
      this.inventory.classList.toggle('open');
    });

    this.state.inventory$
      .pipe(
        map((ids) =>
          [...ids]
            .filter((id) => !!inventory[id])
            .map((id) => ({ ...inventory[id], id } as InventoryWithId))
        )
      )
      .subscribe(async (inventory) => {
        console.log('active inventory', inventory);
        this.inventoryListElement.innerHTML = '';

        if (inventory.length) {
          this.inventory.classList.add('has-inventory');
        } else {
          this.inventory.classList.remove('has-inventory');
        }

        for (const item of inventory) {
          if (!this.loadedArtwork.has(item.artwork.url)) {
            const svgString = await loadSvgString(item.artwork.url);
            this.loadedArtwork.set(item.artwork.url, svgString);
          }
          const svgString = this.loadedArtwork.get(item.artwork.url)!;
          const thisItemSvg = extractIdFromSvg(
            `<svg>${svgString}</svg>`,
            item.artwork.layerId
          );

          const itemElement = document.createElement('div');
          itemElement.classList.add('item');
          itemElement.innerHTML = `
          <svg viewBox="${item.artwork.viewBox}">${thisItemSvg}</svg>
          <span class="item-name">${item.name ?? item.id}</span>
          `;
          this.inventoryListElement.appendChild(itemElement);

          itemElement.addEventListener('click', (event) => {
            const grabbedItem = this.state.getGrabbedItem();
            console.log('grabbed item', grabbedItem);
            if (grabbedItem?.id === item.id) {
              // Put this item down.
              itemElement.classList.remove('grabbed');
              this.state.dropItem();
            } else if (grabbedItem) {
              // Try to use the grabbed item on this item.
              useItemsTogether(
                grabbedItem,
                item.id,
                item,
                this.state,
                this.roomHandler
              );
            } else {
              switch (this.state.getActiveAction()) {
                case 'interact':
                  if (item.use?.this) {
                    doAction(item.use?.this, this.state, this.roomHandler);
                    break;
                  }
                case 'pickup':
                  itemElement.classList.add('grabbed');
                  this.state.grabItem(item);
                  break;
                case 'look':
                  printDialog(
                    item.description ?? `It's a ${item.name ?? item.id}`,
                    this.state
                  );
                  break;
                case 'talk':
                  doAction(
                    item.use?.talk ?? FALLBACTIONS.interact,
                    this.state,
                    this.roomHandler
                  );
                  break;
              }
            }

            event.stopPropagation();
            event.stopImmediatePropagation();
          });
        }
      });
  }
}

export function useItemsTogether(
  grabbedItem: InventoryWithId,
  targetId: string,
  targetItem: InventoryWithId | RoomObject | Character | 'protagonist',
  state: GameState,
  roomHandler: RoomHandler
) {
  const action =
    (grabbedItem.use ?? {})[targetId] ??
    ((targetItem as InventoryWithId).use ?? {})[grabbedItem.id] ??
    ((targetItem as RoomObject) ?? {})[`interact#${grabbedItem.id}`];
  if (action) {
    doAction(action, state, roomHandler);
    state.dropItem();
    document.querySelectorAll('.inventory .item').forEach(item => {
      item.classList.remove('grabbed');
    });
  } else {
    doAction(
      grabbedItem.fallbackUse ?? FALLBACK_USE_ITEM_WITH,
      state,
      roomHandler
    );
  }
}

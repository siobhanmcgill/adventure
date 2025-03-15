import {map} from "rxjs/operators";

import {inventory} from "./content/inventory";
import {GameState} from "./state";
import {extractIdFromSvg, loadSvgString} from "./svg_utils";

export class InventoryHandler {
  private readonly inventoryListElement = document.querySelector(
    ".inventory .item-list"
  )!;
  private readonly inventory = document.querySelector(".inventory")!;
  private readonly inventoryToggle =
    document.querySelector(".inventory .toggle")!;

  private readonly loadedArtwork = new Map<URL, string>();

  constructor(private readonly state: GameState) {
    this.inventoryToggle.addEventListener("click", () => {
      this.inventory.classList.toggle("open");
    });

    this.state.inventory$
      .pipe(map((ids) => [...ids].map((id) => inventory[id]).filter(Boolean)))
      .subscribe(async (inventory) => {
        console.log("active inventory", inventory);
        this.inventoryListElement.innerHTML = "";

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

          const itemElement = document.createElement("div");
          itemElement.classList.add("item");
          itemElement.innerHTML = `<svg viewBox="${item.artwork.viewBox}">${thisItemSvg}</svg>`;
          this.inventoryListElement.appendChild(itemElement);
        }
      });
  }
}

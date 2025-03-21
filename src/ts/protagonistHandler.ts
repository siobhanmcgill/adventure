import { useItemsTogether } from './inventoryHandler';
import { getCharacter } from './lazyLoaders';
import { RoomHandler } from './roomHandler';
import { GameState } from './state';
import { createSvgElement, getSvg, loadSvgString, tooltip } from './svg_utils';
import { Room, RoomEntry } from './types';

export class ProtagonistHandler {
  private protagonistContainer?: SVGGElement;

  private currentPosition: { x: number; y: number } = {x: 0, y: 0};

  constructor(
    private readonly gameState: GameState,
    private readonly roomHandler: RoomHandler
  ) {}

  async setupProtagonist(room: Room, entry: RoomEntry) {
    // Insert the protagonist.
    const protagonistData = (await getCharacter('protagonist'))!;
    const protagonistStyleData =
      protagonistData.styles[room.roomId] ?? protagonistData.styles.main;
    const protagonistArt = await loadSvgString(
      protagonistStyleData.artwork.url
    );

    const scale = room.init.protagonistScale;
    this.currentPosition = entry.coords;
    this.protagonistContainer = createSvgElement('g', 'protagonist character', {
      transform: `translate(${
        entry.coords.x - (protagonistStyleData.artwork.coords?.x ?? 0) * scale
      }, ${
        entry.coords.y - (protagonistStyleData.artwork.coords?.y ?? 0) * scale
      }) scale(${room.init.protagonistScale})`,
    }) as SVGGElement;

    this.protagonistContainer.innerHTML = protagonistArt;
    this.roomHandler.getAccessibleArea()?.after(this.protagonistContainer);

    tooltip(this.protagonistContainer).setText(
      this.gameState.getProtagonistName()
    );

    this.setupProtagonistClick();

    (getSvg().querySelector('.room')! as SVGElement).addEventListener(
      'click',
      (event) => {
        const { offsetX: x, offsetY: y } = event;

        const point = (getSvg() as SVGSVGElement).createSVGPoint();
        point.x = x;
        point.y = y;
        console.log('is it inside?', this.roomHandler.getAccessibleArea()?.isPointInFill(point));

        // Draw a line from the current coords to the clicked coord - the last point which is
        // within the accessible area is the target??
      }
    );
  }

  private setupProtagonistClick() {
    this.protagonistContainer?.addEventListener('click', (event) => {
      const grabbedItem = this.gameState.getGrabbedItem();
      if (grabbedItem) {
        useItemsTogether(
          grabbedItem,
          'protagonist',
          'protagonist',
          this.gameState,
          this.roomHandler
        );
      }

      event.stopImmediatePropagation();
      event.stopPropagation();
    });
  }
}

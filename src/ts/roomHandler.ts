import {firstValueFrom} from 'rxjs';

import {getCharacter} from './lazyLoaders';
import {ObjectHandler} from './objectHandler';
import {GameState} from './state';
import {
  createSvgElement,
  getPosition,
  getSvg,
  injectHtmlFromTemplate,
  loadSvgString,
  printDialog,
  tooltip,
} from './svg_utils';
import {Popup, Room} from './types';
import {
  formatString,
  loadStyles,
  onBodyClick,
  query,
  typeEffect,
} from './utils';
import {useItemsTogether} from './inventoryHandler';
import {ProtagonistHandler} from './protagonistHandler';

export class RoomHandler {
  private currentRoomId?: string;
  private roomContainer?: SVGGElement;

  private readonly room$ = this.gameState.room$;

  private readonly objects = new Map<string, ObjectHandler>();
  private readonly popupData = new Map<string, Popup>();

  private accessibleArea?: SVGPathElement;

  private protagonistHandler;

  constructor(private readonly gameState: GameState) {
    this.protagonistHandler = new ProtagonistHandler(this.gameState, this);

    this.room$.subscribe((room) => {
      if (room.roomId !== this.currentRoomId) {
        this.initializeRoom(room);
      }
    });

    this.gameState.roomStates$.subscribe((states) => {
      console.log('room state?', states);
      if (this.roomContainer) {
        this.roomContainer.classList.remove(...this.roomContainer.classList);
        this.roomContainer.classList.add(
          'room',
          this.currentRoomId ?? '',
          ...states
        );
      }
    });
  }

  getRoomContainer() {
    return this.roomContainer;
  }

  getAccessibleArea() {
    return this.accessibleArea;
  }

  async showPopup(popupId: string): Promise<void> {
    if (!this.popupData.has(popupId)) {
      return;
    }

    const {quote, text, popupStyle, quoteAfter} = this.popupData.get(popupId)!;

    await (quote ? printDialog(quote, this.gameState) : Promise.resolve());

    const {container, htmlObject} = injectHtmlFromTemplate('.popup-wrapper', {
      width: '100%',
      height: '100%',
    });
    htmlObject.classList.add(popupStyle);
    const popupObj = htmlObject.querySelector('.popup')! as HTMLDivElement;
    popupObj.innerHTML = formatString(text, this.gameState);

    await typeEffect(popupObj);

    await onBodyClick(true);
    container.remove();

    if (quoteAfter) {
      printDialog(quoteAfter, this.gameState);
    }
  }

  async moveProtagonistToObject(objectContainer: SVGGElement) {
    if (this.protagonistHandler.isProtagonistCloseToObject(objectContainer)) {
      return Promise.resolve();
    }
    const target = getPosition(objectContainer);

    await this.protagonistHandler.moveProtagonistAsCloseAsPossibleTo(target);
  }

  // TODO: Break up this function.
  private async initializeRoom(room: Room) {
    const root = getSvg();
    // TODO: Transition away from the old room(s).
    root.querySelectorAll('.room').forEach((room) => {
      room.remove();
    });

    this.currentRoomId = room.roomId;
    this.objects.clear();

    const styles = room.init.styles;
    for (const style of styles) {
      loadStyles(room.roomId, style);
    }

    this.roomContainer = createSvgElement('g') as SVGGElement;
    this.gameState.getSvgElement().prepend(this.roomContainer);

    const artworkData = room.init.artwork ?? '';
    this.roomContainer.innerHTML = await loadSvgString(
      artworkData.url,
      artworkData.layerId
    );
    root.setAttribute('viewBox', artworkData.viewBox);

    const groups = this.roomContainer.querySelectorAll('g');
    for (const group of groups) {
      const id = group.id;
      if (room.objects[id]) {
        this.objects.set(
          id,
          new ObjectHandler(id, this.gameState, this, group, room.objects[id])
        );
      }
    }

    const saveState = this.gameState.getSaveState();
    let isFirstTime = false;
    if (saveState && saveState.roomStates[room.roomId]) {
      this.gameState.setRoomStates(saveState.roomStates[room.roomId]);
    } else {
      this.gameState.setRoomStates(room.init.states.slice());
      isFirstTime = true;
    }

    this.accessibleArea = query('$accessible-area', this.roomContainer);
    query<SVGPathElement>('#floor', this.roomContainer).addEventListener(
      'click',
      (e) => {
        this.protagonistHandler.moveProtagonistAsCloseAsPossibleTo(
          getPosition(new DOMRect(e.x, e.y, 1, 1))
        );
      }
    );

    // TODO: Control where the player entered from.
    const entry = room.enter.default;

    this.protagonistHandler.setupProtagonist(
      room,
      entry,
      saveState?.protagonistPosition
    );

    if (room.popups) {
      for (const key of Object.keys(room.popups)) {
        this.popupData.set(key, room.popups[key]);
      }
    }

    await firstValueFrom(this.gameState.ready$);

    if (isFirstTime) {
      printDialog(entry.quote, this.gameState);
    }
  }
}

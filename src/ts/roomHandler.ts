
import {getCharacter} from './lazyLoaders';
import {ObjectHandler} from './objectHandler';
import {GameState} from './state';
import {createSvgElement, getSvg, injectHtmlFromTemplate, loadSvgString, printDialog} from './svg_utils';
import {Popup, Room} from './types';
import {formatString, loadStyles, onBodyClick, typeEffect} from './utils';

export class RoomHandler {
  private currentRoomId?: string;
  private roomContainer?: SVGGElement;

  private readonly room$ = this.gameState.room$;

  private readonly objects = new Map<string, ObjectHandler>();
  private readonly popupData = new Map<string, Popup>();

  private accessibleArea?: SVGPathElement;
  private protagonistContainer?: SVGGElement;

  constructor(private readonly gameState: GameState) {
    this.room$.subscribe(room => {
      if (room.roomId !== this.currentRoomId) {
        this.initializeRoom(room);
      }
    });

    this.gameState.roomStates$.subscribe(states => {
      if (this.roomContainer) {
        this.roomContainer.classList.remove(...this.roomContainer.classList);
        this.roomContainer.classList.add(
            'room', this.currentRoomId ?? '', ...states);
      }
    });
  }

  getRoomContainer() {
    return this.roomContainer;
  }

  async showPopup(popupId: string): Promise<void> {
    if (!this.popupData.has(popupId)) {
      return;
    }

    const {quote, text, popupStyle, quoteAfter} = this.popupData.get(popupId)!;

    return (quote ? printDialog(quote, this.gameState) : Promise.resolve())
        .then(() => {
          const {container, htmlObject} = injectHtmlFromTemplate(
              '.popup-wrapper', {width: '100%', height: '100%'});
          htmlObject.classList.add(popupStyle);
          const popupObj =
              htmlObject.querySelector('.popup')! as HTMLDivElement;
          popupObj.innerHTML = formatString(text, this.gameState);
          typeEffect(popupObj);

          return onBodyClick(true)
              .then(() => {
                container.remove();
              })
              .then(
                  () => quoteAfter ? printDialog(quoteAfter, this.gameState) :
                                     Promise.resolve());
        });
  }

  private async initializeRoom(room: Room) {
    const root = getSvg();
    root.innerHTML = '';

    this.currentRoomId = room.roomId;
    this.objects.clear();

    const styles = room.init.styles;
    for (const style of styles) {
      loadStyles(room.roomId, style);
    }

    this.roomContainer = createSvgElement('g') as SVGGElement;
    this.gameState.getSvgElement().appendChild(this.roomContainer);

    const artworkData = room.init.artwork ?? '';
    this.roomContainer.innerHTML =
        await loadSvgString(artworkData.url, artworkData.layerId);
    root.setAttribute('viewBox', artworkData.viewBox);

    const groups = this.roomContainer.querySelectorAll('g');
    for (const group of groups) {
      const id = group.id;
      if (room.objects[id]) {
        this.objects.set(
            id,
            new ObjectHandler(
                id, this.gameState, this, group, room.objects[id]));
      }
    }

    const saveState = this.gameState.getSaveState();
    if (saveState && saveState.roomStates[room.roomId]) {
      this.gameState.setRoomStates(saveState.roomStates[room.roomId]);
    } else {
      this.gameState.setRoomStates(room.init.states.slice());
    }

    this.accessibleArea =
        this.roomContainer.querySelector(
            '[inkscape\\:label=\'accessible-area\']') as SVGPathElement;

    // Insert the protagonist.
    const protagonistData = (await getCharacter('protagonist'))!;
    const protagonistStyleData =
        protagonistData[room.roomId] ?? protagonistData.main;
    const protagonistArt =
        await loadSvgString(protagonistStyleData.artwork.url);

    const entry = room.enter.default;
    const scale = room.init.protagonistScale;
    this.protagonistContainer =
        createSvgElement('g', 'protagonist character', {
          transform: `translate(${
              entry.coords.x -
              ((protagonistStyleData.artwork.coords?.x ?? 0) * scale)}, ${
              entry.coords.y -
              ((protagonistStyleData.artwork.coords?.y ?? 0) *
               scale)}) scale(${room.init.protagonistScale})`
        }) as SVGGElement;

    this.protagonistContainer.innerHTML = protagonistArt;
    this.accessibleArea.after(this.protagonistContainer);

    if (room.popups) {
      for (const key of Object.keys(room.popups)) {
        this.popupData.set(key, room.popups[key]);
      }
    }
  }
}
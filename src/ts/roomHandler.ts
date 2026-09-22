import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  firstValueFrom,
  Observable,
  Subject,
} from 'rxjs';

import {AnyGameMode} from '.';
import {ProtagonistHandler} from './graphic-mode/protagonistHandler';
import {ObjectHandler} from './objectHandler';
import {GeneralPanel} from './panels/generalPanel';
import {Action, ActionType, Coord, Popup, Quote, Room} from './types';
import {
  createSvgElement,
  getPosition,
  getViewBox,
  loadSvgString,
  showQuotePanel,
} from './utils/svg_utils';
import {
  findMatchingKey,
  formatString,
  getStorage,
  html,
  loadStyles,
  OBJECT_MATCHER,
  promiseWait,
  query,
  queryAll,
  setStorage,
  whatIs,
} from './utils/utils';

export const AGENCY_ROOM_SAVE_STATE = 'agency_room_state_';

export interface SavedRoomState {
  // The states currently applied to this room.
  states: string[];
  // The objects the player has seen in this room.
  objectIds: string[];
}

export class RoomHandler<ContainerType extends SVGElement | HTMLElement> {
  private currentRoomId?: string;
  private roomContainer?: ContainerType;

  private readonly isRoomReady = new Subject<boolean>();
  readonly isRoomReady$ = this.isRoomReady.asObservable();

  private readonly objectUpdateSource = new BehaviorSubject(true);
  readonly objectUpdates$: Observable<boolean> = this.objectUpdateSource;

  private readonly objects = new Map<string, ObjectHandler>();
  private readonly popupData = new Map<string, Popup>();

  private accessibleArea?: SVGPathElement;

  // A map of names to object ids to look up objects by string.
  private objectLookupMap = new Map<string, string>();

  // TODO: Should this be at the index.ts level?
  protagonistHandler?: ProtagonistHandler;

  private roomCount = 0;
  private previousRoomId?: string;

  constructor(private readonly game: AnyGameMode) {
    if (this.game.isGraphic()) {
      this.protagonistHandler = new ProtagonistHandler(this.game);
    }

    // Every time a room is loaded in the state, handle the room data here.
    this.game.state.room$.subscribe((room) => {
      if (room.roomId !== this.currentRoomId) {
        this.initializeRoom(room);
      }
    });

    // Every time the room states change, use the states to set CSS classes
    this.game.state.roomStates$.subscribe((states) => {
      if (this.roomContainer) {
        this.roomContainer.classList.remove(...this.roomContainer.classList);
        this.roomContainer.classList.add(
          'room',
          this.currentRoomId ?? '',
          ...states
        );
      }
    });

    combineLatest([
      this.objectUpdateSource,
      this.game.state.roomStates$,
      this.game.state.room$,
    ])
      .pipe(debounceTime(100))
      .subscribe(([_, states, room]) => {
        // Create the map of object names to IDs.
        this.objectLookupMap.clear();
        for (const [key, object] of this.objects) {
          // If the thing was picked up, it isn't in the room anymore.
          if (!states.includes(`${key}-picked-up`)) {
            const names: string[] = object.getLookupNames().filter(Boolean);
            for (const name of names) {
              this.objectLookupMap.set(name.toLowerCase(), key);
            }
          }
        }

        // Save the state for this room.
        this.save(room, states);
      });
  }

  /**
   * Returns an object whose name is contained in a string,
   * as well as the string with the matching name removed.
   */
  lookUpObject(text: string): [ObjectHandler, string] | undefined {
    // Sort by name length so the more specific match will be found first.
    const match = [...this.objectLookupMap.entries()]
      .sort((a, b) => b[0].length - a[0].length)
      .find(([name]) => text.match(new RegExp(`\\b${name}\\b`, 'gi')));
    if (!match || !this.objects.has(match[1])) {
      return undefined;
    }
    return [this.objects.get(match[1])!, text.replace(match[0], '')];
  }

  getRoomContainer(): ContainerType | undefined {
    return this.roomContainer;
  }

  getAccessibleArea() {
    return this.accessibleArea;
  }

  getObjects(): readonly ObjectHandler[] {
    return [...this.objects.values()].sort((a, b) =>
      a.getId().localeCompare(b.getId())
    );
  }

  async showPopup(popupId: string): Promise<void> {
    if (!this.popupData.has(popupId)) {
      return;
    }

    const {title, quote, popupContent, popupStyle, quoteAfter} =
      this.popupData.get(popupId)!;

    if (quote) {
      await this.game.print(quote);
      await this.game.onBodyClick();
    }

    const popupHtml = html`<div>
      ${formatString(popupContent, this.game.state)}
    </div>`;
    const panel = new GeneralPanel(this.game);
    await panel.show({
      title,
      className: popupStyle,
      contents: popupHtml,
      shade: true,
      showCloseButton: true,
      noBodyClick: popupStyle.includes('computer'),
    });

    if (quoteAfter) {
      await promiseWait(200);
      await this.game.print(quoteAfter);
    }
  }

  async moveProtagonistToObject(objectContainer: SVGElement) {
    if (this.protagonistHandler?.isProtagonistCloseToObject(objectContainer)) {
      return Promise.resolve();
    }
    const target = getPosition(objectContainer, this.game.getContainer());

    await this.protagonistHandler?.moveProtagonistAsCloseAsPossibleTo(
      target,
      true
    );
  }

  async resetRoom() {
    const room = await firstValueFrom(this.game.state.room$);
    window.localStorage.removeItem(`${AGENCY_ROOM_SAVE_STATE}${room.roomId}`);
    this.initializeRoom(room, true);
  }

  private async initializeRoom(room: Room, reset = false) {
    this.isRoomReady.next(false);

    this.removeOldRooms();

    this.roomCount++;
    this.previousRoomId = this.currentRoomId;

    this.currentRoomId = room.roomId;
    this.objects.clear();

    // isFirstTime means this is the first time the player has entered this room.
    const isFirstTime = this.setupRoomState(room, reset);

    if (this.roomCount > 1) {
      const states = await firstValueFrom(this.game.state.roomStates$);
      const name = room.name
        ? formatString(
            room.name[findMatchingKey(room.name, 'default', states)],
            this.game.state
          )
        : 'Room';
      await this.game.print([
        `{nowait}<hr />`,
        `{nowait,center}<h4>${name}</h4>`,
      ]);
    }

    if (this.game.isGraphic()) {
      await this.setupRoomArtwork(room);
      await this.setupPlayerPosition(room);
    } else {
      await this.triggerRoomEntryText(room, isFirstTime);
    }

    if (room.popups) {
      for (const key of Object.keys(room.popups)) {
        this.popupData.set(key, room.popups[key]);
      }
    }

    this.isRoomReady.next(true);

    await firstValueFrom(this.game.state.ready$);
  }

  private async removeOldRooms() {
    // TODO: Transition away from the old room(s).
    if (this.game.isGraphic()) {
      (this.game.getContainer() as Element)
        .querySelectorAll('.room')
        .forEach((room) => {
          room.remove();
        });
    } else {
      // this.game.print(['<br />', '<hr />', '<br />']);
    }
  }

  registerObject(
    objectId: string,
    room: Room,
    domElement?: HTMLElement | SVGElement
  ) {
    if (room.objects[objectId]) {
      const objectHandler = this.objects.getOrInsert(
        objectId,
        new ObjectHandler(objectId, this.game, room.objects[objectId])
      );
      if (domElement) {
        objectHandler.addDomElement(domElement);
      }
      this.objectUpdateSource.next(true);
    }
  }

  private async triggerRoomEntryText(room: Room, isFirstTime: boolean) {
    this.game.debug(
      'Entering',
      room.roomId,
      'from',
      this.previousRoomId,
      'for the',
      isFirstTime ? 'first' : 'not first',
      'time'
    );
    let quote: Quote;
    if (!!this.previousRoomId && room.enter[this.previousRoomId]) {
      quote =
        room.enter[this.previousRoomId].text ??
        room.enter[this.previousRoomId].quote ??
        [];
    } else {
      const states = await firstValueFrom(this.game.state.roomStates$);
      const key = findMatchingKey(room.enter, 'default', states);
      quote = room.enter[key]?.text ?? room.enter[key]?.quote ?? [];

      // if (!isFirstTime && this.game.state.isDebug()) {
      //   // In debug mode, skip the entry dialog.
      //   quote = quote[quote.length - 1];
      // }
    }

    await this.game.print(quote);
  }

  async scanForObjects(within?: HTMLElement) {
    const room = await firstValueFrom(this.game.state.room$);
    const objectDoms: NodeListOf<HTMLElement> = queryAll(
      '.room-object',
      within ?? this.game.getContainer()
    );
    for (const objectDom of objectDoms) {
      const objectId = objectDom.dataset.objectId;
      if (objectId && room.objects[objectId]) {
        this.registerObject(objectId, room);
      }
    }
  }

  private setupRoomState(room: Room, reset = false): boolean {
    const saveState = getStorage<SavedRoomState | undefined>(
      `${AGENCY_ROOM_SAVE_STATE}${room.roomId}`,
      undefined
    );
    if (!reset && saveState) {
      // Set up the room state from the saved state
      this.game.debug('loading room state', {room, saveState});
      this.game.state.setRoomStates(saveState.states);
      for (const objectId of [...room.init.objects, ...saveState.objectIds]) {
        this.registerObject(objectId, room);
      }
      return false;
    } else {
      // This is the first time the player has entered this room
      this.game.state.setRoomStates(room.init.states.slice());
      for (const initObject of room.init.objects) {
        this.registerObject(initObject, room);
      }
      return true;
    }
  }

  private async setupRoomArtwork(room: Room) {
    const styles = room.init.styles;
    for (const style of styles ?? []) {
      loadStyles(room.roomId, style);
    }

    this.roomContainer = createSvgElement('g') as ContainerType;
    this.game.getContainer().prepend(this.roomContainer);

    const artworkData = room.init.artwork;
    if (artworkData) {
      this.roomContainer.innerHTML = await loadSvgString(
        artworkData.url,
        artworkData.layerId
      );
    }
    this.game.getContainer().setAttribute('viewBox', getViewBox());

    const groups = this.roomContainer.querySelectorAll('g');
    for (const group of groups) {
      const id = group.id;
      this.registerObject(id, room, group);
    }
  }

  private async setupPlayerPosition(room: Room) {
    let startingCoord: Coord | undefined;
    let startingQuote: Quote | undefined;
    if (this.roomCount === 1 && !!this.game.state.getProtagonistPosition()) {
      // The player loaded a save state.
      startingCoord = this.game.state.getProtagonistPosition()!;
    } else {
      const entry =
        room.enter[this.previousRoomId ?? 'default'] ??
        room.enter[Object.keys(room.enter)[0]];
      startingCoord = entry.coords;
      startingQuote = entry.quote;
    }

    this.accessibleArea = query('$accessible-area', this.roomContainer);
    query<SVGPathElement>('#floor', this.roomContainer)?.addEventListener(
      'click',
      (e) => {
        this.protagonistHandler?.moveProtagonistAsCloseAsPossibleTo(
          getPosition(new DOMRect(e.x, e.y, 1, 1), this.game.getContainer())
        );
      }
    );

    await this.protagonistHandler?.setupProtagonist(
      room,
      startingCoord ?? {x: 0, y: 0}
    );

    if (startingQuote) {
      await showQuotePanel(startingQuote, this.game);
    }
  }

  private async save(room: Room, states: string[]) {
    setStorage<SavedRoomState>(`${AGENCY_ROOM_SAVE_STATE}${room.roomId}`, {
      states,
      objectIds: [...this.objects.keys()],
    });
  }

  async debug_roomcheck() {
    await this.game.print([
      '{nowait}*****************************************************************************',
      'Checking room config...',
    ]);

    const roomData = await firstValueFrom(this.game.state.room$);

    const objectIds: string[] = [];
    const allText: string[] = [];
    // What objects are visible from looking at other objects.
    // key === objectId, value === what object ids include this object in their view text.
    const viewMap = new Map<
      string,
      Array<{action: string; sourceId: string}>
    >();

    for (const [entryId, entry] of Object.entries(roomData.enter)) {
      const thisText = ([] as string[]).concat(entry.text ?? entry.quote ?? '');
      for (const t of thisText) {
        const objectMatches = t.matchAll(OBJECT_MATCHER);
        for (const [_, matchObjectId] of objectMatches ?? []) {
          viewMap.getOrInsert(matchObjectId, []).push({
            sourceId: entryId,
            action: 'room-entry',
          });
        }
      }
    }

    for (const [objectId, object] of Object.entries(roomData.objects)) {
      objectIds.push(objectId);
      for (const [actionLabel, action] of Object.entries(object)) {
        const thisText = extractAllTextFromAction(action);
        for (const t of thisText) {
          const objectMatches = t.matchAll(OBJECT_MATCHER);
          for (const [_, matchObjectId] of objectMatches ?? []) {
            viewMap.getOrInsert(matchObjectId, []).push({
              sourceId: objectId,
              action: actionLabel,
            });
          }
        }
      }
    }

    if (viewMap.size > 0) {
      let tableCode = `<table>
        <tr>
          <th>Object ID</th>
          <th>Seen by</th>
        </tr>`;
      for (const objectId of [...viewMap.keys()].sort()) {
        tableCode += `
        <tr><td>${objectId}</td><td>${viewMap
          .get(objectId)
          ?.map((data) => `${data.action} > ${data.sourceId}`)
          .join('<br /> ')}</td></tr>
        `;
      }
      tableCode += `</table>`;
      await this.game.print('{nowait}' + tableCode);
    }

    await this.game.print('');

    const unseenObjects = objectIds.filter((id) => !viewMap.has(id));
    await this.game.print([
      '{nowait}These objects cannot be seen!',
      `{nowait}${unseenObjects.sort().join(', ')}`,
    ]);
  }
}

function extractAllTextFromAction(action?: ActionType): string[] {
  if (!action) {
    return [];
  }
  const actionText: string[] = [];
  if (whatIs(action) === 'quote') {
    actionText.push(...([] as string[]).concat(action as Quote));
  } else {
    const definitelyAction: Action = action as Action;
    actionText.push(
      ...([] as string[]).concat(
        definitelyAction.text ?? definitelyAction.quote ?? ''
      )
    );
    actionText.push(
      ...([] as string[]).concat(
        definitelyAction.textAfterAnimation ??
          definitelyAction.quoteAfterAnimation ??
          ''
      )
    );
    if (definitelyAction.queue?.length) {
      for (const subAction of definitelyAction.queue) {
        actionText.push(...extractAllTextFromAction(subAction));
      }
    }
  }
  return actionText.filter(Boolean);
}

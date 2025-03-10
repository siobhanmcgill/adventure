import {BehaviorSubject} from 'rxjs';
import {filter, map, take} from 'rxjs/operators';

import {ARTWORK} from './artworkMap';
import {ObjectHandler} from './objectHandler';
import {GameState} from './state';
import {createSvgElement} from './svg_utils';
import {Room} from './types';

export class RoomHandler {
  private currentRoomId?: string;
  private roomContainer?: SVGGElement;

  private readonly room$ = this.gameState.room$;
  private readonly activeStateSource = new BehaviorSubject<string[]>([]);

  readonly activeStates$ = this.activeStateSource.asObservable();

  private readonly objects = new Map<string, ObjectHandler>();

  constructor(private readonly gameState: GameState) {
    this.room$.subscribe(room => {
      if (room.roomId !== this.currentRoomId) {
        this.initializeRoom(room);
      }
    });

    this.activeStates$.subscribe(states => {
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

  hasState(state: string) {
    return this.activeStates$.pipe(
        take(1), filter(s => s.includes(state)), map(Boolean));
  }

  addState(state?: string) {
    if (!state) {
      return;
    }
    this.activeStateSource.next([...this.activeStateSource.value, state]);
  }

  removeState(state?: string) {
    if (!state) {
      return;
    }
    const states = this.activeStateSource.value;
    if (states.includes(state)) {
      states.splice(states.indexOf(state), 1);
    }
    this.activeStateSource.next(states);
  }

  private async initializeRoom(room: Room) {
    this.currentRoomId = room.roomId;
    this.objects.clear();

    this.roomContainer = createSvgElement('g') as SVGGElement;
    this.gameState.getSvgElement().appendChild(this.roomContainer);

    const artworkUrl = ARTWORK.rooms[room.roomId] ?? '';
    const artwork = await (await fetch(artworkUrl)).text();

    console.log({artworkUrl, artwork});

    const placeholder = document.createElement('div');
    placeholder.classList.add('placeholder');
    placeholder.innerHTML = artwork;
    document.body.appendChild(placeholder);
    const sodipodi =
        placeholder.querySelector(CSS.escape('sodipodi:namedview'));
    if (sodipodi) {
      sodipodi.remove();
    }
    const clipPaths = placeholder.querySelectorAll('clipPath use');
    for (const clipPath of clipPaths) {
      const useId = clipPath.getAttribute('xlink:href')?.replace('#', '');
      if (useId) {
        const wrong = document.getElementById(useId);
        if (wrong?.tagName === 'g') {
          const right = wrong.childNodes[1] as SVGElement;
          if (right) {
            const rightId = right.getAttribute('id');
            if (rightId) {
              clipPath.setAttribute('xlink:href', `#${rightId}`);
            }
          }
        }
      }
    }
    const placeholderSvg = placeholder.querySelector('svg');
    if (!placeholderSvg) {
      // Something went horribly wrong.
      return;
    }

    this.roomContainer.innerHTML = placeholderSvg.innerHTML;

    placeholder.remove();

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

    this.activeStateSource.next(room.init.states.slice());
  }
}
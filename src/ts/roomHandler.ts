import {BehaviorSubject} from 'rxjs';
import {filter, map, take} from 'rxjs/operators';

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
        this.roomContainer.classList.add('room', ...states);
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

  addState(state: string) {
    this.activeStateSource.next([...this.activeStateSource.value, state]);
  }

  removeState(state: string) {
    const states = this.activeStateSource.value;
    if (states.includes(state)) {
      states.splice(states.indexOf(state), 1);
    }
    this.activeStateSource.next(states);
  }

  private initializeRoom(room: Room) {
    this.currentRoomId = room.roomId;
    this.objects.clear();

    this.roomContainer = createSvgElement('g') as SVGGElement;
    this.gameState.getSvgElement().appendChild(this.roomContainer);

    const artwork = room.artwork;
    this.roomContainer.innerHTML = artwork;

    const groups = this.roomContainer.querySelectorAll('g');
    console.log(groups);
    for (const group of groups) {
      const id = group.id;
      if (room.objects[id]) {
        this.objects.set(
            id, new ObjectHandler(id, this, group, room.objects[id]));
      }
    }

    this.activeStateSource.next(room.init.states.slice());
  }
}
import {firstValueFrom} from 'rxjs';

import {combineLatest} from 'rxjs';
import {AnyGameMode} from '.';
import {
  FALLBACK_PICK_UP_AGAIN,
  FALLBACK_USE_ITEM_WITH,
  FALLBACTIONS,
} from './constants';
import {
  Action,
  ActionOptions,
  ActionOptionsWithState,
  ActionType,
  Room,
  RoomObject,
} from './types';
import {tooltip} from './utils/svg_utils';
import {findMatchingKey, whatIs} from './utils/utils';

// A special version of the room object that can have any string as an action.
// Actions with an alias will be expanded so those aliases can be called.
interface InternalRoomObject extends RoomObject {
  [index: string]: ActionType | undefined;
}

/** Controller for a single room object. */
export class ObjectHandler {
  private objectDomElement: Array<SVGElement | HTMLElement> = [];
  private readonly data: InternalRoomObject;
  private readonly possibleActions: Set<string>;

  constructor(
    private readonly id: string,
    private readonly game: AnyGameMode,
    inputData: RoomObject
  ) {
    this.data = JSON.parse(JSON.stringify(inputData));

    // Expand all of the action aliases to make them easier to call later.
    for (const [key, value] of Object.entries(inputData).filter(
      ([k]) => !['name', 'aka'].includes(k)
    )) {
      // Functions aren't copied by the JSON.parse(JSON.stringify()) hack.
      if ((value as Action)?.custom) {
        (this.data[key] as Action).custom = (
          inputData[key as keyof RoomObject] as Action
        )?.custom;
      }

      const [baseStateAction, state] = key.split('.');
      const [baseItemAction, otherObjectId] = key.split('#');
      const baseAction = otherObjectId ? baseItemAction : baseStateAction;
      if ((value as Action)?.alias?.length) {
        for (const alias of (value as Action).alias!) {
          let thisAlias = state ? `${alias}.${state}` : alias;
          if (otherObjectId) {
            thisAlias += '#' + otherObjectId;
          }
          this.data[thisAlias] = `>${key}`;
        }
      }
      // Add aliases for this action's known synonyms.
      for (const alias of ACTION_MAP.get(baseAction as ActionOptions) ?? []) {
        let thisAlias = state ? `${alias}.${state}` : alias;
        if (otherObjectId) {
          thisAlias += '#' + otherObjectId;
        }
        if (!this.data[thisAlias]) {
          this.data[thisAlias] = `>${key}`;
        }
      }
    }
    // Make sure that interact#yourself is an alias of interact.
    // if (!this.data['interact#yourself']) {
    //   this.data['interact#yourself'] = '>interact';
    // }

    // A list of all possible actions without state or object values.
    this.possibleActions = new Set(
      Object.keys(this.data).map((key) => key.split('.')[0].split('#')[0])
    );
  }

  addDomElement(domElement: HTMLElement | SVGElement) {
    this.objectDomElement?.push(domElement);

    domElement.classList.add('room-object');

    // In graphical mode, the object elements are G tags.
    // We will add tooltips to them - we don't need tooltips in text mode.
    if (this.game.isGraphic() || domElement.nodeName === 'G') {
      const tooltipActor = tooltip(
        domElement as SVGGElement,
        this.game.getContainer()
      );

      // Update this object's name tooltip whenever the room state changes.
      combineLatest([
        this.game.state.roomStates$,
        this.game.state.room$,
      ]).subscribe(async ([states, roomData]) => {
        const nameKey = findMatchingKey(this.data, 'name', states);

        const stateWithFilter = Object.entries(roomData.states).find(
          ([key, state]) => states.includes(key) && !!state.objectNameFilter
        );

        let nameText = (this.data[nameKey] as string) ?? this.id;
        if (
          stateWithFilter &&
          stateWithFilter[1] &&
          stateWithFilter[1].objectNameFilter
        ) {
          nameText = await stateWithFilter[1].objectNameFilter(
            this.id,
            nameText
          );
        }

        tooltipActor.setText(nameText);
      });
    }

    domElement.addEventListener('click', async (event: Event) => {
      // const actionParams = await this.getAction();
      // // If the user is interacting with the object in some way
      // // (the action is more than just some text), she should walk to there.
      // if (
      //   this.game.isGraphic() &&
      //   (this.game.state.getGrabbedItem() ||
      //     whatIs(actionParams.action) === 'action')
      // ) {
      //   await this.game.roomHandler.moveProtagonistToObject(
      //     domElement as SVGElement
      //   );
      // }
      // this.game.actionHandler.doAction(actionParams);
    });
  }

  getId() {
    return this.id;
  }

  getIconHtml() {
    const iconName = this.data.icon
      ? `${this.data.icon as string}`
      : `fa-cube fa-${this.getId().toLowerCase()}`;

    return `<i class="fa-solid ${iconName}"></i>`;
  }

  getLookupNames(): string[] {
    return [
      this.data.name as string,
      ...((this.data.aka as string[]) ?? []),
      this.id,
    ];
  }

  getData(): RoomObject {
    return this.data;
  }

  // Get the processed name, filtered through any active states.
  async getName() {
    const [states, roomData] = await firstValueFrom(
      combineLatest([this.game.state.roomStates$, this.game.state.room$])
    );

    const nameKey = findMatchingKey(this.data, 'name', states);

    const stateWithFilter = Object.entries(roomData.states).find(
      ([key, state]) => states.includes(key) && !!state.objectNameFilter
    );

    let nameText = (this.data[nameKey] as string) ?? this.id;
    if (
      stateWithFilter &&
      stateWithFilter[1] &&
      stateWithFilter[1].objectNameFilter
    ) {
      nameText = await stateWithFilter[1].objectNameFilter(this.id, nameText);
    }
    return nameText;
  }

  /** Return any action whose text is in a given string. */
  async findAction(
    text: string,
    otherObjectId?: string
  ): Promise<ActionType | undefined> {
    // First see if any of the
    const verb = [...this.possibleActions.values()]
      .sort((a, b) => a.length - b.length)
      .find((action) => text.includes(action));

    if (!verb) {
      return undefined;
    }

    const states = (
      await firstValueFrom(this.game.state.roomStates$)
    ).reverse();
    let actionName = findMatchingKey(this.data, verb, states);
    // If this is acting on another object we have to find an action that matches that.
    // "use on yourself" is the same thing as "use"
    if (
      otherObjectId &&
      (this.data[`${actionName}#${otherObjectId}`] ||
        otherObjectId !== 'yourself')
    ) {
      actionName = `${actionName}#${otherObjectId}`;
    }
    // If an action is just `>something` it's an alias for the something action.
    if (
      typeof this.data[actionName] === 'string' &&
      (this.data[actionName] as string).startsWith('>')
    ) {
      actionName = (this.data[actionName] as string).substring(1);
    }
    if (
      actionName === 'pickup' &&
      states.includes(this.getId() + '-picked-up')
    ) {
      return FALLBACK_PICK_UP_AGAIN;
    } else {
      return this.data[actionName];
    }
  }
}

// When a player types a verb, this determines which action they likely mean.
export const ACTION_MAP = new Map<ActionOptions, string[]>([
  // ['look', 'look'],
  // ['peep', 'look'],
  // ['examine', 'look'],
  // ['stare', 'look'],
  ['look', ['peep', 'examine', 'stare']],

  // ['interact', 'interact'],
  // ['use', 'interact'],
  // ['touch', 'interact'],
  // ['turn', 'interact'],
  // ['toggle', 'interact'],
  // ['do', 'interact'],
  ['interact', ['use', 'touch', 'turn', 'toggle', 'do']],

  // Make sure pick up is first, so it doesn't make it 'pickup up'
  // ['pick up', 'pickup'],
  // ['pickup', 'pickup'],
  // ['pick', 'pickup'],
  // ['take', 'pickup'],
  // ['grab', 'pickup'],
  ['pickup', ['pick up', 'pick', 'take', 'grab']],

  // ['talk', 'talk'],
  // ['greet', 'talk'],
  // ['yell', 'talk'],
  ['talk', ['greet', 'yell']],

  ['sit', ['squat']],
]);

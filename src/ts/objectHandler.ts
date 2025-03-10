import {firstValueFrom, take} from 'rxjs';

import {FALLBACTIONS, LOOK_FALLBACK} from './constants';
import {RoomHandler} from './roomHandler';
import {GameState} from './state';
import {createSvgElement, getSvg, printDialog} from './svg_utils';
import {Action, RoomObject} from './types';
import {onBodyClick} from './utils';

export class ObjectHandler {
  constructor(
      readonly id: string, private readonly state: GameState,
      private readonly roomHandler: RoomHandler,
      private readonly svgElement: SVGGElement,
      private readonly data: RoomObject) {
    this.svgElement.classList.add('room-object');

    const actions: Array<'look'|'use'|'pickup'|'talk'> =
        ['look', 'use', 'pickup', 'talk'];

    this.svgElement.addEventListener('click', (event: MouseEvent) => {
      const actionMenuTemplate: HTMLDivElement =
          document.querySelector('body > .actions')!;
      const actionMenuWidth = actionMenuTemplate.clientWidth + 1;
      const actionMenuHeight = actionMenuTemplate.clientHeight + 1;

      const menu = actionMenuTemplate.cloneNode(true) as HTMLDivElement;

      const {offsetX, offsetY} = event;

      const container = createSvgElement('foreignObject', 'action-container', {
        x: offsetX - (actionMenuWidth / 2),
        y: offsetY - (actionMenuHeight + 10),
        width: actionMenuWidth,
        height: actionMenuHeight
      });
      container.appendChild(menu);
      getSvg().appendChild(container);

      for (const actionBase of actions) {
        menu.querySelector(`.button-${actionBase}`)
            ?.addEventListener('click', async () => {
              const states =
                  (await firstValueFrom(this.roomHandler.activeStates$))
                      .reverse();
              const keys = Object.keys(this.data);
              let action: string = actionBase;
              const actionKey = states.some(s => {
                const thisAction = `${actionBase}{${s}}`;
                const pass = keys.includes(thisAction);
                if (pass) {
                  action = thisAction;
                }
                return pass;
              });

              this.doAction(this.data[action] ?? FALLBACTIONS[actionBase]);
            });
      }

      setTimeout(() => {
        onBodyClick(() => {
          container.remove();
          return false;
        });
      });
    });
  }

  private doAction(action: string|string[]|Action) {
    if (typeof action === 'string') {
      printDialog([action]);
    } else if (
        (action as string[]).length &&
        typeof (action as string[])[0] === 'string') {
      printDialog(action as string[]);
    } else {
      // TODO: Handle an action queue.

      console.log({action});
      action = action as Action;
      if (action.quote) {
        printDialog(([] as string[]).concat(action.quote));
      }
      this.roomHandler.addState(action.addState);
      this.roomHandler.removeState(action.removeState);
      this.state.addToInventory(action.addItem);
      if (action.addItem) {
        this.roomHandler.addState(`${action.addItem}-picked-up`)
      }
      this.state.removeFromInventory(action.removeItem);
    }
  }
}
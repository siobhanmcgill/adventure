import {firstValueFrom, take} from 'rxjs';

import {FALLBACTIONS} from './constants';
import {useItemsTogether} from './inventoryHandler';
import {RoomHandler} from './roomHandler';
import {GameState} from './state';
import {createSvgElement, getSvg, printDialog, tooltip} from './svg_utils';
import {Action, RoomObject} from './types';
import {findMatchingKey, onBodyClick} from './utils';

export class ObjectHandler {
  constructor(
      readonly id: string, private readonly state: GameState,
      private readonly roomHandler: RoomHandler,
      private readonly svgElement: SVGGElement,
      private readonly data: RoomObject) {
    this.svgElement.classList.add('room-object');

    const actions: Array<'look'|'use'|'pickup'|'talk'> =
        ['look', 'use', 'pickup', 'talk'];

    const tooltipActor = tooltip(this.svgElement);
    this.state.roomStates$.subscribe(states => {
      const nameKey = findMatchingKey(this.data, 'name', states);
      tooltipActor.setText(this.data[nameKey] as string ?? this.id);
    });

    // Show the action menu when you click on a thing.
    this.svgElement.addEventListener('click', (event: MouseEvent) => {
      const grabbedItem = this.state.getGrabbedItem();
      if (grabbedItem) {
        // Try to use the grabbed item on this.
        useItemsTogether(grabbedItem, id, data, this.state, this.roomHandler);
      } else {
        const actionMenuTemplate: HTMLDivElement =
            document.querySelector('body > .actions')!;
        const actionMenuWidth = actionMenuTemplate.clientWidth + 1;
        const actionMenuHeight = actionMenuTemplate.clientHeight + 1;

        const menu = actionMenuTemplate.cloneNode(true) as HTMLDivElement;

        const {offsetX, offsetY} = event;

        const container =
            createSvgElement('foreignObject', 'action-container', {
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
                    (await firstValueFrom(this.state.roomStates$)).reverse();
                const action = findMatchingKey(this.data, actionBase, states);

                doAction(
                    this.data[action] ?? FALLBACTIONS[actionBase], this.state,
                    this.roomHandler);
              });
        }

        onBodyClick().then(() => container.remove());
      }
    });
  }
}

export async function doAction(
    action: string|string[]|Action, state: GameState,
    roomHandler: RoomHandler): Promise<void> {
  if (typeof action === 'string') {
    return printDialog([action], state);
  } else if (
      (action as string[]).length &&
      typeof (action as string[])[0] === 'string') {
    return printDialog(action as string[], state);
  } else {
    let commitAction = action as Action;
    const queue = commitAction.queue ?? [];
    const onQueueFinish = commitAction.onQueueFinish;
    if (queue?.length) {
      commitAction = queue.shift()!;
    }

    await (
        commitAction.quote ?
            printDialog(([] as string[]).concat(commitAction.quote), state) :
            Promise.resolve());
    await (
        commitAction.popup ? roomHandler.showPopup(commitAction.popup) :
                             Promise.resolve());
    state.addRoomState(commitAction.addState);
    state.removeRoomState(commitAction.removeState);
    state.addToInventory(commitAction.addItem);
    if (commitAction.addItem) {
      state.addRoomState(`${commitAction.addItem}-picked-up`);
    }
    state.removeFromInventory(commitAction.removeItem);

    if (!queue.length && onQueueFinish) {
      return doAction(onQueueFinish, state, roomHandler);
    }
  }
  return Promise.resolve();
}
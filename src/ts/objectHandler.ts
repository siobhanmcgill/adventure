import { firstValueFrom, take } from 'rxjs';

import { FALLBACTIONS } from './constants';
import { useItemsTogether } from './inventoryHandler';
import { RoomHandler } from './roomHandler';
import { GameState } from './state';
import { createSvgElement, getSvg, printDialog, tooltip } from './svg_utils';
import { Action, RoomObject } from './types';
import { findMatchingKey, onBodyClick } from './utils';

export class ObjectHandler {
  constructor(
    readonly id: string,
    private readonly state: GameState,
    private readonly roomHandler: RoomHandler,
    private readonly svgElement: SVGGElement,
    private readonly data: RoomObject
  ) {
    this.svgElement.classList.add('room-object');

    const tooltipActor = tooltip(this.svgElement);
    this.state.roomStates$.subscribe((states) => {
      const nameKey = findMatchingKey(this.data, 'name', states);
      tooltipActor.setText((this.data[nameKey] as string) ?? this.id);
    });

    // Show the action menu when you click on a thing.
    this.svgElement.addEventListener('click', async (event: MouseEvent) => {
      const grabbedItem = this.state.getGrabbedItem();
      if (grabbedItem) {
        // Try to use the grabbed item on this.
        useItemsTogether(grabbedItem, id, data, this.state, this.roomHandler);
      } else {
        const states = (await firstValueFrom(this.state.roomStates$)).reverse();
        const action = findMatchingKey(
          this.data,
          this.state.getActiveAction(),
          states
        );

        doAction(
          this.data[action] ??
            FALLBACTIONS[this.state.getActiveAction()] ??
            `I don't know.`,
          this.state,
          this.roomHandler
        );
      }
    });
  }
}

export async function doAction(
  action: string | string[] | Action,
  state: GameState,
  roomHandler: RoomHandler
): Promise<void> {
  if (typeof action === 'string') {
    return printDialog([action], state);
  } else if (
    (action as string[]).length &&
    typeof (action as string[])[0] === 'string'
  ) {
    return printDialog(action as string[], state);
  } else {
    let commitAction = action as Action;
    const queue = commitAction.queue ?? [];
    const onQueueFinish = commitAction.onQueueFinish;
    if (queue?.length) {
      commitAction = queue.shift()!;
    }

    await (commitAction.quote
      ? printDialog(([] as string[]).concat(commitAction.quote), state)
      : Promise.resolve());
    await (commitAction.popup
      ? roomHandler.showPopup(commitAction.popup)
      : Promise.resolve());
    state.addRoomState(commitAction.addState);
    state.removeRoomState(commitAction.removeState);
    state.addToInventory(commitAction.addItem);
    if (commitAction.addItem) {
      state.addRoomState(`${commitAction.addItem}-picked-up`);
    }
    state.removeFromInventory(commitAction.removeItem);

    if (commitAction.animation) {
      // ...
    }
    await (commitAction.quoteAfterAnimation
      ? printDialog(commitAction.quoteAfterAnimation, state)
      : Promise.resolve());

    if (!queue.length && onQueueFinish) {
      return doAction(onQueueFinish, state, roomHandler);
    }
  }
  return Promise.resolve();
}

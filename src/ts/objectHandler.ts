import {firstValueFrom, take} from 'rxjs';

import {FALLBACTIONS} from './constants';
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
                  (await firstValueFrom(this.state.roomStates$))
                      .reverse();
              const action = findMatchingKey(this.data, actionBase, states);

              this.doAction(this.data[action] ?? FALLBACTIONS[actionBase]);
            });
      }

      onBodyClick().then(() => container.remove());
    });
  }

  private async doAction(action: string|string[]|Action): Promise<void> {
    if (typeof action === 'string') {
      return printDialog([action], this.state);
    } else if (
        (action as string[]).length &&
        typeof (action as string[])[0] === 'string') {
      return printDialog(action as string[], this.state);
    } else {
      let commitAction = action as Action;
      const queue = commitAction.queue ?? [];
      const onQueueFinish = commitAction.onQueueFinish;
      if (queue?.length) {
        commitAction = queue.shift()!;
      }

      await (
          commitAction.quote ?
              printDialog(([] as string[]).concat(commitAction.quote), this.state) :
              Promise.resolve());
      await (
          commitAction.popup ? this.roomHandler.showPopup(commitAction.popup) :
                               Promise.resolve());
      this.state.addRoomState(commitAction.addState);
      this.state.removeRoomState(commitAction.removeState);
      this.state.addToInventory(commitAction.addItem);
      if (commitAction.addItem) {
        this.state.addRoomState(`${commitAction.addItem}-picked-up`);
      }
      this.state.removeFromInventory(commitAction.removeItem);

      if (!queue.length && onQueueFinish) {
        return this.doAction(onQueueFinish);
      }
    }
    return Promise.resolve();
  }
}
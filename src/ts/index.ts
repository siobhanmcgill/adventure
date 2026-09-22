/** This is the starting point for the whole shebang! */

import {InventoryHandler} from './inventoryHandler';
import {GameState} from './game-state';
import {getVersionString, loadStyles, transitionToClass} from './utils/utils';
import {AgencyText} from './text-mode';
import {firstValueFrom, startWith} from 'rxjs';
import {AgencyGraphic} from './graphic-mode';
import {RoomHandler} from './roomHandler';
import {Quote} from './types';
import {TooltipHandler} from './tooltipHandler';
import {ActionHandler} from './actionHandler';
import { ObjectPanelHandler } from './objectPanelHandler';

/** A source of truth for the entire game. */
export interface GameMode<ContainerType extends SVGElement | HTMLElement> {
  state: GameState;
  roomHandler: RoomHandler<ContainerType>;
  tooltipHandler: TooltipHandler;
  actionHandler: ActionHandler;
  inventoryHandler: InventoryHandler;
  objectPanelHandler: ObjectPanelHandler;
  // TODO: other global handlers go here.
  isGraphic(): boolean;
  debug(...data: any[]): void;
  getContainer(): ContainerType;
  play(): Promise<void>;
  print(text: Quote, system?: boolean, format?: boolean): Promise<void>;
  onBodyClick(): Promise<void>;
}

export type AnyGameMode = GameMode<any>;

export class Agency {
  private readonly gameState = new GameState();

  private textMode?: GameMode<HTMLElement>;
  private graphicMode?: GameMode<SVGElement>;

  constructor() {
    this.gameState.start();
  }

  async playText() {
    console.log('play text mode!');
    await loadStyles(
      'textmode',
      new URL('../styles/textmode.scss', import.meta.url)
    );

    this.textMode = new AgencyText(this.gameState);
    await this.textMode.play();
  }

  // async playGraphic() {
  //   console.log('play graphic mode!');
  //   await loadStyles('graphicmode', new URL('../styles/graphicmode.scss', import.meta.url));
  //   this.graphicMode = new AgencyGraphic(this.gameState);
  //   this.graphicMode.play();
  //   if (await firstValueFrom(this.gameState.newGame$)) {
  //     await this.graphicMode.newGame();
  //   } else {
  //     // Resume a game.
  //   }
  // }
}

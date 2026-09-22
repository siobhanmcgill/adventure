import {GameMode} from '..';
import {ActionHandler} from '../actionHandler';
import {FIRST_ROOM} from '../constants';
import {GameState} from '../game-state';
import {InventoryHandler} from '../inventoryHandler';
import {getCharacter, getRoom} from '../lazyLoaders';
import {RoomHandler} from '../roomHandler';
import {TooltipHandler} from '../tooltipHandler';
import {Quote} from '../types';
import {showQuotePanel} from '../utils/svg_utils';
import {InputPanel} from '../panels/inputPanel';

export class AgencyGraphic implements GameMode<SVGElement> {
  private readonly svgElement: SVGSVGElement | null =
    document.querySelector('svg');

  readonly roomHandler: RoomHandler<SVGGElement>;
  readonly tooltipHandler: TooltipHandler;
  readonly actionHandler: ActionHandler;

  constructor(readonly state: GameState) {
    this.roomHandler = new RoomHandler(this);
    this.tooltipHandler = new TooltipHandler(this);
    this.actionHandler = new ActionHandler(this);
  }

  isGraphic(): boolean {
    return true;
  }

  async print(text: Quote) {
    await showQuotePanel(text, this);
  }

  getContainer(): SVGElement {
    return this.svgElement!;
  }

  async play(): Promise<void> {
    if (!this.getContainer()) {
      console.error("Unable to find SVG! The game shan't work!");
      return Promise.resolve();
    }
    const inventoryHandler = new InventoryHandler(this);

    // Debug controls.
    document
      .getElementById('reset-room-btn')
      ?.addEventListener('click', async () => {
        this.roomHandler.resetRoom();
      });

    document
      .getElementById('reset-save-btn')
      ?.addEventListener('click', async () => {
        window.localStorage.clear();
        window.location.reload();
      });

    document
      .getElementById('debug-btn')
      ?.addEventListener('click', async () => {
        document.body.classList.toggle('debug');
      });
  }

  async newGame(): Promise<void> {
    this.getContainer().classList.add('bg');
    const newGamePanel = new InputPanel(this, {
      prompt: 'This is your protagonist.',
      placeholderText: 'Give her a name',
    })
      .setArtwork((await getCharacter('protagonist'))!.styles.main.artwork)
      .onClick(async (name) => {
        this.state.setProtagonistName(name);
        this.state.setRoom((await getRoom(FIRST_ROOM))!);
        this.getContainer().classList.remove('bg');
        await newGamePanel.hide();
        this.state.markReady();
      });

    await newGamePanel.show();
  }
}

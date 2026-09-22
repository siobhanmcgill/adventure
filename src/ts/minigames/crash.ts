import {firstValueFrom, Subject} from 'rxjs';
import {GeneralPanel} from '../panels/generalPanel';
import {html, htmlToNode, loadStyles, query} from '../utils/utils';
import template from './crash.html?raw';
import {ObjectHandler} from '../objectHandler';
import {AnyGameMode} from '..';

type DieValues = 1 | 2 | 3 | 4 | 5 | 'c';
type PlayerDice = [
  DieValues,
  DieValues,
  DieValues,
  DieValues,
  DieValues,
  DieValues
];
type DiceLocks = [boolean, boolean, boolean, boolean, boolean, boolean];

export class Crash {
  private readonly gameFinishedSource = new Subject<void>();

  private readonly crashPanel: GeneralPanel;
  private readonly contents: HTMLElement = htmlToNode(template);

  private readonly els = {
    playerName: query('.player-name', this.contents),
    opponentName: query('.them-name', this.contents),
    playerValues: query('.you .values', this.contents),
    opponentValues: query('.them .values', this.contents),
  };

  private playerDice: PlayerDice = [1, 2, 3, 4, 5, 'c'];
  private playerLocks: DiceLocks = [false, false, false, false, false, false];

  private opponentDice: PlayerDice = [1, 2, 3, 4, 5, 'c'];
  private opponentLocks: DiceLocks = [false, false, false, false, false, false];

  constructor(private readonly game: AnyGameMode) {
    this.crashPanel = new GeneralPanel(this.game);
  }

  async start() {
    console.log('crash!');

    await loadStyles('crash', new URL('./crash.scss', import.meta.url));
    this.els.playerName.innerHTML = this.game.state.getProtagonistName();

    // Somehow the opponent will be set up.
    this.els.opponentName.innerHTML = `Other ${this.game.state.getProtagonistName()}`;

    this.renderDiceValues();

    const panelPromise = this.crashPanel.show({
      position: 'center',
      contents: this.contents.outerHTML,
      shade: true,
      noBodyClick: true,
      title: 'Crash!',
    });

    return panelPromise;
  }

  private renderDiceValues() {
    this.els.playerValues.innerHTML = '';
    this.els.opponentValues.innerHTML = '';
    for (let x = 0; x < 6; x++) {
      this.renderDie(x, 'you');
      this.renderDie(x, 'them');
    }
  }

  private renderDie(x: number, youOrThem: 'you' | 'them') {
    const playerValue =
      youOrThem === 'you' ? this.playerDice[x] : this.opponentDice[x];
    let dieContents: string = '';
    if (playerValue === 'c') {
      dieContents = '<i class="fa-solid fa-burst"></i>';
    } else {
      dieContents = `<i class="dievalue">${playerValue}</i>`;
    }
    const dieEl = htmlToNode(html`<span class="die">${dieContents}</span>`);
    (youOrThem === 'you'
      ? this.els.playerValues
      : this.els.opponentValues
    ).appendChild(dieEl);
  }
}

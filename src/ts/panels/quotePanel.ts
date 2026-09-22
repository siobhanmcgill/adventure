import {firstValueFrom} from 'rxjs';
import {AnyGameMode} from '..';
import {protagonist} from '../../../content/characters/protagonist';
import {REM} from '../constants';
import {Coord, Quote} from '../types';
import {createSvgElement, setSvgAttribute} from '../utils/svg_utils';
import {
  disectQuoteString,
  findMatchingKey,
  formatString,
  getVersionString,
  hideActionButtons,
  html,
  onBodyClick,
  showActionButtons,
  transitionToClass,
  typeEffect,
} from '../utils/utils';

/**
 * Handles showing a popup window with a character's spoken line inside it.
 * I'm avoiding calling it or the line "dialog(ue)" because it's an overloaded term.
 * But this is a dialog to show dialogue. There, are you happy?
 */
export class QuotePanel {
  private readonly svg: SVGElement;

  private readonly element = createSvgElement('g', 'panel-wrapper', {
    x: 0,
    y: 0,
  });

  private quoteData?: {
    characterId: string;
    effects: string[];
    quoteText: string;
    stateControls: string;
    speakerName: string;
  };
  private previousCharacterId?: string;
  private nextCharacterId?: string;

  constructor(private readonly game: AnyGameMode) {
    this.svg = this.game.getContainer();
  }

  async go(quote: Quote) {
    const remainingText = await this.parseQuote(quote);
    this.render();

    this.setupCharacterArtwork();

    hideActionButtons();

    await this.show();
    await this.game.onBodyClick();

    if (remainingText.length) {
      const nextLine = remainingText[0];
      const {characterId} = disectQuoteString(nextLine);
      this.nextCharacterId = characterId;
    } else {
      this.nextCharacterId = undefined;
    }

    await this.remove();
    if (remainingText.length) {
      this.previousCharacterId = this.quoteData?.characterId;
      await this.go(remainingText);
    }
    showActionButtons();
  }

  private async parseQuote(quote: Quote) {
    const roomData = await firstValueFrom(this.game.state.room$);
    const text = ([] as string[]).concat(quote);
    const thisText = text.shift() ?? '';

    const {characterId, effects, dialogText, stateControls} =
      disectQuoteString(thisText);

    let speakerName = '';
    if (characterId === 'protagonist') {
      speakerName = this.game.state.getProtagonistName();
    } else if (roomData.objects[characterId]) {
      const states = (
        await firstValueFrom(this.game.state.roomStates$)
      ).reverse();
      const key = findMatchingKey(
        roomData.objects[characterId],
        'name',
        states
      );
      speakerName = (roomData.objects[characterId][key] as string) ?? '';
    }

    this.quoteData = {
      characterId,
      effects,
      quoteText: formatString(dialogText, this.game.state),
      stateControls,
      speakerName,
    };
    return text;
  }

  private async setupCharacterArtwork() {
    const artworkElement: SVGSVGElement = this.getArtworkElement();
    if (this.quoteData && this.quoteData.characterId !== 'n') {
      // TODO: anchor the panel to the speaker.
      const anchor = this.svg.querySelector(
        `.character.${this.quoteData?.characterId ?? 'protagonist'}`
      ) as SVGElement;
      artworkElement.setAttribute('viewBox', '0 0 100 100');

      const newArtwork = anchor.cloneNode(true) as SVGGElement;
      setSvgAttribute(newArtwork, 'transform', '');

      if (this.quoteData.characterId === 'protagonist') {
        const pos = protagonist.styles.main.dialogImagePos ?? {x: 0, y: 0};
        const scale = protagonist.styles.main.dialogImageScale ?? 1;
        setSvgAttribute(
          newArtwork,
          'transform',
          `translate(${pos.x}, ${pos.y}) scale(-${scale}, ${scale})`
        );
      }
      // TODO: Figure out how to align and scale other characters here.

      artworkElement.appendChild(newArtwork);
    } else {
      // Otherwise it's the narrator probably.
    }
  }

  private getBgClass() {
    switch (this.quoteData?.characterId) {
      case 'protagonist':
        return 'red';
      default:
        return 'blue';
    }
  }

  private render() {
    if (this.quoteData) {
      this.element.innerHTML = html`
        <foreignObject
          class="quote-wrapper"
          width="100%"
          height="100%">
          <div class="quote panel ${this.getBgClass()}">
            <div class="panel-title">
              <h1>${getVersionString()}</h1>
            </div>
            <div class="panel-contents-wrapper">
              ${this.quoteData.characterId !== 'n'
                ? '<svg class="quote-artwork"></svg>'
                : ''}
              <div
                class="panel-contents ${this.quoteData.characterId === 'n'
                  ? 'narrator'
                  : ''}">
                <div class="name">${this.quoteData.speakerName ?? ''}</div>
                <div class="quote-text">${this.quoteData.quoteText}</div>

                <div class="click-hint">Click anywhere...</div>
              </div>
            </div>
          </div>
        </foreignObject>
      `;
    }
  }

  private getArtworkElement() {
    return this.element.querySelector('.quote-artwork') as SVGSVGElement;
  }

  private getPanel() {
    return this.element.querySelector('.panel')! as HTMLDivElement;
  }

  private getPanelContents() {
    return this.element.querySelector('.panel-contents')! as HTMLDivElement;
  }

  private async show() {
    const {x, y} = this.getCoords();

    this.svg.appendChild(this.element);
    const panel = this.element.querySelector('.quote-wrapper') as SVGElement;
    panel.setAttribute('x', String(x));
    panel.setAttribute('y', String(y));

    // If this is a new panel or a new character, it will animate.
    if (
      !this.previousCharacterId ||
      this.previousCharacterId !== this.quoteData?.characterId
    ) {
      this.getPanelContents().style.opacity = '0';

      await transitionToClass(this.getPanel(), 'show');

      this.getPanelContents().style.opacity = '1';
    } else {
      this.getPanel().classList.add('show');
    }

    if (
      this.quoteData?.characterId !== 'n' &&
      this.quoteData?.quoteText &&
      this.quoteData?.quoteText !== '...' &&
      this.quoteData.quoteText !== '<p>...</p>'
    ) {
      this.getArtworkElement()
        .querySelector('.character')
        ?.classList.add('talking');
    }

    await typeEffect(
      this.element.querySelector('.quote-text')!,
      this.quoteData?.effects?.includes('slow')
    );

    if (this.quoteData?.characterId !== 'n') {
      // Delay stopping the talking animation just so it looks smoother.
      setTimeout(() => {
        this.getArtworkElement()
          .querySelector('.character')
          ?.classList.remove('talking');
      }, 500);
    }

    return this;
  }

  private async remove() {
    if (
      !this.nextCharacterId ||
      this.nextCharacterId !== this.quoteData?.characterId
    ) {
      await transitionToClass(this.getPanel(), '-show');
    }

    this.element.remove();
  }

  private getCoords(): Coord {
    // if (!this.anchor) {
    //   return {x: REM, y: REM};
    // }
    return {x: REM, y: REM};
  }
}

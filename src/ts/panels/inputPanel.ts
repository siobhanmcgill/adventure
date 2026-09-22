import {AnyGameMode} from '..';
import {SvgSource} from '../types';
import {
  createSvgElement,
  getViewBox,
  loadSvgString,
} from '../utils/svg_utils';
import {
  getVersionString,
  html,
  promiseWait,
  transitionToClass,
} from '../utils/utils';

type InputHandler = (value: string) => Promise<void>;

export class InputPanel {
  private readonly svg: SVGElement;

  private readonly element = createSvgElement('g', 'panel-wrapper', {
    x: 0,
    y: 0,
  });

  constructor(
    private readonly game: AnyGameMode,
    {
      prompt,
      placeholderText,
    }: {
      prompt: string;
      placeholderText?: string;
    }
  ) {
    this.svg = this.game.getContainer();

    this.element.innerHTML = html`
      <foreignObject
        class="input-wrapper"
        width="100%"
        height="100%">
        <div class="input to-be-removed-when-done">
          <div class="panel">
            <div class="panel-title">
              <h1>${getVersionString()}</h1>
            </div>
            <div class="panel-contents-wrapper">
              <div class="panel-contents">
                <svg class="panel-artwork"></svg>
                <p>${prompt}</p>
                <input
                  name="${(placeholderText ?? prompt).replaceAll(' ', '_')}"
                  placeholder="${placeholderText ?? ''}" />
              </div>
            </div>
            <div class="panel-actions">
              <div class="panel-actions-border">
                <button>Go!</button>
              </div>
            </div>
          </div>
        </div>
      </foreignObject>
    `;
  }

  setArtwork(artwork: SvgSource) {
    const artworkSvg = this.element.querySelector('svg') as SVGSVGElement;
    artworkSvg.setAttribute(
      'viewBox',
      getViewBox(artwork.dimensions, artwork.offset)
    );
    loadSvgString(artwork.url, artwork.layerId).then((artworkString) => {
      artworkSvg.innerHTML = artworkString;
    });

    return this;
  }

  onClick(handler: InputHandler) {
    const inputElement = this.element.querySelector('input')!;
    inputElement.addEventListener('keypress', async (event) => {
      if (event.key === 'Enter') {
        await this.handleEvent(inputElement, handler);
      }
    });

    const button = this.element.querySelector('button')!;
    button.addEventListener('click', async () => {
      await this.handleEvent(inputElement, handler);
    });

    return this;
  }

  private getPanel() {
    return this.element.querySelector('.panel')! as HTMLDivElement;
  }

  async show() {
    this.svg.appendChild(this.element);

    await transitionToClass(this.getPanel(), 'show');

    return this;
  }

  async hide() {
    await transitionToClass(
      this.element.querySelector('.to-be-removed-when-done')!,
      'remove-me'
    );
    await promiseWait(500);
    this.element?.remove();
  }

  private async handleEvent(input: HTMLInputElement, handler: InputHandler) {
    const inputText = input.value;
    if (!inputText) {
      return;
    }
    await handler(inputText);
  }
}

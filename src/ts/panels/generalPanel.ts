import {AnyGameMode} from '..';
import {Coord} from '../types';
import {
  getVersionString,
  html,
  htmlToNode,
  promiseWait,
  query,
  transitionToClass,
} from '../utils/utils';

export interface PanelOptions {
  // Where to put this panel - random will put it somewhere random (imagine that)
  position?: 'center' | 'random';
  // If coord is set, position is ignored.
  coord?: Coord;
  // CSS class(es) to add to the panel.
  className?: string;
  // This can be a raw string or HTML
  contents?: string;
  // If true, clicking anywhere will not close this panel
  // you better have another way to close it.
  noBodyClick?: boolean;
  // Show buttons with the given text labels
  options?: Array<{text: string; value: unknown}>;
  // Slightly fade out the background so the panel is emphasized.
  shade?: boolean;
  title?: string;
  showCloseButton?: boolean;
}

/** A popup window to show whatever. */
export class GeneralPanel {
  private readonly container: HTMLElement = query('.overlays');

  private panelElement?: HTMLElement;

  constructor(private readonly game: AnyGameMode) {}

  async show(inputConfig: string | PanelOptions) {
    if (this.panelElement) {
      this.literallyRemove();
    }

    return new Promise(async (resolve, reject) => {
      const config: PanelOptions =
        typeof inputConfig === 'string' ? {contents: inputConfig} : inputConfig;

      if (!(config as PanelOptions).contents) {
        console.error(
          'Hey you cannot show a panel with nothing in it! Supply contents.'
        );
        reject();
        return;
      }

      this.panelElement = this.createPanelElement(config);
      this.createOptionButtons(resolve, config);
      this.container.appendChild(this.panelElement);

      if (config.shade) {
        this.container.classList.add('shade');
      }

      await this.literallyShow(config);

      this.panelElement.addEventListener('click', (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        e.preventDefault();
      });

      if (config.showCloseButton) {
        query('button.close-panel', this.panelElement).addEventListener(
          'click',
          (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.close(resolve, false);
          }
        );
      }

      if (!config.noBodyClick) {
        await this.game.onBodyClick();

        this.close(resolve, false);
      }
    });
  }

  close(resolve?: (value: unknown) => void, value?: unknown) {
    if (resolve) {
      resolve(value);
    }
    this.container.classList.remove('shade');
    this.literallyRemove();
  }

  private async literallyShow(config: PanelOptions) {
    // TODO: Custom position or alignment.
    if (!this.panelElement) {
      return;
    }

    if (!config.position || config.position === 'center') {
      this.panelElement.classList.add('center');
    } else if (config.position === 'random') {
      const {width, height} = this.panelElement.getBoundingClientRect();
      const left = Math.random() * (window.innerWidth - (width + 24));
      const top = Math.random() * (window.innerHeight - (height + 24));

      this.panelElement.style.left = left + 'px';
      this.panelElement.style.top = top + 'px';
    }
    await promiseWait(1);

    if (config.options?.length) {
      query<HTMLElement>('.panel-button', this.panelElement).focus();
    }

    this.panelElement.classList.add('show');
  }

  private async literallyRemove() {
    if (!this.panelElement) {
      return;
    }
    const panel = this.panelElement;
    await transitionToClass(panel, '-show');
    panel.remove();
  }

  private createPanelElement(config: PanelOptions = {}): HTMLElement {
    let panelHtml = html`
      <div class="panel general-panel ${config.className ?? ''}">
        <div class="panel-title">
          <h1>${config.title ?? getVersionString()}</h1>
        </div>
        <div class="panel-contents-wrapper">
          <div class="panel-contents">
            ${config.contents?.startsWith('<')
              ? config.contents
              : html`<p>${config.contents ?? ''}</p>`}
          </div>
        </div>
        ${config.showCloseButton || config.className?.includes('computer')
          ? html`<button class="red close-panel">x</button>`
          : ''}
      </div>
    `;

    if (config.className?.includes('computer')) {
      panelHtml = html`<div class="popup-computer-screen">
        ${panelHtml}
        <div class="computer-icon"></div>
      </div>`;
    }

    return htmlToNode(panelHtml);
  }

  private createOptionButtons(
    resolve: (value: unknown) => void,
    config: PanelOptions
  ) {
    if (!this.panelElement) {
      return;
    }
    if (config.options?.length) {
      const buttonWrapper: HTMLElement = htmlToNode(
        html`<div class="panel-actions"></div>`
      );
      for (const option of config.options) {
        const button: HTMLButtonElement = htmlToNode(
          html`<button class="panel-button">${option.text}</button>`
        );
        button.addEventListener('click', (e) => {
          this.close(resolve, option.value);
          e.stopPropagation();
          e.preventDefault();
        });
        buttonWrapper.appendChild(button);
      }
      query('.panel-contents', this.panelElement).appendChild(buttonWrapper);
    }
  }
}

import {AnyGameMode} from '.';
import {Coord} from './types';
import {htmlToNode, query, html} from './utils/utils';

/** A singleton which shows different tooltip text when you mouseover something that has a tooltip. */
export class TooltipHandler {
  private readonly screen = query('.screen')!;
  private readonly overlay = query('.overlays')!;
  private readonly tooltip = htmlToNode(html`<div class="tooltip"></div>`);
  private timer?: number;

  constructor(private readonly game: AnyGameMode) {
    this.overlay.appendChild(this.tooltip);
  }

  private setPosition(coord: Coord) {
    this.tooltip.style.transform = `translate(${coord.x}px, ${coord.y}px)`;
  }

  private setText(text: string) {
    this.tooltip.textContent = text;
  }

  private clearTimer() {
    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = undefined;
    }
  }

  private show() {
    this.tooltip.classList.add('show');
  }

  private hide() {
    this.timer = window.setTimeout(() => {
      this.tooltip.classList.remove('show');
      this.timer = window.setTimeout(() => {
        this.setPosition({x: -9999, y: 0});
        this.setText('');
      }, 500);
    }, 100);
  }

  registerTarget(target: HTMLElement, text: string) {
    target.addEventListener('mousemove', (e: MouseEvent) => {
      this.clearTimer();
      const {clientX: x, clientY: y} = e;
      this.setText(text);
      this.setPosition({x, y});
    });
    target.addEventListener('mouseenter', (e: MouseEvent) => {
      this.clearTimer();
      this.setText(text);

      const {clientX: x, clientY: y} = e;

      this.setPosition({x, y});
      this.show();
    });
    target.addEventListener('mouseout', () => {
      this.hide();
    });
    return {
      setText: (newText: string) => {
        text = newText;
      },
    };
  }
}

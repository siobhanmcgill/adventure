import {GameState} from './state';
import {Quote} from './types';
import {formatString, onBodyClick, typeEffect} from './utils';

export function getSvg(): SVGElement {
  return document.querySelector('svg')!;
}

export function emptySvgElement(element: SVGElement) {
  element.textContent = '';
}

const UNSAFE_SVG_ATTRIBUTES = ['href', 'xlink:href'];

export function setSvgAttribute(
    svg: SVGElement,
    attr: string,
    value: string,
    ): void {
  const attrLower = attr.toLowerCase();
  if (UNSAFE_SVG_ATTRIBUTES.indexOf(attrLower) !== -1 ||
      attrLower.indexOf('on') === 0) {
    let msg = '';
    throw new Error(msg);
  }

  svg.setAttribute(attr, value);
}

interface SvgAttributes {
  text?: string;
  d?: string;
  [index: string]: unknown;
  x?: number;
  y?: number;
  width?: number|'100%';
  height?: number|'100%';
  transform?: string;
}

/** Generate an SVG Element. */
export function createSvgElement(
    name: string,
    className?: string,
    attributes?: SvgAttributes,
    ): SVGElement {
  const el = document.createElementNS('http://www.w3.org/2000/svg', name);
  if (className) {
    el.classList.add(...className.split(' '));
  }
  if (attributes) {
    for (const key of Object.keys(attributes)) {
      if (key === 'text') {
        el.textContent = String(attributes[key]);
      } else {
        setSvgAttribute(el, key, String(attributes[key]));
      }
    }
  }
  return el;
}

export function injectHtmlFromTemplate(
    templateSelector: string, attributes?: SvgAttributes) {
  const htmlObject =
      document.querySelector(`.templates > ${templateSelector}`)!.cloneNode(
          true) as HTMLDivElement;

  return injectHtml(htmlObject, templateSelector.replace('.', ''), attributes);
}

export function injectHtml(
    htmlObject: HTMLElement, className: string, attributes?: SvgAttributes) {
  const container =
      createSvgElement('foreignObject', `${className}-container`, attributes) as
      SVGForeignObjectElement;
  container.appendChild(htmlObject);
  getSvg().appendChild(container);
  return {container, htmlObject};
}

export async function printDialog(
    quote: Quote, state: GameState): Promise<void> {
  const text = ([] as string[]).concat(quote);
  const {container, htmlObject} =
      injectHtmlFromTemplate('.quote', {x: 50, y: 20, width: 500, height: 500});
  const thisText = text.shift() ?? '';

  const matcher = /^(([a-z-_]+):)?({([a-z-_, ]+)})?(.*)/i;
  const [, , characterId, , effects, dialogText] =
      thisText.match(matcher) ?? [];

  htmlObject.innerHTML = formatString(dialogText ?? thisText, state);
  await typeEffect(htmlObject, effects?.includes('slow'));
  await onBodyClick(true);
  container.remove();
  if (text.length) {
    return printDialog(text, state);
  }
}

export async function loadSvgString(
    fromUrl: URL, useId?: string): Promise<string> {
  const artwork =
      (await (await fetch(fromUrl)).text()).replace(/display: inline;?/gi, '');
  return extractIdFromSvg(artwork, useId);
}

export function extractIdFromSvg(fullSvg: string, idToGrab?: string): string {
  const placeholder = document.createElement('div');
  placeholder.classList.add('placeholder');
  placeholder.innerHTML = fullSvg;
  document.body.appendChild(placeholder);
  const sodipodi = placeholder.querySelector(CSS.escape('sodipodi:namedview'));
  if (sodipodi) {
    sodipodi.remove();
  }
  const clipPaths = placeholder.querySelectorAll('clipPath use');
  for (const clipPath of clipPaths) {
    const useId = clipPath.getAttribute('xlink:href')?.replace('#', '');
    if (useId) {
      const wrong = document.getElementById(useId);
      if (wrong?.tagName === 'g') {
        const right = wrong.childNodes[1] as SVGElement;
        if (right) {
          const rightId = right.getAttribute('id');
          if (rightId) {
            clipPath.setAttribute('xlink:href', `#${rightId}`);
          }
        }
      }
    }
  }
  const placeholderSvg = placeholder.querySelector('svg');
  if (!placeholderSvg) {
    // Something went horribly wrong.
    return '';
  }

  let html: string;
  if (idToGrab) {
    html = placeholderSvg.getElementById(idToGrab).outerHTML;
  } else {
    html = placeholderSvg.innerHTML;
  }

  placeholder.remove();

  return html;
}

const TOOLTIP_WIDTH = 500;
const TOOLTIP_HEIGHT = 40;

// TODO: Positions are wrong when the SVG is smaller than 1024x768
function setPosition(container: SVGElement, x: number, y: number) {
  const {left: svgX, top: svgY} =
      getSvg().querySelector('.room')!.getBoundingClientRect();
  setSvgAttribute(container, 'x', String(x - (svgX + (TOOLTIP_WIDTH / 2))));
  setSvgAttribute(container, 'y', String(y - (svgY + (TOOLTIP_HEIGHT + 10))));
}

export function tooltip(target: SVGElement) {
  let container: SVGForeignObjectElement|undefined;
  let timer: number|undefined;
  let text = '';
  target.addEventListener('mousemove', (e: MouseEvent) => {
    if (timer) {
      window.clearTimeout(timer);
      timer = undefined;
    }
    const {clientX: x, clientY: y} = e;
    if (container) {
      container.querySelector('.tooltip')!.textContent = text;
      setPosition(container, x, y);
    }
  });
  target.addEventListener('mouseenter', (e: MouseEvent) => {
    if (timer) {
      window.clearTimeout(timer);
      timer = undefined;
    }
    if (!container) {
      const tooltip = document.createElement('div');
      tooltip.classList.add('tooltip');
      container = injectHtml(tooltip, 'tooltip', {
                    width: TOOLTIP_WIDTH,
                    height: TOOLTIP_HEIGHT
                  }).container;
    }
    container.querySelector('.tooltip')!.textContent = text;
    container.classList.add('show');

    const {clientX: x, clientY: y} = e;

    setPosition(container, x, y);
  });
  target.addEventListener('mouseout', () => {
    timer = window.setTimeout(() => {
      if (container) {
        container.classList.remove('show');
      }
    }, 100);
  });
  return {
    setText: (newText: string) => {
      text = newText;
    }
  }
}

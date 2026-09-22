import {AnyGameMode} from '..';
import {GameState} from '../game-state';
import {QuotePanel} from '../panels/quotePanel';
import {ConvoResponseOption, Coord, Quote} from '../types';

export function emptySvgElement(element: SVGElement) {
  element.textContent = '';
}

const UNSAFE_SVG_ATTRIBUTES = ['href', 'xlink:href'];

export function setSvgAttribute(
  element: SVGElement,
  attr: string,
  value: string
): void {
  const attrLower = attr.toLowerCase();
  if (
    UNSAFE_SVG_ATTRIBUTES.indexOf(attrLower) !== -1 ||
    attrLower.indexOf('on') === 0
  ) {
    throw new Error("Don't do that.");
  }

  element.setAttribute(attr, value);
}

interface SvgAttributes {
  text?: string;
  d?: string;
  [index: string]: unknown;
  x?: number;
  y?: number;
  width?: number | '100%';
  height?: number | '100%';
  transform?: string;
}

/** Generate an SVG Element. */
export function createSvgElement(
  name: string,
  className?: string,
  attributes?: SvgAttributes
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
  parentSvg: SVGElement,
  templateSelector: string,
  attributes?: SvgAttributes
) {
  const htmlObject = document
    .querySelector(`.templates > ${templateSelector}`)!
    .cloneNode(true) as HTMLDivElement;

  return injectHtml({
    parentSvg,
    htmlObject,
    className: templateSelector.replace('.', ''),
    attributes,
  });
}

export function injectHtml({
  parentSvg,
  htmlObject,
  className,
  attributes,
}: {
  parentSvg: SVGElement;
  htmlObject: HTMLElement;
  className: string;
  attributes?: SvgAttributes;
}) {
  const container = createSvgElement(
    'foreignObject',
    `${className}-container`,
    attributes
  ) as SVGForeignObjectElement;
  container.appendChild(htmlObject);
  parentSvg.appendChild(container);
  return {container, htmlObject};
}

// TODO: Positions are wrong when the SVG is smaller than 1024x768
// TODO: Rename this to `getPositionInRoom`
export function getPosition(
  element: SVGElement | DOMRect,
  within: SVGElement
): DOMRect {
  let {left, top, width, height} =
    element instanceof DOMRect ? element : element.getBoundingClientRect();
  const {left: svgX, top: svgY} = within
    .querySelector('.room')!
    .getBoundingClientRect();
  return new DOMRect(left - svgX, top - svgY, width, height);
}

// TODO: Rename this to 'setPositionInRoom'
function setPosition(container: SVGElement, coord: Coord, within: SVGElement) {
  const {left: svgX, top: svgY} = within
    .querySelector('.room')!
    .getBoundingClientRect();
  setSvgAttribute(container, 'x', String(coord.x - (svgX + TOOLTIP_WIDTH / 2)));
  setSvgAttribute(
    container,
    'y',
    String(coord.y - (svgY + (TOOLTIP_HEIGHT + 10)))
  );
}

// Show a popup with some sort of ingame speech text.
// If the quote is an array, Popups will continue for
// each element until the quote array is exhausted.
export async function showQuotePanel(
  quote: Quote,
  game: AnyGameMode
): Promise<void> {
  await new QuotePanel(game).go(quote);
}

export async function printResponseOptions(
  responses: ConvoResponseOption[],
  state: GameState,
  onSelect: (response: ConvoResponseOption) => Promise<void>
): Promise<HTMLElement[]> {
  // TODO
  return Promise.resolve([]);
}

export async function loadSvgString(
  fromUrl: URL,
  useId?: string
): Promise<string> {
  const artwork = (await (await fetch(fromUrl)).text()).replace(
    /display: inline;?/gi,
    ''
  );
  return cleanupSvg(artwork, useId);
}

export function getViewBox(
  dimensions: Coord = {x: 1024, y: 768},
  xy: Coord = {x: 0, y: 0}
) {
  return `${xy.x} ${xy.y} ${dimensions.x} ${dimensions.y}`;
}

/**
 * Processes SVG created by an external tool to make it more HTML friendly.
 * Then optionally pull a specific element from it using its ID.
 */
export function cleanupSvg(fullSvg: string, idToGrab?: string): string {
  const placeholder = document.createElement('div');
  placeholder.classList.add('placeholder');
  placeholder.innerHTML = fullSvg.replace(/display\:inline;?/gi, '');
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
        const right = wrong.querySelector('*') as SVGElement;
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

  let elementToGrab: SVGElement;
  if (idToGrab) {
    elementToGrab = placeholderSvg.getElementById(idToGrab) as SVGElement;
  } else {
    elementToGrab = placeholderSvg;
  }
  // If the layer was hidden in an image editor, make sure it's showing here.
  const style = elementToGrab.getAttribute('style');
  elementToGrab.setAttribute(
    'style',
    (style ?? '').replace(/display:\s?none/, '')
  );
  const html = idToGrab ? elementToGrab.outerHTML : elementToGrab.innerHTML;

  placeholder.remove();

  return html;
}

const TOOLTIP_WIDTH = 500;
const TOOLTIP_HEIGHT = 40;

export function tooltip(target: SVGElement, parentSvg: SVGElement) {
  let container: SVGForeignObjectElement | undefined;
  let timer: number | undefined;
  let text = '';
  target.addEventListener('mousemove', (e: MouseEvent) => {
    if (timer) {
      window.clearTimeout(timer);
      timer = undefined;
    }
    const {clientX: x, clientY: y} = e;
    if (container) {
      container.querySelector('.tooltip')!.textContent = text;
      setPosition(container, {x, y}, parentSvg);
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
      container = injectHtml({
        parentSvg,
        htmlObject: tooltip,
        className: 'tooltip',
        attributes: {
          width: TOOLTIP_WIDTH,
          height: TOOLTIP_HEIGHT,
        },
      }).container;
    }
    container.querySelector('.tooltip')!.textContent = text;
    container.classList.add('show');

    const {clientX: x, clientY: y} = e;

    setPosition(container, {x, y}, parentSvg);
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
    },
  };
}

export function createSVGPoint({x, y}: Coord, svg: SVGElement) {
  const point = (svg as SVGSVGElement).createSVGPoint();
  point.x = x;
  point.y = y;
  return point;
}

export function isPointWithinPath(
  coord: Coord,
  parentSvg: SVGElement,
  path?: SVGPathElement
): Boolean {
  if (!path) {
    return false;
  }
  const point = createSVGPoint(coord, parentSvg);
  return path.isPointInFill(point);
}

export function drawLine({
  coords,
  insertAfter,
  append,
}: {
  coords: Coord[];
  insertAfter?: SVGElement;
  append?: SVGElement;
}) {
  const d = coords
    .map((coord, i) => {
      if (i === 0) {
        return `M ${coord.x}, ${coord.y}`;
      }
      return `L ${coord.x}, ${coord.y}`;
    })
    .join(' ');
  const line = createSvgElement('path', 'path-target-line', {
    d,
  }) as SVGPathElement;
  if (insertAfter) {
    insertAfter.after(line);
  } else if (append) {
    append.append(line);
  }
  return line;
}

export function getDistance(
  coords: Coord[],
  insertAfter?: SVGElement,
  append?: SVGElement
) {
  const line = drawLine({coords, insertAfter, append});
  const len = line.getTotalLength();
  return {length: len, line};
}

export function getDist(
  coords: Coord[],
  insertAfter?: SVGElement,
  append?: SVGElement
) {
  const {length, line} = getDistance(coords, insertAfter, append);
  line.remove();
  return length;
}

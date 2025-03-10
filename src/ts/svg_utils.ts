import {onBodyClick, parseMarkdown} from './utils';

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
    templateClass: string, attributes?: SvgAttributes) {
  const htmlObject =
      document.querySelector(`.templates > ${templateClass}`)!.cloneNode(
          true) as HTMLDivElement;
  const container = createSvgElement(
      'foreignObject', `${templateClass.replace('.', '')}-container`,
      attributes);
  container.appendChild(htmlObject);
  getSvg().appendChild(container);
  return {container, htmlObject};
}

export function printDialog(text: string[]) {
  const {container, htmlObject} =
      injectHtmlFromTemplate('.quote', {x: 50, y: 20, width: 500, height: 500});
  htmlObject.innerHTML = parseMarkdown(text.shift() ?? '');

  onBodyClick(() => {
    container.remove();
    if (text.length) {
      printDialog(text);
    }
  }, true);
}

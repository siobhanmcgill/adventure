export function getSvg(): SVGElement {
  return document.querySelector('svg');
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

/** Generate an SVG Element. */
export function createSvgElement(
    name: string,
    className?: string,
    attributes?: {
      text?: string;
      d?: string; [index: string]: unknown;
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      transform?: string;
    },
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

export function printDialog(text: string) {
  const dialogPane = document.querySelector('body > .dialog-pane')!.cloneNode();
  dialogPane.textContent = text;

  const container = createSvgElement('foreignObject', 'dialog-container', {
    x: 50, y: 20, width: 500, height: 500
  });
  container.appendChild(dialogPane);
  getSvg().appendChild(container);

}
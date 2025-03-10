import {createSvgElement, getSvg} from './svg_utils';

export function tooltip(target: SVGElement, text: string) {
  target.addEventListener('mousemove', (e: MouseEvent) => {
    const {offsetX, offsetY} = e;
  });
  target.addEventListener(
      'mouseover',
      (e: MouseEvent) => {

      });
  target.addEventListener('mouseout', () => {});
}

export function onBodyClick(callback: (() => void), capture = false) {
  const eventHandler = (event: MouseEvent) => {
    callback();
    if (capture) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  setTimeout(() => {
    getSvg().addEventListener('click', eventHandler, {capture, once: true});
  });
}

export function parseMarkdown(input: string): string {
  let output = input.replace(/_(.+)_/, '<em>$1</em>')

  return output;
}
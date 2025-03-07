import {createSvgElement} from './svg_utils';

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
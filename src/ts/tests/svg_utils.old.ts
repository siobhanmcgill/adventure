import {describe, expect, test} from 'vitest';
import {emptySvgElement, setSvgAttribute} from '../../utils/svg_utils';

/** Tests for all of the SVG Util methods. */
describe('emptySvgElement', () => {
  test('clears everything', () => {
    const svg: SVGSVGElement = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'svg'
    );
    svg.innerHTML = '<rect width="10" height="10"></rect>';
    emptySvgElement(svg);
    expect(svg.innerHTML).toBe('');
  });
});

describe('setSvgAttribute', () => {
  test('sets an attribute', () => {
    const svg: SVGSVGElement = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'svg'
    );
    svg.innerHTML = '<rect width="10" height="10"></rect>';
    setSvgAttribute(svg.querySelector<SVGElement>('rect')!, 'r', '10');
    expect(svg.innerHTML).toBe('<rect width="10" height="10" r="10"></rect>');
  });
});

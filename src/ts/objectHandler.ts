import {LOOK_FALLBACK} from './constants';
import {RoomHandler} from './roomHandler';
import {printDialog} from './svg_utils';
import {RoomObject} from './types';

export class ObjectHandler {
  constructor(
      readonly id: string, private readonly roomHandler: RoomHandler,
      private readonly svgElement: SVGGElement,
      private readonly data: RoomObject) {
    this.svgElement.classList.add('room-object');

    this.svgElement.addEventListener('click', () => {
      
    });
  }
}
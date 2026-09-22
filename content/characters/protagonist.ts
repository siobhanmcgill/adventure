import {Character} from '../../src/ts/types';

export const protagonist: Character = {
  id: 'protagonist',
  styles: {
    main: {
      artwork: {
        url: new URL('../artwork/protagonist_1.svg', import.meta.url),
        layerId: 'main',
        dimensions: {x: 182, y: 500},
        coords: {x: 265, y: 485},
        offset: {x: 194, y: 38},
      },
      // TODO: this is currently broken for some reason
      // styles: [new URL('../characters/protagonist.scss', import.meta.url)],
      speed: 300,
      animations: [
        'walk',
        'pickup',
        'interact',
        'shrug',
        'neckscratch',
        'toilet', // ;)
      ],
      dialogImagePos: {x: 331, y: -37},
      dialogImageScale: 1,
    },
  },
};

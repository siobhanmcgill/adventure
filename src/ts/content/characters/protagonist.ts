import {Character} from '../../types';

export const protagonist: Character = {
  main: {
    artwork: {
      url: new URL('../../../../artwork/protagonist_1.svg', import.meta.url),
      layerId: 'main',
      viewBox: '194 37 182 500',
      coords: {x: 214, y: 505}
    },
    styles: [new URL('./protagonist.scss', import.meta.url)]
  }
}
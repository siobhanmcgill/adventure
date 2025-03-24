import {Character} from '../../types';

export const protagonist: Character = {
  id: 'protagonist',
  styles: {
    main: {
      artwork: {
        url: new URL('../../../../artwork/protagonist_1.svg', import.meta.url),
        layerId: 'main',
        viewBox: '194 37 182 500',
        coords: {x: 265, y: 485}
      },
      styles: [new URL('./protagonist.scss', import.meta.url)],
      speed: 300,
      animations: [
        'walk',
        'pickup',
        'interact',
        'shrug',
        'neckscratch',
        'toilet' // ;)
      ]
    }
  }
}
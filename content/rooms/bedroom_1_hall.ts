import {Room} from '../../src/ts/types';

export const bedroom_1_hall: Room = {
  name: {default: 'Apartment Hallway'},
  roomId: 'bedroom_1_hall',
  init: {
    objects: ['home'],
    states: ['elevators_broken'],
    artwork: {
      url: new URL(`../artwork/apartment_hallway_1.svg`, import.meta.url),
      dimensions: {x: 3000, y: 768},
    },
    protagonistScale: [1, 1],
    styles: [],
  },
  states: {},
  enter: {
    bedroom_1: {
      text: [
        `{{p}} steps through the door, entering a long, well-lit #hallway#. It stretches in both directions. Behind her, the door tentatively slides closed, careful not to close on any errant clothes or appendages that might have been left in its path.`,
      ],
    },
    default: {
      coords: {x: 2644, y: 680},
      text: [
        `{{p}} stands in the #hallway# outside her apartment. It stretches in both directions.`,
      ],
    },
  },
  objects: {
    hallway: {
      aka: ['around'],
      look: {
        alias: ['walk'],
        text: [
          `{{p}} has seen a few hallways in her time, and there isn't anything terribly exciting about this one. Along the walls on each side are a series of #doors# leading to the other apartments on this floor. Outside one of the nondescript doors, a #hallway_guy:guy# is standing, leaning against the wall casually fiddling with a THC cartridge.`,
          `The circular architecture leads to the same cluster of #elevators# no matter which way {{p}} walks from her #home:room#. This area mainly serves as a passageway to take people from their personal rooms to the public atrium a few floors down.`,
        ],
      },
    },

    home: {
      aka: ['apartment'],
      interact: {
        alias: ['go'],
        loadRoom: 'bedroom_1',
      },
    },

    doors: {
      interact: `{{p}} cannot access any of the other rooms, so don't bother trying. Don't worry, though - they are all identical to the one {{p}} was in earlier.`,
      look: {queue: [`p::Those are definitely doors.`, `p::Yep, still doors.`]},
    },

    hallway_guy: {
      name: 'Hallway guy',
      'name.player_is_mean': 'Casanova',
      'name.met_hallway_guy': 'Wilbeany',
      'name.player_is_double_mean': 'Horndog',
      talk: {dialog: '1_hallway_guy'},
    },
  },
};

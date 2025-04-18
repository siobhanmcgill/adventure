import { Room } from '../../types';

export const bedroom_1_hall: Room = {
  roomId: 'bedroom_1_hall',
  init: {
    states: [],
    artwork: {
      url: new URL(''),
      viewBox: '',
    },
    protagonistScale: 1,
    styles: [],
  },
  states: {},
  enter: {
    bedroom_1: { coords: { x: 0, y: 0 } },
  },
  objects: {
    hallway_guy: {
      name: 'Hallway guy',
      'name.met-hallway-guy': 'Dowb',
      talk: { dialog: 'hallway_guy' },
    },
  },

  dialogs: {
    hallway_guy: {
      default: [
        "{wave}Hi, I'm {{pp}} and I'm a fixer.",
        'me::Oh, are you here about my toilet?',
        'Um.',
        'No.',
        'Not that kind of fixer...',
        'me::{sigh}Oh.',
        "me::Oh yeah, you're the girl who just moved in down the hall.",
        "That's me.",
        "me::I'm Dowb. It's nice to meet you.::+met-hallway-guy",
        "me::Welcome to the building",
        "Thanks.",
        "me::Most people who move in here are either down on their luck, a criminal, or both.",
        "me::Which are you?",
        {
          responses: [
            {text: "I'm trying to get my life back together.", goto: '2-down-on-luck'},
            {text: "I'm ready to make my own way in the world.", goto: '2-criminal'},
            {text: "I guess I haven't decided yet.", goto: '2-both'}
          ]
        },
      ],
      '2-down-on-luck': [
        "me::Down on your luck, then.",
        "I don't know, I'm feeling pretty lucky.",
        "me::Oh yeah?",
        "Yep.",
        "I was recently 'streamlined' from the Dynagistics Corporate Management Division.",
        "I'm officially over my divorce.",
        "These are my only pants.",
        "me::Wow. Sounds pretty lucky alright."
      ],
      '2-criminal': [
        "me::A criminal, then.",
        "I mean, if a criminal is whoever defies the megacorps, then I suppose I am."
      ],
      '2-both': [
        "me::So, both, then.",
        "Now hold on a minute.",
        "...",
        "...",
        "{slow}...",
        "me::I'm holding . . .",
        "{neckscratch}I guess I have no comeback.",
        "me::I mean, no judgements here."
      ]

      //   "Actually, I'm trying to get my life back together.",
      //   "me::Down on your luck, then.",
      //   "I don't know, I'm feeling pretty lucky, all things considered.",
      //   "me::Oh yeah?",
      //   "Yeah.",
      //   {
      //     responses: [
      //       {text: "I'm getting my business off the ground."},
      //       {text: "I'm officially over my divorce."},
      //       {text: "I'm "}
      //     ]
      //   }

      //   // "I'm getting my business off the ground.",
      //   // "me::Nice.",
      //   // "me::Is {{pp}} Industries gonna be the next big megacorp?",
        
      // ],
    },
  },
};

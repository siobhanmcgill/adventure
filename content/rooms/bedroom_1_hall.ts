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
      talk: {dialog: 'hallway_guy'},
    },
  },

  convos: {
    hallway_guy: {
      default: [
        "{wave}Hi, I'm {{pp}} and I'm a fixer.",
        'me::Oh.',
        'me::Are you here about my toilet?',
        'Um.',
        'No.',
        'Not that kind of fixer...',
        'me::{sigh}Oh.',
        "me::Oh yeah, you're the girl who just moved in down the hall.",
        "That's me.",
        "me::I'm Wilbeany. It's nice to meet you.::+met_hallway_guy",
        'me::Welcome to the building',
        'Thanks.',
        'me::Most people who move in here are either down on their luck, a criminal, or both.',
        'me::So which are you?',
        {
          goto: '1-answers',
        },
      ],
      'default.met_hallway_guy': [
        'Hello again.',
        'me::What were you saying?',
        {
          goto: '1-answers',
        },
      ],
      'default.player_is_mean': [
        "Hey, I'm sorry I said that.",
        "me::It's okay",
        "It's been a long week.",
        'me::I get it.',
        'So anyway, what was your question?',
        'me::Um, I think I was just wondering what your deal was.',
        {
          goto: '1-answers',
        },
      ],
      '1-answers': [
        {
          responses: [
            {
              text: "Actually I'm just here temporarily.",
              goto: '2-down-on-luck',
            },
            {
              text: "Actually I'm starting my own business.",
              goto: '2-criminal',
            },
            {
              text: "Actually, I guess I haven't decided yet.",
              goto: '2-both',
            },
            {
              ifNotState: 'player_is_mean',
              text: "Slow your roll, Casanova, I'm not interested.",
              goto: '2-okay',
              action: {
                addState: 'player_is_mean',
                addTag: 'rejected_hallway_guy',
              },
            },
            {
              ifState: 'player_is_mean',
              text: "Cool your jets, Horndog, I'm still not interested.",
              goto: '2-okay-alt',
              action: {
                addState: 'player_is_double_mean',
                addTag: 'rejected_hallway_guy',
              },
            },
          ],
        },
      ],
      '2-down-on-luck': [
        'me::Yeah, we all say that.',
        "me::I've been saying that for over a year.",
        "Well I'm feeling pretty lucky.",
        'me::Oh yeah?',
        'Yep.',
        'I lost my job in the Dynagistics Corporate Management Division.',
        'me::Oh hey, they fired me, too!',
        "I'm officially over my divorce.",
        'me::Congratulations?',
        "If I don't make any money today I may be homeless soon.",
        "me::That's true of most of the folks here.",
        'Oh, and these are my only pants.',
        'me::Wow. Sounds pretty lucky alright.',
        "Well, see, now I'm free to do whatever I want.",
        "me::And what's that?",
        {goto: '1-answers'},
      ],
      '2-criminal': [
        'me::Criminal, it is.',
        "Oh I'd be a terrible criminal. I'm too nice.",
        'me::Yeah, walking up to a stranger and telling him your full name kind of gave that away.',
        'My business is totally legitimate',
        'me::So you have no plans to nuke the Dynagistics headquarters?',
        'No.',
        'Wait, what? No!',
        "me:: I mean, I've never fantasized about that. What?",
        'What?',
        'me::What?',
        'You got something against Dynagistics Corporation?',
        'me::You bet I do. They fired me about six months ago.',
        'Oh hey, they fired me too, a few weeks ago.',
        'me::Unemployment buddies?',
        "I'm self employed now.",
        "me::Oh right, 'totally legit.'",
        "That's right.",
        "me::If you can't beat 'em, join 'em, eh?",
        'me::So what is this business of yours?',
        {goto: '3-business'},
      ],
      '2-down-on-luck>2-criminal': [
        "me::And what's _that_?",
        "What's a business?",
        "me::{sigh}I know what a _business_ is, I mean what's _your_ business?",
        {goto: '3-business'},
      ],
      '2-both': [
        'me::So, down on your luck _and_ a criminal, then.',
        'Now hold on a minute.',
        '...',
        '...',
        '{slow}...',
        "me::I'm holding . . .",
        '{neckscratch}I guess I have no comeback.',
        'me::I mean, no judgements here.',
        'me::You gotta be honest with yourself first.',
        "I guess I am still used to working for a corp. Without a set of 'Direxpectations' I am just lost.",
        "me::'Direxpectations?' You worked for Dynagistics?",
      ],

      '2-okay': [
        'me::Weirdly hostile, but okay. I hear you.',
        "me::I guess I'll stay out of your way, then.",
      ],
      '2-okay-alt': [
        'me::Wow.',
        "Sorry, I couldn't resist.",
        'me::Is this all just a joke to you?',
        {
          responses: [
            {
              text: 'Yes',
              goto: '9-yes',
            },
            {text: 'No', goto: '9-no'},
            {
              text: 'Sort of.',
              goto: '9-sort-of',
            },
            {
              text: 'The only joke is your face, slick.',
              goto: '9-joke-is-face',
              action: {
                addState: 'player_is_triple_mean',
                addTag: 'rejected_hallway_guy',
              },
            },
          ],
        },
      ],

      '3-business': [],

      '9-yes': [],
      '9-no': [],
      '9-joke-is-face': [],
    },
  },
};

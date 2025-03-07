import {Room, RoomList} from '../../types';

export const bedroom_1: Room = {
  roomId: 'bedroom_1',
  init: {'states': ['alarm_on', 'computer_has_messages', 'no_pants']},
  states: {
    'alarm_on': {
      'idle': ['I should turn my alarm off.', 'I better click on that alarm.']
    },
    'picture_turned_down': {},
    'took_pills': {},
    'no_pants': {}
  },
  enter: {
    'default': 'Home, sweet temporary home.',
    'alarm_on': 'Ugh, my throat hurts. It\'s another day, I guess.',
  },
  objects: {
    'clock': {
      'name{alarm_on}': 'Clock (beeping)',
      'look{alarm_on}': 'Yep, it sure is beeping.',
      'talk{alarm_on}': 'Shut up.',
      'name': 'Clock (not beeping)',
      'look': 'It\'s a clock. It woke me up. I hate it.',
      'use{alarm_on}':
          {'quote': 'Okay, okay, I\'m up.', 'removeState': 'alarm_on'},
      'use': 'It\'s ready to go off again tomorrow. I can\'t wait.',
      'talk': 'Hey clock, I hate you.',
      'pickup':
          'As much as I\'d love to throw that thing out the window, I better leave it there so I can go through this again tomorrow.'
    },
    'bed': {'look': 'It\'s a bed. It\'s as uncomfortable as it is empty.'},
    'picture': {
      'look': 'It\'s a picture of my ex-wife. She looks happy.',
      'pickup':
          'I prefer to leave the past in the past. which is why I keep that next to my bed.',
      'use': {'addState': 'picture_turned_down'}
    },
    'picture_down': {
      'name': 'Picture (still there)',
      'look': '*sigh*',
      'use': {'removeState': 'picture_turned_down'}
    },
    'computer': {
      'look': 'It\'s a computer, for when I need to compute.',
      'pickup': [
        'Yeah, sure, I\'ll just pop an entire computer in my pocket.',
        'What a concept.'
      ],
      'use': {
        'queue': [{'popup': 'intro_computer_1'}, {'popup': 'intro_computer_2'}],
        'onQueueFinish': {
          'quote': 'I really gotta find more work.',
          'removeState': 'computer_has_messages'
        }
      }
    },
    'pills': {
      'look': 'My favorite little blue pills.',
      'use': 'I can\'t really take them without water.',
      'pickup': {'quote': 'Come here, darling.', 'addItem': 'pill'},
      'talk': 'I\'m not crazy enough to talk to my pills just yet.'
    },
    'mirror': {
      'look': 'Still getting used to this face. Who is she?',
      'use':
          'I keep looking and expecting to see the old me. Maybe I\'m still dreaming.',
      'pickup': ['I mean, I\'m vain, but am I that vain?', '', 'I guess not.']
    },
    'window': {
      'look': 'I can see air cars wizzing past.',
      'use':
          'It won\'t budge. The wind would be way too high from up here anyway.',
      'pickup': 'Um, no, I can\'t pick up a window.',
      'talk': 'Hello, world.'
    },
    'capsules': {
      'name': 'TCH Capsules',
      'look': [
        'They\'re all empty. I guess I\'m going to have to start feeling my feelings.',
        '', 'Yeah, I better go to Cade\'s today and get some more.'
      ],
      'pickup': {
        'quote': 'I guess I might as well clean up after myself.',
        'addItem': 'empty_thc_capsule'
      }
    },
    'sink': {
      'look':
          'I have a room with a sink in it, so that shows you where my life is right now.',
      'use': 'I can\'t splash water on my face without it getting everywhere.',
      'use#cup': {
        'animation': 'protagonist-fillCup',
        'removeItem': 'cup',
        'addItem': 'cup_of_water'
      }
    },
    'cup': {'look': 'It\'s a plastiglass cup.', 'pickup': {'addItem': 'cup'}},
    'door': {
      'look':
          'A medium security door, which means someone could probably hack it in fifteen seconds.',
      'use{no_pants}':
          'This isn\'t that kind of game. I should put some pants on first.',
      'use': 'I _would_, but this room is all that currently exists.'
    },
    'pants': {
      'look': [
        'It\'s my pants.', 'I mean, _they are_ my pants.',
        'Why are pants plural?'
      ],
      'use': 'How is one supposed to _use_ pants, exactly?',
      'talk': 'Hey pants, guess what? You get to touch my butt.',
      'pickup': {'addItem': 'pants'}
    },
    'sweater': {
      'look': 'It\'s a sweater, for when I need to sweat.',
      'pickup': {'addItem': 'sweater'},
      'use': 'It\'s dirty, and whats more it\'s not really my style today.'
    },
    'hamper': {
      'look': 'It\'s a hamper, for when I need to hamp.',
      'use#sweater':
          {'quote': 'I feel tidier already.', 'removeItem': 'sweater'},
      'use#pants': [
        'I\'ve only worn these a few days in a row, so they\'re still good.',
        '', 'Also they\'re my only pants right now.'
      ],
      'use#empty_thc_capsule': 'That\'s for clothes, not trash, silly.',
      'use#cup_of_water': 'I don\'t have to, there\'s a machine down the hall.'
    },
    'jacket': {
      'look':
          'My badass jacket. It makes me look cool, but my claim that it makes me look cool nullifies that.'
    },
    'chair': {
      'look': 'I know a chair when I see one.',
      'use': 'Nobody animated me sitting down yet.'
    }
  },
  artwork: `
  <g
     inkscape:label="room"
     inkscape:groupmode="layer"
     id="layer1"
     style="display:inline">
    <path
       style="fill:#0b005c;fill-opacity:1;stroke:#000000;opacity:1"
       d="M 2.5084831,765.64206 131.02725,578.31873 h 757.5235 l 134.56145,189.30151 z"
       id="floor" />
    <path
       style="display:inline;opacity:1;fill:#e1d1d1;fill-opacity:1;stroke:#000000"
       d="m 131.29938,577.81983 757.60026,2.27822 V 41.52778 L 130.40623,41.22425 Z"
       id="path8933" />
    <path
       style="opacity:1;fill:#e7d9d9;fill-opacity:1;stroke:#000000"
       d="M 0.81290202,768.81343 1.1443428,-0.00348885 131.3552,41.049808 V 580.21318 Z"
       id="path3093" />
    <path
       style="opacity:1;fill:#a67272;fill-opacity:1;stroke:#000000"
       d="M 132.05995,40.857921 888.788,41.25565 1022.5679,1.5909155 H 0.49541668 Z"
       id="path8011" />
    <path
       style="opacity:1;fill:#e1d1d1;fill-opacity:1;stroke:#000000"
       d="M 888.89615,41.751067 V 579.66417 L 1023.6421,766.89039 1022.9657,1.1931867 Z"
       id="path8391"
       sodipodi:nodetypes="ccccc" />
  </g>
  <g
     inkscape:groupmode="layer"
     id="bed"
     inkscape:label="bed">
    <path
       style="opacity:1;fill:#c8eae7;fill-opacity:1;stroke:#000000"
       d="m 759.05176,695.59887 -79.46861,-117.15169 1.78391,-103.58415 205.9706,4.72816 86.67518,101.25196 1.78391,116.45341 z"
       id="path8939"
       sodipodi:nodetypes="ccccccc"
       inkscape:label="hover" />
    <path
       style="opacity:1;fill:#e1d1d1;fill-opacity:0;stroke:#000000"
       d="M 974.47382,581.62873 765.17405,578.06364 681.36568,476.49798"
       id="path8941"
       sodipodi:nodetypes="ccc" />
    <path
       style="display:inline;opacity:1;fill:#e1d1d1;fill-opacity:1;stroke:#000000"
       d="M 766.35082,579.53659 759.21791,696.3746"
       id="path8943"
       sodipodi:nodetypes="cc" />
  </g>
  <g
     inkscape:groupmode="layer"
     id="layer4"
     inkscape:label="nightstand">
    <path
       style="opacity:1;fill:#ecf2c0;fill-opacity:1;stroke:#000000"
       d="m 570.94666,577.98634 2.16529,-146.65939 h 106.97458 l 30.3472,30.34721 -4.33389,162.30385 -107.02675,-0.0455 z"
       id="path9324"
       sodipodi:nodetypes="ccccccc" />
    <path
       style="opacity:1;fill:#ecf2c0;fill-opacity:1;stroke:#000000"
       d="m 574.61074,433.41929 26.28518,29.08296 109.43171,-0.90436"
       id="path10562"
       sodipodi:nodetypes="ccc" />
    <path
       style="opacity:1;fill:#ecf2c0;fill-opacity:1;stroke:#000000"
       d="m 601.33496,463.3598 -2.0439,160.12844"
       id="path10564"
       sodipodi:nodetypes="cc" />
  </g>
  <g
     inkscape:groupmode="layer"
     id="clock"
     inkscape:label="clock">
    <path
       style="opacity:1;fill:#283b28;fill-opacity:1;stroke:#000000"
       d="m 626.39835,431.67263 v -35.31215 h 44.19764 l 11.31108,8.58476 -0.85887,37.73905 -44.79123,-0.85887 z"
       id="path10567" />
    <path
       style="opacity:1;fill:#283b28;fill-opacity:1;stroke:#000000"
       d="m 625.46594,395.87458 12.69131,10.30118 42.73861,-0.85756"
       id="path10623" />
    <path
       style="opacity:1;fill:#283b28;fill-opacity:1;stroke:#000000"
       d="m 637.4494,406.54872 -0.74461,34.49006"
       id="path10625" />
    <text
       xml:space="preserve"
       style="opacity:1;fill:#61f300;fill-opacity:1;stroke:#000000;stroke-opacity:0"
       x="644.1991"
       y="418.7478"
       id="text10681"><tspan
         sodipodi:role="line"
         x="644.1991"
         y="418.7478"
         id="tspan10683">08:00</tspan></text>
  </g>
  `
};
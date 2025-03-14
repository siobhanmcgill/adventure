import {PopupList, Room, RoomList} from '../../types';

export const bedroom_1: Room = {
  roomId: 'bedroom_1',
  init: {
    'states': ['alarm_on', 'computer_has_messages', 'no_pants'],
    artwork: {
      url: new URL(`../../../../artwork/bedroom_1.svg`, import.meta.url),
      viewBox: '0 0 1024 768',
    },
    protagonistScale: 0.95,
    styles: [new URL('./bedroom_1.scss', import.meta.url)]
  },
  states: {
    'alarm_on': {
      'idle': ['I should turn my alarm off.', 'I better click on that alarm.']
    },
    'picture_turned_down': {},
    'took_pills': {},
    'no_pants': {}
  },
  enter: {
    'hallway_1': {quote: 'Home, sweet temporary home.', coords: {x: 0, y: 0}},
    'default': {
      quote: 'Okay, first day in the rest of my life. Here we go.',
      coords: {x: 650, y: 670},
    },
  },
  objects: {
    'clock': {
      'name.alarm_on': 'Clock (beeping)',
      'look.alarm_on': 'Yep, it sure is beeping.',
      'talk.alarm_on': 'Shut up.',
      'name': 'Clock (not beeping)',
      'look': 'It\'s a clock. It woke me up. I hate it.',
      'use.alarm_on':
          {'quote': 'Okay, okay, I\'m up.', 'removeState': 'alarm_on'},
      'use': 'It\'s ready to go off again tomorrow. I can\'t wait.',
      'talk': 'Hey clock, I hate you.',
      'pickup':
          'As much as I\'d love to throw that thing out the window, I better leave it there so I can go through this again tomorrow.'
    },
    'bed': {
      'look': 'It\'s a bed. It\'s as uncomfortable as it is empty.',
      'use.alarm_on': 'Not with the alarm blaring like that.',
      'use': 'I wish I could, but I really need to find some work.',
      'talk': [
        'Yep, just me standing here alone talking to an empty bed.',
        'I\'m doing great.'
      ]
    },
    'picture': {
      'look': 'It\'s a picture of my ex-wife. She looks happy.',
      'pickup':
          'I prefer to leave the past in the past. which is why I keep that next to my bed.',
      'use': {'addState': 'picture_turned_down'},
      'talk': 'She doesn\'t want to hear from me.'
    },
    'picture_down': {
      'name': 'Picture (still there)',
      'look': '*sigh*',
      'use': {'removeState': 'picture_turned_down'},
      'talk': ['I\'m over it.', '', '{slow}Clearly.'],
    },
    'computer': {
      'look': 'It\'s a computer, for when I need to compute.',
      'pickup': [
        'Yeah, sure, I\'ll just pop an entire computer in my pocket.',
        'What a concept.'
      ],
      'use': {
        'queue': [
          {'popup': 'intro_computer_1'}, {'popup': 'intro_computer_2'},
          {'popup': 'intro_computer_3'}
        ],
        'onQueueFinish': {
          'quote': 'I really gotta find more work.',
          'removeState': 'computer_has_messages'
        }
      },
      'talk': 'Hello, computer.'
    },
    'pills': {
      'look': 'My favorite little blue pills.',
      'use{pill-picked-up}': 'I already have one.',
      'use': 'I should try the "Pick up" action on them.',
      'pickup{pill-picked-up}': 'I already have one.',
      'pickup': {
        'quote': 'Come here, darling.',
        'addItem': 'pill',
      },
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
    'cross': {
      'look': 'It was my mom\'s. I don\'t really put much stock in it.',
      'use': 'I forgot the Lord\'s prayer a long time ago.',
      'talk': 'Uh, "Hail Satan," I guess.',
      'pickup': 'People are going to think I\'m some kind of religious nut.'
    },
    'capsules': {
      'name': 'TCH Capsules',
      'look': [
        'They\'re all empty. I guess I\'m going to have to start feeling my feelings.',
        '...', 'Yeah, I better go to Cade\'s today and get some more.'
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
  popups: {
    'intro_computer_1': {
      'quote': 'There\'s a message from my last client.',
      'popupStyle': 'computer',
      'text': `
{{p}}: 
tahnks again! Bitsy is happy and so snuggly.

She missed me. 
-Sam
`,
      'quoteAfter': [
        'I watched her cat for a week.', 'Hey, work is work.',
        'I think I have more messages.'
      ]
    },
    'intro_computer_2': {
      'quote': 'There\'s a message from my comlink provider.',
      'popupStyle': 'computer',
      'text': `
Dear Eric Jenkuns,

Your request to update the primary billing owner on your account has been processed. 

If you requested this change, no further action is required. However, if this wasn't you, you should probably call us to get it sorted out, unless someone has stolen your comlink account in which case you probably cannot call us. In that event, please respond to this message with the name and address of your identity thief, and we will update our records for the new owner of your identity. 

Have a nice day, and thank you for trusting CyberCom for your comlink needs. 

Sincerely, 
Deedo Quandary
Sales Associate, CyberCom. 

_P.S. have you tried our new Max Plus Deluxe and Max Plus Deluxe Mini comlinks? The digital clarity will blow you away!_
`,
      'quoteAfter': [
        'I guess I\'ll need to get a new burner comlink.',
        'Not that anybody\'s gonna call me.'
      ]
    },
    'intro_computer_3': {
      'quote': 'There\'s a message from my ex.',
      'popupStyle': 'computer',
      'text': `
{{p}}: 
Hey, just checking in to see if you sent in that form to update the comlink yet? It's been a few days. I hope you're doing okay.
-Jace
`
    }
  }
};
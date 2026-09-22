import {firstValueFrom} from 'rxjs';
import {PROTAGONIST_MESSAGE_READER_APP} from '../../src/ts/constants';
import {ACTION_MAP} from '../../src/ts/objectHandler';
import {GeneralPanel} from '../../src/ts/panels/generalPanel';
import {Action, Quote, Room} from '../../src/ts/types';
import {whatIs} from '../../src/ts/utils/utils';
import {bedroom_1_hall} from './bedroom_1_hall';

const ALARM_OFF_TEXT: Quote = [
  `{{pp}} wakes up and turns off her obnoxious #clock:alarm#.`,
  `p::Okay, okay, I'm up.`,
  `p::Now I can hear myself think.`,
  `{nowait}She pulls herself out of -`,
  `p::Just give me a second.`,
  `{nowait,type, slow} . . .`,
  `{delay,nowait,type}{{p}} pulls her lazy butt out of #bed#.`,
  `{{p}} misses the large comfy bed of her old home, but that isn't her home anymore. This is her home now: a tiny little studio #apartment# on one of the upper floors of a massive megabuilding.`,
  // `_(Items underlined like that are things {{p}} can potentially interact with. She can generally LOOK, USE, PICK UP, or TALK to things, but you can also try anything and see what happens.)_`,
  `p::First day in the rest of my life, here I come.`,
  // `p::How about 'GO BACK TO BED?' Can you try typing that?`,
];

const COMPUTER_LOOK_TEXT: Quote = [
  "p::It's a computer, for when I need to compute.",
  `Her personal computer is a perfect example of modern industrial design. You'd be hard pressed to find any right angles or straight lines anywhere on the thing. It's all bulbous curves and circular gagues. It's made of the same shiny white plastic that seems to make up most of the consumer goods in the whole city - somehow translucent and milky-opaque at the same time. The machine is well-specced, a holdover from the days when she cared about raw floating point capabilities.`,
];

export const bedroom_1: Room = {
  roomId: 'bedroom_1',
  name: {default: `{{p}}'s apartment`},
  init: {
    states: ['computer_has_messages', 'no_pants'],
    objects: ['clock', 'bed', 'apartment'],
    //artwork, protagonistScale, and styles are ignored in text mode:
    artwork: {
      url: new URL(`../artwork/bedroom_1.svg`, import.meta.url),
      dimensions: {x: 1024, y: 768},
    },
    protagonistScale: [1.4, 1],
    styles: [new URL('./bedroom_1.scss', import.meta.url)],
  },
  states: {
    alarm_on: {
      // When the alarm is on, all she can see and hear are beeps.
      actionFilter: (game, attemptedAction, verb, noun, on) => {
        // Go ahead with the action if it's to turn the ding dang alarm off.
        if (
          (noun === 'clock' || on === 'clock') &&
          (verb.includes('interact') ||
            ACTION_MAP.get('interact')?.find((synonym) =>
              verb.includes(synonym)
            ))
        ) {
          return Promise.resolve(attemptedAction);
        }

        let text: Quote = [];
        if (whatIs(attemptedAction) === 'action') {
          text = ([] as string[]).concat(
            (attemptedAction as Action).quote ?? ''
          );
        } else {
          text = ([] as string[]).concat(attemptedAction as Quote);
        }
        return Promise.resolve(
          text[0]
            .split(' ')
            .map(() => '**BEEP**')
            .join(' ')
        );
      },
      objectNameFilter: (id: string) => {
        if (id === 'clock') {
          return Promise.resolve('**BEEP**');
        }
        return Promise.resolve('beep');
      },
      onApply: (game) => {
        const beepPanel = new GeneralPanel(game);
        beepPanel.show({
          contents: 'beep',
          position: 'random',
          noBodyClick: true,
        });
        const timerval = window.setInterval(() => {
          beepPanel.show({
            contents: 'beep',
            position: 'random',
            noBodyClick: true,
          });
        }, 800);
        return {timerval, beepPanel};
      },
      onRemove: (_, fromApply: {timerval: number; beepPanel: GeneralPanel}) => {
        window.clearTimeout(fromApply.timerval as number);
        fromApply.beepPanel.close();
      },
    },
    picture_turned_down: {},
    took_pills: {},
    no_pants: {},
  },
  enter: {
    bedroom_1_hall: {
      text: [
        `{{p}} returns to their room. The door gently slides closed behind them.`,
      ],
      quote: 'Home, sweet, hopefully temporary home.',
      coords: {x: 0, y: 0},
    },
    default: {
      text: [
        `::-alarm_on,-alarm_off`,
        `{{p}} dreamt she was at work.`,
        `She was her old self, back in her old office. She had her professional costume on - the one that once felt so normal. She had since left normal behind, but her subconscious was still catching up.`,
        `She was wandering the maze of workspace pods searching for the breakroom. The Dynagistics office floor she used to work on was huge and meandering, but her dreamscape had expanded it to something corporate and otherworldly. Curved white pods stretched out to the horizon, an endless sea of work addicts clicking and clacking away on reports.`,
        `She was one of them, once. In the dream space, she still was. Life was simpler then. She just had to keep her head down, drink her coffee, and cross off the day. She needed coffee. Capitalism can't be that bad if it gives her coffee. The breakroom was just beyond the next stretch of workpods.`,
        `She held a mug in her hand. The mug was white and smooth, like everything around her. Smooth curved pods in a smooth curved world. Coffee was just up ahead, in its own smooth egg-shaped machine.`,
        `Then should could get back to work. Capitalism needed her. It _called_ to her.`,
        `{nowait}She twisted and turned, wandering the non-euclidian geometry of the corporate office floor. Any moment now. Coffee was just up ahead. Coffee was **beep**.::+alarm_on`,
        `{nowait,delay2}Not even the dream of capitalism could sleep through that #clock:alarm#. The dream disperses like smoke as she wakes up. Her awareness slowly withdraws itself from the corporate hororscape and returns to the vaguely painful reality of, well, reality.`,
        `{delay2,type}The beeping will continue until you tell her to TURN OFF the ALARM.`,
      ],

      quote: [
        'n::{{p}} wakes up in a small bedroom, eager to start a new day.',
        `**BEEP** **BEEP** **BEEP**`,
        `n::Perhaps more accurately, {{p}} wakes up in a small bedroom, _marginally capable_ of starting a new day.`,
        `**BEEP** **BEEP**`,
        `**BEEP** **BEEP** **BEEP**`,
        'n::...',
        `n::Obviously, her first task is to find and ~~destroy~~ turn off her alarm.`,
      ],
      coords: {x: 695, y: 640},
      // To test pathfinding:
      // coords: {x: 310, y: 602}
    },
    'default.alarm_off': {
      text: `{{p}} is standing in her small #apartment#.`,
      coords: {x: 695, y: 640},
    },
  },

  objects: {
    clock: {
      aka: ['alarm'],
      'interact.alarm_on': {
        text: ALARM_OFF_TEXT,
        quote: [
          `That's better.`,
          `Now I can hear myself think.`,
          `First day in the rest of my life, here I come.`,
        ],
        removeState: 'alarm_on',
        addState: 'alarm_off',
      },
      icon: 'fa-clock',
      name: 'Stupid Clock',
      look: `p::It's a clock. It woke me up. It has big numbers on it. I hate it.`,
      interact:
        "p::Oh, don't worry. It's ready to go off again tomorrow. I can't wait.",
      talk: 'p::Hey clock, I hate you.',
      pickup:
        "p::As much as I'd love to pick that thing up and throw it out the window, I better leave it there so I can go through this again tomorrow.",
    },
    apartment: {
      name: 'Tiny Apartment',
      aka: ['around', 'room'],
      icon: 'fa-house',
      look: [
        `{{p}} scans the extent of her domain.`,
        `One benefit - if she were inclined to seek out a silver lining - is that no matter where she stands in the room, pretty much all of her belongings are within arm's reach. The word 'room' is more colloquial than descriptive here. Of the things she can see, 'room' is hardly present.`,
        `The space means well, though. The room is a perfect example of modern interior design (as of a decade ago). It's efficient and thoughtful, and despite its small size the careful attention to detail actually makes it surprisingly liveable. It follows the design cues of most of the city, all curves and shiny bright plastics. Not all of that shiny modernity has aged as well as the designers probably intended, though. Just above her bed, built into the wall, was once a working fishtank. Now it's a long-neglected, dark, empty cavity in the wall. Years have left their mark on all the once shiny surfaces. The white plastic is scratched and scuffed and smudged. The design avoided hard corners in which grime can collect, but grime always finds a way.`,
        `The whole apartment is barely as wide than her small #bed# is long. There is just enough room for a small #hamper# at the foot of her bed where her feet stick off the end when she sleeps. A #television:ViewCast screen# hangs from the ceiling in the corner, so she can watch commercials from anywhere in the room.`,
        `Her bed is connected to a slick white wall covered in panels hiding away storage and utility cabinets. The wall curves organically at waist height providing a small #shelf# to store a few personal items. A #desk# protrudes from the center of the wall, and then the plastic organically curves outward for a small but usable #sink#.`,
        `The sliding, electronic #door# is recessed into the wall opposite the self-dimming #window# recessed into the wall over her bed. A pile of #clothes# are strewn on the floor.`,
      ],
      pickup: `p::My apartment may be tiny, but it's not _that_ tiny.`,
      interact: `p::If I stretch my arms out I can almost touch all four walls at once.`,
      talk: `p::It's you and me against the world, new home.`,
    },
    bed: {
      name: 'Bed',
      icon: 'fa-bed',
      look: [
        "p::It's a bed. It's as uncomfortable as it is empty.",
        `To belabor the point, the bed is a barely adequate slab that takes up about half of the entire space of her room. It is built into a sliding mechanism so it can hide away into the wall when not in use. At least, that's the idea. Years of being carelessly closed on pillows and loose blankets by prior tenants has left the mechanism about as tired as those who try to sleep on the sagging foam mattress.`,
      ],
      interact: {
        alias: ['lie down', 'sleep', 'lie down on', 'lie on'],
        quote:
          'p::I appreciate that. I really do. However, if I lay back down the narrator will probably yell at me.',
      },
      talk: [
        'p::Yep, just me standing here alone talking to an empty bed.',
        "{delay}p::I'm doing great.",
      ],
    },
    television: {
      name: 'ViewCast screen',
      aka: ['viewcast', 'screen', 'tv'],
      look: "p::It's a ViewVast. VC has been so bad ever since they cancelled my favorite show.",
      interact: {
        // can also type 'watch tv'
        alias: ['watch'],
        quote: "p::I promise there's nothing good on.",
      },
      pickup: "p::It's mounted to the wall, so, no.",
      talk: [
        'p::Talk to the VC? Who am I, my mom?',
        'p::Oh wait, maybe I _am_, now.',
        `p::That's kind of a haunting thought . . .`,
      ],
    },

    clothes: {
      name: 'Pile of clothes',
      icon: 'fa-socks',
      look: {
        custom: async (game) => {
          const states = await firstValueFrom(game.state.roomStates$);
          const quotes = [
            `As if in defiance of the cramped space, or perhaps just taking advantage of her newfound solo living, {{p}} has strewn what clothes she has on what floor space she has. The clothes piled on the floor are somehow different than the clothes tossed in her #hamper#, in a way known only to her.`,
            `p::Mine is a very sophisticated mind, organizationally.`,
          ];
          const pantsPickedUp = states.includes('pants-picked-up');
          const sweaterPickedUp = states.includes('sweater-picked-up');
          if (!pantsPickedUp) {
            const pantsLine = `Among assorted less immediately relevant articles, her single pair of #pants:cute pants# lie on top of the pile${
              !sweaterPickedUp
                ? ', just underneath her favorite #sweater:puffy sweater#.'
                : '.'
            }`;
            quotes.push(
              pantsLine,
              `p::Great, now they know I don't have any pants on.`,
              `Indeed, {{pp}} slept in her underwear. Her long, slender gams are on display.`
            );
          } else if (!sweaterPickedUp) {
            quotes.push(
              `Among assorted less immediately relevant articles, her favorite #sweater:puffy sweater# stands out on top of the pile.`
            );
          }

          await game.print(quotes);
        },
      },
      pickup: `p::I don't think I can grab it all at once.`,
      talk: `p::I find that my old clothes aren't the most exciting conversationalists.`,
      interact: {
        alias: ['put', 'wear', 'don'],
        quote: 'p::With which thing, specifically?',
      },
    },
    pants: {
      icon: 'fa-socks',
      look: [
        "p::It's my pants.",
        'p::I mean, _they are_ my pants.',
        `p::Why are 'pants' plural?`,
      ],
      'look#inventory': `Straightforward black pants. Well, straight downward black pants. They fit perfectly over {{p}}'s gams.`,
      interact: {
        alias: ['put', 'don', 'wear'],
        addState: 'pants-picked-up',
        removeState: 'no_pants',
        animation: 'protagonist-putOnPants',
        text: [
          '{nowait}{{p}} pulls her favorite black pants over her long, slender gams-',
          'p::Would you quit talking about my gams?',
          `Ahem. She pulls on her favorite black pants. There's no need to mention over which body parts the pants go. She could be wearing them on her arms for all you know.`,
        ],
      },
      talk: 'p::Hey pants, guess what? You get to touch my butt.',
      pickup: {
        addItem: 'pants',
        text: [
          `{{p}} picks up her pants. She puts them in her inventory.`,
          `p::Don't worry about how that works.`,
        ],
      },
      'pickup.pants-picked-up': 'p::I already have them.',
    },
    sweater: {
      icon: 'fa-shirt',
      name: 'Cute sweater',
      look: "p::It's a sweater, for when I need to sweat.",
      pickup: {addItem: 'sweater', text: `{{p}} picks up her sweater.`},
      interact: {
        alias: ['put', 'don', 'wear'],
        quote:
          "p::It's too hot, and most importantly it's not really my style today. I want people to think I'm cool, not cute.",
      },
    },

    hamper: {
      look: "p::It's a hamper, for when I need to hamp.",
      interact: `p::That only makes sense if I have something to put in there.`,
      pickup: "p::It isn't laundry day today.",
      talk: "p::Hey laundry, I'm totally going to _do_ you later.",
      'interact#sweater': {
        alias: ['put'],
        removeItem: 'sweater',
        addState: 'sweater-in-hamper',
        quoteAfterAnimation: 'I feel tidier already.',
      },
      'interact#pants': [
        "I've only worn these a few days in a row, so they're still good.",
        '{delay}Also they might be my only pants right now.',
      ],
      'interact#empty_thc_capsules': "That's for clothes, not trash, silly.",
      'interact#cup_of_water':
        "I don't have to. There's a laundry machine down the hall.",
    },

    sink: {
      icon: 'fa-sink',
      look: [
        'p::I live in a room with a sink in it, so that shows you where my life is right now.',
        `The sink is a rounded bowl sculpted from the same material as the wall. The area around the slender faucet is just large enough to store a single, transparent #cup# and a small bottle of #pills#. Above the sink is a simple vanity #mirror#, and below it is a hatch which can slide out, revealing a perfectly functional #toilet#`,
      ],
      interact:
        'p::I can never splash water on my face without it getting everywhere.',
      'interact#cup': {
        alias: ['fill'],
        animation: 'protagonist-fillCup',
        removeItem: 'cup',
        addItem: 'cup_of_water',
      },
    },
    cup: {
      icon: 'fa-glass-water',
      aka: ['water'],
      look: "It's a cup made of space-age plastiglass polymer. It's as durable as it is capable of holding a small volume of liquid.",
      pickup: {addItem: 'cup', text: '{{p}} picks up the cup.'},
      interact: {
        alias: ['drink'],
        queue: [
          `{{p}} does that thing where she turns the cup upside-down to show that not even a single drop of water falls out of it.`,
          `p::The cup is empty.`,
        ],
      },
      talk: [
        'p::If I stick my mouth inside it, I sound like a robot.',
        'p::Beep. Boop. I am a robot.',
        'p::Heh.',
      ],
    },
    // Inventory item, from using the cup on the sink
    cup_of_water: {
      icon: 'fa-glass-water-droplet',
      aka: ['water', 'cup'],
      name: 'Cup full of water',
      look: "It's a glass of water. Looks really refreshing.",
      // artwork: {
      //   url: MAIN_INVENTORY_ART,
      //   layerId: 'cup-of-water',
      //   dimensions: {x: 150, y: 150},
      // },
      interact: {
        alias: ['drink'],
        quote: 'p::Down the hatch.',
        animation: 'protagonist-drink',
        quoteAfterAnimation: `p::I feel more hydrated already. You can't even taste the reclamation system.`,
        removeItem: 'cup_of_water',
        addItem: 'cup',
        addTag: 'drank-water',
      },
    },

    pills: {
      icon: 'fa-prescription-bottle',
      aka: ['bottle'],
      look: 'p::My favorite little blue pills.',
      'interact.singlepill-picked-up': 'p::I already have one.',
      interact: `p::Try telling me to 'PICK UP the PILLS'`,
      'pickup.singlepill-picked-up': 'p::I already took one.',
      pickup: {
        quote: 'p::Come here, darling.',
        addItem: 'singlepill',
      },
      talk: "p::I'm not going to talk to my pills just yet.",
    },
    // Inventory item
    singlepill: {
      icon: 'fa-tablets',
      aka: ['pill'],
      name: 'A small blue pill',
      look: `{{p}} looks at the small, blue pill in her palm. It seems so innocuous, so inanimate. However, it means so very much.`,
      interact: {
        alias: ['take', 'swallow', 'eat'],
        text: `{{p}} slips the little blue pill under her tongue, performing her twice-daily ritual of reminding herself not to chew it.`,
        animation: 'protagonist-takePill',
        quoteAfterAnimation: 'I feel more feminized already.',
        addTag: 'feminized',
        removeItem: 'singlepill',
      },
    },

    mirror: {
      icon: 'fa-image-portrait',
      look: 'p::Still getting used to this face. Who is she?',
      interact:
        "p::I keep looking and expecting to see the old me. Maybe I'm still dreaming.",
      pickup: [
        "p::I mean, I'm vain, but am I that vain?",
        '{delay2}p::I guess not.',
      ],
      talk: {
        queue: [
          `p::I'm good enough, I'm smart enough . . .`,
          `p::Hey good lookin'`,
          `p::You lookin' at me?`,
        ],
      },
    },

    door: {
      icon: 'fa-door-open',
      look: [
        `p::It's a medium-security door, which means someone could probably hack it in fifteen seconds.`,
        `Next to the door hangs a small wooden #cross#.`,
      ],
      'interact.no_pants': {
        alias: ['open'],
        text: [
          `For a moment, {{p}} considers leaving her apartment without pants on, with those killer gams out and about for any old whoever to put their beady little eyes on.`,
          "p::This isn't that kind of game. I should put some pants on first.",
        ],
      },
      interact: {
        text: `The door slides open with a satisfying whoosh. {{p}} steps out into the hallway.`,
        alias: ['open'],
        animation: 'door-open',
        loadRoom: 'bedroom_1_hall',
      },
      pickup: "p::I can't. It's really jammed in there.",
    },

    shelf: {
      icon: 'fa-pallet',
      look: [
        `The small ledge contains some items {{p}} is very conflicted about emotionally, like that annoying #clock# and a framed #picture:photo#, within convenient reach of her bed. There are also a few #empty_thc_capsules:single-use THC capsules# that {{p}} has finished and should probably recycle.`,
      ],
    },

    picture: {
      icon: 'fa-id-badge',
      'name.picture_turned_down': 'picture (still there)',
      aka: ['photo'],
      look: "p::It's a picture of my ex-wife. She looks happy.",
      ['look.picture_turned_down']: 'p::**sigh**',
      pickup:
        'p::I prefer to leave the past in the past. which is why I keep that next to my bed.',
      interact: {
        text: '{{p}} symbolically turns the frame down so the photo inside is not quite as visible. Even though the picture is not visible, {{p}} is aware that it is still very _present_. The past is always present, but we can choose to leave it.',
        addState: 'picture_turned_down',
      },
      ['interact.picture_turned_down']: {
        text: `{{p}} turnes the photo back up, leaning the simple picture frame on it's little kickstand. Perhaps the past is inescapable after all.`,
        removeState: 'picture_turned_down',
      },
      talk: "p::She doesn't want to hear from me.",
      ['talk.picture_turned_down']: [
        `p::I'm over it.`,
        `{delay,slow}p::Clearly.`,
      ],
    },

    empty_thc_capsules: {
      icon: 'fa-vials',
      aka: ['capsule', 'drug'],
      name: 'THC Capsules',
      look: [
        'Once filled with perfectly harmless inhalable drugs, now they are just useless metal tubes.',
        "p::I guess I'm going to have to start feeling my feelings.",
        'p::{slow}...',
        "p::Yeah, I better go to Cade's today and get some more.",
      ],
      interact: {
        alias: ['smoke'],
        queue: [
          `p::They're empty. All it would do is make me look cool.`,
          [
            `{{p}} takes a performative drag from the empty capsule.`,
            'p::I feel cooler already.',
          ],
        ],
      },
      pickup: {
        quote: 'p::I guess I might as well clean up after myself.',
        addItem: 'empty_thc_capsules',
      },
    },

    desk: {
      icon: 'fa-pallet',
      look: [
        `A totally usable desk protrudes from the wall. {{p}} can sit in her little wheely #chair# and work on her #computer# if she was so inclined.`,
        `p::That's not my job anymore.`,
        `Still, eventually she will have to check her messages. Next to the keyboard sits {{p}}'s #dice:Crash Dice# for when she wants to avoid doing work.`,
      ],
    },

    // TODO: from here down
    computer: {
      icon: 'fa-computer',
      look: COMPUTER_LOOK_TEXT,
      'look.computer_has_messages': [
        ...COMPUTER_LOOK_TEXT,
        'An icon is blinking on the screen, indicating that {{p}} has an unread message to view.',
      ],
      pickup: [
        "p::Yeah, sure, I'll just pop an entire computer in my pocket.",
        'p::What a concept.',
      ],
      interact: {
        queue: [
          {popup: 'intro_computer_1'},
          {popup: 'intro_computer_2'},
          {popup: 'intro_computer_3'},
        ],
        onQueueFinish: {
          quote: [
            `p::That's all of my messages right now.`,
            'p::I really gotta find more work.',
          ],
          removeState: 'computer_has_messages',
        },
      },
      talk: 'p::Hello, computer.',
    },

    window: {
      icon: 'fa-person-through-window',
      look: [
        'p::Ah, the city . . .',
        `The city stretches out to the horizon, although {{p}} can't really see past the collage of massive skyscrapers outside her window. The city gleams and sparkles in the morning sun, the walls of polished glass and metal catching sunlight like faceted jewels. The view is a tangled maze of walls, atria and courtyards scattered across the buildings and skybridges leading between them.`,
        `Flying transports whizz past her window as they follow a lane of air traffic through the glass canyon. She can see no ads or billboards outside, but huge pixel screens show looping animations that this month's public access council chose to decorate the city with. Images of huge bubbles, glistening just as much as the buildings towering over them, float languidly on the giant screens which most folks train themselves to completely ignore.`,
        `She has no view of naturalized land, because the nice views are generally reserved for the 'important' people.`,
        `p::I'll be one of those important people some day.`,
        `p::Just you watch, the city.`,
      ],
      interact:
        "p::It won't budge. The wind would be way too high from up here anyway.",
      pickup: "p::Um, no, I can't pick up a window.",
      talk: 'p::Hello, world.',
    },
    cross: {
      icon: 'fa-cross-ud',
      look: [
        `A simple, hand-carved cross hangs on the wall by a string looped through the long end. It's a traditional style, with a snake depicted wrapped around the wood in the vague shape of an 'S.'`,
        `It belonged to {{p}}'s mother, and reminds her more of her childhood than any religious figure it was created to represent.`,
      ],
      interact: "p::I forgot the Lord's prayer a long time ago.",
      talk: 'p::Uh, "Hail Satan," I guess.',
      pickup:
        "p::No, people are going to think I'm some kind of religious nut.",
    },
    chair: {
      icon: 'fa-chair',
      look: [
        'p::I know a chair when I see one.',
        'p::This is definitely one, even with my #jacket:cool jacket# hanging on the back.',
      ],
      interact: `{{p}} sits down in her chair. The act serves no functional purpose, but she appreciates that you are taking the time to give her knees a rest.`,
      pickup: {
        text: [
          `{{p}} picks the chair up off the floor and sets it down again.`,
          `p::I guess that constitutes my morning exercises.`,
        ],
        addTag: 'morning_exercises',
      },
    },

    dice: {
      icon: 'fa-dice',
      name: 'Crash dice',
      look: `p::My Crash dice. I used to love playing it, but lately I am not so sure.`,
      interact: {
        alias: ['play'],
        quote: `p::I can break the fourth wall and teach you how to play if you want. Just tell me to pick them up.`,
      },
      pickup: {
        addItem: 'crashdice',
        text: `{{p}} picks up her dice. She may be ready to leave the game in the past as something her old self used to do, but she couldn't deny that it was useful for breaking the ice with people (also, she has to admit, it's a pretty fun game).`,
      },
      'pickup.crashdice-picked-up': 'p::I already have them.',
    },
    crashdice: {
      icon: 'fa-dice',
      aka: ['dice', 'crash'],
      name: 'Crash dice',
      interact: {
        alias: ['play'],
        custom: (game) => {
          //           export async function getMinigame(
          //   name: MinigameOptions
          // ): Promise<typeof Minigame | undefined> {
          //   switch (name) {
          //     case 'crash':
          //       return (await import('./minigames/crash.js')).Crash;
          //     default:
          //       return Promise.resolve(undefined);
          //   }
          // }
          return Promise.resolve();
        },
      },
      look: `Six specialized six-sided dice, with the numbers 1-5 and a special side for crashes. Enjoyed as a popular cultural pasttime, Crash is a quick and easy game that blends a bit of skill and just enough chance to make it exciting.`,
    },

    jacket: {
      icon: 'fa-vest-patches',
      look: `p::It's my badass jacket. It makes me look cool, but my claim that it makes me look cool nullifies that.`,
      pickup: {
        addItem: 'jacket',
        quote: `p::Just pop this in my pocket, I guess.`,
      },
      'pickup.jacket-picked-up': `p::Yeah, I have it.`,
      interact: `p::I'm probably not going to go outside today, so there isn't really much point.`,
      talk: `p::Hello jacket.`,
    },

    comlink: {
      icon: 'fa-walkie-talkie',
      look: `It's a small hand-held personal communicator. It's basically a tiny microphone and a tiny speaker connected to a little screen and keypad.`,
      pickup: {
        addItem: 'comlink',
        quote:
          'p::Yeah, I need to get a new one under my name, so I can take this in to be recycled.',
      },
      interact: `p::It doesn't work, because the underlying account was cancelled. I need to get a new one activated in my name.`,
    },
  },
  popups: {
    intro_computer_1: {
      title: PROTAGONIST_MESSAGE_READER_APP,
      quote: "p::There's a message from my last client.",
      popupStyle: 'computer',
      popupContent: `
{{p}}: 
tahnks again! Bitsy is happy and so snuggly.

She missed me. 
-Sam
`,
      quoteAfter: [
        'p::I watched her cat for a week.',
        'p::Hey, work is work.',
        'p::I think I have more messages.',
      ],
    },
    intro_computer_2: {
      title: PROTAGONIST_MESSAGE_READER_APP,
      quote: "p::There's a message from my comlink provider.",
      popupStyle: 'computer',
      popupContent: `
Dear {{pdd}},

Your request to update the primary billing owner on your account has been processed. 

If you requested this change, no further action is required. However, if this wasn't you, you should probably call us to get it sorted out, unless someone has stolen your comlink account in which case you probably cannot call us. In that event, please respond to this message with the name and address of your identity thief, and we will update our records for the new owner of your identity. 

Have a nice day, and thank you for trusting CyberCom for your comlink needs. 

Sincerely, 
Deedo Quandary
Sales Associate, CyberCom. 

_P.S. have you tried our new Max Plus Deluxe and Max Plus Deluxe Mini comlinks? The digital clarity will blow you away!_
`,
      quoteAfter: [
        "p::I guess I'll need to get a new burner comlink.",
        "p::Not that anybody's gonna call me.",
      ],
    },
    intro_computer_3: {
      title: PROTAGONIST_MESSAGE_READER_APP,
      quote: "p::There's a message from my ex.",
      popupStyle: 'computer',
      popupContent: `
{{p}}: 
Hey, just checking in to see if you sent in that form to update the comlink yet? It's been a few days. I hope you're doing okay.
-Jace
`,
    },
  },
};

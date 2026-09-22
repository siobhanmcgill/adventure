import {beforeEach, describe, expect, Mock, test, vi} from 'vitest';
import {AgencyText} from '../text-mode';
import {GameState} from '../game-state';
import {ActionHandler} from '../actionHandler';
import {bedroom_1} from '../../../content/rooms/bedroom_1';
import {setupRoom} from './test_utils';
import {ActionOptions, Room, RoomObject} from '../types';
import {FALLBACK_FALLBACK, NULL_ACTIONS} from '../constants';
import {firstValueFrom} from 'rxjs';
import {STORAGE_INVENTORY} from '../inventoryHandler';
import {setStorage} from '../utils/utils';

describe('action handler', () => {
  let gameState: GameState;
  let textMode: AgencyText;
  let actionHandler: ActionHandler;

  // This object id is 'gadget'
  const inventoryItem = {
    name: 'Inventory Item',
    aka: ['widget', 'complex thingie'],
    look: `look at gadget`,
    interact: `use gadget`,
    'interact#key': {
      alias: ['stick'],
      quote: 'use key on gadget!',
    },
  } as RoomObject;

  beforeEach(() => {
    // Populate the inventory so we can interact with it.
    setStorage<{[index: string]: RoomObject}>(STORAGE_INVENTORY, {
      gadget: inventoryItem,
    });

    gameState = new GameState();
    textMode = new AgencyText(gameState);
    actionHandler = textMode.actionHandler;
  });

  describe('command parsing', () => {
    let actionSpy: Mock;

    describe('with objects', () => {
      const mock_room: Room = {
        roomId: 'test',
        init: {
          states: ['test_state'],
          objects: [],
        },
        states: {},
        enter: {},
        objects: {
          // This object has a handler for all of the basic actions.
          pills: {
            look: 'look at pills',
            interact: 'interact at pills',
            pickup: 'pick up pills',
            talk: 'talk at pills',
            sit: 'sit on pills',
            'interact#gadget': 'use gadget with pills!',
            'interact#yourself': {alias: ['give'], quote: 'take pill'},
          },
          // This object has an alias, so you can say "open door" instead of "use door"
          door: {
            interact: {
              alias: ['open'],
              quote: 'interact door',
            },
            'interact#key': 'key on door',
          },
          // This object can be used on the door.
          key: {
            interact: 'use key',
            pickup: 'pick up key',
            'interact#pants': 'put key in pants',
          },
          // This object has an alternate name
          pants: {
            aka: ['jeans'],
            interact: {
              alias: ['put'],
              quote: 'interact jeans',
            },
          },
          // This object has a name with two words that don't match the id
          switch: {
            name: 'cool button',
            interact: 'interact switch',
          },
          // This object exists but the player hasn't seen it yet.
          unseen: {
            name: 'John Cena',
            look: `it's John Cena!`,
            talk: 'do do do dooo, do do do doooo!',
          },
          trinket: {
            name: 'Shiny Trinket',
            pickup: {
              addItem: 'trinket',
            },
          },
        },
      };
      beforeEach(async () => {
        actionSpy = vi
          .spyOn(actionHandler, 'filterActionByState')
          .mockImplementation(() => Promise.resolve(''));

        setupRoom(textMode, mock_room);
        for (const [key] of Object.entries(mock_room.objects)) {
          if (key !== 'unseen') {
            textMode.roomHandler.registerObject(key, mock_room);
          }
        }
        await vi.runAllTimersAsync();
      });

      const allActions: ActionOptions[] = [
        'look',
        'interact',
        'pickup',
        'talk',
        'sit',
      ];

      const altActions = new Map<string, ActionOptions>([
        ['peep', 'look'],
        ['use', 'interact'],
        ['grab', 'pickup'],
        ['greet', 'talk'],
      ]);

      test.for([
        // Happy paths
        ...allActions.map((a) => ({
          prompt: `${a} at pills`,
          arg1: mock_room.objects.pills[a],
          arg2: a,
          arg3: 'pills',
          arg4: undefined,
        })),
        {
          // Command with two-word name
          prompt: 'interact with cool button',
          arg1: mock_room.objects.switch.interact,
          arg2: 'interact',
          arg3: 'switch',
          arg4: undefined,
        },
        {
          // Strips 'the' from the string.
          prompt: 'look at the pills',
          arg1: 'look at pills',
          arg2: 'look',
          arg3: 'pills',
          arg4: undefined,
        },
        {
          // Finds the verb in an actions aliases
          prompt: 'open the door',
          arg1: mock_room.objects.door.interact,
          arg2: 'open',
          arg3: 'door',
          arg4: undefined,
        },
        {
          // Works with an alternate object name
          prompt: 'interact with the jeans',
          arg1: mock_room.objects.pants.interact,
          arg2: 'interact',
          arg3: 'pants',
          arg4: undefined,
        },
        // {
        //   // Works with alternate verbs
        //   prompt: 'use the door',
        //   arg1: mock_room.objects.door.interact,
        //   arg2: 'interact',
        //   arg3: 'door',
        //   arg4: undefined,
        // },
        ...altActions.entries().map(([verb, a]) => ({
          prompt: `${verb} the pills`,
          arg1: mock_room.objects.pills[a],
          arg2: verb,
          arg3: 'pills',
          arg4: undefined,
        })),
        {
          // Includes an invalid verb in the null response
          prompt: 'dingle the door',
          arg1: `p::I don't know how to dingle a door.`,
          arg2: 'dingle',
          arg3: 'door',
          arg4: undefined,
        },
        {
          // Can use the first object on the second
          prompt: 'use key on door',
          arg1: mock_room.objects.door['interact#key'],
          arg2: 'use',
          arg3: 'key',
          arg4: 'door',
        },
        {
          // Throws a null action if you try to use an object on another object
          // that does not account for that.
          prompt: 'use pants on door',
          arg1: `p::I don't think a pants goes with a door.`,
          arg2: 'use',
          arg3: 'pants',
          arg4: 'door',
        },
        {
          // Works with pick up as two words.
          prompt: 'pick up key',
          arg1: mock_room.objects.key.pickup,
          arg2: 'pick up',
          arg3: 'key',
          arg4: undefined,
        },
        ...allActions.map((a) => ({
          // Does a null action if you ask for something that doesn't exist.
          prompt: `${a} at lemon cake`,
          arg1: NULL_ACTIONS[a],
          arg2: a,
          arg3: undefined,
          arg4: undefined,
        })),
        ...allActions.map((a) => ({
          // Does a null action if you ask for something that you haven't seen.
          prompt: `${a} at John Cena`,
          arg1: NULL_ACTIONS[a],
          arg2: a,
          arg3: undefined,
          arg4: undefined,
        })),
        {
          // Handles superfluous language
          prompt: `please would you kindly pick up the key?`,
          arg1: mock_room.objects.key.pickup,
          arg2: 'please would you kindly pick up',
          arg3: 'key',
          arg4: undefined,
        },
        {
          // Throws a null action if you try to use an object on another object
          // that does not account for that (and the object isn't in the list).
          prompt: 'smash clock with foot',
          arg1: `p::I don't know how to smash clock.`,
          arg2: 'smash clock',
          arg3: undefined,
          arg4: undefined,
        },
        {
          // Handles something completely wackadoo
          prompt: 'Hello my friend',
          arg1: `p::I don't know how to hello my friend.`,
          arg2: 'hello my friend',
          arg3: undefined,
          arg4: undefined,
        },
        {
          // Can interact with items in your inventory
          prompt: 'Look at gadget',
          arg1: inventoryItem.look,
          arg2: 'look',
          arg3: 'gadget',
          arg4: undefined,
        },
        {
          // Can interact with items in your inventory by aka name
          prompt: 'Look at complex thingie',
          arg1: inventoryItem.look,
          arg2: 'look',
          arg3: 'gadget',
          arg4: undefined,
        },
        {
          // Can interact with items in your inventory by name
          prompt: 'Look at inventory item',
          arg1: inventoryItem.look,
          arg2: 'look',
          arg3: 'gadget',
          arg4: undefined,
        },
        // Can use an inventory item with a room object that interacts with it
        ...['use gadget on pills', 'touch pills with gadget'].map(
          (prompt, i) => ({
            prompt,
            arg1: mock_room.objects.pills['interact#gadget'],
            arg2: i ? 'touch' : 'use',
            arg3: i ? 'pills' : 'gadget',
            arg4: i ? 'gadget' : 'pills',
          })
        ),
        // Can use a room object on an inventory item that interacts with it
        ...['use gadget on key', 'touch key with gadget'].map((prompt, i) => ({
          prompt,
          arg1: inventoryItem['interact#key'],
          arg2: i ? 'touch' : 'use',
          arg3: i ? 'key' : 'gadget',
          arg4: i ? 'gadget' : 'key',
        })),

        {
          // Can handle an alias in an object interaction
          prompt: 'stick gadget in key',
          arg1: inventoryItem['interact#key'],
          arg2: 'stick',
          arg3: 'gadget',
          arg4: 'key',
        },
        {
          // Can generalize 'yourself' to a standard interact
          prompt: 'use switch on yourself',
          arg1: mock_room.objects.switch.interact,
          arg2: 'use',
          arg3: 'switch',
          arg4: 'yourself',
        },
        {
          // Can have an alias on 'yourself'
          // so give pill won't work, but give pill to yourself will
          // not sure if this will be useful but we can do it.
          prompt: 'give pills to yourself',
          arg1: mock_room.objects.pills['interact#yourself'],
          arg2: 'give',
          arg3: 'pills',
          arg4: 'yourself',
        },
        {
          prompt: 'put on jeans',
          arg1: mock_room.objects.pants.interact,
          arg2: 'put',
          arg3: 'pants',
          arg4: undefined,
        },
        // TODO: these tests may or may not work yet:
        // give pill to yourself (same as use pill)
        // give yourself a pill (same as use pill)
        // pick up the key by yourself (same as pick up key)
        // give pants to yourself (some sort of null response)
      ])(
        'parses $prompt correctly',
        async ({prompt, arg1, arg2, arg3, arg4}) => {
          await actionHandler.doActionString(prompt);
          await vi.runAllTimersAsync();
          expect(actionSpy).toHaveBeenCalledWith(arg1, arg2, arg3, arg4);
        }
      );

      test('adds an item to inventory when you pick it up', async () => {
        actionSpy.mockReset();

        await actionHandler.doActionString('pick up shiny trinket');
        await vi.runAllTimersAsync();

        expect(actionSpy).toHaveBeenCalledWith(
          mock_room.objects.trinket.pickup,
          'pick up',
          'trinket',
          undefined
        );

        const inventory = await firstValueFrom(textMode.state.inventory$);
        // The inventory already has an item populated at the start of this test spec.
        expect(inventory).toEqual(new Set(['gadget', 'trinket']));

        const states = await firstValueFrom(textMode.state.roomStates$);
        expect(states).toEqual([...mock_room.init.states, 'trinket-picked-up']);
      });
    });
  });
});

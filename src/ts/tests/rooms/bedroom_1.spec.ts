/** Tests for the actions and interactions inside the first room. */

import {ArgumentOutOfRangeError, firstValueFrom} from 'rxjs';
import {beforeEach, describe, expect, it, Mock, vi} from 'vitest';
import {page} from 'vitest/browser';
import {bedroom_1} from '../../../../content/rooms/bedroom_1';
import {GameState} from '../../game-state';
import {AgencyText} from '../../text-mode';
import {Action, Quote} from '../../types';
import {
  command,
  expectHasState,
  expectHasTag,
  expectInventoryIncludes,
  expectObjectVisible,
  expectQuoteText,
  flush,
  getEl,
  setupRoom,
} from '../test_utils';
import {FALLBACK_FALLBACK} from '../../constants';
import {bedroom_1_hall} from '../../../../content/rooms/bedroom_1_hall';

describe('bedroom_1', () => {
  let gameState: GameState;
  let game: AgencyText;
  let printSpy: Mock<(text: Quote, system?: boolean) => Promise<void>>;

  beforeEach(() => {
    gameState = new GameState();
    game = new AgencyText(gameState);

    printSpy = vi.spyOn(game, 'print');
  });

  describe('first time', () => {
    beforeEach(async () => {
      await setupRoom(game, bedroom_1);
    });

    it('shows the intro quotes', async () => {
      expect(printSpy).toHaveBeenCalledWith(bedroom_1.enter.default.text);
    });

    it('triggers the alarm_on state', async () => {
      const states = await firstValueFrom(game.state.roomStates$);
      expect(states).includes('alarm_on');
    });

    it('shows the beep panel', async () => {
      expect(getEl('.general-panel')).toBeTruthy();
      expect(getEl('.general-panel .panel-contents').textContent.trim()).toBe(
        'beep'
      );
    });
  });

  describe('not first load but initial state', () => {
    beforeEach(async () => {
      await setupRoom(
        game,
        bedroom_1,
        {
          currentRoomId: 'bedroom_1',
        },
        {
          states: bedroom_1.init.states,
        }
      );
    });

    it.each`
      action
      ${'look'}
      ${'interact'}
      ${'pickup'}
      ${'talk'}
    `('**BEEP** ($action)', async ({action}) => {
      game.actionHandler.doActionString(`${action} at apartment`);
      await expectQuoteText('**BEEP**');
    });

    it("ain't got not pants on", () => {
      expectHasState(game.state, 'no_pants');
    });

    it('can see the clock', () => {
      expect(game.roomHandler.lookUpObject('clock')).toBeTruthy();
    });

    it('cannot see the pants', () => {
      expect(game.roomHandler.lookUpObject('pants')).not.toBeTruthy();
    });

    it.each`
      label
      ${'clock'}
      ${'alarm'}
      ${'Stupid Clock'}
    `('stops beeping when you use the $label', async ({label}) => {
      game.actionHandler.doActionString(`turn off the ${label}`);
      await flush();
      expect(printSpy).toHaveBeenCalledWith(
        (bedroom_1.objects.clock['interact.alarm_on'] as Action)
          .text as string[]
      );
      await flush();

      await expectHasState(gameState, 'alarm_on', false);
      await expectHasState(gameState, 'alarm_off');

      expect(page.getEl('.general-panel')).not.toBeInTheDocument();
    });
  });

  describe('with that stupid clock off', () => {
    beforeEach(async () => {
      const states = bedroom_1.init.states.filter((s) => s !== 'alarm_on');
      states.push('alarm_off');
      await setupRoom(
        game,
        bedroom_1,
        {
          currentRoomId: 'bedroom_1',
        },
        {
          states,
        }
      );
      await flush();
      printSpy.mockClear();
    });

    describe('clock', () => {
      it('no longer toggles the alarm', async () => {
        await command(game, 'use the clock');
        expect(printSpy).toHaveBeenCalledWith(bedroom_1.objects.clock.interact);
        expectHasState(game.state, 'alarm_off');
      });
    });

    describe('room', () => {
      it.each`
        player
        ${'examine apartment'}
        ${'look around'}
        ${'look at room'}
      `('$player looks around', async ({player}) => {
        await command(game, player);
        expect(printSpy).toHaveBeenCalledWith(bedroom_1.objects.apartment.look);
      });
    });

    describe.each([
      {
        objectId: 'bed',
        visibleAfterLookingAt: [],
        only: false,
      },
      {
        objectId: 'television',
        visibleAfterLookingAt: ['room'],
      },
      {
        objectId: 'pile of clothes',
        visibleAfterLookingAt: ['room'],
        pickupId: undefined,
        useCommand: 'put on clothes',
        testForUse: (bedroom_1.objects.clothes.interact as Action).quote,
        otherTests: [
          {
            name: 'Mentions pants, gams, and the sweater if nothing has been picked up',
            arrange: () => {
              // Nothing changes here.
            },
            act: async () => {
              await command(game, 'look at clothes');
            },
            assert: () => {
              expect(printSpy).toHaveBeenCalledWith([
                `As if in defiance of the cramped space, or perhaps just taking advantage of her newfound solo living, {{p}} has strewn what clothes she has on what floor space she has. The clothes piled on the floor are somehow different than the clothes tossed in her #hamper#, in a way known only to her.`,
                `p::Mine is a very sophisticated mind, organizationally.`,
                `Among assorted less immediately relevant articles, her single pair of #pants:cute pants# lie on top of the pile, just underneath her favorite #sweater:puffy sweater#.`,
                `p::Great, now they know I don't have any pants on.`,
                `Indeed, {{pp}} slept in her underwear. Her long, slender gams are on display.`,
              ]);
            },
          },
          {
            name: 'Mentions pants and gams if the sweater has been picked up',
            arrange: async () => {},
            act: async () => {
              await command(game, 'look at clothes');
              await command(game, 'pick up sweater');

              printSpy.mockReset();
              await command(game, 'look at clothes');
            },
            assert: () => {
              expect(printSpy).toHaveBeenCalledWith([
                `As if in defiance of the cramped space, or perhaps just taking advantage of her newfound solo living, {{p}} has strewn what clothes she has on what floor space she has. The clothes piled on the floor are somehow different than the clothes tossed in her #hamper#, in a way known only to her.`,
                `p::Mine is a very sophisticated mind, organizationally.`,
                `Among assorted less immediately relevant articles, her single pair of #pants:cute pants# lie on top of the pile.`,
                `p::Great, now they know I don't have any pants on.`,
                `Indeed, {{pp}} slept in her underwear. Her long, slender gams are on display.`,
              ]);
            },
          },
          {
            name: 'Mentions the sweater (but no pants or gams) if the pants have been picked up',
            arrange: async () => {},
            act: async () => {
              await command(game, 'look at clothes');
              await command(game, 'pick up pants');

              printSpy.mockReset();
              await command(game, 'look at clothes');
            },
            assert: () => {
              expect(printSpy).toHaveBeenCalledWith([
                `As if in defiance of the cramped space, or perhaps just taking advantage of her newfound solo living, {{p}} has strewn what clothes she has on what floor space she has. The clothes piled on the floor are somehow different than the clothes tossed in her #hamper#, in a way known only to her.`,
                `p::Mine is a very sophisticated mind, organizationally.`,
                `Among assorted less immediately relevant articles, her favorite #sweater:puffy sweater# stands out on top of the pile.`,
              ]);
            },
          },
          {
            name: 'Mentions neither sweaters, nor pants, nor gams if the sweater and pants have been picked up',
            arrange: async () => {},
            act: async () => {
              await command(game, 'look at clothes');
              await command(game, 'pick up pants');
              await command(game, 'pick up sweater');

              printSpy.mockReset();
              await command(game, 'look at clothes');
            },
            assert: () => {
              expect(printSpy).toHaveBeenCalledWith([
                `As if in defiance of the cramped space, or perhaps just taking advantage of her newfound solo living, {{p}} has strewn what clothes she has on what floor space she has. The clothes piled on the floor are somehow different than the clothes tossed in her #hamper#, in a way known only to her.`,
                `p::Mine is a very sophisticated mind, organizationally.`,
              ]);
            },
          },
        ],
      },
      {
        objectId: 'pants',
        visibleAfterLookingAt: ['room', 'pile of clothes'],
        pickupId: 'pants',
        useCommand: 'put on pants',
        testForUse: (bedroom_1.objects.pants.interact as Action).text,
        otherTests: undefined,
      },
      {
        objectId: 'sweater',
        visibleAfterLookingAt: ['room', 'pile of clothes'],
        pickupId: 'sweater',
        useCommand: 'put on sweater',
        testForUse: (bedroom_1.objects.sweater.interact as Action).quote,
        otherTests: undefined,
      },
      {
        objectId: 'hamper',
        visibleAfterLookingAt: ['room'],
        pickupId: undefined,
        useCommand: undefined,
        testForUse: undefined,
        otherTests: [
          ...['use sweater on hamper', 'put sweater in hamper'].map((com) => {
            return {
              name: 'can ' + com,
              arrange: () => game.state.addToInventory('sweater'),
              act: async () => await command(game, com),
              assert: () => {
                expect(printSpy).toHaveBeenCalledWith(
                  (bedroom_1.objects.hamper['interact#sweater'] as Action)
                    .quoteAfterAnimation
                );

                expectInventoryIncludes(game.state, 'sweater', false);
                expectHasState(game.state, 'sweater-in-hamper');
              },
            };
          }),
          {
            name: 'will not take the pants',
            arrange: () => game.state.addToInventory('pants'),
            act: async () => await command(game, 'use pants on hamper'),
            assert: () => expectInventoryIncludes(game.state, 'pants'),
          },
        ],
      },
      {
        objectId: 'sink',
        visibleAfterLookingAt: ['room'],
        pickupId: undefined,
        useCommand: 'use the sink',
        testForUse: bedroom_1.objects.sink.interact,
        otherTests: ['use cup at sink', 'fill cup in sink'].map((com) => {
          return {
            name: 'can ' + com,
            arrange: () => game.state.addToInventory('cup'),
            act: async () => await command(game, com),
            assert: () => {
              expectInventoryIncludes(game.state, 'cup', false);
              expectInventoryIncludes(game.state, 'cup_of_water', true);
            },
          };
        }),
      },
      {
        objectId: 'cup',
        visibleAfterLookingAt: ['room', 'sink'],
        pickupId: 'cup',
        useCommand: 'use cup',
        testForUse: (bedroom_1.objects.cup.interact as Action).queue![0],
        otherTests: [
          {
            name: 'will not drink water',
            arrange: () => null,
            act: async () => await command(game, 'drink water'),
            assert: () => {
              expect(printSpy).toHaveBeenCalledWith(
                (bedroom_1.objects.cup.interact as Action).queue![0]
              );
            },
          },
        ],
      },
      {
        objectId: 'pills',
        visibleAfterLookingAt: ['room', 'sink'],
        pickupId: 'singlepill',
      },
      {
        objectId: 'mirror',
        visibleAfterLookingAt: ['room', 'sink'],
      },
      {
        objectId: 'door',
        visibleAfterLookingAt: ['room'],
        otherTests: [
          {
            name: 'door will not open without pants',
            arrange: (() => null) as () => void,
            act: async () => {
              await command(game, 'open the door');
            },
            assert: async () => {
              const currentRoom = await firstValueFrom(game.state.room$);
              expect(currentRoom.roomId).toBe(bedroom_1.roomId);

              expect(printSpy).toHaveBeenCalledWith(
                (bedroom_1.objects.door['interact.no_pants'] as Action).text
              );
            },
          },
          {
            name: 'door WILL open WITH pants',
            arrange: async () => {
              await command(game, 'look at clothes');
              await command(game, 'put on pants');

              printSpy.mockReset();
            },
            act: async () => {
              await command(game, 'open the door');
              await flush();
              document.body.click();
              await flush();
            },
            assert: async () => {
              const currentRoom = await firstValueFrom(game.state.room$);
              expect(currentRoom.roomId).toBe(bedroom_1_hall.roomId);

              expect(printSpy).toHaveBeenCalledWith(
                (bedroom_1.objects.door.interact as Action).text
              );
            },
          },
        ],
      },
      {
        objectId: 'picture',
        visibleAfterLookingAt: ['room', 'shelf'],
        otherTests: [
          {
            name: 'the past can be left in the past',
            arrange: (() => null) as () => void,
            act: async () => {
              await command(game, 'use the picture');
            },
            assert: async () => {
              expectHasState(game.state, 'picture_turned_down');
              expect(printSpy).toHaveBeenCalledWith(
                (bedroom_1.objects.picture.interact as Action).text
              );
            },
          },
          {
            name: 'the past can be remembered again',
            arrange: (() => null) as () => void,
            act: async () => {
              await command(game, 'use the picture');
              printSpy.mockReset();
              await command(game, 'use the picture');
            },
            assert: async () => {
              expectHasState(game.state, 'picture_turned_down', false);
              expect(printSpy).toHaveBeenCalledWith(
                (
                  bedroom_1.objects.picture[
                    'interact.picture_turned_down'
                  ] as Action
                ).text
              );
            },
          },
        ],
      },
      {
        objectId: 'empty_thc_capsules',
        visibleAfterLookingAt: ['room', 'shelf'],
        pickupId: 'empty_thc_capsules',
        useCommand: 'smoke the capsule',
        testForUse: (bedroom_1.objects.empty_thc_capsules.interact as Action)
          .queue![0],
      },
    ])(
      '$objectId',
      ({
        objectId,
        visibleAfterLookingAt,
        pickupId,
        useCommand,
        testForUse,
        otherTests,
        only,
      }) => {
        const tit = only ? it.only : it;

        tit(
          `is ${visibleAfterLookingAt.length ? 'not' : ''} visible right away`,
          async () => {
            expectObjectVisible(game, objectId, !visibleAfterLookingAt.length);
          }
        );

        describe('when visible', () => {
          beforeEach(async () => {
            for (const lookAt of visibleAfterLookingAt) {
              if (lookAt === 'room') {
                await command(game, `look around`);
              } else {
                await command(game, `look at ${lookAt}`);
              }
            }
            printSpy.mockReset();
          });

          if (visibleAfterLookingAt.length) {
            tit(
              `is visible after looking at ${visibleAfterLookingAt.join(
                ' and '
              )}`,
              async () => {
                expectObjectVisible(game, objectId);
              }
            );
          }

          if (useCommand) {
            tit('can be used', async () => {
              await command(game, useCommand);
              expect(printSpy).toHaveBeenCalledWith(testForUse);
            });
          }

          if (otherTests) {
            for (const otherTest of otherTests) {
              tit(otherTest.name, async () => {
                await otherTest.arrange();

                await otherTest.act();

                await otherTest.assert();
              });
            }
          }

          if (pickupId) {
            describe('picked up', () => {
              beforeEach(async () => {
                await command(game, `pick up ${objectId}`);
                printSpy.mockReset();
              });

              tit('can be picked up', async () => {
                await expectInventoryIncludes(game.state, pickupId);
              });

              tit('cannot be picked up again', async () => {
                printSpy.mockReset();
                await command(game, `pick up ${objectId}`);
                expect(printSpy).not.toHaveBeenCalledWith(
                  (bedroom_1.objects[objectId].pickup as Action).text
                );
                if (
                  bedroom_1.objects[objectId][`pickup.${pickupId}-picked-up`]
                ) {
                  expect(printSpy).toHaveBeenCalledWith(
                    bedroom_1.objects[objectId][`pickup.${pickupId}-picked-up`]
                  );
                }
              });

              if (useCommand) {
                tit('can be used from inventory', async () => {
                  await command(game, useCommand);
                  expect(printSpy).toHaveBeenCalledWith(testForUse);
                });
              }
            });
          }
        });
      }
    );

    describe('cup of water', () => {
      it('cannot be seen in the room', async () => {
        await command(game, 'look around');
        await command(game, 'look at sink');

        expectObjectVisible(game, 'cup_of_water', false);
      });

      it('hydrates the player', async () => {
        await command(game, 'look around');
        await command(game, 'look at sink');
        await command(game, 'pick up cup');
        await command(game, 'use cup on sink');

        printSpy.mockReset();

        await command(game, 'drink water');

        expect(printSpy).toHaveBeenCalledWith(
          (bedroom_1.objects.cup_of_water.interact as Action).quote
        );
        expect(printSpy).toHaveBeenCalledWith(
          (bedroom_1.objects.cup_of_water.interact as Action)
            .quoteAfterAnimation
        );
        expectInventoryIncludes(game.state, 'cup_of_water', false);
        expectInventoryIncludes(game.state, 'cup', true);
        expectHasTag(game.state, 'drank-water');
      });
    });

    describe('single pill', () => {
      it('can be taken', async () => {
        await command(game, 'look around');
        await command(game, 'look at sink');
        await command(game, 'pick up pills');
        printSpy.mockReset();

        await command(game, 'take pill');

        expect(printSpy).toHaveBeenCalledWith(
          (bedroom_1.objects.singlepill.interact as Action).text
        );
        expectInventoryIncludes(game.state, 'singlepill', false);
        expectHasTag(game.state, 'feminized');
      });

      it('cannot be taken twice', async () => {
        await command(game, 'look around');
        await command(game, 'look at sink');
        await command(game, 'pick up pillls');
        await command(game, 'take pill');
        printSpy.mockReset();

        await command(game, 'pick up pillls');
        await command(game, 'take pill');

        expect(printSpy).not.toHaveBeenCalledWith(
          (bedroom_1.objects.singlepill.interact as Action).text
        );
      });
    });

    // Add:
    // ${'capsules'}| ${'empty_thc_capsule'} | ${'capsules'}
    // dice
    // it.each`
    //   pickup       | inventory
    //   ${'sweater'} | ${'sweater'}
    //   ${'pills'}   | ${'singlepill'}
    //   ${'pants'}   | ${'pants'}
    //   ${'cup'}     | ${'cup'}
    // `('$inventory can be picked up', async ({pickup, inventory}) => {
    //   // await game.actionHandler.doActionString(`pick up ${pickup}`)
    //   await command(game, `pick up ${pickup}`);
    //   await expectInventoryIncludes(gameState, inventory);

    //   expect(game.roomHandler.lookUpObject(inventory)).toBeFalsy();
    // });

    // it('can turn down the haunting reminder of days gone by', async () => {
    //   await game.actionHandler.doActionString('interact with picture');

    //   expectInkscapeLabelVisible('picture', false);
    //   expectInkscapeLabelVisible('picture_down', true);
    // });

    // it('cannot leave without pants', async () => {
    //   await switchToAction('interact');
    //   await clickRoomObject('door');
    //   // await game.actionHandler.doActionString(')
    //   await flush();
    //   await expectQuoteText(
    //     "This isn't that kind of game. I should put some pants on first."
    //   );
    // });

    // it('can leave with pants', async () => {
    //   gameState.removeRoomState('no_pants');
    //   await flush();
    //   await switchToAction('interact');
    //   await clickRoomObject('door');
    //   await flush();
    //   // TODO: Update this when you actually can leave.
    //   await expectQuoteText(
    //     'I <em>would</em>, but this room is all that currently exists.'
    //   );
    // });

    // describe('computer', () => {
    //   it('shows a little animation', async () => {
    //     expectInkscapeLabelAnimation('has-messages', 'blink');
    //   });

    //   it('does not animate when there are no messages', async () => {
    //     gameState.removeRoomState('computer_has_messages');
    //     expectInkscapeLabelAnimation('has-messages', 'blink', true);
    //   });

    //   it('opens three different popups', async () => {
    //     await switchToAction('interact');

    //     // Popup 1
    //     await clickRoomObject('computer');
    //     await expectPopup(bedroom_1.popups!['intro_computer_1'], gameState);

    //     // Popup 2
    //     await clickRoomObject('computer');
    //     await expectPopup(bedroom_1.popups!['intro_computer_2'], gameState);

    //     await clickRoomObject('computer');
    //     await expectPopup(bedroom_1.popups!['intro_computer_3'], gameState);

    //     await expectQuoteText('I really gotta find more work.');
    //     await expectHasState(gameState, 'computer_has_messages', false);
    //   });
    // });

    // describe('pills', () => {
    //   beforeEach(async () => {
    //     await switchToAction('pickup');
    //     await clickRoomObject('pills');
    //     await flush();
    //   });

    //   it('can be picked up', async () => {
    //     await expectQuoteText('Come here, darling.');
    //     await expectInventoryIncludes(gameState, 'pill');
    //   });

    //   it('can not be picked up again', async () => {
    //     await clickRoomObject('pills');
    //     await expectQuoteText('I already have one.');
    //   });

    //   it('is not there anymore', async () => {
    //     expectInkscapeLabelVisible('pill-to-pick-up', false);
    //   });
    // });
  });
});

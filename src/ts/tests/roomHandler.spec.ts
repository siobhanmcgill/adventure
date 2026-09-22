import {beforeEach, describe, expect, Mock, test} from 'vitest';
import {bedroom_1} from '../../../content/rooms/bedroom_1';
import {GameState} from '../game-state';
import {RoomHandler} from '../roomHandler';
import {AgencyText} from '../text-mode';
import {setupRoom} from './test_utils';

describe('room handler', () => {
  let gameState: GameState;
  let textMode: AgencyText;

  beforeEach(() => {
    gameState = new GameState();
    textMode = new AgencyText(gameState);
  });

  test('can be instantiated', () => {
    expect(textMode.roomHandler).toBeTruthy();
  });

  // test('creates a protagonistHandler', () => {
  //   const handler = new RoomHandler(gameState);
  //   expect((handler as any).protagonistHandler).instanceOf(ProtagonistHandler);
  // });

  describe('initializeRoom', () => {
    let handler: RoomHandler<HTMLElement>;
    let setupProtagSpy: Mock;

    beforeEach(async () => {
      await setupRoom(textMode, bedroom_1);
      handler = textMode.roomHandler;
    });

    test('is called when the room changes', () => {
      expect((handler as any).currentRoomId).toBe(bedroom_1.roomId);
    });

    // test('loads the room artwork', async () => {
    //   await expect.element(page.getEl('#svg .room')).toHaveLength(1);
    // });

    // test('loads the room artwork viewbox', async () => {
    //   await expect
    //     .element(getTestSvg())
    //     .toHaveAttribute('viewBox', '0 0 1024 768');
    // });

    // test('loads the room artwork stylesheet', async () => {
    //   await expect
    //     .element(page.getStylesheet(bedroom_1.roomId))
    //     .toBeInTheDocument();
    // });

    // test('sets the default room state', async () => {
    //   await expect
    //     .element(page.getEl('.room'))
    //     .toHaveAttribute(
    //       'class',
    //       `room bedroom_1 ${bedroom_1.init.states.join(' ')}`
    //     );
    // });

    // test('creates an object handler for each object in the room config and artwork', async () => {
    //   await vi.runAllTimersAsync();
    //   const objects: Map<string, ObjectHandler> = (handler as any).objects;
    //   expect(JSON.stringify([...objects.keys()].sort())).toEqual(
    //     JSON.stringify(Object.keys(bedroom_1.objects).sort())
    //   );
    // });

    // test('unloads a room when a new one is set', async () => {
    //   gameState.setRoom({
    //     roomId: 'test_room',
    //     init: bedroom_1.init,
    //     states: {},
    //     enter: {default: {coords: {x: 695, y: 640}}},
    //     objects: {},
    //   });

    //   expect((handler as any).objects.size).toBe(0);
    //   await expect.element(page.getEl('#svg .room')).not.toBeInTheDocument();
    // });

    // test('puts the player at the default position', async () => {
    //   await vi.runAllTimersAsync();
    //   expect(setupProtagSpy).toHaveBeenCalledWith(
    //     bedroom_1,
    //     bedroom_1.enter.default
    //   );
    // });

    // test('prepares popup data', async () => {
    //   await vi.runAllTimersAsync();
    //   const popups: Map<string, Popup> = (handler as any).popupData;
    //   expect(JSON.stringify([...popups.keys()].sort())).toEqual(
    //     JSON.stringify(Object.keys(bedroom_1.popups ?? {}).sort())
    //   );
    // });

    // test('prints the opening quotes when ready', async () => {
    //   // This is usually triggered by the new game or load save states.
    //   gameState.markReady();

    //   await vi.runAllTimersAsync();
    //   expect(getEl('.main-game-stream .text-line')).toContainHTML(
    //     // This is the first quote in the bedroom intro.
    //     '<p>Testy wakes up in a small bedroom, eager to start a new day.</p>'
    //   );
    // });
  });

  describe('with a saved state', () => {
    // test('loads the saved room state', async () => {
    //   await setupRoom(
    //     textMode,
    //     bedroom_1,
    //     {},
    //     {
    //       states: ['test', 'something'],
    //     }
    //   );
    //   await expect
    //     .element(page.getEl('.room'))
    //     .toHaveAttribute('class', `room bedroom_1 test something`);
    // });
    // test('loads the saved room', async () => {
    //   await setupRoom(textMode, bedroom_1, {
    //     currentRoomId: 'bedroom_1_hall',
    //   });
    //   await vi.runAllTimersAsync();
    //   expect((textMode.roomHandler as any).currentRoomId).toBe('bedroom_1_hall');
    // });
    // test.skip('loads the saved protagonist position', async () => {
    //   const {setupProtagSpy} = await setupRoom(gameState, bedroom_1, {
    //     protagonistPosition: {x: 1, y: 1},
    //   });
    //   await vi.runAllTimersAsync();
    //   expect(setupProtagSpy).toHaveBeenCalledWith(
    //     bedroom_1,
    //     bedroom_1.enter.default,
    //     {x: 1, y: 1}
    //   );
    // });
  });
});

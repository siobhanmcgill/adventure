/** The lazily loaded TS / JS files are defined here for Parcel to pick them up. */

import {Character, Room} from './types.js';

export async function getRoom(roomId: string): Promise<Room | undefined> {
  switch (roomId) {
    case 'bedroom_1':
      return (await import('../../content/rooms/bedroom_1.js'))[roomId];
    case 'bedroom_1_hall':
      return (await import('../../content/rooms/bedroom_1_hall.js'))[roomId];
    default:
      return Promise.resolve(undefined);
  }
}

export async function getCharacter(
  characterId: string
): Promise<Character | undefined> {
  switch (characterId) {
    case 'protagonist':
      return (await import('../../content/characters/protagonist.js'))[
        characterId
      ];
    default:
      return Promise.resolve(undefined);
  }
}

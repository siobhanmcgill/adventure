/** The lazily loaded TS / JS files are defined here for Parcel to pick them up. */

import {convo} from '../../content/conversations/1_hallway_guy.js';
import {bedroom_1} from '../../content/rooms/bedroom_1.js';
import {Character, Convo, Room} from './types.js';

type LoadSet<T> = {[roomId: string]: () => Promise<{[index: string]: T}>};

const fallbackLoad = () => Promise.resolve(undefined);

const ROOMS: LoadSet<Room> = {
  bedroom_1: () => import(`../../content/rooms/bedroom_1.js`),
  bedroom_1_hall: () => import('../../content/rooms/bedroom_1_hall.js'),
};

export async function getRoom(roomId: string): Promise<Room | undefined> {
  const room = await (ROOMS[roomId] ?? fallbackLoad)();
  return room[roomId] ?? room.room;
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

const CONVOS: LoadSet<Convo> = {
  '1_hallway_guy': () => import('../../content/conversations/1_hallway_guy.js'),
};

export async function getConversation(
  convoId: string
): Promise<Convo | undefined> {
  const convo = await (CONVOS[convoId] ?? fallbackLoad)();
  return convo[convoId] ?? convo.convo;
}

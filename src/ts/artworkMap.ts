import {bedroom_1} from './content/rooms/bedroom_1';
import {Room} from './types';

export const ARTWORK: {rooms: {[index: string]: URL}} = {
  rooms: {bedroom_1: new URL(`../../artwork/bedroom_1.svg`, import.meta.url)}
};

export const ROOMS: {[roomId: string]: Room} = {
  [bedroom_1.roomId]: bedroom_1
};
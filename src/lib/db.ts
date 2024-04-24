import Dexie, { type Table } from 'dexie';
import { writable } from 'svelte/store';

export interface DbMediaItem {
	/** user id */
	user: string;
	/** photoslibrary media item id */
	id: string;
	/** prevents repetitions when randomly showing */
	seen: DbMediaItemSeen;
}

export enum DbMediaItemSeen {
	False = 0,
	True = 1,
	NeverShowAgain = 2
}

export const createSeenWritable = (user: string, id: string) => {
	const { subscribe, set } = writable(DbMediaItemSeen.True);
	db.mediaItems.get({ user, id }).then((item) => {
		if (item) set(item.seen); // load true initial state
	});
	return {
		subscribe,
		set: (seen: DbMediaItemSeen) => {
			db.mediaItems.where({ user, id }).modify({ seen });
			set(seen);
		}
	};
};

export class TypedDexie extends Dexie {
	// store list of media items sorted by user key
	mediaItems!: Table<DbMediaItem, string>;

	constructor() {
		super('random-gphoto');
		this.version(2).stores({
			mediaItems: '++, &[user+id], [user+seen]'
		});
	}
}
export const db = new TypedDexie();

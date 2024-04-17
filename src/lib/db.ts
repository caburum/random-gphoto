import Dexie, { type Table } from 'dexie';

export interface DbMediaItem {
	/** user id */
	user: string;
	/** photoslibrary media item id */
	id: string;
	/** boolean to prevent random repetitions (0 = false, 1 = true) */
	seen: number;
}

export class TypedDexie extends Dexie {
	// store list of media items sorted by user key
	mediaItems!: Table<DbMediaItem, string>;

	constructor() {
		super('random-gphoto');
		this.version(2).stores({
			mediaItems: '++, user, &id, [user+seen]'
		});
	}
}
export const db = new TypedDexie();

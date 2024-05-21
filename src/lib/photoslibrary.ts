import { type BulkError } from 'dexie';
import { refreshToken, type AuthState } from './auth';
import { DbMediaItemSeen, db, type DbMediaItem } from './db';
import { snackbar } from './stores';
import { get } from 'svelte/store';

export interface GoogleMediaItem {
	id: string;
	description?: string;
	productUrl: string; // link to photo in app
	baseUrl?: string; // direct file, only valid for 60 minutes from api call
	mimeType: string;
	filename: string;
	mediaMetadata: GoogleMediaMetadata;
}

export interface GoogleMediaMetadata {
	width: string;
	height: string;
	creationTime: string;
	photo?: {
		cameraMake: string;
		cameraModel: string;
		focalLength: number;
		apertureFNumber: number;
		isoEquivalent: number;
		exposureTime: string;
	};
	video?: {
		cameraMake: string;
		cameraModel: string;
		fps: number;
		status: string;
	};
}

export interface GoogleAlbum {
	id: string;
	title: string;
	productUrl: string;
	mediaItemsCount?: number;
}

const getMediaItems = async (
	token: string,
	pageToken?: string,
	albumId?: string
): Promise<{ mediaItems: Pick<GoogleMediaItem, 'id'>[]; nextPageToken?: string }> => {
	const url = new URL('https://photoslibrary.googleapis.com/v1/mediaItems');
	url.searchParams.append('pageSize', '100');
	url.searchParams.append('fields', 'mediaItems(id),nextPageToken');
	if (pageToken) url.searchParams.append('pageToken', pageToken);
	if (albumId) url.searchParams.append('albumId', albumId);
	const res = await fetch(url.href, { headers: { Authorization: `Bearer ${token}` } });
	if (!res.ok) {
		if (res.status === 401) throw await refreshToken();
		throw new Error(await res.text());
	}
	return res.json();
};

const getAlbums = async (
	token: string,
	pageToken?: string
): Promise<{ albums: GoogleAlbum[]; nextPageToken?: string }> => {
	const res = await fetch(
		`https://photoslibrary.googleapis.com/v1/albums${pageToken ? `?pageToken=${pageToken}` : ''}`,
		{ headers: { Authorization: `Bearer ${token}` } }
	);
	if (!res.ok) {
		if (res.status === 401) throw await refreshToken();
		throw new Error(await res.text());
	}
	return res.json();
};

const getMediaItem = async (token: string, id: string): Promise<GoogleMediaItem> => {
	const res = await fetch(`https://photoslibrary.googleapis.com/v1/mediaItems/${id}`, {
		headers: { Authorization: `Bearer ${token}` }
	});
	if (!res.ok) {
		if (res.status === 401) throw await refreshToken();
		throw new Error(await res.text());
	}
	return res.json();
};

/** bulk add new media to library */
export const updateMedia = async (auth: AuthState) => {
	if (!auth.id || !auth.token) throw new Error('missing auth info');

	const sb = get(snackbar);

	const toAdd: DbMediaItem[] = [];

	let pageToken: string | undefined = '';
	do {
		const { mediaItems, nextPageToken } = await getMediaItems(auth.token, pageToken);
		pageToken = nextPageToken;

		let allOldItems = true;
		for (const item of mediaItems) {
			const entry = await db.mediaItems.get({ user: auth.id, id: item.id });
			if (entry === undefined) {
				toAdd.push({ user: auth.id, id: item.id, seen: 0 });
				allOldItems = false;
			}
		}
		console.log(allOldItems, toAdd, mediaItems);
		if (allOldItems) break; // no new items to add
		sb?.({ message: `currently found ${toAdd.length} new media items` });
		// debugger;
	} while (pageToken !== undefined);
	console.log('adding', toAdd);

	toAdd.reverse();

	let failedCount = 0;
	await db.mediaItems.bulkAdd(toAdd).catch('BulkError', (err: BulkError) => {
		failedCount = err.failures.length;
	});

	return { added: toAdd.length - failedCount, total: toAdd.length };
};

/** get a random cached media item */
export const getRandomMediaItem = async (auth: AuthState, markSeen = true): Promise<GoogleMediaItem | undefined> => {
	if (!auth.id || !auth.token) throw new Error('missing auth info');

	const items = db.mediaItems.where({ user: auth.id, seen: DbMediaItemSeen.False });

	const count = await db.mediaItems.where({ user: auth.id, seen: DbMediaItemSeen.False }).count();
	if (count === 0) {
		// unmark all seen items, starting fresh
		const total = await db.mediaItems.where({ user: auth.id, seen: DbMediaItemSeen.True }).count();
		if (total > 0) {
			await db.mediaItems.where({ user: auth.id, seen: 1 }).modify({ seen: DbMediaItemSeen.False });
			return getRandomMediaItem(auth);
		}
		return undefined;
	}

	const randomIndex = Math.floor(Math.random() * count);
	const randomItem = await items.offset(randomIndex).first();

	if (!randomItem) throw new Error('failed to get random item');

	const mediaItem = await getMediaItem(auth.token, randomItem.id);

	// handle deleted/archived image? (remove from db)
	// no way to tell if an image has been archived since it will still exist, user can manually mark it as hidden

	if (markSeen) await db.mediaItems.where({ user: auth.id, id: randomItem.id }).modify({ seen: DbMediaItemSeen.True });

	return mediaItem;
};

import { authState, type AuthState } from './auth';
import { db, type DbMediaItem } from './db';
import { get } from 'svelte/store';

export interface GoogleMediaItem {
	id: string;
	description?: string;
	productUrl: string; // link to photo in app, todo: on use set ?authuser=
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
		focalLength: string;
		apertureFNumber: string;
		isoEquivalent: string;
		exposureTime: string;
	};
	video?: {
		cameraMake: string;
		cameraModel: string;
		fps: string;
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
): Promise<{ mediaItems: GoogleMediaItem[]; nextPageToken?: string }> => {
	const url = new URL('https://photoslibrary.googleapis.com/v1/mediaItems');
	url.searchParams.append('pageSize', '100');
	if (pageToken) url.searchParams.append('pageToken', pageToken);
	if (albumId) url.searchParams.append('albumId', albumId);
	return (await fetch(url.href, { headers: { Authorization: `Bearer ${token}` } })).json();
};

const getAlbums = async (
	token: string,
	pageToken?: string
): Promise<{ albums: GoogleAlbum[]; nextPageToken?: string }> => {
	return (
		await fetch(`https://photoslibrary.googleapis.com/v1/albums${pageToken ? `?pageToken=${pageToken}` : ''}`, {
			headers: { Authorization: `Bearer ${token}` }
		})
	).json();
};

const getMediaItem = async (token: string, id: string): Promise<GoogleMediaItem> => {
	return (
		await fetch(`https://photoslibrary.googleapis.com/v1/mediaItems/${id}`, {
			headers: { Authorization: `Bearer ${token}` }
		})
	).json();
};

/** bulk add new media to library */
export const updateMedia = async (auth: AuthState) => {
	if (!auth.id || !auth.token) throw new Error('missing auth info');

	let toAdd: DbMediaItem[] = [];

	let pageToken: string | undefined = '';
	do {
		const { mediaItems, nextPageToken } = await getMediaItems(auth.token, pageToken);
		pageToken = nextPageToken;

		let allOldItems = true;
		for (const item of mediaItems) {
			const entry = await db.mediaItems.get({ id: item.id });
			if (!entry) {
				toAdd.push({ user: auth.id, id: item.id, seen: 0 });
				allOldItems = false;
			}
		}
		console.log(allOldItems, toAdd, mediaItems);
		if (allOldItems) break; // no new items to add
		debugger;
	} while (pageToken !== undefined);

	toAdd.reverse();
	await db.mediaItems.bulkAdd(toAdd);
};

/** get a random cached media item */
export const getRandomMediaItem = async (auth: AuthState, handleSeen = true): Promise<GoogleMediaItem | undefined> => {
	if (!auth.id || !auth.token) throw new Error('missing auth info');

	const items = db.mediaItems.where({ user: auth.id, seen: 0 });

	const count = await db.mediaItems.where({ user: auth.id, seen: 0 }).count();
	if (count === 0) {
		// unmark all seen items, starting fresh
		const total = await db.mediaItems.where({ user: auth.id }).count();
		if (total > 0) {
			await db.mediaItems.where({ user: auth.id }).modify({ seen: 0 });
			return getRandomMediaItem(auth);
		}
		return undefined;
	}

	const randomIndex = Math.floor(Math.random() * count);
	const randomItem = await items.offset(randomIndex).first();

	if (!randomItem) throw new Error('failed to get random item');

	const mediaItem = await getMediaItem(auth.token, randomItem.id);

	return mediaItem;
};

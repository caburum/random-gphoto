import { get, writable } from 'svelte/store';
import type { getRandomMediaItem } from './photoslibrary';
import { authState } from './auth';
import type { SnackbarIn } from 'm3-svelte';
import { liveQuery } from 'dexie';
import { db } from './db';

// store current image across app reloads
export const currentRandomMediaItemPromise = writable<ReturnType<typeof getRandomMediaItem> | undefined>(undefined);

authState.subscribe(async (auth) => {
	if (!auth.id || !auth.token) currentRandomMediaItemPromise.set(undefined);
});

export const snackbar = writable<(data: SnackbarIn) => void | undefined>(undefined);

export const mediaCount = liveQuery(() => db.mediaItems.where({ user: get(authState).id }).count());

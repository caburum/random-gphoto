import { writable } from 'svelte/store';
import type { getRandomMediaItem } from './photoslibrary';
import { authState } from './auth';

// store current image across app reloads
export const currentRandomMediaItemPromise = writable<ReturnType<typeof getRandomMediaItem> | undefined>(undefined);

authState.subscribe(async (auth) => {
	if (!auth.id || !auth.token) currentRandomMediaItemPromise.set(undefined);
});

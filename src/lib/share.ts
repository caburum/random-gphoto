import type { GoogleMediaItem } from './photoslibrary';
import { get, writable } from 'svelte/store';
import { snackbar } from './stores';

export const shareForceClipboard = writable(localStorage.getItem('shareForceClipboard') === 'true');
shareForceClipboard.subscribe((value) => localStorage.setItem('shareForceClipboard', String(value)));

export function isDesktop() {
	return window.matchMedia('(hover: hover)').matches;
}

export async function share(item: GoogleMediaItem) {
	if (!item) return;

	get(snackbar)?.({ message: 'loading image to share' });

	if (get(shareForceClipboard)) {
		const width = Number(item.mediaMetadata.width);
		const res = await fetch(
			`/api/proxy?url=${encodeURIComponent(`${item.baseUrl}=w${width < 1000 ? width : width / 2}-rp`)}`
		);
		const blob = await res.blob();

		// doesn't support jpeg, png images only
		navigator.clipboard
			.write([
				new ClipboardItem({
					[blob.type]: blob
				})
			])
			.then(() => {
				get(snackbar)?.({ message: 'image copied to clipboard' });
			});
	} else if (navigator.share) {
		const res = await fetch(`/api/proxy?url=${encodeURIComponent(item.baseUrl + '=d')}`);
		const blob = await res.blob();

		await navigator.share({
			title: item.filename,
			files: [new File([blob], item.filename, { type: blob.type })]
		});
	}
}

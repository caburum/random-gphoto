<script lang="ts">
	import { Button, Switch } from 'm3-svelte';
	import { authState } from './lib/auth';
	import { DbMediaItemSeen, db } from './lib/db';
	import { updateMedia } from './lib/photoslibrary';
	import { liveQuery } from 'dexie';
	import { shareForceClipboard } from './lib/share';
	import { mediaCount, snackbar } from './lib/stores';

	const dangerStyle = {
		style: 'background-color: rgb(var(--m3-scheme-error-container)); --text: var(--m3-scheme-on-error-container);'
	};

	let neverShownAgainCount = liveQuery(() =>
		db.mediaItems.where({ user: $authState.id, seen: DbMediaItemSeen.NeverShowAgain }).count()
	);
	let currentlyUpdating = false;
</script>

<h1>settings</h1>

<hr />

<h2>account</h2>
<p>logged in as {$authState.name} &lt;{$authState.email}&gt;</p>
<!-- <button on:click={() => ($authState = { ...$authState, token: 'invalid' })}>break token</button> -->

<hr />

<h2>albums</h2>
<!-- todo: -->

<hr />

<h2>
	media{#if $mediaCount !== undefined}&nbsp;({$mediaCount}){/if}
</h2>
<p class="center">
	note: only media added since the previous update will be included,<br />
	and any media archived since the previous update will remain until randomly selected
</p>
<Button
	type="filled"
	disabled={currentlyUpdating}
	on:click={async () => {
		currentlyUpdating = true;
		const { added, total } = await updateMedia($authState);
		$snackbar?.({ message: `added ${added}/${total} newer media items` });
		currentlyUpdating = false;
	}}>update media</Button
>
<Button
	type="filled"
	on:click={() =>
		$authState.id &&
		db.mediaItems
			.where({ user: $authState.id, seen: DbMediaItemSeen.NeverShowAgain })
			.modify({ seen: DbMediaItemSeen.True })}
	>clear never shown again{#if $neverShownAgainCount !== undefined}&nbsp;({$neverShownAgainCount}){/if}</Button
>

<!-- todo: compression setings -->

<hr />

<h2>database</h2>
<Button
	type="filled"
	extraOptions={dangerStyle}
	on:click={() =>
		$authState.id &&
		db.mediaItems
			.where('user')
			.equals($authState.id)
			.delete()
			.then((deleteCount) => console.log(`deleted ${deleteCount}`))}>clear current user cache</Button
>
<Button type="filled" extraOptions={dangerStyle} on:click={() => db.delete().then(() => location.reload())}
	>nuke database</Button
>

<hr />

<h2>sharing</h2>
<label for={undefined}>
	<Switch bind:checked={$shareForceClipboard} />
	<p>copy shared image to clipboard (will scale down & use png, useful for desktop)</p>
</label>

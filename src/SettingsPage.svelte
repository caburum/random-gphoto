<script lang="ts">
	import { Button } from 'm3-svelte';
	import { authState } from './lib/auth';
	import { DbMediaItemSeen, db } from './lib/db';
	import { updateMedia } from './lib/photoslibrary';
	import { liveQuery } from 'dexie';

	const errorStyle = {
		style: 'background-color: rgb(var(--m3-scheme-error-container)); --text: var(--m3-scheme-on-error-container);'
	};

	let mediaCount = liveQuery(() => db.mediaItems.where({ user: $authState.id }).count());
	let neverShownAgainCount = liveQuery(() =>
		db.mediaItems.where({ user: $authState.id, seen: DbMediaItemSeen.NeverShowAgain }).count()
	);
	let updateMediaCount: string | undefined;
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

<h2>media ({$mediaCount})</h2>
<Button
	type="filled"
	on:click={async () => {
		const { added, total } = await updateMedia($authState);
		updateMediaCount = `${added}/${total}`;
	}}>update media</Button
>
{#if updateMediaCount !== undefined}
	<p>added {updateMediaCount} newer media items</p>
{/if}
<Button
	type="filled"
	on:click={() =>
		$authState.id &&
		db.mediaItems
			.where({ user: $authState.id, seen: DbMediaItemSeen.NeverShowAgain })
			.modify({ seen: DbMediaItemSeen.True })}>clear never shown again ({$neverShownAgainCount})</Button
>

<!-- todo: compression setings -->

<hr />

<h2>database</h2>
<Button
	type="filled"
	extraOptions={errorStyle}
	on:click={() =>
		$authState.id &&
		db.mediaItems
			.where('user')
			.equals($authState.id)
			.delete()
			.then((deleteCount) => console.log(`deleted ${deleteCount}`))}>clear current user cache</Button
>
<Button type="filled" extraOptions={errorStyle} on:click={() => db.delete().then(() => location.reload())}
	>nuke database</Button
>

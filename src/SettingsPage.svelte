<script lang="ts">
	import { authState } from './lib/auth';
	import { db } from './lib/db';
	import { updateMedia } from './lib/photoslibrary';
</script>

<h1>settings</h1>

<h2>account</h2>
<p>logged in as {$authState.name} &lt;{$authState.email}&gt;</p>

<h2>database</h2>
<button on:click={() => updateMedia($authState)}>update media</button>
<button
	class="warning"
	on:click={() =>
		$authState.id &&
		db.mediaItems
			.where('user')
			.equals($authState.id)
			.delete()
			.then((deleteCount) => console.log(`deleted ${deleteCount}`))}>clear current user cache</button
>
<button class="danger" on:click={() => db.delete().then(() => location.reload())}>nuke database</button>

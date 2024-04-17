<script lang="ts">
	import LoadingRing from './lib/LoadingRing.svelte';
	import { authState } from './lib/auth';
	import { getRandomMediaItem } from './lib/photoslibrary';

	let mediaItem: ReturnType<typeof getRandomMediaItem>;
</script>

<h1>app</h1>

{#if $authState.id}
	<div>
		<button on:click={() => (mediaItem = getRandomMediaItem($authState))}>get random media item</button>
	</div>
	{#await mediaItem}
		<LoadingRing />
	{:then item}
		{#if item}
			<a href={`${item.productUrl}?authuser=${$authState.email}`} target="_blank" rel="noopener">
				<!-- https://gist.github.com/Sauerstoffdioxid/2a0206da9f44dde1fdfce290f38d2703 for url paramters -->
				{#if item.mediaMetadata.photo}
					<img
						class="media"
						src={`${item.baseUrl}=w${Math.ceil(window.innerWidth * 1.5)}-h${Math.ceil(window.innerHeight * 1.5)}-rw-v1`}
						alt={item.filename}
						style:max-width={`min(100%, ${item.mediaMetadata.width}px)`}
						style:max-height={`min(100%, ${item.mediaMetadata.height}px)`}
					/>
				{:else if item.mediaMetadata.video}
					<!-- svelte-ignore a11y-media-has-caption -->
					<video
						class="media"
						controls
						preload="none"
						poster={`${item.baseUrl}=w${window.screen.width}-h${window.screen.height}-no-rw-v2`}
					>
						<source src={`${item.baseUrl}=dv`} type={item.mimeType} />
					</video>
				{:else}
					<p>no preview</p>
				{/if}
			</a>
		{:else}
			<p>no media items</p>
		{/if}
	{:catch error}
		<p>{error.message}</p>
	{/await}
{/if}

<style>
	.media {
		max-width: 100%;
		max-height: 100%;
	}
</style>

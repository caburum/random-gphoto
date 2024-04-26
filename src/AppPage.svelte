<script lang="ts">
	import { Button, CheckboxAnim, CircularProgressIndeterminate, Icon } from 'm3-svelte';
	import iconDice from '@ktibow/iconset-material-symbols/casino-outline';
	import iconCalendar from '@ktibow/iconset-material-symbols/today';
	import iconCamera from '@ktibow/iconset-material-symbols/camera-outline';
	import iconImage from '@ktibow/iconset-material-symbols/image-outline';
	import { authState } from './lib/auth';
	import { getRandomMediaItem } from './lib/photoslibrary';
	import { currentRandomMediaItemPromise } from './lib/stores';
	import { DbMediaItemSeen, createSeenWritable } from './lib/db';

	function prettyNumber(n: number, decimals: number): string {
		return Number(n.toFixed(decimals)).toString();
	}

	function prettyExposureTime(exposureTimeS: string): string {
		let exposureTime = parseFloat(exposureTimeS);
		if (exposureTime < 1) return `1/${Math.round(1 / exposureTime)}`;
		return prettyNumber(exposureTime, 2);
	}

	let loading = false;
	let seenWritable: ReturnType<typeof createSeenWritable> | undefined;
	$: if ($currentRandomMediaItemPromise) {
		loading = true;
		$currentRandomMediaItemPromise.then((item) => {
			console.log('currentRandomMediaItem', item);
			if ($authState.id && item) seenWritable = createSeenWritable($authState.id, item.id);
			if (!item) loading = false;
		});
	}
</script>

{#if $authState.id}
	<div>
		<Button
			type="filled"
			iconType="left"
			on:click={() => ($currentRandomMediaItemPromise = getRandomMediaItem($authState))}
			><Icon icon={iconDice} /> get random media item</Button
		>
	</div>
	<CircularProgressIndeterminate display={loading ? 'inline-flex' : 'none'} />
	{#await $currentRandomMediaItemPromise then item}
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
						on:load={() => (loading = false)}
						style:display={loading ? 'none' : null}
					/>
				{:else if item.mediaMetadata.video}
					<!-- svelte-ignore a11y-media-has-caption -->
					<video
						class="media"
						controls
						preload="none"
						poster={`${item.baseUrl}=w${window.screen.width}-h${window.screen.height}-no-rw-v2`}
						on:loadstart={() => (loading = false)}
					>
						<source src={`${item.baseUrl}=dv`} type={item.mimeType} />
					</video>
				{:else}
					<p>no preview</p>
				{/if}
			</a>
			{#if item.description}
				<p>{item.description}</p>
			{/if}
			<!-- recreated metadata from google photos ui -->
			<dl>
				<div>
					<dt>
						<Icon icon={iconCalendar} width="24px" height="24px" />
					</dt>
					<dd>
						<div class="m3-font-label-large">
							{new Intl.DateTimeFormat(undefined, {
								dateStyle: 'medium'
							}).format(new Date(item.mediaMetadata.creationTime))}
						</div>
						<div class="m3-font-label-small">
							<span
								>{new Intl.DateTimeFormat(undefined, {
									weekday: 'short'
								}).format(new Date(item.mediaMetadata.creationTime))},
								{new Intl.DateTimeFormat(undefined, {
									timeStyle: 'short'
								}).format(new Date(item.mediaMetadata.creationTime))}
							</span>
							<!-- more user friendly time zone -->
							<span
								>{new Intl.DateTimeFormat(undefined, {
									timeZoneName: 'short'
								})
									.formatToParts(new Date(item.mediaMetadata.creationTime))
									.find((p) => p.type === 'timeZoneName')?.value}</span
							>
						</div>
					</dd>
				</div>
				{#if (item.mediaMetadata.photo && Object.keys(item.mediaMetadata.photo).length > 0) || (item.mediaMetadata.video && Object.keys(item.mediaMetadata.video).length > 0)}
					<div>
						<dt>
							<Icon icon={iconCamera} width="24px" height="24px" />
						</dt>
						<dd>
							<div class="m3-font-label-large">
								{item.mediaMetadata.photo?.cameraModel || item.mediaMetadata.video?.cameraModel || ''}
							</div>
							<div class="m3-font-label-small">
								{#if item.mediaMetadata.photo?.apertureFNumber}<span title="aperture"
										>ƒ/{item.mediaMetadata.photo.apertureFNumber}</span
									>{/if}
								{#if item.mediaMetadata.photo?.exposureTime}<span title="exposure time"
										>{prettyExposureTime(item.mediaMetadata.photo.exposureTime)}s</span
									>{/if}
								{#if item.mediaMetadata.photo?.focalLength}<span title="focal length"
										>{item.mediaMetadata.photo.focalLength}mm</span
									>{/if}
								{#if item.mediaMetadata.photo?.isoEquivalent}<span title="ISO"
										>ISO{item.mediaMetadata.photo.isoEquivalent}</span
									>{/if}
								{#if item.mediaMetadata.video?.fps}<span title="fps"
										>{prettyNumber(item.mediaMetadata.video.fps, 2)}fps</span
									>{/if}
							</div>
						</dd>
					</div>
				{/if}
				<div>
					<dt>
						<Icon icon={iconImage} width="24px" height="24px" />
					</dt>
					<dd>
						<div class="m3-font-label-large">{item.filename}</div>
						<div class="m3-font-label-small">
							<span
								>{Number(
									((Number(item.mediaMetadata.width) * Number(item.mediaMetadata.height)) / 1e6).toFixed(1)
								)}MP</span
							>
							<span>{item.mediaMetadata.width}&hairsp;&times;&hairsp;{item.mediaMetadata.height}</span>
						</div>
					</dd>
				</div>
			</dl>
			<div class="vertical">
				<!-- <Button
					type="filled"
					on:click={async () => console.log(await db.mediaItems.get({ user: $authState.id, id: item.id }))}
					>get item</Button
				> -->
				<!-- todo: add copy original to clipboard/share button -->
				{#if seenWritable}
					<label>
						<CheckboxAnim>
							<!-- checkbox will always be false initially as seen must be 0-1 -->
							<input
								type="checkbox"
								checked={$seenWritable === DbMediaItemSeen.NeverShowAgain}
								on:change={({ currentTarget }) =>
									seenWritable?.set(currentTarget.checked ? DbMediaItemSeen.NeverShowAgain : DbMediaItemSeen.True)}
							/>
						</CheckboxAnim>
						<p>never shown again</p>
					</label>
				{/if}
			</div>
		{:else if $currentRandomMediaItemPromise !== undefined}
			<!-- not in the inital state before the first item was loaded -->
			<p>no media items</p>
		{/if}
	{:catch error}
		<p>{error?.message}</p>
	{/await}
{/if}

<style lang="scss">
	.media {
		max-width: 100%;
		max-height: 100%;
	}

	dl {
		display: flex;
		flex-wrap: wrap;
		gap: 1.25em;

		> div {
			display: flex;
			gap: 0.5em;
		}

		dt,
		dd {
			display: grid;
			place-content: center;
			:global(svg) {
				color: rgba(var(--m3-scheme-primary) / 50%);
			}
		}

		dd .m3-font-label-small {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			gap: 0.75em;
		}
	}
</style>

<script lang="ts">
	import { authState, login, logout } from './lib/auth';
	import { routes, currentPage } from './lib/routing';
	import { StyleFromScheme, Button, CircularProgressIndeterminate, SnackbarAnim } from 'm3-svelte';
	import { snackbar } from './lib/stores';

	const routeNames = Object.keys(routes) as Array<keyof typeof routes>;
</script>

<!-- generated from #2962FF, neutral -->
<!-- prettier-ignore -->
<StyleFromScheme
	lightScheme={{"primary":4284178028,"onPrimary":4294967295,"primaryContainer":4292927987,"onPrimaryContainer":4279769895,"inversePrimary":4291085782,"secondary":4284309095,"onSecondary":4294967295,"secondaryContainer":4293059052,"onSecondaryContainer":4279900963,"tertiary":4284046706,"onTertiary":4294967295,"tertiaryContainer":4292796921,"onTertiaryContainer":4279638828,"error":4290386458,"onError":4294967295,"errorContainer":4294957782,"onErrorContainer":4282449922,"background":4294768890,"onBackground":4280032029,"surface":4294768890,"onSurface":4280032029,"surfaceVariant":4293255907,"onSurfaceVariant":4282861128,"inverseSurface":4281413682,"inverseOnSurface":4294177009,"outline":4286084728,"outlineVariant":4291348167,"shadow":4278190080,"scrim":4278190080,"surfaceDim":4292663771,"surfaceBright":4294768890,"surfaceContainerLowest":4294967295,"surfaceContainerLow":4294374388,"surfaceContainer":4293979631,"surfaceContainerHigh":4293650409,"surfaceContainerHighest":4293255907,"surfaceTint":4284178028}}
	darkScheme={{"primary":4291085782,"onPrimary":4281151549,"primaryContainer":4282598996,"onPrimaryContainer":4292927987,"inversePrimary":4284178028,"secondary":4291216848,"onSecondary":4281282616,"secondaryContainer":4282730063,"onSecondaryContainer":4293059052,"tertiary":4290954717,"onTertiary":4281020482,"tertiaryContainer":4282533465,"onTertiaryContainer":4292796921,"error":4294948011,"onError":4285071365,"errorContainer":4287823882,"onErrorContainer":4294957782,"background":4279440149,"onBackground":4293255907,"surface":4279440149,"onSurface":4293255907,"surfaceVariant":4282861128,"onSurfaceVariant":4291348167,"inverseSurface":4293255907,"inverseOnSurface":4281413682,"outline":4287795346,"outlineVariant":4282861128,"shadow":4278190080,"scrim":4278190080,"surfaceDim":4279440149,"surfaceBright":4281940282,"surfaceContainerLowest":4279111183,"surfaceContainerLow":4280032029,"surfaceContainer":4280295201,"surfaceContainerHigh":4280953387,"surfaceContainerHighest":4281676854,"surfaceTint":4291085782}}
/>

<header>
	<!-- todo: create icon & favicon -->
	<h1>random-gphoto</h1>
	<nav>
		{#each routeNames as route}
			<Button
				on:click={() => ($currentPage = route)}
				type={$currentPage === route && $authState.state == 'success' ? 'tonal' : 'outlined'}
				disabled={$authState.state !== 'success'}>{route}</Button
			>
		{/each}
		<Button type="outlined" on:click={() => logout()} disabled={$authState.state !== 'success'}>logout</Button>
	</nav>
</header>

<main class="vertical">
	{#if $authState.state === 'loading'}
		<CircularProgressIndeterminate />
	{:else if $authState.state === 'success'}
		<svelte:component this={routes[$currentPage]} />
	{:else}
		<!-- todo: switch to google button to support fedcm -->
		<Button type="filled" on:click={() => login()}>login with google</Button>
		{#if $authState.state !== 'none'}
			<h1>auth error</h1>
			<p>{$authState.message}</p>
		{/if}
	{/if}
</main>

<SnackbarAnim bind:show={$snackbar} />

<style lang="scss">
	header {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--gap);
		& :first-child {
			margin: 0;
			margin-right: auto;
			line-height: 1;
		}
		nav {
			display: flex;
			// flex-wrap: wrap;
			gap: var(--gap);

			// diy segmented button
			> :global(button) {
				border: 0.0625rem solid rgb(var(--m3-scheme-outline)) !important;
			}
			> :global(button):not(:first-child):not(:last-child) {
				border-radius: 0;
				border-right: none !important;
			}
			> :global(button):first-child {
				border-top-right-radius: 0;
				border-bottom-right-radius: 0;
				border-right: none !important;
			}
			> :global(button):last-child {
				border-top-left-radius: 0;
				border-bottom-left-radius: 0;
			}
		}
	}
</style>

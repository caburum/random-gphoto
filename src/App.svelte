<script lang="ts">
	import { authState, login, logout } from './lib/auth';
	import { routes, currentPage } from './lib/routing';
	import { snackbar } from './lib/stores';
	import { StyleFromScheme, Button, CircularProgressIndeterminate, Snackbar } from 'm3-svelte';

	const navRouteNames = (Object.keys(routes) as Array<keyof typeof routes>).filter((r) => !routes[r].hidden);
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
		{#each navRouteNames as route}
			<Button
				on:click={() => ($currentPage = route)}
				type={$currentPage === route ? 'tonal' : 'outlined'}
				disabled={$authState.state !== 'success' && !routes[route].noAuth}>{routes[route].name}</Button
			>
		{/each}
		<Button type="outlined" on:click={() => logout()} disabled={$authState.state !== 'success'}>logout</Button>
	</nav>
</header>

<main class="vertical">
	{#if $authState.state === 'loading'}
		<CircularProgressIndeterminate />
	{:else if $authState.state === 'success' || (routes[$currentPage].noAuth && $currentPage !== '')}
		<svelte:component this={routes[$currentPage].page} />
	{:else}
		<!-- todo: switch to google button to support fedcm -->
		<Button type="outlined" iconType="left" on:click={() => login()}>
			<!-- prettier-ignore -->
			<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlns:xlink="http://www.w3.org/1999/xlink">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
      </svg>
			Sign in with Google</Button
		>
		{#if $authState.state !== 'none'}
			<h1>auth error</h1>
			<p>{$authState.message}</p>
		{/if}
		<p>random-gphoto is a tool to view media from your google photos library in a random order</p>

		<Button type="text" on:click={() => ($currentPage = 'privacy-policy')}>privacy policy</Button>
	{/if}
</main>

<Snackbar bind:show={$snackbar} />

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

<script lang="ts">
	import { authState, login, logout } from './lib/auth';
	import { routes, currentPage } from './lib/routing';
	import LoadingRing from './lib/LoadingRing.svelte';

	const routeNames = Object.keys(routes) as Array<keyof typeof routes>;
</script>

<header>
	<h1>random-gphoto</h1>
	<div>
		{#each routeNames as route}
			<button
				on:click={() => ($currentPage = route)}
				class:active={$currentPage === route}
				disabled={$authState.state !== 'success'}>{route}</button
			>
		{/each}
		<button on:click={logout} disabled={$authState.state !== 'success'}>logout</button>
	</div>
</header>

<main>
	{#if $authState.state === 'loading'}
		<LoadingRing />
	{:else if $authState.state === 'success'}
		<svelte:component this={routes[$currentPage]} />
	{:else}
		<button on:click={() => login()}>login with google</button>
		{#if $authState.state !== 'none'}
			<h1>auth error</h1>
			<p>{$authState.message}</p>
		{/if}
	{/if}
</main>

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
		div {
			display: flex;
			flex-wrap: wrap;
			gap: var(--gap);
		}
	}

	main {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--gap);
	}
</style>

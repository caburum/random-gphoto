<script lang="ts">
	import { authState, login, logout } from './lib/auth';
	import LoadingRing from './lib/LoadingRing.svelte';
</script>

<header>
	<h1>random-gphoto</h1>
	{#if $authState.state == 'success'}
		<div>
			<button>settings</button>
			<button on:click={logout}>logout</button>
		</div>
	{/if}
</header>

<main>
	{#if $authState.state === 'loading'}
		<LoadingRing />
	{:else if $authState.state === 'success'}
		<p>hi</p>
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
	}
</style>

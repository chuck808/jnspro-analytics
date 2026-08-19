<script lang="ts">
	import SiteHeader from '$lib/components/public/SiteHeader.svelte';
	import SiteFooter from '$lib/components/public/SiteFooter.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&family=Barlow+Condensed:wght@600;700;800&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="public-shell">
	<SiteHeader />
	<main class="public-main">
		{@render children()}
	</main>
	<SiteFooter />
</div>

<style>
	:global(body) {
		margin: 0;
		background: #080707;
	}
	.public-shell {
		font-family: 'Barlow', system-ui, sans-serif;
		background: #080707;
		color: #f0ece4;
		overflow-x: hidden;
	}
	.public-main {
		padding-top: 80px;
	}

	@media (max-width: 768px) {
		.public-main {
			padding-top: 64px;
		}
	}
</style>

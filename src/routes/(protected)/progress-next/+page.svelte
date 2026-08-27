<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Progress Next — AppGatePro</title>
</svelte:head>

<div class="progress-next-shell">
	<header>
		<p>Progress preview</p>
		<h1>Performance, without the old dashboard.</h1>
		<span>{data.sessionCount} eligible session{data.sessionCount === 1 ? '' : 's'}</span>
	</header>
</div>

<style>
	.progress-next-shell {
		min-height: calc(100vh - 5rem);
		margin: -2rem;
		padding: clamp(1.5rem, 4vw, 4rem);
		background: #06111d;
		color: #f7fbff;
	}

	header {
		max-width: 72rem;
	}

	p,
	span {
		color: #7f93a8;
	}

	p {
		margin: 0;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}

	h1 {
		margin: 0.75rem 0;
		max-width: 18ch;
		font-size: clamp(2rem, 5vw, 4.75rem);
		line-height: 0.98;
		letter-spacing: -0.045em;
	}
</style>

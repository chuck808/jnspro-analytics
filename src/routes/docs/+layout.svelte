<script lang="ts">
	import { page } from '$app/stores';
	import { chapters } from '$lib/docs/contents';
	import { P, A } from 'flowbite-svelte';

	let { data, children } = $props();

	let currentSlug = $derived($page.params.chapter ?? '');
	let sidebarOpen = $state(false);

	function closeSidebar() {
		sidebarOpen = false;
	}

	function navClass(slug: string) {
		return currentSlug === slug ? 'nav-item nav-item--active' : 'nav-item';
	}
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;1,9..144,300&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<!-- Mobile overlay -->
{#if sidebarOpen}
	<div
		class="sidebar-overlay"
		role="button"
		tabindex="-1"
		aria-label="Close navigation"
		onclick={closeSidebar}
		onkeydown={(e) => e.key === 'Enter' && closeSidebar()}
	></div>
{/if}

<!-- Docs header -->
<header class="docs-header">
	<button
		class="menu-toggle"
		onclick={() => (sidebarOpen = !sidebarOpen)}
		aria-label="Toggle navigation"
		aria-expanded={sidebarOpen}
	>
		<svg
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
		>
			<path d="M3 12h18M3 6h18M3 18h18" />
		</svg>
	</button>

	<a href="/docs" class="docs-logo">
		<div class="docs-logo-mark">AP</div>
		<div>
			<div class="docs-logo-name">AppGatePro</div>
			<div class="docs-logo-sub">Documentation</div>
		</div>
	</a>

	<nav class="docs-site-links">
		<a href="/" class="docs-site-link">Home</a>
		<a href="/about" class="docs-site-link">About</a>
		<a href="/contact" class="docs-site-link">Contact</a>
	</nav>

	<a href={data.claims ? '/dashboard' : '/'} class="back-to-app">
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
		>
			<path d="M19 12H5m7-7-7 7 7 7" />
		</svg>
		Back to app
	</a>
</header>

<div class="docs-layout">
	<!-- Sidebar -->
	<nav
		class="docs-sidebar {sidebarOpen ? 'docs-sidebar--open' : ''}"
		aria-label="Documentation navigation"
	>
		<div class="sidebar-section-label">Chapters</div>

		{#each chapters as ch}
			<a href="/docs/{ch.slug}" class={navClass(ch.slug)} onclick={closeSidebar}>
				<span class="nav-icon">{ch.icon}</span>
				<span class="nav-label">{ch.title}</span>
			</a>
		{/each}

		<div class="sidebar-footer">
			<P size="xs">
				Questions?
				<A href="mailto:support@jnsprosystems.com">support@jnsprosystems.com</A>
			</P>
			<P size="xs">Or use the feedback button inside the app.</P>
		</div>
	</nav>

	<!-- Main content -->
	<main class="docs-main" id="docs-main">
		{@render children()}
	</main>
</div>

<style>
	/* ── Layout shell ─────────────────────────────────── */
	:global(body) {
		background: var(--theme-bg);
	}

	.docs-header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 100;
		height: 56px;
		background: var(--theme-surface);
		border-bottom: 1px solid var(--theme-border);
		display: flex;
		align-items: center;
		padding: 0 1.25rem;
		gap: 1rem;
	}

	.docs-logo {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		text-decoration: none;
		flex-shrink: 0;
	}
	.docs-logo-mark {
		width: 30px;
		height: 30px;
		background: var(--color-jns-amber);
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: 'DM Mono', monospace;
		font-size: 13px;
		font-weight: 500;
		color: var(--theme-bg);
		flex-shrink: 0;
	}
	.docs-logo-name {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--theme-text-primary);
		line-height: 1.1;
		font-family: 'Fraunces', serif;
	}
	.docs-logo-sub {
		font-size: 0.65rem;
		color: var(--theme-text-subtle);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		line-height: 1;
	}

	.docs-site-links {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		margin: 0 auto;
	}
	.docs-site-link {
		font-size: 0.82rem;
		font-weight: 500;
		color: var(--theme-text-subtle);
		text-decoration: none;
		transition: color 0.15s;
	}
	.docs-site-link:hover {
		color: var(--color-jns-amber);
	}

	.back-to-app {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.8rem;
		color: var(--theme-text-subtle);
		text-decoration: none;
		padding: 0.35rem 0.75rem;
		border: 1px solid var(--theme-border);
		border-radius: 7px;
		transition:
			color 0.15s,
			border-color 0.15s;
		flex-shrink: 0;
	}
	.back-to-app:hover {
		color: var(--color-jns-amber);
		border-color: var(--color-jns-amber);
	}

	.menu-toggle {
		display: none;
		background: none;
		border: none;
		color: var(--theme-text-secondary);
		cursor: pointer;
		padding: 0.35rem;
		border-radius: 6px;
		align-items: center;
		justify-content: center;
	}
	.menu-toggle:hover {
		color: var(--theme-text-primary);
		background: var(--theme-border);
	}

	.docs-layout {
		display: flex;
		margin-top: 56px;
		min-height: calc(100vh - 56px);
	}

	/* ── Sidebar ──────────────────────────────────────── */
	.docs-sidebar {
		width: 272px;
		flex-shrink: 0;
		position: fixed;
		top: 56px;
		left: 0;
		bottom: 0;
		overflow-y: auto;
		background: var(--theme-surface);
		border-right: 1px solid var(--theme-border);
		padding: 1.25rem 0.75rem;
		transition: transform 0.25s ease;
	}

	.sidebar-section-label {
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--theme-text-subtle);
		font-weight: 600;
		padding: 0 0.75rem;
		margin-bottom: 0.5rem;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		width: 100%;
		padding: 0.55rem 0.75rem;
		border-radius: 8px;
		cursor: pointer;
		text-decoration: none;
		transition: background 0.12s;
		margin-bottom: 2px;
	}
	.nav-item:hover {
		background: var(--theme-border);
	}
	.nav-item--active {
		background: color-mix(in srgb, var(--color-jns-amber) 12%, transparent);
	}
	.nav-icon {
		font-size: 1rem;
		width: 1.4rem;
		text-align: center;
		flex-shrink: 0;
	}
	.nav-label {
		font-size: 0.83rem;
		color: var(--theme-text-secondary);
		font-weight: 500;
		white-space: nowrap;
	}
	.nav-item:hover .nav-label {
		color: var(--theme-text-primary);
	}
	.nav-item--active .nav-label {
		color: var(--color-jns-amber);
	}

	.sidebar-footer {
		margin-top: 1.5rem;
		padding: 1rem 0.75rem 0;
		border-top: 1px solid var(--theme-border);
		font-size: 0.75rem;
		color: var(--theme-text-subtle);
		line-height: 1.6;
	}
	.sidebar-footer :global(p) {
		margin-bottom: 0.25rem;
	}
	.sidebar-footer :global(a) {
		color: var(--color-jns-amber);
		text-decoration: none;
	}
	.sidebar-footer :global(a:hover) {
		text-decoration: underline;
	}

	/* ── Main ─────────────────────────────────────────── */
	.docs-main {
		flex: 1;
		margin-left: 272px;
		padding: 3rem 2.5rem 6rem;
		max-width: 1400px;
		margin-right: auto;
	}

	/* ── Mobile overlay ───────────────────────────────── */
	.sidebar-overlay {
		display: block;
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.55);
		backdrop-filter: blur(2px);
		z-index: 49;
	}

	/* ── Responsive ───────────────────────────────────── */
	@media (max-width: 768px) {
		.docs-sidebar {
			transform: translateX(-100%);
			z-index: 50;
			box-shadow: 4px 0 24px rgba(0, 0, 0, 0.4);
		}
		.docs-sidebar--open {
			transform: translateX(0);
		}
		.docs-main {
			margin-left: 0;
			padding: 1.5rem 1rem 5rem;
		}
		.menu-toggle {
			display: flex;
		}
		.docs-site-links {
			display: none;
		}
	}
</style>

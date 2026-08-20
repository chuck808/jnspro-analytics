<script lang="ts">
	import { page } from '$app/stores';
	import type { Database } from '$lib/types/database.types';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import ThemeLogo from '$lib/components/ThemeLogo.svelte';

	type Profile = Database['public']['Tables']['profiles']['Row'];

	let { user }: { user?: Profile | null } = $props();

	const titles: Record<string, string> = {
		'/dashboard': 'Home',
		'/analytics': 'Progress',
		'/sessions': 'Sessions',
		'/goals': 'Goals',
		'/leaderboard': 'Compare',
		'/upload': 'Upload Session',
		'/profile': 'Rider Profile',
		'/settings': 'Settings',
		'/help': 'Help',
		'/coach': 'Coach',
		'/admin': 'Admin',
		'/admin/users': 'Users'
	};

	let pageTitle = $derived(
		titles[$page.url.pathname] ??
			($page.url.pathname.startsWith('/sessions/')
				? 'Session Detail'
				: $page.url.pathname.startsWith('/analytics/')
					? 'Progress'
					: $page.url.pathname.startsWith('/coach/')
						? 'Coach'
						: $page.url.pathname.startsWith('/admin/')
							? 'Admin'
							: 'AppGatePro')
	);

	let firstName = $derived(user?.name?.split(' ')[0] ?? null);

	function toggleMobileMenu() {
		const sidebar = document.getElementById('sidebar');
		if (sidebar) sidebar.classList.toggle('-translate-x-full');
	}
</script>

<nav
	aria-label="Top navigation"
	class="fixed top-0 right-0 left-0 z-30 flex h-20 items-center gap-4
            border-b border-[#221c18] bg-[#0a0809] px-4 md:left-64 md:px-6"
>
	<!-- Mobile menu toggle -->
	<button
		onclick={toggleMobileMenu}
		aria-label="Toggle sidebar"
		aria-controls="sidebar"
		class="rounded-lg p-2 text-[#9a8f7a] transition-colors hover:bg-[#221c18]
               hover:text-[#f0ece4] focus:ring-2
               focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[color:var(--theme-surface)] focus:outline-none md:hidden"
	>
		<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M4 6h16M4 12h16M4 18h16"
			/>
		</svg>
	</button>

	<!-- Compact logo (mobile only) -->
	<ThemeLogo variant="compact" alt="AppGatePro" class="h-12 w-auto md:hidden" />

	<!-- Page title -->
	<h1 class="page-title truncate text-2xl font-bold text-[#f0ece4]" id="page-title">{pageTitle}</h1>

	<!-- Right side -->
	<div class="ml-auto flex flex-shrink-0 items-center gap-2">
		<!-- Upload shortcut -->
		<a
			href="/upload"
			class="hidden items-center gap-1.5 rounded-lg bg-[#f5a623] px-3 py-1.5
                   text-xs font-semibold text-[#0a0809] transition-colors
                   hover:bg-[#c97e0a] focus:ring-2
                   focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[color:var(--theme-surface)] focus:outline-none sm:flex"
		>
			<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
				/>
			</svg>
			Upload
		</a>

		<!-- Beta badge -->
		<span
			class="hidden items-center rounded border border-[#f5a623]/20 bg-[#f5a623]/10 px-2 py-1
                     text-xs font-medium text-[#f5a623] md:inline-flex"
		>
			Beta
		</span>

		<!-- Theme Toggle -->
		<ThemeToggle />

		<!-- Sign out pill — always visible -->
		<a
			href="/auth/sign-out"
			class="flex items-center gap-1.5 rounded-lg border border-[#221c18] bg-[#131010]
                   px-3 py-1.5 text-xs font-medium text-[#9a8f7a]
                   transition-colors hover:border-[#ff4444]/40 hover:bg-[#ff4444]/5
                   hover:text-[#ff4444]
                   focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[color:var(--theme-surface)] focus:outline-none"
		>
			<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
				/>
			</svg>
			{#if firstName}
				<span class="hidden sm:inline">{firstName}</span>
			{:else}
				<span class="hidden sm:inline">Sign out</span>
			{/if}
		</a>
	</div>
</nav>

<style>
	.page-title {
		font-family: 'Barlow Condensed', 'Barlow', system-ui, sans-serif;
		letter-spacing: 0.01em;
	}
</style>

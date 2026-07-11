<script lang="ts">
	import { page } from '$app/stores';
	import type { Database } from '$lib/types/database.types';
	import ThemeLogo from '$lib/components/ThemeLogo.svelte';

	type Profile = Database['public']['Tables']['profiles']['Row'];

	let { user }: { user: Profile | null } = $props();

	function closeSidebar() {
		const sidebar = document.getElementById('sidebar');
		if (sidebar) sidebar.classList.add('-translate-x-full');
	}

	// Training & Performance
	const trainingItems = [
		{
			label: 'Dashboard',
			href: '/dashboard',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>`
		},
		{
			label: 'Analytics',
			href: '/analytics',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>`
		},
		{
			label: 'Sessions',
			href: '/sessions',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>`
		},
		{
			label: 'Goals',
			href: '/goals',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>`
		}
	];

	// Tools
	const toolItems = [
		{
			label: 'Upload',
			href: '/upload',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>`
		}
	];

	// Account
	const accountItems = [
		{
			label: 'Profile',
			href: '/profile',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>`
		},
		{
			label: 'Settings',
			href: '/settings',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>`
		},
		{
			label: 'Help',
			href: '/help',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>`
		}
	];

	// Admin - Overview
	const adminOverviewItems = [
		{
			label: 'Admin Dashboard',
			href: '/admin',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>`
		}
	];

	// Admin - Analytics & Insights
	const adminAnalyticsItems = [
		{
			label: 'Analytics',
			href: '/admin/analytics',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>`
		},
		{
			label: 'Advanced Analytics',
			href: '/admin/thresholds',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>`
		},
		{
			label: 'Thresholds',
			href: '/admin/thresholds',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>`
		},
		{
			label: 'Research Data',
			href: '/admin/research',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>`
		},
		{
			label: 'Advanced Analytics',
			href: '/admin/advanced-analytics',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/>`
		},
		{
			label: 'Feedback Analytics',
			href: '/admin/feedback-analytics',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/>`
		}
	];

	// Admin - User Engagement
	const adminEngagementItems = [
		{
			label: 'Feedback',
			href: '/feedback',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>`
		},
		{
			label: 'Goals Intelligence',
			href: '/admin/goals-intelligence',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>`
		},
		{
			label: 'Leaderboard Admin',
			href: '/admin/leaderboard-admin',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>`
		}
	];

	// Admin - Content Management
	const adminContentItems = [
		{
			label: 'Documentation Manager',
			href: '/admin/docs-manager',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>`
		},
		{
			label: 'Email Templates',
			href: '/admin/email-templates',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>`
		},
		{
			label: 'Help FAQs',
			href: '/admin/help-faqs',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>`
		}
	];

	// Admin - System
	const adminSystemItems = [
		{
			label: 'Maintenance',
			href: '/admin/maintenance',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>`
		}
	];

	function isActive(href: string) {
		return (
			$page.url.pathname === href || ($page.url.pathname.startsWith(href) && href !== '/dashboard')
		);
	}

	// Extract session ID from URL if on a session detail page
	let currentSessionId = $derived.by(() => {
		const match = $page.url.pathname.match(/^\/sessions\/([^/]+)/);
		return match ? match[1] : null;
	});

	let isOnSessionDetail = $derived(currentSessionId !== null);
</script>

<aside
	class="themed-card fixed top-0 left-0 z-40 flex h-screen w-64 -translate-x-full
              flex-col border-r border-[color:var(--border)] transition-transform md:translate-x-0"
	id="sidebar"
	aria-label="Main navigation"
>
	<!-- Logo + Close button -->
	<div class="flex items-center gap-3 border-b border-[color:var(--border)] px-4 py-4">
		<!-- Close button (mobile only) -->
		<button
			onclick={closeSidebar}
			aria-label="Close sidebar"
			class="themed-text-secondary -ml-1 rounded-lg p-1.5 transition-colors hover:bg-[color:var(--border)]
                   hover:text-[color:var(--text-primary)] focus:ring-2
                   focus:ring-[color:var(--accent)] focus:ring-offset-2 focus:ring-offset-[color:var(--card)] focus:outline-none md:hidden"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M6 18L18 6M6 6l12 12"
				/>
			</svg>
		</button>
		<ThemeLogo variant="icon" alt="JNS Pro Systems" class="h-9 w-9 flex-shrink-0 object-contain" />
		<div>
			<p class="themed-accent text-sm leading-tight font-bold">AppGatePro</p>
			<p class="themed-text-subtle text-xs leading-tight">Analytics</p>
		</div>
	</div>

	<!-- Nav -->
	<nav aria-label="Primary navigation" class="flex-1 overflow-y-auto px-3 py-4">
		<!-- Training & Performance -->
		<div class="mb-6">
			<p class="mb-2 px-3 text-xs font-semibold tracking-wider text-[#6b5f4d] uppercase">
				Training & Performance
			</p>
			<ul class="space-y-1">
				{#each trainingItems as item}
					<!-- Hide Sessions link when viewing session details (it's in Session Pages instead) -->
					{#if !(isOnSessionDetail && item.href === '/sessions')}
						<li>
							<a
								href={item.href}
								onclick={closeSidebar}
								class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
                                       transition-colors
                                       focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[color:var(--theme-surface)] focus:outline-none
                                       {isActive(item.href)
									? 'border border-[#f5a623]/20 bg-[#f5a623]/10 text-[#f5a623]'
									: 'text-[#9a8f7a] hover:bg-[#221c18] hover:text-[#f0ece4]'}"
								aria-current={isActive(item.href) ? 'page' : undefined}
							>
								<svg
									class="h-5 w-5 flex-shrink-0"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									{@html item.icon}
								</svg>
								{item.label}
							</a>
						</li>
					{/if}
				{/each}
			</ul>
		</div>

		<!-- Tools -->
		<div class="mb-6">
			<p class="mb-2 px-3 text-xs font-semibold tracking-wider text-[#6b5f4d] uppercase">Tools</p>
			<ul class="space-y-1">
				{#each toolItems as item}
					<li>
						<a
							href={item.href}
							onclick={closeSidebar}
							class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
                                   transition-colors
                                   focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[color:var(--theme-surface)] focus:outline-none
                                   {isActive(item.href)
								? 'border border-[#f5a623]/20 bg-[#f5a623]/10 text-[#f5a623]'
								: 'text-[#9a8f7a] hover:bg-[#221c18] hover:text-[#f0ece4]'}"
							aria-current={isActive(item.href) ? 'page' : undefined}
						>
							<svg
								class="h-5 w-5 flex-shrink-0"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								{@html item.icon}
							</svg>
							{item.label}
						</a>
					</li>
				{/each}
			</ul>
		</div>

		<!-- Account -->
		<div class="mb-6">
			<p class="mb-2 px-3 text-xs font-semibold tracking-wider text-[#6b5f4d] uppercase">Account</p>
			<ul class="space-y-1">
				{#each accountItems as item}
					<li>
						<a
							href={item.href}
							onclick={closeSidebar}
							class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
                                   transition-colors
                                   focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[color:var(--theme-surface)] focus:outline-none
                                   {isActive(item.href)
								? 'border border-[#f5a623]/20 bg-[#f5a623]/10 text-[#f5a623]'
								: 'text-[#9a8f7a] hover:bg-[#221c18] hover:text-[#f0ece4]'}"
							aria-current={isActive(item.href) ? 'page' : undefined}
						>
							<svg
								class="h-5 w-5 flex-shrink-0"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								{@html item.icon}
							</svg>
							{item.label}
						</a>
					</li>
				{/each}
			</ul>
		</div>

		<!-- Session Detail Sub-Navigation -->
		{#if isOnSessionDetail && currentSessionId}
			<div class="mt-4 border-t border-[#221c18] pt-4">
				<p class="mb-2 px-3 text-xs font-semibold tracking-wider text-[#6b5f4d] uppercase">
					Session Pages
				</p>
				<ul class="space-y-1">
					{#each [{ label: 'All Sessions', href: '/sessions', icon: 'M15 19l-7-7 7-7', isList: true }, { label: 'Overview', href: `/sessions/${currentSessionId}`, icon: 'M4 6h16M4 12h16M4 18h16' }, { label: 'Analysis', href: `/sessions/${currentSessionId}/analysis`, icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }, { label: 'Deep Dive', href: `/sessions/${currentSessionId}/detail`, icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' }] as subItem}
						<li>
							<a
								href={subItem.href}
								onclick={closeSidebar}
								class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium
                                       transition-colors
                                       focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[color:var(--theme-surface)] focus:outline-none
                                       {$page.url.pathname === subItem.href
									? 'border border-[#f5a623]/20 bg-[#f5a623]/10 text-[#f5a623]'
									: 'text-[#9a8f7a] hover:bg-[#221c18] hover:text-[#f0ece4]'}"
								aria-current={$page.url.pathname === subItem.href ? 'page' : undefined}
							>
								<svg
									class="h-4 w-4 flex-shrink-0"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									stroke-width="2"
								>
									<path stroke-linecap="round" stroke-linejoin="round" d={subItem.icon} />
								</svg>
								{subItem.label}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		{#if user?.role === 'admin'}
			<!-- Admin Overview -->
			<div class="mt-6 border-t border-[#221c18] pt-6">
				<p class="mb-2 px-3 text-xs font-semibold tracking-wider text-[#6b5f4d] uppercase">
					Admin Overview
				</p>
				<ul class="space-y-1">
					{#each adminOverviewItems as item}
						<li>
							<a
								href={item.href}
								onclick={closeSidebar}
								class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
                                       transition-colors
                                       focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[color:var(--theme-surface)] focus:outline-none
                                       {isActive(item.href)
									? 'border border-[#f5a623]/20 bg-[#f5a623]/10 text-[#f5a623]'
									: 'text-[#9a8f7a] hover:bg-[#221c18] hover:text-[#f0ece4]'}"
								aria-current={isActive(item.href) ? 'page' : undefined}
							>
								<svg
									class="h-5 w-5 flex-shrink-0"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									{@html item.icon}
								</svg>
								{item.label}
							</a>
						</li>
					{/each}
				</ul>
			</div>

			<!-- Admin Analytics & Insights -->
			<div class="mb-6">
				<p class="mb-2 px-3 text-xs font-semibold tracking-wider text-[#6b5f4d] uppercase">
					Analytics & Insights
				</p>
				<ul class="space-y-1">
					{#each adminAnalyticsItems as item}
						<li>
							<a
								href={item.href}
								onclick={closeSidebar}
								class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
                                       transition-colors
                                       focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[color:var(--theme-surface)] focus:outline-none
                                       {isActive(item.href)
									? 'border border-[#f5a623]/20 bg-[#f5a623]/10 text-[#f5a623]'
									: 'text-[#9a8f7a] hover:bg-[#221c18] hover:text-[#f0ece4]'}"
								aria-current={isActive(item.href) ? 'page' : undefined}
							>
								<svg
									class="h-5 w-5 flex-shrink-0"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									{@html item.icon}
								</svg>
								{item.label}
							</a>
						</li>
					{/each}
				</ul>
			</div>

			<!-- Admin User Engagement -->
			<div class="mb-6">
				<p class="mb-2 px-3 text-xs font-semibold tracking-wider text-[#6b5f4d] uppercase">
					User Engagement
				</p>
				<ul class="space-y-1">
					{#each adminEngagementItems as item}
						<li>
							<a
								href={item.href}
								onclick={closeSidebar}
								class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
                                       transition-colors
                                       focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[color:var(--theme-surface)] focus:outline-none
                                       {isActive(item.href)
									? 'border border-[#f5a623]/20 bg-[#f5a623]/10 text-[#f5a623]'
									: 'text-[#9a8f7a] hover:bg-[#221c18] hover:text-[#f0ece4]'}"
								aria-current={isActive(item.href) ? 'page' : undefined}
							>
								<svg
									class="h-5 w-5 flex-shrink-0"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									{@html item.icon}
								</svg>
								{item.label}
							</a>
						</li>
					{/each}
				</ul>
			</div>

			<!-- Admin Content Management -->
			<div class="mb-6">
				<p class="mb-2 px-3 text-xs font-semibold tracking-wider text-[#6b5f4d] uppercase">
					Content Management
				</p>
				<ul class="space-y-1">
					{#each adminContentItems as item}
						<li>
							<a
								href={item.href}
								onclick={closeSidebar}
								class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
                                       transition-colors
                                       focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[color:var(--theme-surface)] focus:outline-none
                                       {isActive(item.href)
									? 'border border-[#f5a623]/20 bg-[#f5a623]/10 text-[#f5a623]'
									: 'text-[#9a8f7a] hover:bg-[#221c18] hover:text-[#f0ece4]'}"
								aria-current={isActive(item.href) ? 'page' : undefined}
							>
								<svg
									class="h-5 w-5 flex-shrink-0"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									{@html item.icon}
								</svg>
								{item.label}
							</a>
						</li>
					{/each}
				</ul>
			</div>

			<!-- Admin System -->
			<div class="mb-6">
				<p class="mb-2 px-3 text-xs font-semibold tracking-wider text-[#6b5f4d] uppercase">
					System
				</p>
				<ul class="space-y-1">
					{#each adminSystemItems as item}
						<li>
							<a
								href={item.href}
								onclick={closeSidebar}
								class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
                                       transition-colors
                                       focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[color:var(--theme-surface)] focus:outline-none
                                       {isActive(item.href)
									? 'border border-[#f5a623]/20 bg-[#f5a623]/10 text-[#f5a623]'
									: 'text-[#9a8f7a] hover:bg-[#221c18] hover:text-[#f0ece4]'}"
								aria-current={isActive(item.href) ? 'page' : undefined}
							>
								<svg
									class="h-5 w-5 flex-shrink-0"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									{@html item.icon}
								</svg>
								{item.label}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</nav>

	<!-- User + sign out -->
	<div class="border-t border-[#221c18] px-3 py-4">
		<div class="mb-2 flex items-center gap-3 rounded-lg bg-[#0a0809] px-3 py-2.5">
			<div
				class="flex h-8 w-8 flex-shrink-0 items-center justify-center
                        rounded-full border border-[#f5a623]/30 bg-[#f5a623]/20"
			>
				<span class="text-xs font-bold text-[#f5a623]">
					{user?.name?.charAt(0).toUpperCase() ?? '?'}
				</span>
			</div>
			<div class="min-w-0 flex-1">
				<p class="truncate text-sm font-medium text-[#f0ece4]">{user?.name ?? 'User'}</p>
				<p class="truncate text-xs text-[#6b5f4d]">{user?.email ?? ''}</p>
			</div>
		</div>

		<!-- Sign out — GET link, always works -->
		<a
			href="/auth/sign-out"
			class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm
                   text-[#9a8f7a] transition-colors hover:bg-[#221c18] hover:text-[#ff4444]
                   focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[color:var(--theme-surface)] focus:outline-none"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
				/>
			</svg>
			Sign out
		</a>
	</div>
</aside>

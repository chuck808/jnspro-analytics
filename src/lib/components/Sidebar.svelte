<script lang="ts">
	import { page } from '$app/stores';
	import type { Database } from '$lib/types/database.types';
	import ThemeLogo from '$lib/components/ThemeLogo.svelte';

	type Profile = Database['public']['Tables']['profiles']['Row'];
	type NavItem = { label: string; href: string; icon: string; exact?: boolean };
	type NavSection = { label: string; items: NavItem[] };

	let { user }: { user: Profile | null } = $props();

	const icons = {
		home: 'M3 12l2-2 7-7 7 7 2 2M5 10v10h4v-6h6v6h4V10',
		sessions: 'M4 6h16M4 12h16M4 18h16',
		progress: 'M4 16l4-5 4 3 6-8 2 2',
		goal: 'M12 3a9 9 0 109 9h-9V3z M12 7v5h5',
		compare: 'M7 20V10m5 10V4m5 16v-7',
		upload: 'M12 16V4m0 0L8 8m4-4 4 4M4 16v3h16v-3',
		profile: 'M16 7a4 4 0 11-8 0 4 4 0 018 0z M5 21a7 7 0 0114 0',
		settings: 'M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z M19.4 15a1.7 1.7 0 00.34 1.88l.05.05-2.12 2.12-.05-.05a1.7 1.7 0 00-1.88-.34 1.7 1.7 0 00-1.03 1.57V20h-3v-.07a1.7 1.7 0 00-1.03-1.57 1.7 1.7 0 00-1.88.34l-.05.05-2.12-2.12.05-.05A1.7 1.7 0 007 15a1.7 1.7 0 00-1.57-1.03H5v-3h.43A1.7 1.7 0 007 9.94a1.7 1.7 0 00-.34-1.88l-.05-.05 2.12-2.12.05.05a1.7 1.7 0 001.88.34A1.7 1.7 0 0011.7 4.7V4h3v.7a1.7 1.7 0 001.03 1.57 1.7 1.7 0 001.88-.34l.05-.05 2.12 2.12-.05.05a1.7 1.7 0 00-.34 1.88A1.7 1.7 0 0021 10.97v3h-.03A1.7 1.7 0 0019.4 15z',
		help: 'M9.1 9a3 3 0 115.8 1c0 2-2.9 2.1-2.9 4M12 18h.01 M12 22a10 10 0 110-20 10 10 0 010 20z',
		coach: 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M22 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75',
		admin: 'M12 3l8 4v5c0 5-3.4 8.2-8 9-4.6-.8-8-4-8-9V7l8-4z M9 12l2 2 4-4',
		users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z',
		chart: 'M4 20V10m5 10V4m5 16v-8m5 8V7',
		research: 'M9 3h6M10 3v6l-5 9a2 2 0 001.7 3h10.6a2 2 0 001.7-3l-5-9V3',
		content: 'M5 4h14v16H5z M8 8h8M8 12h8M8 16h5',
		maintenance: 'M14.7 6.3a4 4 0 01-5 5l-5.4 5.4a2 2 0 102.8 2.8l5.4-5.4a4 4 0 005-5l-2.2 2.2-2.6-.7-.7-2.6 2.2-2.2z',
		back: 'M15 18l-6-6 6-6'
	};

	const riderSections: NavSection[] = [
		{
			label: 'Training',
			items: [
				{ label: 'Home', href: '/dashboard', icon: icons.home, exact: true },
				{ label: 'Sessions', href: '/sessions', icon: icons.sessions },
				{ label: 'Progress', href: '/analytics', icon: icons.progress },
				{ label: 'Goals', href: '/goals', icon: icons.goal },
				{ label: 'Compare', href: '/leaderboard', icon: icons.compare }
			]
		},
		{
			label: 'Data',
			items: [{ label: 'Upload session', href: '/upload', icon: icons.upload }]
		},
		{
			label: 'Account',
			items: [
				{ label: 'Profile', href: '/profile', icon: icons.profile },
				{ label: 'Settings', href: '/settings', icon: icons.settings },
				{ label: 'Help', href: '/help', icon: icons.help }
			]
		}
	];

	const coachSections: NavSection[] = [
		{
			label: 'Coaching',
			items: [{ label: 'Riders', href: '/coach', icon: icons.coach }]
		}
	];

	const adminSections: NavSection[] = [
		{
			label: 'Overview',
			items: [{ label: 'Admin home', href: '/admin', icon: icons.admin, exact: true }]
		},
		{
			label: 'People & access',
			items: [
				{ label: 'Users', href: '/admin/users', icon: icons.users },
				{ label: 'Coach applications', href: '/admin/coach-applications', icon: icons.coach }
			]
		},
		{
			label: 'Performance & benchmarking',
			items: [
				{ label: 'Analytics', href: '/admin/analytics', icon: icons.chart },
				{ label: 'Advanced analytics', href: '/admin/advanced-analytics', icon: icons.chart },
				{ label: 'Thresholds', href: '/admin/thresholds', icon: icons.settings },
				{ label: 'Leaderboard', href: '/admin/leaderboard-admin', icon: icons.compare },
				{ label: 'Goals intelligence', href: '/admin/goals-intelligence', icon: icons.goal }
			]
		},
		{
			label: 'Research & feedback',
			items: [
				{ label: 'Research data', href: '/admin/research', icon: icons.research },
				{ label: 'Feedback analytics', href: '/admin/feedback-analytics', icon: icons.chart },
				{ label: 'Feedback', href: '/admin/feedback', icon: icons.content }
			]
		},
		{
			label: 'System',
			items: [
				{ label: 'Email templates', href: '/admin/email-templates', icon: icons.content },
				{ label: 'Maintenance', href: '/admin/maintenance', icon: icons.maintenance }
			]
		}
	];

	function closeSidebar() {
		const sidebar = document.getElementById('sidebar');
		if (sidebar) sidebar.classList.add('-translate-x-full');
	}

	let workspace = $derived(
		$page.url.pathname.startsWith('/admin')
			? 'admin'
			: $page.url.pathname.startsWith('/coach')
				? 'coach'
				: 'rider'
	);

	let sections = $derived(
		workspace === 'admin' ? adminSections : workspace === 'coach' ? coachSections : riderSections
	);

	let currentSessionId = $derived.by(() => {
		const match = $page.url.pathname.match(/^\/sessions\/([^/]+)/);
		return match ? match[1] : null;
	});

	function isActive(item: NavItem) {
		if (item.exact) return $page.url.pathname === item.href;
		return $page.url.pathname === item.href || $page.url.pathname.startsWith(`${item.href}/`);
	}
</script>

<aside
	class="themed-card fixed top-0 left-0 z-40 flex h-screen w-64 -translate-x-full flex-col border-r border-[color:var(--border)] transition-transform md:translate-x-0"
	id="sidebar"
	aria-label="Main navigation"
>
	<div class="flex items-center gap-3 border-b border-[color:var(--border)] px-4 py-4">
		<button
			onclick={closeSidebar}
			aria-label="Close sidebar"
			class="themed-text-secondary -ml-1 rounded-lg p-1.5 transition-colors hover:bg-[color:var(--border)] hover:text-[color:var(--text-primary)] focus:ring-2 focus:ring-[color:var(--accent)] focus:outline-none md:hidden"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
		<ThemeLogo variant="icon" alt="JNS Pro Systems" class="h-9 w-9 flex-shrink-0 object-contain" />
		<div class="min-w-0">
			<p class="themed-accent text-sm leading-tight font-bold">AppGatePro</p>
			<p class="themed-text-subtle truncate text-xs leading-tight">
				{workspace === 'admin' ? 'Administration' : workspace === 'coach' ? 'Coaching' : 'Rider'}
			</p>
		</div>
	</div>

	<nav aria-label={`${workspace} navigation`} class="flex-1 overflow-y-auto px-3 py-4">
		{#if workspace !== 'rider'}
			<div class="mb-5">
				<a
					href="/dashboard"
					onclick={closeSidebar}
					class="flex items-center gap-3 rounded-lg border border-[#221c18] px-3 py-2.5 text-sm font-medium text-[#9a8f7a] transition-colors hover:border-[#f5a623]/20 hover:bg-[#221c18] hover:text-[#f0ece4]"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={icons.back} />
					</svg>
					Back to rider
				</a>
			</div>
		{/if}

		{#each sections as section}
			<div class="mb-6">
				<p class="mb-2 px-3 text-xs font-semibold tracking-wider text-[#6b5f4d] uppercase">{section.label}</p>
				<ul class="space-y-1">
					{#each section.items as item}
						<li>
							<a
								href={item.href}
								onclick={closeSidebar}
								class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[color:var(--theme-surface)] focus:outline-none {isActive(item) ? 'border border-[#f5a623]/20 bg-[#f5a623]/10 text-[#f5a623]' : 'text-[#9a8f7a] hover:bg-[#221c18] hover:text-[#f0ece4]'}"
								aria-current={isActive(item) ? 'page' : undefined}
							>
								<svg class="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
								</svg>
								{item.label}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/each}

		{#if workspace === 'rider' && currentSessionId}
			<div class="mb-6 border-t border-[#221c18] pt-5">
				<p class="mb-2 px-3 text-xs font-semibold tracking-wider text-[#6b5f4d] uppercase">Session</p>
				<ul class="space-y-1">
					{#each [
						{ label: 'Overview', href: `/sessions/${currentSessionId}` },
						{ label: 'Analysis', href: `/sessions/${currentSessionId}/analysis` },
						{ label: 'Deep Dive', href: `/sessions/${currentSessionId}/detail` }
					] as item}
						<li>
							<a
								href={item.href}
								onclick={closeSidebar}
								class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors {$page.url.pathname === item.href ? 'border border-[#f5a623]/20 bg-[#f5a623]/10 text-[#f5a623]' : 'text-[#9a8f7a] hover:bg-[#221c18] hover:text-[#f0ece4]'}"
								aria-current={$page.url.pathname === item.href ? 'page' : undefined}
							>
								<span class="h-1.5 w-1.5 rounded-full bg-current"></span>
								{item.label}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		{#if workspace === 'rider' && (user?.coach_status === 'approved' || user?.role === 'admin')}
			<div class="border-t border-[#221c18] pt-5">
				<p class="mb-2 px-3 text-xs font-semibold tracking-wider text-[#6b5f4d] uppercase">Workspaces</p>
				<ul class="space-y-1">
					{#if user?.coach_status === 'approved'}
						<li>
							<a href="/coach" onclick={closeSidebar} class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#9a8f7a] transition-colors hover:bg-[#221c18] hover:text-[#f0ece4]">
								<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={icons.coach} /></svg>
								Coach workspace
							</a>
						</li>
					{/if}
					{#if user?.role === 'admin'}
						<li>
							<a href="/admin" onclick={closeSidebar} class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#9a8f7a] transition-colors hover:bg-[#221c18] hover:text-[#f0ece4]">
								<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={icons.admin} /></svg>
								Admin workspace
							</a>
						</li>
					{/if}
				</ul>
			</div>
		{/if}
	</nav>
</aside>

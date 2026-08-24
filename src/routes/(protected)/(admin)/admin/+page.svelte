<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();

	function fmtDate(ts: string | null) {
		if (!ts) return '—';
		return new Date(ts).toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}
	function fmtDateTime(ts: string) {
		return new Date(ts).toLocaleString('en-GB', {
			day: 'numeric',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	let engagementRate = $derived(
		data.totalUsers > 0 ? ((data.activeUsers / data.totalUsers) * 100).toFixed(1) : '0'
	);
</script>

<svelte:head>
	<title>Admin Operations — AppGatePro</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div>
		<h2 class="themed-text-primary text-lg font-bold">Admin Operations</h2>
		<p class="themed-text-secondary mt-0.5 text-sm">
			Operate the platform, inspect evidence, and manage access
		</p>
	</div>

	<!-- Operational priorities -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
		<a
			href="/admin/feedback"
			class="themed-card group block rounded-xl p-5 transition-all hover:scale-[1.02] hover:border-[color:var(--accent)]"
		>
			<div class="mb-3 flex items-center gap-3">
				<div class="themed-bg-accent flex h-10 w-10 items-center justify-center rounded-lg">
					<span class="text-xl">💬</span>
				</div>
				<div class="flex-1">
					<h3
						class="themed-text-primary text-sm font-semibold transition-colors group-hover:text-[color:var(--accent)]"
					>
						Feedback inbox
					</h3>
					<p class="text-xs text-[color:var(--text-subtle)]">Operate</p>
				</div>
				<svg
					class="h-5 w-5 text-[color:var(--text-subtle)] transition-colors group-hover:text-[color:var(--accent)]"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</div>
			<p class="themed-text-secondary text-xs">
				Review user-reported bugs, questions, requests, and follow-up notes
			</p>
		</a>

		<a
			href="/admin/users"
			class="themed-card group block rounded-xl p-5 transition-all hover:scale-[1.02] hover:border-[#3de8c8]"
		>
			<div class="mb-3 flex items-center gap-3">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-lg
                            border border-[#3de8c8]/40 bg-[#3de8c8]/20"
				>
					<span class="text-xl">👥</span>
				</div>
				<div class="flex-1">
					<h3
						class="themed-text-primary text-sm font-semibold transition-colors group-hover:text-[#3de8c8]"
					>
						People & access
					</h3>
					<p class="text-xs text-[color:var(--text-subtle)]">Operate</p>
				</div>
				<svg
					class="h-5 w-5 text-[color:var(--text-subtle)] transition-colors group-hover:text-[#3de8c8]"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</div>
			<p class="themed-text-secondary text-xs">
				Manage users, roles, coaching access, and account state
			</p>
		</a>

		<a
			href="/admin/advanced-analytics"
			class="themed-card group block rounded-xl p-5 transition-all hover:scale-[1.02] hover:border-[#ff6b3d]"
		>
			<div class="mb-3 flex items-center gap-3">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-lg
                            border border-[#ff6b3d]/40 bg-[#ff6b3d]/20"
				>
					<span class="text-xl">📊</span>
				</div>
				<div class="flex-1">
					<h3
						class="themed-text-primary text-sm font-semibold transition-colors group-hover:text-[#ff6b3d]"
					>
						Platform evidence
					</h3>
					<p class="text-xs text-[color:var(--text-subtle)]">Inspect</p>
				</div>
				<svg
					class="h-5 w-5 text-[color:var(--text-subtle)] transition-colors group-hover:text-[#ff6b3d]"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</div>
			<p class="themed-text-secondary text-xs">Inspect population trends, benchmarks, and data quality</p>
		</a>
	</div>

	<!-- Primary Stats -->
	<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
		{#each [{ label: 'Total Users', value: data.totalUsers, sub: `${data.adminCount} admin${data.adminCount !== 1 ? 's' : ''}`, icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', color: 'var(--accent)' }, { label: 'Active Users', value: data.activeUsers, sub: `${engagementRate}% of total`, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: '#3de8c8' }, { label: 'Total Sessions', value: data.totalSessions, sub: `${data.activeSessions} active`, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', color: '#ff6b3d' }, { label: 'Avg Sessions/User', value: data.avgSessionsPerUser > 0 ? data.avgSessionsPerUser.toFixed(1) : '0', sub: `${data.usersWithNoSessions} with no sessions`, icon: 'M9 19v-6a2 2 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: 'var(--text-secondary)' }] as stat}
			<div
				class="themed-card rounded-xl p-5 transition-colors hover:border-[color:var(--accent)]/20"
			>
				<div class="mb-2 flex items-start justify-between">
					<p class="themed-text-secondary text-xs tracking-wider uppercase">{stat.label}</p>
					<svg
						class="h-5 w-5 flex-shrink-0"
						style="color: {stat.color}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={stat.icon} />
					</svg>
				</div>
				<p class="text-2xl font-bold" style="color: {stat.color}">{stat.value}</p>
				<p class="mt-1 text-xs text-[color:var(--text-subtle)]">{stat.sub}</p>
			</div>
		{/each}
	</div>

	<!-- Growth Stats -->
	<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
		<div class="themed-card rounded-xl p-5">
			<h3 class="themed-text-primary mb-4 text-sm font-semibold">Signup activity</h3>
			<div class="space-y-3">
				<div class="flex items-center justify-between rounded-lg bg-[color:var(--background)] p-3">
					<div>
						<p class="themed-text-secondary text-xs">Last 7 days</p>
						<p class="themed-accent mt-0.5 text-xl font-bold">{data.newUsersLast7Days}</p>
					</div>
					<div class="text-right">
						<p class="text-xs text-[color:var(--text-subtle)]">New signups</p>
						<p class="themed-text-secondary mt-0.5 text-xs">
							{data.totalUsers > 0
								? ((data.newUsersLast7Days / data.totalUsers) * 100).toFixed(1)
								: '0'}% of total
						</p>
					</div>
				</div>
				<div class="flex items-center justify-between rounded-lg bg-[color:var(--background)] p-3">
					<div>
						<p class="themed-text-secondary text-xs">Last 30 days</p>
						<p class="themed-accent mt-0.5 text-xl font-bold">{data.newUsersLast30Days}</p>
					</div>
					<div class="text-right">
						<p class="text-xs text-[color:var(--text-subtle)]">New signups</p>
						<p class="themed-text-secondary mt-0.5 text-xs">
							{data.totalUsers > 0
								? ((data.newUsersLast30Days / data.totalUsers) * 100).toFixed(1)
								: '0'}% of total
						</p>
					</div>
				</div>
			</div>
		</div>

		<div class="themed-card rounded-xl p-5">
			<h3 class="themed-text-primary mb-4 text-sm font-semibold">Session activity</h3>
			<div class="space-y-3">
				<div class="flex items-center justify-between rounded-lg bg-[color:var(--background)] p-3">
					<div>
						<p class="themed-text-secondary text-xs">Last 7 days</p>
						<p class="mt-0.5 text-xl font-bold text-[#ff6b3d]">{data.sessionsLast7Days}</p>
					</div>
					<div class="text-right">
						<p class="text-xs text-[color:var(--text-subtle)]">Sessions uploaded</p>
						<p class="themed-text-secondary mt-0.5 text-xs">
							{data.totalSessions > 0
								? ((data.sessionsLast7Days / data.totalSessions) * 100).toFixed(1)
								: '0'}% of total
						</p>
					</div>
				</div>
				<div class="flex items-center justify-between rounded-lg bg-[color:var(--background)] p-3">
					<div>
						<p class="themed-text-secondary text-xs">Last 30 days</p>
						<p class="mt-0.5 text-xl font-bold text-[#ff6b3d]">{data.sessionsLast30Days}</p>
					</div>
					<div class="text-right">
						<p class="text-xs text-[color:var(--text-subtle)]">Sessions uploaded</p>
						<p class="themed-text-secondary mt-0.5 text-xs">
							{data.totalSessions > 0
								? ((data.sessionsLast30Days / data.totalSessions) * 100).toFixed(1)
								: '0'}% of total
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Top Users & Recent Signups -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<!-- Highest session volume -->
		<div class="themed-card rounded-xl p-5">
			<h3 class="themed-text-primary mb-4 text-sm font-semibold">Highest session volume</h3>
			{#if data.topUsers.length === 0}
				<p class="py-8 text-center text-sm text-[color:var(--text-subtle)]">No session activity yet</p>
			{:else}
				<div class="space-y-2">
					{#each data.topUsers as user}
						<a
							href="/admin/users/{user.id}"
							class="group flex items-center gap-3 rounded-lg bg-[color:var(--background)] p-3 transition-colors hover:bg-[color:var(--border)]"
						>
							<div
								class="themed-bg-accent flex h-8 w-8
                                        flex-shrink-0 items-center justify-center rounded-full"
							>
								<span class="themed-accent text-sm font-bold">
									{user.name?.charAt(0).toUpperCase() ?? '?'}
								</span>
							</div>
							<div class="min-w-0 flex-1">
								<p class="themed-text-primary truncate text-sm font-medium">
									{user.name || user.email}
								</p>
								<p class="truncate text-xs text-[color:var(--text-subtle)]">{user.email}</p>
							</div>
							<div class="flex-shrink-0 text-right">
								<p class="themed-accent text-lg font-bold">{user.session_count}</p>
								<p class="text-xs text-[color:var(--text-subtle)]">sessions</p>
							</div>
							<svg
								class="h-4 w-4 flex-shrink-0 text-[color:var(--text-subtle)] transition-colors group-hover:text-[color:var(--accent)]"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 5l7 7-7 7"
								/>
							</svg>
						</a>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Recent Signups -->
		<div class="themed-card rounded-xl p-5">
			<h3 class="themed-text-primary mb-4 text-sm font-semibold">Recent signups</h3>
			{#if data.recentSignups.length === 0}
				<p class="py-8 text-center text-sm text-[color:var(--text-subtle)]">No users yet</p>
			{:else}
				<div class="space-y-2">
					{#each data.recentSignups as user}
						<a
							href="/admin/users/{user.id}"
							class="group flex items-center gap-3 rounded-lg bg-[color:var(--background)] p-3 transition-colors hover:bg-[color:var(--border)]"
						>
							<div
								class="flex h-8 w-8 flex-shrink-0 items-center justify-center
                                        rounded-full border border-[#3de8c8]/30 bg-[#3de8c8]/20"
							>
								<span class="text-sm font-bold text-[#3de8c8]">
									{user.name?.charAt(0).toUpperCase() ?? '?'}
								</span>
							</div>
							<div class="min-w-0 flex-1">
								<p class="themed-text-primary truncate text-sm font-medium">
									{user.name || user.email}
								</p>
								<p class="text-xs text-[color:var(--text-subtle)]">{fmtDate(user.created_at)}</p>
							</div>
							<div class="flex flex-shrink-0 items-center gap-2">
								{#if user.session_count > 0}
									<span class="rounded bg-[#3de8c8]/10 px-2 py-0.5 text-xs text-[#3de8c8]">
										{user.session_count} sessions
									</span>
								{:else}
									<span class="text-xs text-[color:var(--text-subtle)]">No sessions</span>
								{/if}
							</div>
							<svg
								class="h-4 w-4 flex-shrink-0 text-[color:var(--text-subtle)] transition-colors group-hover:text-[color:var(--accent)]"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 5l7 7-7 7"
								/>
							</svg>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- User List -->
	<div class="themed-card rounded-xl p-5">
		<div class="mb-4 flex items-center justify-between">
			<h3 class="themed-text-primary text-sm font-semibold">User directory</h3>
			<a href="/admin/users" class="themed-accent text-xs hover:underline">Manage all →</a>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full min-w-[600px] text-sm">
				<thead>
					<tr class="border-b border-[color:var(--border)]">
						{#each ['Name', 'Email', 'Role', 'Sessions', 'Last active', ''] as h}
							<th
								class="themed-text-secondary pr-4 pb-2 text-left text-xs
                                       font-semibold tracking-wider uppercase">{h}</th
							>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each data.users.slice(0, 10) as user}
						<tr
							class="border-b border-[color:var(--border)]/50 transition-colors hover:bg-[color:var(--border)]"
						>
							<td class="themed-text-primary py-2.5 pr-4 font-medium">
								{user.name || '—'}
							</td>
							<td class="themed-text-secondary py-2.5 pr-4 text-xs">{user.email}</td>
							<td class="py-2.5 pr-4">
								<span
									class="rounded px-2 py-0.5 text-xs
                                             {user.role === 'admin'
										? 'border border-red-800/40 bg-red-900/20 text-red-400'
										: 'themed-text-secondary bg-[color:var(--border)]'}"
								>
									{user.role}
								</span>
							</td>
							<td class="py-2.5 pr-4">
								{#if user.session_count > 0}
									<span class="themed-accent font-medium">{user.session_count}</span>
								{:else}
									<span class="text-[color:var(--text-subtle)]">0</span>
								{/if}
							</td>
							<td class="py-2.5 pr-4 text-xs text-[color:var(--text-subtle)]">
								{fmtDate(user.last_session)}
							</td>
							<td class="py-2.5">
								<a href="/admin/users/{user.id}" class="themed-accent text-xs hover:underline"
									>View →</a
								>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		{#if data.users.length > 10}
			<div class="mt-4 text-center">
				<a
					href="/admin/users"
					class="themed-accent inline-flex items-center gap-2 px-4 py-2 text-sm transition-opacity hover:opacity-80"
				>
					View all {data.users.length} users
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5l7 7-7 7"
						/>
					</svg>
				</a>
			</div>
		{/if}
	</div>

	<!-- Recent audit log -->
	{#if data.recentAudit.length > 0}
		<div class="themed-card rounded-xl p-5">
			<h3 class="themed-text-primary mb-4 text-sm font-semibold">Recent role changes</h3>
			<div class="space-y-2">
				{#each data.recentAudit as entry}
					<div class="flex items-center gap-3 rounded-lg bg-[color:var(--background)] p-3 text-xs">
						<span class="flex-shrink-0 text-[color:var(--text-subtle)]">
							{fmtDateTime(entry.changed_at)}
						</span>
						<span class="themed-text-secondary">
							Role changed:
							<span class="themed-text-primary">{entry.old_role ?? '—'}</span>
							→
							<span class="themed-accent">{entry.new_role}</span>
						</span>
						{#if entry.reason}
							<span class="ml-auto max-w-xs truncate text-[color:var(--text-subtle)]">
								{entry.reason}
							</span>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
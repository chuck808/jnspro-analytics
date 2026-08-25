<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();

	let search = $state('');

	let filtered = $derived(
		search.trim()
			? data.users.filter(
					(u) =>
						u.name?.toLowerCase().includes(search.toLowerCase()) ||
						u.email.toLowerCase().includes(search.toLowerCase()) ||
						u.club?.toLowerCase().includes(search.toLowerCase())
				)
			: data.users
	);

	function fmtDate(ts: string | null) {
		if (!ts) return '—';
		return new Date(ts).toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Users — Admin — AppGatePro</title>
</svelte:head>

<div class="space-y-5">
	<!-- Back -->
	<a
		href="/admin"
		class="themed-text-secondary inline-flex items-center gap-1 text-sm transition-colors hover:text-[color:var(--accent)]"
	>
		<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
		</svg>
		Admin Dashboard
	</a>

	<div class="flex flex-wrap items-center justify-between gap-4">
		<div>
			<h3 class="themed-text-primary text-base font-bold">All Users</h3>
			<p class="themed-text-secondary mt-0.5 text-xs">{data.users.length} registered</p>
		</div>
		<label for="user-search" class="sr-only">Search users</label>
		<input
			id="user-search"
			type="search"
			bind:value={search}
			placeholder="Search name, email, club..."
			class="themed-text-primary w-64 rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-4
                   py-2 text-sm placeholder-[color:var(--text-subtle)] focus:border-[color:var(--accent)] focus:outline-none"
		/>
	</div>

	<div class="themed-card overflow-hidden rounded-xl">
		<div class="overflow-x-auto">
			<table class="w-full min-w-[700px] text-sm">
				<thead>
					<tr class="border-b border-[color:var(--border)] bg-[color:var(--background)]">
						{#each ['Name', 'Email', 'Club', 'Role', 'Sessions', 'Joined', 'Last active', ''] as h}
							<th
								class="themed-text-secondary px-4 py-3 text-left text-xs
                                       font-semibold tracking-wider uppercase">{h}</th
							>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each filtered as user}
						<tr
							class="border-b border-[color:var(--border)]/50 transition-colors hover:bg-[color:var(--border)]"
						>
							<td class="themed-text-primary px-4 py-3 font-medium">
								{user.name || '—'}
							</td>
							<td class="themed-text-secondary px-4 py-3 text-xs">{user.email}</td>
							<td class="themed-text-secondary px-4 py-3 text-xs">{user.club || '—'}</td>
							<td class="px-4 py-3">
								<span
									class="rounded px-2 py-0.5 text-xs
                                             {user.role === 'admin'
										? 'border border-red-800/40 bg-red-900/20 text-red-400'
										: 'themed-text-secondary bg-[color:var(--border)]'}"
								>
									{user.role}
								</span>
							</td>
							<td class="themed-text-secondary px-4 py-3">{user.session_count}</td>
							<td class="px-4 py-3 text-xs text-[color:var(--text-subtle)]"
								>{fmtDate(user.created_at)}</td
							>
							<td class="px-4 py-3 text-xs text-[color:var(--text-subtle)]"
								>{fmtDate(user.last_session)}</td
							>
							<td class="px-4 py-3">
								<a
									href="/admin/users/{user.id}"
									class="themed-accent text-xs whitespace-nowrap hover:underline"
								>
									View →
								</a>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="8" class="px-4 py-8 text-center text-sm text-[color:var(--text-subtle)]">
								No users match your search
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

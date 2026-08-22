<script lang="ts">
	import type { PageData, ActionData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();

	let search = $state('');
	let inviting = $state(false);

	let activeCount = $derived(data.roster.filter((rider) => rider.status === 'active').length);
	let pendingCount = $derived(
		data.roster.filter(
			(rider) => rider.status === 'pending_rider' || rider.status === 'pending_parent'
		).length
	);
	let attentionRows = $derived(
		data.roster
			.filter((rider) => rider.attentionRank >= 50)
			.sort((a, b) => b.attentionRank - a.attentionRank)
	);
	let filtered = $derived(
		(search.trim()
			? data.roster.filter(
					(rider) =>
						rider.riderName?.toLowerCase().includes(search.toLowerCase()) ||
						rider.riderEmail?.toLowerCase().includes(search.toLowerCase())
				)
			: data.roster
		).toSorted((a, b) => {
			if (a.status === 'active' && b.status !== 'active') return -1;
			if (a.status !== 'active' && b.status === 'active') return 1;
			return a.riderName.localeCompare(b.riderName);
	})
	);

	function fmtDate(ts: string | null) {
		if (!ts) return '—';
		return new Date(ts).toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	function statusLabel(status: string) {
		if (status === 'active') return 'Active';
		if (status === 'pending_rider') return 'Awaiting rider';
		if (status === 'pending_parent') return 'Awaiting parent';
		if (status === 'declined') return 'Declined';
		if (status === 'denied') return 'Parent declined';
		if (status === 'revoked') return 'Removed';
		return status;
	}

	function statusClass(status: string) {
		if (status === 'active') return 'border-[#3de8c8]/30 bg-[#3de8c8]/10 text-[#3de8c8]';
		if (status === 'pending_rider' || status === 'pending_parent')
			return 'border-[#f5a623]/30 bg-[#f5a623]/10 text-[#f5a623]';
		return 'themed-text-secondary bg-[color:var(--border)]';
	}

	function attentionLabel(attention: string, unreadCount: number, flagCount: number) {
		if (attention === 'new_shared_evidence') {
			return `${unreadCount} new shared report${unreadCount === 1 ? '' : 's'}`;
		}
		if (attention === 'profile_flag_open') {
			return `${flagCount} profile flag${flagCount === 1 ? '' : 's'} still open`;
		}
		if (attention === 'awaiting_parent') return 'Waiting for parent / guardian approval';
		if (attention === 'awaiting_rider') return 'Waiting for rider response';
		return 'Review rider';
	}
</script>

<svelte:head>
	<title>Coach Dashboard — AppGatePro</title>
</svelte:head>

<div class="space-y-6">
	<section class="flex flex-wrap items-end justify-between gap-4">
		<div>
			<p class="themed-accent text-xs font-semibold tracking-[0.16em] uppercase">Coach workspace</p>
			<h2 class="themed-text-primary mt-1 text-2xl font-bold">Your riders</h2>
			<p class="themed-text-secondary mt-1 max-w-2xl text-sm">
				Focus on what has been shared with you. Session evidence stays rider-owned unless they choose
				to send a report.
			</p>
		</div>
		<div class="grid grid-cols-3 gap-2 text-center text-xs">
			<div class="themed-card min-w-20 rounded-lg px-3 py-2">
				<p class="themed-text-primary text-lg font-bold">{activeCount}</p>
				<p class="themed-text-secondary">Active</p>
			</div>
			<div class="themed-card min-w-20 rounded-lg px-3 py-2">
				<p class="themed-text-primary text-lg font-bold">{pendingCount}</p>
				<p class="themed-text-secondary">Pending</p>
			</div>
			<div class="themed-card min-w-20 rounded-lg px-3 py-2">
				<p class="text-lg font-bold text-[#f5a623]">{data.totalUnread}</p>
				<p class="themed-text-secondary">New reports</p>
			</div>
		</div>
	</section>

	{#if attentionRows.length > 0}
		<section>
			<div class="mb-3">
				<h3 class="themed-text-primary text-base font-bold">Needs attention</h3>
				<p class="themed-text-secondary mt-0.5 text-xs">
					Only consent, shared-report and shared-thread signals are used here — not hidden session activity.
				</p>
			</div>

			<div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
				{#each attentionRows as rider (rider.linkId)}
					<div class="themed-card rounded-xl p-4">
						<div class="flex items-start justify-between gap-4">
							<div class="min-w-0">
								<div class="flex flex-wrap items-center gap-2">
									<p class="themed-text-primary truncate font-semibold">{rider.riderName}</p>
									<span class="rounded border px-2 py-0.5 text-[11px] {statusClass(rider.status)}">
										{statusLabel(rider.status)}
									</span>
								</div>
								<p class="mt-1 text-sm font-medium text-[#f5a623]">
									{attentionLabel(rider.attention, rider.unreadCount, rider.unresolvedProfileFlags)}
								</p>
								{#if rider.status === 'active'}
									<p class="themed-text-secondary mt-1 text-xs">
										{rider.activeGoalCount} active goal{rider.activeGoalCount === 1 ? '' : 's'}
										{#if rider.latestShareAt} · Last shared {fmtDate(rider.latestShareAt)}{/if}
									</p>
								{:else}
									<p class="themed-text-secondary mt-1 text-xs">Invited {fmtDate(rider.invitedAt)}</p>
								{/if}
							</div>

							{#if rider.status === 'active'}
								<a
									href="/coach/riders/{rider.linkId}"
									class="themed-accent flex-shrink-0 text-xs font-semibold hover:underline"
								>
									Open rider →
								</a>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<section>
		<div class="mb-3 flex flex-wrap items-end justify-between gap-3">
			<div>
				<h3 class="themed-text-primary text-base font-bold">All riders</h3>
				<p class="themed-text-secondary mt-0.5 text-xs">Your complete coaching roster and invite states.</p>
			</div>
			<input
				type="search"
				bind:value={search}
				placeholder="Search riders..."
				class="themed-text-primary w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-4
                   py-2 text-sm placeholder-[color:var(--text-subtle)] focus:border-[color:var(--accent)] focus:outline-none sm:w-64"
			/>
		</div>

		<div class="themed-card overflow-hidden rounded-xl">
			<div class="divide-y divide-[color:var(--border)]/60">
				{#each filtered as rider (rider.linkId)}
					<div class="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
						<div class="min-w-0">
							<div class="flex flex-wrap items-center gap-2">
								<p class="themed-text-primary truncate font-medium">{rider.riderName}</p>
								<span class="rounded border px-2 py-0.5 text-[11px] {statusClass(rider.status)}">
									{statusLabel(rider.status)}
								</span>
								{#if rider.unreadCount > 0}
									<span class="rounded-full bg-[#f5a623] px-2 py-0.5 text-[11px] font-semibold text-[#0a0809]">
										{rider.unreadCount} new
									</span>
								{/if}
							</div>
							<p class="themed-text-secondary mt-0.5 truncate text-xs">{rider.riderEmail ?? 'No email shown'}</p>
							{#if rider.status === 'active'}
								<p class="mt-1 text-xs text-[color:var(--text-subtle)]">
									{rider.activeGoalCount} active goal{rider.activeGoalCount === 1 ? '' : 's'}
									{#if rider.latestShareAt} · Last shared {fmtDate(rider.latestShareAt)}{:else} · No reports shared yet{/if}
								</p>
							{:else}
								<p class="mt-1 text-xs text-[color:var(--text-subtle)]">Invited {fmtDate(rider.invitedAt)}</p>
							{/if}
						</div>

						{#if rider.status === 'active'}
							<a href="/coach/riders/{rider.linkId}" class="themed-accent text-xs font-semibold hover:underline">
								View rider →
							</a>
						{/if}
					</div>
				{:else}
					<div class="px-4 py-8 text-center text-sm text-[color:var(--text-subtle)]">
						{search.trim() ? 'No riders match your search.' : 'No riders yet — invite one below.'}
					</div>
				{/each}
			</div>
		</div>
	</section>

	<section class="themed-card rounded-xl p-5">
		<h3 class="themed-text-primary mb-1 text-sm font-semibold">Invite a rider</h3>
		<p class="themed-text-secondary mb-4 text-xs">
			They need an existing account. A minor's link stays pending until the required parent or guardian
			approval is complete.
		</p>

		{#if form?.inviteSuccess}
			<div class="mb-4 rounded-lg border border-[#3de8c8]/30 bg-[#3de8c8]/10 p-3 text-sm text-[#3de8c8]">
				{form.inviteMessage}
			</div>
		{/if}
		{#if form && 'inviteError' in form}
			<div class="mb-4 rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
				{form.inviteError}
			</div>
		{/if}

		<form method="POST" action="?/invite" onsubmit={() => (inviting = true)} class="flex flex-wrap gap-3">
			<input
				type="email"
				name="email"
				required
				placeholder="rider@example.com"
				class="themed-text-primary min-w-[240px] flex-1 rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3
                       py-2 text-sm placeholder-[color:var(--text-subtle)] focus:border-[color:var(--accent)] focus:outline-none"
			/>
			<button
				type="submit"
				disabled={inviting}
				class="rounded-lg bg-[#f5a623] px-4 py-2 text-sm font-semibold text-[#0a0809]
                       transition-colors hover:bg-[#c97e0a] disabled:opacity-50"
			>
				{inviting ? 'Sending…' : 'Send invite'}
			</button>
		</form>
	</section>
</div>

<script lang="ts">
	import type { PageData, ActionData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();

	let search = $state('');
	let inviting = $state(false);

	let filtered = $derived(
		search.trim()
			? data.roster.filter(
					(r) =>
						r.riderName?.toLowerCase().includes(search.toLowerCase()) ||
						r.riderEmail?.toLowerCase().includes(search.toLowerCase())
				)
			: data.roster
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
</script>

<svelte:head>
	<title>Coach Dashboard — AppGatePro</title>
</svelte:head>

<div class="space-y-5">
	<div class="flex flex-wrap items-center justify-between gap-4">
		<div>
			<h3 class="themed-text-primary text-base font-bold">My Riders</h3>
			<p class="themed-text-secondary mt-0.5 text-xs">
				{data.roster.length} linked
				{#if data.totalUnread > 0}
					· <span class="font-semibold text-[#f5a623]">{data.totalUnread} new report{data.totalUnread === 1 ? '' : 's'}</span>
				{/if}
			</p>
		</div>
		<input
			type="search"
			bind:value={search}
			placeholder="Search riders..."
			class="themed-text-primary w-64 rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-4
                   py-2 text-sm placeholder-[color:var(--text-subtle)] focus:border-[color:var(--accent)] focus:outline-none"
		/>
	</div>

	<!-- Invite a rider -->
	<div class="themed-card rounded-xl p-5">
		<h4 class="themed-text-primary mb-1 text-sm font-semibold">Invite a rider</h4>
		<p class="themed-text-secondary mb-4 text-xs">
			They'll need an existing account. If a minor, their parent/guardian will need to approve
			before the link becomes active.
		</p>

		{#if form?.inviteSuccess}
			<div
				class="mb-4 rounded-lg border border-[#3de8c8]/30 bg-[#3de8c8]/10 p-3 text-sm text-[#3de8c8]"
			>
				{form.inviteMessage}
			</div>
		{/if}
		{#if form && 'inviteError' in form}
			<div class="mb-4 rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
				{form.inviteError}
			</div>
		{/if}

		<form
			method="POST"
			action="?/invite"
			onsubmit={() => (inviting = true)}
			class="flex flex-wrap gap-3"
		>
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
	</div>

	<div class="themed-card overflow-hidden rounded-xl">
		<div class="overflow-x-auto">
			<table class="w-full min-w-[600px] text-sm">
				<thead>
					<tr class="border-b border-[color:var(--border)] bg-[color:var(--background)]">
						{#each ['Rider', 'Status', 'Invited', 'Reports', ''] as h (h)}
							<th
								class="themed-text-secondary px-4 py-3 text-left text-xs
                                       font-semibold tracking-wider uppercase">{h}</th
							>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each filtered as rider (rider.linkId)}
						<tr
							class="border-b border-[color:var(--border)]/50 transition-colors hover:bg-[color:var(--border)]"
						>
							<td class="px-4 py-3">
								<p class="themed-text-primary font-medium">{rider.riderName}</p>
								<p class="themed-text-secondary text-xs">{rider.riderEmail}</p>
							</td>
							<td class="px-4 py-3">
								<span class="rounded border px-2 py-0.5 text-xs {statusClass(rider.status)}">
									{statusLabel(rider.status)}
								</span>
							</td>
							<td class="px-4 py-3 text-xs text-[color:var(--text-subtle)]">
								{fmtDate(rider.invitedAt)}
							</td>
							<td class="px-4 py-3">
								{#if rider.unreadCount > 0}
									<span
										class="rounded-full bg-[#f5a623] px-2 py-0.5 text-xs font-semibold text-[#0a0809]"
									>
										{rider.unreadCount} new
									</span>
								{:else}
									<span class="text-xs text-[color:var(--text-subtle)]">—</span>
								{/if}
							</td>
							<td class="px-4 py-3">
								{#if rider.status === 'active'}
									<a
										href="/coach/riders/{rider.linkId}"
										class="themed-accent text-xs whitespace-nowrap hover:underline"
									>
										View →
									</a>
								{/if}
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="5" class="px-4 py-8 text-center text-sm text-[color:var(--text-subtle)]">
								No riders yet — invite one above.
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

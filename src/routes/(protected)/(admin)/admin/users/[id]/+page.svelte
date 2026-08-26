<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();

	let roleSaving = $state(false);
	let selectedRole = $derived(data.profile?.role ?? 'user');
	let coachGrantSaving = $state(false);

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
</script>

<svelte:head>
	<title>{data.profile?.name ?? 'User'} — Admin — AppGatePro</title>
</svelte:head>

<div class="space-y-5">
	<!-- Back -->
	<a
		href="/admin/users"
		class="themed-text-secondary inline-flex items-center gap-1 text-sm transition-colors hover:text-[color:var(--accent)]"
	>
		<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
		</svg>
		All users
	</a>

	<!-- Profile header -->
	<div class="themed-card rounded-xl p-6">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div class="flex items-center gap-4">
				<div
					class="themed-bg-accent flex h-12 w-12
                            flex-shrink-0 items-center justify-center rounded-full"
				>
					<span class="themed-accent text-lg font-bold">
						{data.profile?.name?.charAt(0).toUpperCase() ?? '?'}
					</span>
				</div>
				<div>
					<h3 class="themed-text-primary text-lg font-bold">
						{data.profile?.name || '—'}
					</h3>
					<p class="themed-text-secondary text-sm">{data.profile?.email}</p>
					<div class="mt-1 flex items-center gap-2">
						<span
							class="rounded px-2 py-0.5 text-xs
                                     {data.profile?.role === 'admin'
								? 'border border-red-800/40 bg-red-900/20 text-red-400'
								: 'themed-text-secondary bg-[color:var(--border)]'}"
						>
							{data.profile?.role}
						</span>
						{#if data.profile?.club}
							<span class="text-xs text-[color:var(--text-subtle)]">{data.profile.club}</span>
						{/if}
						{#if data.profile?.country}
							<span class="text-xs text-[color:var(--text-subtle)]">{data.profile.country}</span>
						{/if}
					</div>
				</div>
			</div>

			<!-- Quick stats -->
			<div class="flex gap-6 text-center">
				<div>
					<p class="themed-accent text-xl font-bold">{data.sessions.length}</p>
					<p class="text-xs text-[color:var(--text-subtle)]">Sessions</p>
				</div>
				<div>
					<p class="themed-text-primary text-xl font-bold">
						{data.sessions.reduce((s, sess) => s + (sess.runs?.length ?? 0), 0)}
					</p>
					<p class="text-xs text-[color:var(--text-subtle)]">Runs</p>
				</div>
				<div>
					<p class="themed-text-primary text-sm font-medium">
						{fmtDate(data.sessions[0]?.timestamp ?? null)}
					</p>
					<p class="text-xs text-[#4a4038]">Last session</p>
				</div>
			</div>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-5 xl:grid-cols-2">
		<!-- Role management -->
		<div class="themed-card rounded-xl p-5">
			<h4 class="themed-text-primary mb-1 text-sm font-semibold">Role Management</h4>
			<p class="themed-text-secondary mb-4 text-xs">
				All role changes are logged in the audit trail.
			</p>

			{#if (form as any)?.roleSuccess}
				<div
					role="status"
					class="mb-4 rounded-lg border border-[#3de8c8]/30 bg-[#3de8c8]/10 p-3 text-sm text-[#3de8c8]"
				>
					Role updated successfully
				</div>
			{/if}
			{#if (form as any)?.roleError}
				<div role="alert" class="mb-4 rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
					{(form as any).roleError}
				</div>
			{/if}

			<form
				method="POST"
				action="?/setRole"
				use:enhance={({ cancel }) => {
					if (selectedRole === data.profile?.role) {
						cancel();
						return;
					}
					const verb = selectedRole === 'admin' ? 'promote' : 'demote';
					if (
						!confirm(
							`Are you sure you want to ${verb} ${data.profile?.name ?? 'this user'} to "${selectedRole}"? This change takes effect immediately.`
						)
					) {
						cancel();
						return;
					}
					roleSaving = true;
					return async ({ update }) => {
						await update();
						roleSaving = false;
					};
				}}
				class="space-y-3"
			>
				<div>
					<label for="role" class="themed-text-secondary mb-1 block text-xs">New role</label>
					<select
						id="role"
						name="role"
						bind:value={selectedRole}
						class="themed-text-primary w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3
                                   py-2 text-sm focus:border-[color:var(--accent)] focus:outline-none"
					>
						<option value="user">User</option>
						<option value="admin">Admin</option>
					</select>
				</div>

				<div>
					<label for="reason" class="themed-text-secondary mb-1 block text-xs">
						Reason <span class="text-[color:var(--text-subtle)]"
							>(optional — appears in audit log)</span
						>
					</label>
					<input
						id="reason"
						name="reason"
						type="text"
						class="themed-text-primary w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3
                                  py-2 text-sm placeholder-[color:var(--text-subtle)] focus:border-[color:var(--accent)]
                                  focus:outline-none"
						placeholder="e.g. Beta tester promotion"
					/>
				</div>

				<button
					type="submit"
					disabled={roleSaving}
					class="rounded-lg bg-[#f5a623] px-4 py-2 text-sm
                               font-semibold text-[#0a0809] transition-colors hover:bg-[#c97e0a] disabled:opacity-50"
				>
					{roleSaving ? 'Saving...' : 'Update role'}
				</button>
			</form>
		</div>

		<!-- Coach status -->
		<div class="themed-card rounded-xl p-5">
			<h4 class="themed-text-primary mb-1 text-sm font-semibold">Coach Status</h4>
			<p class="themed-text-secondary mb-4 text-xs">
				Gates access to /coach — see the Coach Applications page for the formal review queue.
			</p>

			{#if (form as any)?.coachGrantSuccess}
				<div
					role="status"
					class="mb-4 rounded-lg border border-[#3de8c8]/30 bg-[#3de8c8]/10 p-3 text-sm text-[#3de8c8]"
				>
					Coach status granted.
				</div>
			{/if}
			{#if (form as any)?.coachGrantError}
				<div role="alert" class="mb-4 rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
					{(form as any).coachGrantError}
				</div>
			{/if}

			<div class="mb-4">
				<span
					class="rounded px-2 py-0.5 text-xs
                         {data.profile?.coach_status === 'approved'
						? 'border border-[#3de8c8]/40 bg-[#3de8c8]/10 text-[#3de8c8]'
						: data.profile?.coach_status === 'pending'
							? 'border border-[#f5a623]/40 bg-[#f5a623]/10 text-[#f5a623]'
							: data.profile?.coach_status === 'rejected'
								? 'border border-red-800/40 bg-red-900/20 text-red-400'
								: 'themed-text-secondary bg-[color:var(--border)]'}"
				>
					{data.profile?.coach_status ?? 'none'}
				</span>
			</div>

			{#if data.profile?.coach_status !== 'approved'}
				<form
					method="POST"
					action="?/grantCoach"
					use:enhance={({ cancel }) => {
						if (
							!confirm(
								`Directly grant coach status to ${data.profile?.name ?? 'this user'}? This bypasses the application review process and takes effect immediately.`
							)
						) {
							cancel();
							return;
						}
						coachGrantSaving = true;
						return async ({ update }) => {
							await update();
							coachGrantSaving = false;
						};
					}}
					class="space-y-3"
				>
					<div>
						<label for="coachGrantReason" class="themed-text-secondary mb-1 block text-xs">
							Reason <span class="text-[color:var(--text-subtle)]">(optional)</span>
						</label>
						<input
							id="coachGrantReason"
							name="reason"
							type="text"
							class="themed-text-primary w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3
                                  py-2 text-sm placeholder-[color:var(--text-subtle)] focus:border-[color:var(--accent)]
                                  focus:outline-none"
							placeholder="e.g. Known club coach, verified in person"
						/>
					</div>
					<button
						type="submit"
						disabled={coachGrantSaving}
						class="rounded-lg bg-[#f5a623] px-4 py-2 text-sm
                               font-semibold text-[#0a0809] transition-colors hover:bg-[#c97e0a] disabled:opacity-50"
					>
						{coachGrantSaving ? 'Granting...' : 'Grant coach status'}
					</button>
				</form>
			{/if}
		</div>

		<!-- Rider & bike summary -->
		<div class="themed-card rounded-xl p-5">
			<h4 class="themed-text-primary mb-4 text-sm font-semibold">Rider & Bike</h4>
			<div class="grid grid-cols-2 gap-3 text-xs">
				{#each [{ label: 'Height', value: data.rider?.height_cm ? `${data.rider.height_cm} cm` : '—' }, { label: 'Weight', value: data.rider?.weight_kg ? `${data.rider.weight_kg} kg` : '—' }, { label: 'Level', value: data.rider?.rider_level ?? '—' }, { label: 'DOB', value: fmtDate(data.rider?.date_of_birth ?? null) }, { label: 'Bike', value: data.bike?.name ?? '—' }, { label: 'Gear ratio', value: data.bike ? `${(data.bike.chainring_teeth / data.bike.sprocket_teeth).toFixed(2)}:1` : '—' }, { label: 'Crank', value: data.bike?.crank_length_mm ? `${data.bike.crank_length_mm}mm` : '—' }, { label: 'Bike weight', value: data.bike?.weight_kg ? `${data.bike.weight_kg}kg` : '—' }] as stat}
					<div class="rounded-lg bg-[color:var(--background)] p-2.5">
						<p class="mb-0.5 text-[color:var(--text-subtle)]">{stat.label}</p>
						<p class="themed-text-primary font-medium">{stat.value}</p>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Session list -->
	<div class="themed-card rounded-xl p-5">
		<h4 class="themed-text-primary mb-4 text-sm font-semibold">
			Sessions ({data.sessions.length})
		</h4>
		{#if data.sessions.length === 0}
			<p class="py-4 text-center text-sm text-[color:var(--text-subtle)]">No sessions uploaded</p>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full min-w-[400px] text-sm">
					<thead>
						<tr class="border-b border-[color:var(--border)]">
							{#each ['Date', 'Type', 'Runs', 'Status'] as h}
								<th
									class="themed-text-secondary pr-4 pb-2 text-left text-xs
                                           font-semibold tracking-wider uppercase">{h}</th
								>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each data.sessions as session}
							<tr class="border-b border-[color:var(--border)]/50">
								<td class="themed-text-primary py-2.5 pr-4">
									{fmtDateTime(session.timestamp)}
								</td>
								<td class="py-2.5 pr-4">
									<span
										class="rounded border border-[#f5a623]/20 bg-[#f5a623]/10
                                                 px-2 py-0.5 text-xs text-[#f5a623]"
									>
										{session.session_type}
									</span>
								</td>
								<td class="themed-text-secondary py-2.5 pr-4">
									{session.runs?.length ?? 0}
								</td>
								<td
									class="py-2.5 text-xs
                                           {session.archived ? 'text-[#4a4038]' : 'text-[#3de8c8]'}"
								>
									{session.archived ? 'Archived' : 'Active'}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>

	<!-- Coach relationships (safeguarding oversight) -->
	{#if data.coachLinks.length > 0}
		<div class="themed-card rounded-xl p-5">
			<h4 class="themed-text-primary mb-1 text-sm font-semibold">Coach Relationships</h4>
			<p class="themed-text-secondary mb-4 text-xs">
				Full history for safeguarding oversight. Force-revoking ends the relationship
				immediately — the coach loses access, the rider's own data is untouched.
			</p>

			{#if (form as any)?.coachLinkSuccess}
				<div
					role="status"
					class="mb-4 rounded-lg border border-jns-success/30 bg-jns-success/10 p-3 text-sm text-jns-success"
				>
					Done
				</div>
			{/if}
			{#if (form as any)?.coachLinkError}
				<div role="alert" class="mb-4 rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
					{(form as any).coachLinkError}
				</div>
			{/if}

			<div class="space-y-2">
				{#each data.coachLinks as link (link.linkId)}
					<div
						class="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[color:var(--background)] p-3 text-xs"
					>
						<div>
							<p class="themed-text-primary font-medium">{link.coachName}</p>
							<p class="text-[color:var(--text-subtle)]">{link.coachEmail}</p>
						</div>
						<div class="flex items-center gap-3">
							<span
								class="rounded px-2 py-0.5
                                       {link.status === 'active'
									? 'border border-jns-success/30 bg-jns-success/10 text-jns-success'
									: 'themed-text-secondary bg-[color:var(--border)]'}"
							>
								{link.status}
							</span>
							{#if link.status === 'active'}
								<form
									method="POST"
									action="?/forceRevokeCoach"
									onsubmit={(e) => {
										if (!confirm(`Force-revoke ${link.coachName}'s access to this rider?`)) {
											e.preventDefault();
										}
									}}
								>
									<input type="hidden" name="linkId" value={link.linkId} />
									<button
										type="submit"
										class="rounded border border-red-800/40 px-2 py-1 text-red-400
                                               transition-colors hover:bg-red-900/20"
									>
										Force revoke
									</button>
								</form>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Audit log -->
	{#if data.auditLog.length > 0}
		<div class="themed-card rounded-xl p-5">
			<h4 class="themed-text-primary mb-4 text-sm font-semibold">Role Change History</h4>
			<div class="space-y-2">
				{#each data.auditLog as entry}
					<div class="flex items-center gap-3 rounded-lg bg-[color:var(--background)] p-3 text-xs">
						<span class="flex-shrink-0 text-[color:var(--text-subtle)]">
							{fmtDateTime(entry.changed_at)}
						</span>
						<span class="themed-text-secondary">
							{entry.old_role ?? '—'} → <span class="themed-accent">{entry.new_role}</span>
						</span>
						{#if entry.reason}
							<span class="ml-auto text-[color:var(--text-subtle)]">{entry.reason}</span>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

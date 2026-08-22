<script lang="ts">
	import type { PageData, ActionData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();

	let messageSaving = $state(false);
	let flagSaving = $state(false);
	let showFlagForm = $state(false);
	let removing = $state(false);

	let activeGoals = $derived(data.goals.filter((goal) => !goal.completed));
	let unresolvedProfileFlags = $derived(
		data.messages.filter(
			(message) => message.message_type === 'profile_flag' && message.resolved_at === null
		).length
	);

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

	const RIDER_LEVEL_LABELS: Record<string, string> = {
		grom: 'Grom (age 2–12)',
		rider: 'Club Rider (age 13–18)',
		expert: 'Expert / Regional',
		elite: 'Elite / National'
	};

	function reportTypeLabel(type: string) {
		if (type === 'coach-session') return 'Session Report';
		if (type === 'progress') return 'Progress Report';
		if (type === 'diagnostic') return 'Diagnostic';
		if (type === 'rider-parent') return 'Rider / Parent Summary';
		return type;
	}
</script>

<svelte:head>
	<title>{data.rider?.name ?? 'Rider'} — Coach — AppGatePro</title>
</svelte:head>

<div class="space-y-6">
	<a
		href="/coach"
		class="themed-text-secondary inline-flex items-center gap-1 text-sm transition-colors hover:text-[color:var(--accent)]"
	>
		<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
		</svg>
		Your riders
	</a>

	<section class="themed-card rounded-xl p-5 sm:p-6">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div class="flex min-w-0 items-center gap-4">
				<div class="themed-bg-accent flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full">
					<span class="themed-accent text-lg font-bold">
						{data.rider?.name?.charAt(0).toUpperCase() ?? '?'}
					</span>
				</div>
				<div class="min-w-0">
					<p class="themed-accent text-[11px] font-semibold tracking-[0.14em] uppercase">Active coaching link</p>
					<h2 class="themed-text-primary truncate text-xl font-bold">{data.rider?.name || '—'}</h2>
					<p class="themed-text-secondary truncate text-sm">{data.rider?.email}</p>
					{#if data.rider?.club || data.rider?.country}
						<div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-[color:var(--text-subtle)]">
							{#if data.rider?.club}<span>{data.rider.club}</span>{/if}
							{#if data.rider?.country}<span>{data.rider.country}</span>{/if}
						</div>
					{/if}
				</div>
			</div>

			<div class="grid grid-cols-3 gap-2 text-center text-xs">
				<div class="rounded-lg bg-[color:var(--background)] px-3 py-2">
					<p class="themed-text-primary text-lg font-bold">{data.reportShares.length}</p>
					<p class="themed-text-secondary">Shared</p>
				</div>
				<div class="rounded-lg bg-[color:var(--background)] px-3 py-2">
					<p class="themed-text-primary text-lg font-bold">{activeGoals.length}</p>
					<p class="themed-text-secondary">Goals</p>
				</div>
				<div class="rounded-lg bg-[color:var(--background)] px-3 py-2">
					<p class:text-[#f5a623]={unresolvedProfileFlags > 0} class="themed-text-primary text-lg font-bold">
						{unresolvedProfileFlags}
					</p>
					<p class="themed-text-secondary">Open flags</p>
				</div>
			</div>
		</div>

		<div class="mt-5 rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] p-3 text-xs">
			<p class="themed-text-primary font-semibold">Shared-access boundary</p>
			<p class="themed-text-secondary mt-1">
				You can see this rider's shared reports, training goals and onboarding reference profile. Their
				full session history and private session notes are not pulled into the coach workspace.
			</p>
		</div>
	</section>

	<section class="themed-card rounded-xl p-5">
		<div class="mb-4 flex flex-wrap items-end justify-between gap-3">
			<div>
				<p class="themed-accent text-xs font-semibold tracking-[0.14em] uppercase">Shared evidence</p>
				<h3 class="themed-text-primary mt-1 text-base font-bold">Reports from {data.rider?.name ?? 'this rider'}</h3>
				<p class="themed-text-secondary mt-1 text-xs">
					These are explicit rider shares, not automatic access to every training session.
				</p>
			</div>
			<span class="themed-text-secondary text-xs">{data.reportShares.length} shared</span>
		</div>

		{#if data.reportShares.length === 0}
			<div class="rounded-lg bg-[color:var(--background)] p-5 text-center">
				<p class="themed-text-primary text-sm font-medium">No reports shared yet</p>
				<p class="themed-text-secondary mx-auto mt-1 max-w-lg text-xs">
					When the rider chooses Send to Coach from a generated report, it will appear here. Their lack of
					a shared report does not imply they have not trained.
				</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
				{#each data.reportShares as share (share.id)}
					<a
						href="/coach/riders/{data.linkId}/reports/{share.id}"
						class="group rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] p-4 transition-colors hover:border-[color:var(--accent)]"
					>
						<div class="flex items-start justify-between gap-3">
							<div>
								<p class="themed-text-primary font-medium">{reportTypeLabel(share.report_type)}</p>
								<p class="mt-1 text-xs text-[color:var(--text-subtle)]">Shared {fmtDateTime(share.created_at)}</p>
							</div>
							<span class="themed-accent text-xs font-semibold group-hover:underline">Open →</span>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</section>

	<section class="themed-card rounded-xl p-5">
		<div class="mb-4">
			<p class="themed-accent text-xs font-semibold tracking-[0.14em] uppercase">Direction</p>
			<h3 class="themed-text-primary mt-1 text-base font-bold">Training goals</h3>
			<p class="themed-text-secondary mt-1 text-xs">Read-only. Goal ownership and edits remain with the rider.</p>
		</div>

		{#if data.goals.length === 0}
			<p class="rounded-lg bg-[color:var(--background)] p-4 text-sm text-[color:var(--text-subtle)]">
				No goals on file.
			</p>
		{:else}
			<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
				{#each data.goals as goal (goal.id)}
					<div class="rounded-lg bg-[color:var(--background)] p-4 text-xs">
						<div class="flex items-start justify-between gap-3">
							<div>
								<p class="themed-text-primary font-semibold">{goal.metric}</p>
								{#if !goal.completed}
									<p class="themed-text-secondary mt-1">Best so far {goal.current_value ?? '—'} · Target {goal.target_value}</p>
								{/if}
							</div>
							{#if goal.completed}
								<span class="rounded border border-[#3de8c8]/30 bg-[#3de8c8]/10 px-2 py-0.5 text-[11px] text-[#3de8c8]">Completed</span>
							{:else}
								<span class="rounded border border-[color:var(--border)] px-2 py-0.5 text-[11px] text-[color:var(--text-subtle)]">Active</span>
							{/if}
						</div>
						{#if goal.deadline}
							<p class="mt-2 text-[color:var(--text-subtle)]">Due {fmtDate(goal.deadline)}</p>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</section>

	<section class="themed-card rounded-xl p-5">
		<div class="mb-4">
			<p class="themed-accent text-xs font-semibold tracking-[0.14em] uppercase">Conversation</p>
			<h3 class="themed-text-primary mt-1 text-base font-bold">Shared thread</h3>
			<p class="themed-text-secondary mt-1 text-xs">
				Messages and profile flags live here. Private rider session notes remain separate.
			</p>
		</div>

		{#if form && 'messageSuccess' in form && form.messageSuccess}
			<div class="mb-4 rounded-lg border border-[#3de8c8]/30 bg-[#3de8c8]/10 p-3 text-sm text-[#3de8c8]">
				Message sent
			</div>
		{/if}
		{#if form && 'messageError' in form}
			<div class="mb-4 rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
				{form.messageError}
			</div>
		{/if}

		<div class="mb-4 max-h-96 space-y-2 overflow-y-auto">
			{#each data.messages as message (message.id)}
				<div class="rounded-lg bg-[color:var(--background)] p-3 text-sm">
					<div class="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs text-[color:var(--text-subtle)]">
						<span>
							{message.sender_id === data.coachId ? 'You' : data.rider?.name}
							{#if message.message_type === 'profile_flag'}
								<span class="ml-1 rounded bg-[#f5a623]/10 px-1.5 py-0.5 text-[#f5a623]">
									Flag: {message.flagged_field}{message.resolved_at ? ' · resolved' : ''}
								</span>
							{/if}
						</span>
						<span>{fmtDateTime(message.created_at)}</span>
					</div>
					<p class="themed-text-primary">{message.content}</p>
				</div>
			{:else}
				<p class="rounded-lg bg-[color:var(--background)] py-5 text-center text-sm text-[color:var(--text-subtle)]">
					No messages yet
				</p>
			{/each}
		</div>

		<form method="POST" action="?/sendMessage" onsubmit={() => (messageSaving = true)} class="flex flex-col gap-2 sm:flex-row">
			<input
				type="text"
				name="content"
				required
				placeholder="Send a message..."
				class="themed-text-primary min-w-0 flex-1 rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3
                       py-2 text-sm placeholder-[color:var(--text-subtle)] focus:border-[color:var(--accent)] focus:outline-none"
			/>
			<button
				type="submit"
				disabled={messageSaving}
				class="rounded-lg bg-[#f5a623] px-4 py-2 text-sm font-semibold text-[#0a0809]
                       transition-colors hover:bg-[#c97e0a] disabled:opacity-50"
			>
				{messageSaving ? 'Sending…' : 'Send'}
			</button>
		</form>
	</section>

	<section class="themed-card rounded-xl p-5">
		<div class="mb-4 flex flex-wrap items-start justify-between gap-3">
			<div>
				<p class="themed-accent text-xs font-semibold tracking-[0.14em] uppercase">Reference</p>
				<h3 class="themed-text-primary mt-1 text-base font-bold">Onboarding profile</h3>
				<p class="themed-text-secondary mt-1 text-xs">
					View-only. If something looks wrong, flag it in the shared thread; only the rider or their
					parent/guardian can change it.
				</p>
			</div>
			<button
				onclick={() => (showFlagForm = !showFlagForm)}
				class="rounded-lg border border-[#f5a623]/30 px-3 py-1.5 text-xs text-[#f5a623] transition-colors hover:border-[#f5a623]/60"
			>
				{showFlagForm ? 'Cancel flag' : 'Flag inaccuracy'}
			</button>
		</div>

		{#if form && 'flagSuccess' in form && form.flagSuccess}
			<div class="mb-4 rounded-lg border border-[#3de8c8]/30 bg-[#3de8c8]/10 p-3 text-sm text-[#3de8c8]">
				Flag sent
			</div>
		{/if}
		{#if form && 'flagError' in form}
			<div class="mb-4 rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
				{form.flagError}
			</div>
		{/if}

		{#if showFlagForm}
			<form
				method="POST"
				action="?/flagProfile"
				onsubmit={() => (flagSaving = true)}
				class="mb-4 space-y-2 rounded-lg bg-[color:var(--background)] p-3"
			>
				<select
					name="flaggedField"
					required
					class="themed-text-primary w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm focus:border-[color:var(--accent)] focus:outline-none"
				>
					<option value="rider_level">Rider level</option>
					<option value="years_racing">Years racing</option>
					<option value="height_cm">Height</option>
					<option value="weight_kg">Weight</option>
					<option value="other">Other</option>
				</select>
				<textarea
					name="content"
					required
					placeholder="What looks wrong?"
					class="themed-text-primary min-h-24 w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm placeholder-[color:var(--text-subtle)] focus:border-[color:var(--accent)] focus:outline-none"
				></textarea>
				<button
					type="submit"
					disabled={flagSaving}
					class="rounded-lg bg-[#f5a623] px-3 py-1.5 text-xs font-semibold text-[#0a0809] transition-colors hover:bg-[#c97e0a] disabled:opacity-50"
				>
					{flagSaving ? 'Sending…' : 'Send flag'}
				</button>
			</form>
		{/if}

		{#if data.riderProfile}
			<div class="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
				{#each [{ label: 'Rider level', value: RIDER_LEVEL_LABELS[data.riderProfile.rider_level ?? ''] ?? data.riderProfile.rider_level ?? '—' }, { label: 'Years racing', value: data.riderProfile.years_racing ?? '—' }, { label: 'Height', value: data.riderProfile.height_cm ? `${data.riderProfile.height_cm} cm` : '—' }, { label: 'Weight', value: data.riderProfile.weight_kg ? `${data.riderProfile.weight_kg} kg` : '—' }, { label: 'Dominant leg', value: data.riderProfile.dominant_leg ?? '—' }, { label: 'DOB', value: fmtDate(data.riderProfile.date_of_birth) }] as stat (stat.label)}
					<div class="rounded-lg bg-[color:var(--background)] p-3">
						<p class="mb-0.5 text-[color:var(--text-subtle)]">{stat.label}</p>
						<p class="themed-text-primary font-medium">{stat.value}</p>
					</div>
				{/each}
			</div>
		{:else}
			<p class="rounded-lg bg-[color:var(--background)] p-4 text-sm text-[color:var(--text-subtle)]">
				No onboarding profile on file yet.
			</p>
		{/if}
	</section>

	<section class="rounded-xl border border-red-900/30 p-4">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div>
				<p class="themed-text-primary text-sm font-semibold">Coaching relationship</p>
				<p class="themed-text-secondary mt-0.5 text-xs">
					Removing the rider revokes this coaching link; it does not delete any of their data.
				</p>
			</div>
			<form
				method="POST"
				action="?/removeTrainee"
				onsubmit={(event) => {
					if (!confirm(`Remove ${data.rider?.name ?? 'this rider'} from your roster?`)) {
						event.preventDefault();
						return;
					}
					removing = true;
				}}
			>
				<button
					type="submit"
					disabled={removing}
					class="rounded-lg border border-red-800/50 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-900/20 disabled:opacity-50"
				>
					{removing ? 'Removing…' : 'Remove trainee'}
				</button>
			</form>
		</div>
	</section>
</div>

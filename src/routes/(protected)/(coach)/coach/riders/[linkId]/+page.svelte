<script lang="ts">
	import type { PageData, ActionData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();

	let messageSaving = $state(false);
	let flagSaving = $state(false);
	let showFlagForm = $state(false);
	let removing = $state(false);

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

<div class="space-y-5">
	<!-- Back -->
	<a
		href="/coach"
		class="themed-text-secondary inline-flex items-center gap-1 text-sm transition-colors hover:text-[color:var(--accent)]"
	>
		<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
		</svg>
		My Riders
	</a>

	<!-- Profile header -->
	<div class="themed-card rounded-xl p-6">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div class="flex items-center gap-4">
				<div
					class="themed-bg-accent flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full"
				>
					<span class="themed-accent text-lg font-bold">
						{data.rider?.name?.charAt(0).toUpperCase() ?? '?'}
					</span>
				</div>
				<div>
					<h3 class="themed-text-primary text-lg font-bold">{data.rider?.name || '—'}</h3>
					<p class="themed-text-secondary text-sm">{data.rider?.email}</p>
					{#if data.rider?.club || data.rider?.country}
						<div class="mt-1 flex items-center gap-2 text-xs text-[color:var(--text-subtle)]">
							{#if data.rider?.club}<span>{data.rider.club}</span>{/if}
							{#if data.rider?.country}<span>{data.rider.country}</span>{/if}
						</div>
					{/if}
				</div>
			</div>

			<form
				method="POST"
				action="?/removeTrainee"
				onsubmit={(e) => {
					if (!confirm(`Remove ${data.rider?.name ?? 'this rider'} from your roster?`)) {
						e.preventDefault();
						return;
					}
					removing = true;
				}}
			>
				<button
					type="submit"
					disabled={removing}
					class="rounded-lg border border-red-800/40 px-3 py-1.5 text-xs text-red-400
                           transition-colors hover:bg-red-900/20 disabled:opacity-50"
				>
					Remove trainee
				</button>
			</form>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-5 xl:grid-cols-2">
		<!-- Onboarding profile (view + flag, never edit) -->
		<div class="themed-card rounded-xl p-5">
			<div class="mb-3 flex items-center justify-between">
				<h4 class="themed-text-primary text-sm font-semibold">Onboarding Profile</h4>
				<button
					onclick={() => (showFlagForm = !showFlagForm)}
					class="rounded-lg border border-[#f5a623]/30 px-3 py-1 text-xs text-[#f5a623]
                           transition-colors hover:border-[#f5a623]/60"
				>
					Flag inaccuracy
				</button>
			</div>
			<p class="themed-text-secondary mb-4 text-xs">
				View-only — you can flag something that looks wrong, but only {data.rider?.name ??
					'the rider'} (or their parent/guardian) can change it.
			</p>

			{#if form && 'flagSuccess' in form && form.flagSuccess}
				<div
					class="mb-4 rounded-lg border border-[#3de8c8]/30 bg-[#3de8c8]/10 p-3 text-sm text-[#3de8c8]"
				>
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
						class="themed-text-primary w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3
                               py-1.5 text-sm focus:border-[color:var(--accent)] focus:outline-none"
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
						class="themed-text-primary w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3
                               py-1.5 text-sm placeholder-[color:var(--text-subtle)] focus:border-[color:var(--accent)] focus:outline-none"
					></textarea>
					<button
						type="submit"
						disabled={flagSaving}
						class="rounded-lg bg-[#f5a623] px-3 py-1.5 text-xs font-semibold text-[#0a0809]
                               transition-colors hover:bg-[#c97e0a] disabled:opacity-50"
					>
						{flagSaving ? 'Sending…' : 'Send flag'}
					</button>
				</form>
			{/if}

			{#if data.riderProfile}
				<div class="grid grid-cols-2 gap-3 text-xs">
					{#each [{ label: 'Rider level', value: RIDER_LEVEL_LABELS[data.riderProfile.rider_level ?? ''] ?? data.riderProfile.rider_level ?? '—' }, { label: 'Years racing', value: data.riderProfile.years_racing ?? '—' }, { label: 'Height', value: data.riderProfile.height_cm ? `${data.riderProfile.height_cm} cm` : '—' }, { label: 'Weight', value: data.riderProfile.weight_kg ? `${data.riderProfile.weight_kg} kg` : '—' }, { label: 'Dominant leg', value: data.riderProfile.dominant_leg ?? '—' }, { label: 'DOB', value: fmtDate(data.riderProfile.date_of_birth) }] as stat (stat.label)}
						<div class="rounded-lg bg-[color:var(--background)] p-2.5">
							<p class="mb-0.5 text-[color:var(--text-subtle)]">{stat.label}</p>
							<p class="themed-text-primary font-medium">{stat.value}</p>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-[color:var(--text-subtle)]">No onboarding profile on file yet.</p>
			{/if}
		</div>

		<!-- Goals (read-only) -->
		<div class="themed-card rounded-xl p-5">
			<h4 class="themed-text-primary mb-4 text-sm font-semibold">Training Goals</h4>
			{#if data.goals.length === 0}
				<p class="text-sm text-[color:var(--text-subtle)]">No active goals.</p>
			{:else}
				<div class="space-y-2">
					{#each data.goals as goal (goal.id)}
						<div class="rounded-lg bg-[color:var(--background)] p-3 text-xs">
							<div class="flex items-center justify-between">
								<span class="themed-text-primary font-medium">{goal.metric}</span>
								{#if goal.completed}
									<span class="text-[#3de8c8]">Completed</span>
								{:else}
									<span class="themed-text-secondary"
										>{goal.current_value ?? '—'} → {goal.target_value}</span
									>
								{/if}
							</div>
							{#if goal.deadline}
								<p class="mt-1 text-[color:var(--text-subtle)]">Due {fmtDate(goal.deadline)}</p>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Shared thread -->
	<div class="themed-card rounded-xl p-5">
		<h4 class="themed-text-primary mb-4 text-sm font-semibold">
			Messages ({data.messages.length})
		</h4>

		{#if form && 'messageSuccess' in form && form.messageSuccess}
			<div
				class="mb-4 rounded-lg border border-[#3de8c8]/30 bg-[#3de8c8]/10 p-3 text-sm text-[#3de8c8]"
			>
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
					<div class="mb-1 flex items-center justify-between text-xs text-[color:var(--text-subtle)]">
						<span>
							{message.sender_id === data.coachId ? 'You' : data.rider?.name}
							{#if message.message_type === 'profile_flag'}
								<span class="ml-1 rounded bg-[#f5a623]/10 px-1.5 py-0.5 text-[#f5a623]">
									Flag: {message.flagged_field}
								</span>
							{/if}
						</span>
						<span>{fmtDateTime(message.created_at)}</span>
					</div>
					<p class="themed-text-primary">{message.content}</p>
				</div>
			{:else}
				<p class="py-4 text-center text-sm text-[color:var(--text-subtle)]">No messages yet</p>
			{/each}
		</div>

		<form
			method="POST"
			action="?/sendMessage"
			onsubmit={() => (messageSaving = true)}
			class="flex gap-2"
		>
			<input
				type="text"
				name="content"
				required
				placeholder="Send a message..."
				class="themed-text-primary flex-1 rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3
                       py-2 text-sm placeholder-[color:var(--text-subtle)] focus:border-[color:var(--accent)] focus:outline-none"
			/>
			<button
				type="submit"
				disabled={messageSaving}
				class="rounded-lg bg-[#f5a623] px-4 py-2 text-sm font-semibold text-[#0a0809]
                       transition-colors hover:bg-[#c97e0a] disabled:opacity-50"
			>
				Send
			</button>
		</form>
	</div>

	<!-- Reports shared with me -->
	<div class="themed-card rounded-xl p-5">
		<h4 class="themed-text-primary mb-4 text-sm font-semibold">
			Reports Shared With Me ({data.reportShares.length})
		</h4>
		{#if data.reportShares.length === 0}
			<p class="py-4 text-center text-sm text-[color:var(--text-subtle)]">
				No reports shared yet — {data.rider?.name ?? 'the rider'} can send you one from any generated
				report.
			</p>
		{:else}
			<div class="space-y-2">
				{#each data.reportShares as share (share.id)}
					<div class="flex items-center justify-between rounded-lg bg-[color:var(--background)] p-3 text-sm">
						<div>
							<p class="themed-text-primary font-medium">{reportTypeLabel(share.report_type)}</p>
							<p class="text-xs text-[color:var(--text-subtle)]">{fmtDateTime(share.created_at)}</p>
						</div>
						<a
							href="/coach/riders/{data.linkId}/reports/{share.id}"
							class="themed-accent text-xs whitespace-nowrap hover:underline"
						>
							View →
						</a>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

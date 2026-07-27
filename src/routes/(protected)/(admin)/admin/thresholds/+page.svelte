<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const PROFILE_LABELS: Record<string, string> = {
		grom: 'Grom (age 2–12)',
		rider: 'Club Rider (age 13–18)',
		expert: 'Expert / Regional',
		elite: 'Elite / National',
		coach: 'Coach view'
	};

	const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
		hardcoded: { label: 'Seed values', color: 'text-[#9a8f7a]' },
		auto: { label: 'Auto-derived', color: 'text-[#3de8c8]' },
		manual: { label: 'Manual', color: 'text-[#f5a623]' },
		manual_override: { label: 'Manual override', color: 'text-[#ff6b3d]' }
	};

	const PROFILE_ORDER = ['grom', 'rider', 'expert', 'elite', 'coach'];

	let editingLevel = $state<string | null>(null);
	let refreshing = $state(false);

	function startEdit(level: string) {
		editingLevel = level;
	}
	function cancelEdit() {
		editingLevel = null;
	}

	function getThreshold(level: string) {
		return data.thresholds.find((t: any) => t.profile_level === level);
	}

	function formatDate(iso: string | null) {
		if (!iso) return '—';
		return new Date(iso).toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>Threshold Profiles — AppGatePro Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-start justify-between gap-4">
		<div>
			<h2 class="text-lg font-bold text-[#f0ece4]">Performance Threshold Profiles</h2>
			<p class="mt-0.5 text-sm text-[#9a8f7a]">
				Thresholds used to score technique runs. Auto-derived from real session data once minimum
				sample sizes are reached. Manual overrides persist across auto refreshes.
			</p>
		</div>
		<form
			method="POST"
			action="?/triggerRefresh"
			use:enhance={() => {
				refreshing = true;
				return async ({ update }) => {
					await update();
					refreshing = false;
				};
			}}
		>
			<button
				type="submit"
				disabled={refreshing}
				class="rounded-lg border border-[#3a2e24] bg-[#221c18] px-4 py-2 text-sm text-[#f5a623]
                       transition-colors hover:border-[#f5a623]/40 disabled:opacity-50"
			>
				{refreshing ? 'Refreshing…' : 'Trigger refresh'}
			</button>
		</form>
	</div>

	{#if (form as any)?.refreshSuccess}
		<div
			class="rounded-lg border border-[#3de8c8]/30 bg-[#3de8c8]/10 px-4 py-3 text-sm text-[#3de8c8]"
		>
			Aggregates and thresholds refreshed successfully.
		</div>
	{/if}
	{#if (form as any)?.error}
		<div class="rounded-lg border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-400">
			{(form as any).error}
		</div>
	{/if}

	<!-- Population summary -->
	<div class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
		<h3 class="mb-3 text-sm font-semibold text-[#f0ece4]">Dataset population</h3>
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
			<div>
				<p class="text-2xl font-bold text-[#f5a623]">{data.totalRiders}</p>
				<p class="text-xs text-[#9a8f7a]">Total riders with snapshots</p>
			</div>
			{#each Object.entries(data.populationSummary) as [level, count]}
				<div>
					<p class="text-2xl font-bold text-[#f0ece4]">{count}</p>
					<p class="text-xs text-[#9a8f7a] capitalize">{level}</p>
				</div>
			{/each}
		</div>
		<p class="mt-3 text-xs text-[#4a4038]">
			Minimum sample sizes before auto-derivation: grom ≥15, rider/expert ≥25, elite ≥20.
		</p>
	</div>

	<!-- Distribution context -->
	{#if data.aggregatesByMetric['reaction_ms']}
		<div class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
			<h3 class="mb-3 text-sm font-semibold text-[#f0ece4]">
				Global distribution (all riders, n={data.aggregatesByMetric['reaction_ms']?.sample_size ??
					0})
			</h3>
			<div class="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
				{#each [{ metric: 'reaction_ms', label: 'Reaction time (ms)', unit: 'ms', lowerBetter: true }, { metric: 'max_g', label: 'Peak G-force', unit: 'g', lowerBetter: false }, { metric: 'peak_speed_ms', label: 'Peak speed', unit: 'm/s', lowerBetter: false }, { metric: 'consistency', label: 'Consistency', unit: '/100', lowerBetter: false }] as row}
					{@const agg = data.aggregatesByMetric[row.metric]}
					{#if agg}
						<div class="space-y-1">
							<p class="font-medium text-[#9a8f7a]">{row.label}</p>
							<div class="space-y-0.5 text-[#4a4038]">
								<p>
									p10: <span class="text-[#f0ece4]"
										>{agg.percentile_10?.toFixed(
											row.metric === 'reaction_ms' ? 0 : 2
										)}{row.unit}</span
									>
								</p>
								<p>
									p25: <span class="text-[#f0ece4]"
										>{agg.percentile_25?.toFixed(
											row.metric === 'reaction_ms' ? 0 : 2
										)}{row.unit}</span
									>
								</p>
								<p>
									p50: <span class="text-[#f0ece4]"
										>{agg.percentile_50?.toFixed(
											row.metric === 'reaction_ms' ? 0 : 2
										)}{row.unit}</span
									>
								</p>
								<p>
									p75: <span class="text-[#f0ece4]"
										>{agg.percentile_75?.toFixed(
											row.metric === 'reaction_ms' ? 0 : 2
										)}{row.unit}</span
									>
								</p>
								<p>
									p90: <span class="text-[#f0ece4]"
										>{agg.percentile_90?.toFixed(
											row.metric === 'reaction_ms' ? 0 : 2
										)}{row.unit}</span
									>
								</p>
							</div>
						</div>
					{/if}
				{/each}
			</div>
		</div>
	{/if}

	<!-- Threshold profiles -->
	{#each PROFILE_ORDER as level}
		{@const t = getThreshold(level)}
		{#if t}
			<div class="overflow-hidden rounded-xl border border-[#221c18] bg-[#131010]">
				<!-- Card header -->
				<div class="flex items-center justify-between border-b border-[#221c18] px-5 py-4">
					<div>
						<h3 class="text-sm font-semibold text-[#f0ece4]">
							{PROFILE_LABELS[level] ?? level}
						</h3>
						<div class="mt-1 flex items-center gap-3 text-xs text-[#4a4038]">
							<span class="{SOURCE_LABELS[t.source]?.color ?? 'text-[#9a8f7a]'} font-medium">
								{SOURCE_LABELS[t.source]?.label ?? t.source}
							</span>
							{#if t.sample_size}
								<span>n={t.sample_size}</span>
							{/if}
							<span>Updated {formatDate(t.computed_at)}</span>
						</div>
						{#if t.notes}
							<p class="mt-1 text-xs text-[#4a4038] italic">{t.notes}</p>
						{/if}
					</div>
					<div class="flex gap-2">
						{#if t.source === 'manual' || t.source === 'manual_override'}
							<form method="POST" action="?/resetToAuto" use:enhance>
								<input type="hidden" name="profile_level" value={level} />
								<button
									type="submit"
									class="rounded-lg border border-[#3a2e24] px-3 py-1.5 text-xs
                                           text-[#9a8f7a] transition-colors hover:border-[#f5a623]/40"
								>
									Reset to auto
								</button>
							</form>
						{/if}
						{#if editingLevel !== level}
							<button
								onclick={() => startEdit(level)}
								class="rounded-lg border border-[#f5a623]/30 px-3 py-1.5 text-xs
                                       text-[#f5a623] transition-colors hover:border-[#f5a623]/60"
							>
								Edit
							</button>
						{/if}
					</div>
				</div>

				{#if editingLevel === level}
					<!-- Edit form -->
					<form
						method="POST"
						action="?/updateThreshold"
						use:enhance={({ cancel }) => {
							if (
								!confirm(
									`Save this override for the "${PROFILE_LABELS[level] ?? level}" profile? This immediately changes how every rider at this level is scored.`
								)
							) {
								cancel();
								return;
							}
							return async ({ update }) => {
								await update();
								editingLevel = null;
							};
						}}
						class="space-y-5 p-5"
					>
						<input type="hidden" name="profile_level" value={level} />

						<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
							<!-- Reaction time -->
							<div class="space-y-3">
								<h4 class="text-xs font-semibold tracking-wider text-[#9a8f7a] uppercase">
									Reaction time (ms) — lower is better
								</h4>
								{#each [{ name: 'reaction_ms_excellent', label: 'Excellent (top 10%)', value: t.reaction_ms_excellent }, { name: 'reaction_ms_good', label: 'Good (top 25%)', value: t.reaction_ms_good }, { name: 'reaction_ms_needs_work', label: 'Needs work (median)', value: t.reaction_ms_needs_work }] as field}
									<div>
										<label for={field.name} class="text-xs text-[#4a4038]">{field.label}</label>
										<input
											id={field.name}
											type="number"
											name={field.name}
											value={field.value}
											step="1"
											min="50"
											max="1000"
											class="mt-1 w-full rounded-lg border border-[#221c18] bg-[#0a0809] px-3
                                                      py-1.5 text-sm text-[#f0ece4] focus:border-[#f5a623]
                                                      focus:ring-1 focus:ring-[#f5a623] focus:outline-none"
										/>
									</div>
								{/each}
							</div>

							<!-- Peak G -->
							<div class="space-y-3">
								<h4 class="text-xs font-semibold tracking-wider text-[#9a8f7a] uppercase">
									Peak G-force — higher is better
								</h4>
								{#each [{ name: 'peak_g_good', label: 'Good (p75)', value: t.peak_g_good }, { name: 'peak_g_excellent', label: 'Excellent (p90)', value: t.peak_g_excellent }] as field}
									<div>
										<label for={field.name} class="text-xs text-[#4a4038]">{field.label}</label>
										<input
											id={field.name}
											type="number"
											name={field.name}
											value={field.value}
											step="0.1"
											min="0.5"
											max="8"
											class="mt-1 w-full rounded-lg border border-[#221c18] bg-[#0a0809] px-3
                                                      py-1.5 text-sm text-[#f0ece4] focus:border-[#f5a623]
                                                      focus:ring-1 focus:ring-[#f5a623] focus:outline-none"
										/>
									</div>
								{/each}

								<h4 class="pt-2 text-xs font-semibold tracking-wider text-[#9a8f7a] uppercase">
									Time to 90% impulse (s) — lower is better
								</h4>
								{#each [{ name: 'impulse_90_excellent', label: 'Excellent', value: t.impulse_90_excellent }, { name: 'impulse_90_good', label: 'Good', value: t.impulse_90_good }, { name: 'impulse_90_needs_work', label: 'Needs work', value: t.impulse_90_needs_work }] as field}
									<div>
										<label for={field.name} class="text-xs text-[#4a4038]">{field.label}</label>
										<input
											id={field.name}
											type="number"
											name={field.name}
											value={field.value}
											step="0.05"
											min="0.2"
											max="4"
											class="mt-1 w-full rounded-lg border border-[#221c18] bg-[#0a0809] px-3
                                                      py-1.5 text-sm text-[#f0ece4] focus:border-[#f5a623]
                                                      focus:ring-1 focus:ring-[#f5a623] focus:outline-none"
										/>
									</div>
								{/each}
							</div>

							<!-- Smoothness + Speed carry -->
							<div class="space-y-3">
								<h4 class="text-xs font-semibold tracking-wider text-[#9a8f7a] uppercase">
									Smoothness score (0–100) — higher is better
								</h4>
								{#each [{ name: 'smoothness_good', label: 'Good', value: t.smoothness_good }, { name: 'smoothness_excellent', label: 'Excellent', value: t.smoothness_excellent }] as field}
									<div>
										<label for={field.name} class="text-xs text-[#4a4038]">{field.label}</label>
										<input
											id={field.name}
											type="number"
											name={field.name}
											value={field.value}
											step="1"
											min="0"
											max="100"
											class="mt-1 w-full rounded-lg border border-[#221c18] bg-[#0a0809] px-3
                                                      py-1.5 text-sm text-[#f0ece4] focus:border-[#f5a623]
                                                      focus:ring-1 focus:ring-[#f5a623] focus:outline-none"
										/>
									</div>
								{/each}

								<h4 class="pt-2 text-xs font-semibold tracking-wider text-[#9a8f7a] uppercase">
									Speed carry ratio (0–1) — higher is better
								</h4>
								{#each [{ name: 'speed_carry_good', label: 'Good', value: t.speed_carry_good }, { name: 'speed_carry_excellent', label: 'Excellent', value: t.speed_carry_excellent }] as field}
									<div>
										<label for={field.name} class="text-xs text-[#4a4038]">{field.label}</label>
										<input
											id={field.name}
											type="number"
											name={field.name}
											value={field.value}
											step="0.01"
											min="0"
											max="1"
											class="mt-1 w-full rounded-lg border border-[#221c18] bg-[#0a0809] px-3
                                                      py-1.5 text-sm text-[#f0ece4] focus:border-[#f5a623]
                                                      focus:ring-1 focus:ring-[#f5a623] focus:outline-none"
										/>
									</div>
								{/each}
							</div>
						</div>

						<!-- Notes -->
						<div>
							<label for="admin-notes" class="text-xs text-[#9a8f7a]">Admin notes (optional)</label>
							<input
								id="admin-notes"
								type="text"
								name="notes"
								value={t.notes ?? ''}
								placeholder="Reason for manual override, research reference, etc."
								class="mt-1 w-full rounded-lg border border-[#221c18] bg-[#0a0809] px-3
                                          py-1.5 text-sm text-[#f0ece4] placeholder-[#4a4038]
                                          focus:border-[#f5a623] focus:ring-1 focus:ring-[#f5a623] focus:outline-none"
							/>
						</div>

						<div class="flex gap-3">
							<button
								type="submit"
								class="rounded-lg bg-[#f5a623] px-4 py-2 text-sm
                                       font-semibold text-[#0a0809] transition-colors hover:bg-[#c97e0a]"
							>
								Save override
							</button>
							<button
								type="button"
								onclick={cancelEdit}
								class="rounded-lg bg-[#221c18] px-4 py-2 text-sm text-[#9a8f7a]
                                       transition-colors hover:text-[#f0ece4]"
							>
								Cancel
							</button>
						</div>
					</form>
				{:else}
					<!-- Read view -->
					<div class="grid grid-cols-2 gap-4 p-5 text-xs sm:grid-cols-5">
						<div>
							<p class="mb-1.5 text-[#4a4038]">Reaction time (ms)</p>
							<p class="text-[#3de8c8]">≤{t.reaction_ms_excellent} excellent</p>
							<p class="text-[#f5a623]">≤{t.reaction_ms_good} good</p>
							<p class="text-[#9a8f7a]">≥{t.reaction_ms_needs_work} needs work</p>
						</div>
						<div>
							<p class="mb-1.5 text-[#4a4038]">Peak G-force</p>
							<p class="text-[#3de8c8]">≥{t.peak_g_excellent}g excellent</p>
							<p class="text-[#f5a623]">≥{t.peak_g_good}g good</p>
						</div>
						<div>
							<p class="mb-1.5 text-[#4a4038]">90% impulse (s)</p>
							<p class="text-[#3de8c8]">≤{t.impulse_90_excellent}s excellent</p>
							<p class="text-[#f5a623]">≤{t.impulse_90_good}s good</p>
							<p class="text-[#9a8f7a]">≥{t.impulse_90_needs_work}s needs work</p>
						</div>
						<div>
							<p class="mb-1.5 text-[#4a4038]">Smoothness</p>
							<p class="text-[#3de8c8]">≥{t.smoothness_excellent} excellent</p>
							<p class="text-[#f5a623]">≥{t.smoothness_good} good</p>
						</div>
						<div>
							<p class="mb-1.5 text-[#4a4038]">Speed carry</p>
							<p class="text-[#3de8c8]">≥{t.speed_carry_excellent} excellent</p>
							<p class="text-[#f5a623]">≥{t.speed_carry_good} good</p>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	{/each}
</div>

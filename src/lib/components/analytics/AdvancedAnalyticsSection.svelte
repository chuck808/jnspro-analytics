<script lang="ts">
	import HelpButton from '$lib/components/HelpButton.svelte';

	interface SessionSummary {
		id: string;
		timestamp: string;
		run_count: number;
		best_reaction_ms: number | null;
		avg_reaction_ms: number | null;
		best_peak_speed_ms: number | null;
		avg_peak_speed_ms: number | null;
		reaction_cv: number | null;
		best_max_g: number | null;
		avg_max_g: number | null;
		has_valid_speed: boolean;
	}

	interface RunData {
		reaction_time_ms: number | null;
		peak_speed_ms: number | null;
		max_g: number | null;
		analytics_valid: boolean;
	}

	interface Props {
		sessions: SessionSummary[];
		allRuns: RunData[];
		sessionCount: number;
		onOpenHelp: (key: string) => void;
	}

	let { sessions, allRuns, sessionCount, onOpenHelp }: Props = $props();

	let isExpanded = $state(false);
	let compareA = $state(0);
	let compareB = $state(1);

	function fmtDate(ts: string) {
		return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
	}

	function fmtReaction(ms: number | null) {
		return ms !== null ? (ms / 1000).toFixed(3) + 's' : '—';
	}

	function fmtSpeed(ms: number | null) {
		return ms !== null ? (ms * 3.6).toFixed(1) + ' km/h' : '—';
	}

	function fmtG(g: number | null) {
		return g !== null ? g.toFixed(2) + 'G' : '—';
	}

	function compareChange(a: number | null, b: number | null, lowerIsBetter = false) {
		if (a === null || b === null) return null;
		const pct = ((b - a) / a) * 100;
		return { pct, improving: lowerIsBetter ? pct < 0 : pct > 0, abs: Math.abs(pct) };
	}

	// Speed heatmap
	let speedHeatmap = $derived.by(() => {
		const validSpeeds = (allRuns ?? [])
			.filter((r) => r.analytics_valid && r.peak_speed_ms !== null)
			.map((r) => r.peak_speed_ms! * 3.6);
		if (validSpeeds.length === 0) return null;
		const binSize = 2;
		const min = Math.floor(Math.min(...validSpeeds) / binSize) * binSize;
		const max = Math.ceil(Math.max(...validSpeeds) / binSize) * binSize;
		const bins: { label: string; count: number; pct: number }[] = [];
		for (let b = min; b < max; b += binSize) {
			const count = validSpeeds.filter((s) => s >= b && s < b + binSize).length;
			bins.push({ label: `${b}–${b + binSize}`, count, pct: 0 });
		}
		const maxCount = Math.max(...bins.map((b) => b.count), 1);
		bins.forEach((b) => {
			b.pct = (b.count / maxCount) * 100;
		});
		return {
			bins,
			total: validSpeeds.length,
			mean: validSpeeds.reduce((a, b) => a + b, 0) / validSpeeds.length
		};
	});

	// Quickness correlation
	let quicknessCorrelation = $derived.by(() => {
		const runs = (allRuns ?? []).filter((r) => r.reaction_time_ms !== null && r.max_g !== null);
		if (runs.length < 3) return null;
		const bestReaction = runs.reduce((a, b) => (a.reaction_time_ms! < b.reaction_time_ms! ? a : b));
		const bestG = runs.reduce((a, b) => (a.max_g! > b.max_g! ? a : b));
		const samRun =
			bestReaction.reaction_time_ms === bestG.reaction_time_ms &&
			bestReaction.max_g === bestG.max_g;
		const n = runs.length;
		const rts = runs.map((r) => r.reaction_time_ms!);
		const gs = runs.map((r) => r.max_g!);
		const meanRt = rts.reduce((a, b) => a + b, 0) / n;
		const meanG = gs.reduce((a, b) => a + b, 0) / n;
		const num = runs.reduce((s, r) => s + (r.reaction_time_ms! - meanRt) * (r.max_g! - meanG), 0);
		const denRt = Math.sqrt(
			runs.reduce((s, r) => s + Math.pow(r.reaction_time_ms! - meanRt, 2), 0)
		);
		const denG = Math.sqrt(runs.reduce((s, r) => s + Math.pow(r.max_g! - meanG, 2), 0));
		const corr = denRt > 0 && denG > 0 ? num / (denRt * denG) : 0;
		const interpretation =
			corr < -0.4
				? 'Quicker reactions consistently produce more explosive starts — ideal pattern'
				: corr > 0.4
					? 'Slower reactions are producing higher G — possible compensation pattern, worth investigating'
					: 'No strong link between reaction speed and explosive power — room to align both';
		return {
			samRun,
			bestReactionMs: bestReaction.reaction_time_ms!,
			bestReactionG: bestReaction.max_g!,
			bestGMs: bestG.reaction_time_ms!,
			bestG: bestG.max_g!,
			correlation: parseFloat(corr.toFixed(2)),
			interpretation
		};
	});

	let sessionA = $derived(sessions[compareA] ?? null);
	let sessionB = $derived(sessions[compareB] ?? null);

	// Rolling analytics (10+ sessions)
	let rollingAnalytics = $derived.by(() => {
		if (sessionCount < 10) return null;
		const recent = sessions.slice(-5);
		const previous = sessions.slice(-10, -5);
		const avgRecent = recent.reduce((s, x) => s + (x.avg_reaction_ms || 0), 0) / recent.length;
		const avgPrevious =
			previous.reduce((s, x) => s + (x.avg_reaction_ms || 0), 0) / previous.length;
		const change = ((avgRecent - avgPrevious) / avgPrevious) * 100;
		const improving = change < 0;
		return {
			label: 'Avg reaction',
			recent: (avgRecent / 1000).toFixed(3) + 's',
			change,
			improving
		};
	});
</script>

{#if sessionCount >= 3}
	<div
		class="overflow-hidden rounded-xl border border-neutral-300 bg-neutral-50 dark:border-[#221c18] dark:bg-[#131010]"
	>
		<!-- Collapsible Header -->
		<button
			onclick={() => (isExpanded = !isExpanded)}
			class="flex w-full items-center justify-between p-5 transition-colors hover:bg-neutral-100 focus:ring-2
                   focus:ring-[#f5a623] focus:outline-none focus:ring-inset dark:hover:bg-[#0a0809]"
			aria-expanded={isExpanded}
		>
			<div class="flex items-center gap-3">
				<svg
					class="h-5 w-5 text-[#f5a623] transition-transform {isExpanded ? 'rotate-90' : ''}"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
				<div class="text-left">
					<h2 class="text-lg font-bold text-neutral-900 dark:text-[#f0ece4]">Advanced Analytics</h2>
					<p class="mt-0.5 text-sm text-neutral-600 dark:text-[#9a8f7a]">
						Deep-dive tools for detailed analysis
					</p>
				</div>
			</div>
			<span
				class="rounded-full bg-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:bg-[#6b5f4d]/20 dark:text-[#9a8f7a]"
			>
				{isExpanded ? 'Hide' : 'Show'} details
			</span>
		</button>

		<!-- Collapsible Content -->
		{#if isExpanded}
			<div class="space-y-5 border-t border-neutral-300 px-5 pt-5 pb-5 dark:border-[#221c18]">
				<!-- Speed heatmap -->
				{#if speedHeatmap}
					{@const heatmap = speedHeatmap}
					<div
						class="rounded-xl border border-neutral-300 bg-white p-5 dark:border-[#221c18] dark:bg-[#0a0809]"
					>
						<div class="mb-1 flex items-start justify-between gap-4">
							<div class="flex items-center gap-2">
								<div>
									<h3 class="text-sm font-semibold text-neutral-900 dark:text-[#f0ece4]">
										Speed Distribution Heatmap
									</h3>
									<p class="mt-0.5 text-xs text-neutral-500 dark:text-[#6b5f4d]">
										All {heatmap.total} valid runs · Mean peak speed: {heatmap.mean.toFixed(1)} km/h
									</p>
								</div>
								<HelpButton onclick={() => onOpenHelp('speedAnalysis')} />
							</div>
							<span class="text-xs text-neutral-500 dark:text-[#6b5f4d]">⚠ IMU estimated</span>
						</div>
						<p class="mb-5 text-xs text-neutral-600 dark:text-[#9a8f7a]">
							How often you hit each speed band — a tight cluster means consistent peak power, a
							wide spread suggests variability in effort or conditions.
						</p>
						<div class="space-y-2" role="img" aria-label="Speed distribution across all runs">
							{#each heatmap.bins as bin}
								<div class="flex items-center gap-3">
									<span
										class="w-20 flex-shrink-0 text-right text-xs text-neutral-500 dark:text-[#6b5f4d]"
										>{bin.label} km/h</span
									>
									<div class="h-5 flex-1 overflow-hidden rounded bg-neutral-200 dark:bg-[#221c18]">
										<div
											class="h-full rounded transition-all duration-500"
											style="width:{bin.pct}%; background:{bin.pct > 80
												? '#f5a623'
												: bin.pct > 50
													? '#f5a62399'
													: bin.pct > 20
														? '#f5a62355'
														: '#f5a62322'}"
										></div>
									</div>
									<span class="w-6 flex-shrink-0 text-right text-xs font-bold text-[#9a8f7a]"
										>{bin.count}</span
									>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Quickness correlation -->
				{#if quicknessCorrelation}
					{@const qc = quicknessCorrelation}
					<div class="rounded-xl border border-[#221c18] bg-[#0a0809] p-5">
						<div class="mb-1 flex items-center gap-2">
							<h3 class="text-sm font-semibold text-[#f0ece4]">Quickness Correlation</h3>
							<HelpButton onclick={() => onOpenHelp('quicknessCorrelation')} />
						</div>
						<p class="mb-5 text-xs text-[#6b5f4d]">
							Does the quickest reaction also produce the most explosive start?
						</p>
						<div class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div class="rounded-xl border border-[#f5a623]/20 bg-[#131010] p-4">
								<p class="mb-3 text-xs font-semibold tracking-wider text-[#f5a623] uppercase">
									Quickest Reaction
								</p>
								<div class="space-y-2 text-sm">
									<div class="flex justify-between">
										<span class="text-[#6b5f4d]">Reaction</span><span
											class="font-bold text-[#f5a623]">{fmtReaction(qc.bestReactionMs)}</span
										>
									</div>
									<div class="flex justify-between">
										<span class="text-[#6b5f4d]">Max G on that run</span><span
											class="font-bold text-[#f0ece4]">{fmtG(qc.bestReactionG)}</span
										>
									</div>
								</div>
							</div>
							<div class="rounded-xl border border-[#ff6b3d]/20 bg-[#131010] p-4">
								<p class="mb-3 text-xs font-semibold tracking-wider text-[#ff6b3d] uppercase">
									Highest G-Force
								</p>
								<div class="space-y-2 text-sm">
									<div class="flex justify-between">
										<span class="text-[#6b5f4d]">Reaction on that run</span><span
											class="font-bold text-[#f0ece4]">{fmtReaction(qc.bestGMs)}</span
										>
									</div>
									<div class="flex justify-between">
										<span class="text-[#6b5f4d]">Max G</span><span class="font-bold text-[#ff6b3d]"
											>{fmtG(qc.bestG)}</span
										>
									</div>
								</div>
							</div>
						</div>
						<div class="flex items-start gap-3 rounded-lg bg-[#131010] p-4">
							<div class="flex-shrink-0 text-center">
								<p
									class="text-2xl font-bold {qc.correlation < -0.4
										? 'text-[#3de8c8]'
										: qc.correlation > 0.4
											? 'text-[#ff4444]'
											: 'text-[#f5a623]'}"
								>
									{qc.correlation > 0 ? '+' : ''}{qc.correlation}
								</p>
								<p class="text-[10px] text-[#6b5f4d]">Pearson r</p>
							</div>
							<div class="flex-1">
								{#if qc.samRun}
									<p class="mb-0.5 text-sm font-semibold text-[#3de8c8]">
										Same run — perfect alignment
									</p>
									<p class="text-xs text-[#9a8f7a]">
										Your quickest reaction also produced your highest G-force — this is the ideal
										pattern.
									</p>
								{:else}
									<p class="text-xs text-[#9a8f7a]">{qc.interpretation}</p>
								{/if}
							</div>
						</div>
					</div>
				{/if}

				<!-- Session comparison -->
				{#if sessionCount >= 2}
					<div class="rounded-xl border border-[#221c18] bg-[#0a0809] p-5">
						<div class="mb-4 flex items-center gap-2">
							<h3 class="text-sm font-semibold text-[#f0ece4]">Session Comparison</h3>
							<HelpButton onclick={() => onOpenHelp('sessionComparison')} />
						</div>
						<div class="mb-5 grid grid-cols-2 gap-4">
							{#each [{ label: 'Session A', idx: compareA, set: (v: number) => {
										compareA = v;
									}, id: 'session-a-select' }, { label: 'Session B', idx: compareB, set: (v: number) => {
										compareB = v;
									}, id: 'session-b-select' }] as picker}
								<div>
									<label for={picker.id} class="mb-1 block text-xs text-[#6b5f4d]"
										>{picker.label}</label
									>
									<select
										id={picker.id}
										value={picker.idx}
										onchange={(e) => picker.set(parseInt((e.target as HTMLSelectElement).value))}
										class="min-h-[44px] w-full rounded-lg border border-[#221c18] bg-[#131010] px-3
                                                   py-2.5 text-sm text-[#f0ece4]
                                                   focus:border-[#f5a623] focus:ring-2 focus:ring-[#f5a623] focus:outline-none"
									>
										{#each sessions as session, i}
											<option value={i}
												>{fmtDate(session.timestamp)} — {session.run_count} runs</option
											>
										{/each}
									</select>
								</div>
							{/each}
						</div>

						{#if sessionA && sessionB && compareA !== compareB}
							<div class="overflow-x-auto">
								<table class="w-full min-w-[500px] text-sm">
									<caption class="sr-only"
										>Session comparison between {fmtDate(sessionA.timestamp)} and {fmtDate(
											sessionB.timestamp
										)}</caption
									>
									<thead>
										<tr class="border-b border-[#221c18]">
											<th
												scope="col"
												class="pb-2 text-left text-xs tracking-wider text-[#6b5f4d] uppercase"
												>Metric</th
											>
											<th
												scope="col"
												class="pb-2 text-right text-xs tracking-wider text-[#f5a623] uppercase"
												>A · {fmtDate(sessionA.timestamp)}</th
											>
											<th
												scope="col"
												class="pb-2 text-right text-xs tracking-wider text-[#9a8f7a] uppercase"
												>B · {fmtDate(sessionB.timestamp)}</th
											>
											<th
												scope="col"
												class="pb-2 text-right text-xs tracking-wider text-[#6b5f4d] uppercase"
												>Change</th
											>
										</tr>
									</thead>
									<tbody class="divide-y divide-[#221c18]/50">
										{#each [{ label: 'Best reaction', a: fmtReaction(sessionA.best_reaction_ms), b: fmtReaction(sessionB.best_reaction_ms), change: compareChange(sessionA.best_reaction_ms, sessionB.best_reaction_ms, true) }, { label: 'Avg reaction', a: fmtReaction(sessionA.avg_reaction_ms), b: fmtReaction(sessionB.avg_reaction_ms), change: compareChange(sessionA.avg_reaction_ms, sessionB.avg_reaction_ms, true) }, { label: 'Best peak speed', a: fmtSpeed(sessionA.best_peak_speed_ms), b: fmtSpeed(sessionB.best_peak_speed_ms), change: compareChange(sessionA.best_peak_speed_ms, sessionB.best_peak_speed_ms, false) }, { label: 'Best max G', a: fmtG(sessionA.best_max_g), b: fmtG(sessionB.best_max_g), change: compareChange(sessionA.best_max_g, sessionB.best_max_g, false) }, { label: 'Consistency CV', a: sessionA.reaction_cv !== null ? sessionA.reaction_cv.toFixed(1) + '%' : '—', b: sessionB.reaction_cv !== null ? sessionB.reaction_cv.toFixed(1) + '%' : '—', change: compareChange(sessionA.reaction_cv, sessionB.reaction_cv, true) }, { label: 'Run count', a: String(sessionA.run_count), b: String(sessionB.run_count), change: null }] as row}
											<tr>
												<td class="py-2.5 text-[#9a8f7a]">{row.label}</td>
												<td class="py-2.5 text-right font-medium text-[#f0ece4]">{row.a}</td>
												<td class="py-2.5 text-right font-medium text-[#9a8f7a]">{row.b}</td>
												<td class="py-2.5 text-right text-xs">
													{#if row.change}
														<span style="color:{row.change.improving ? '#3de8c8' : '#ff4444'}"
															>{row.change.improving ? '↑' : '↓'} {row.change.abs.toFixed(1)}%</span
														>
													{:else}
														<span class="text-[#6b5f4d]">—</span>
													{/if}
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{:else if compareA === compareB}
							<p class="py-4 text-center text-sm text-[#6b5f4d]">
								Select two different sessions to compare
							</p>
						{/if}
					</div>
				{/if}

				<!-- Rolling analytics -->
				{#if rollingAnalytics}
					{@const rolling = rollingAnalytics}
					<div class="rounded-xl border border-[#221c18] bg-[#0a0809] p-5">
						<div class="mb-1 flex items-center gap-2">
							<h3 class="text-sm font-semibold text-[#f0ece4]">Rolling Analytics</h3>
							<HelpButton onclick={() => onOpenHelp('rollingAnalytics')} />
						</div>
						<p class="mb-4 text-xs text-[#9a8f7a]">Last 5 sessions vs previous 5</p>
						<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
							<div class="rounded-lg bg-[#131010] p-3">
								<p class="mb-1 text-xs text-[#6b5f4d]">{rolling.label}</p>
								<p class="text-base font-bold text-[#f0ece4]">{rolling.recent}</p>
								<p class="mt-1 text-xs" style="color:{rolling.improving ? '#3de8c8' : '#ff4444'}">
									{rolling.improving ? '↑' : '↓'}
									{Math.abs(rolling.change).toFixed(1)}% vs prev 5
								</p>
							</div>
						</div>
					</div>
				{:else if sessionCount >= 3 && sessionCount < 10}
					<div class="rounded-xl border border-[#221c18] bg-[#0a0809] p-4 text-center">
						<p class="text-xs text-[#6b5f4d]">
							{10 - sessionCount} more sessions to unlock rolling analytics
						</p>
					</div>
				{/if}

				<!-- Statistical analysis -->
				{#if sessionCount >= 20}
					<div class="rounded-xl border border-[#221c18] bg-[#0a0809] p-5">
						<h3 class="mb-1 text-sm font-semibold text-[#f0ece4]">Statistical Analysis</h3>
						<p class="mb-4 text-xs text-[#9a8f7a]">Period-by-period significance testing</p>
						<p class="text-xs text-[#6b5f4d]">
							Welch t-test + Cohen's d effect size — coming in next update.
						</p>
					</div>
				{:else if sessionCount >= 10}
					<div class="rounded-xl border border-[#221c18] bg-[#0a0809] p-4 text-center">
						<p class="text-xs text-[#6b5f4d]">
							{20 - sessionCount} more sessions to unlock statistical significance testing
						</p>
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}

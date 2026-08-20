<script lang="ts">
	import type { PageData } from './$types';
	import ReactionProgression from '$lib/components/dashboard/ReactionProgression.svelte';

	let { data }: { data: PageData } = $props();

	function fmtReaction(ms: number | null | undefined) {
		return ms !== null && ms !== undefined ? `${(ms / 1000).toFixed(3)}s` : '—';
	}

	function fmtSpeed(ms: number | null | undefined) {
		return ms !== null && ms !== undefined ? `${(ms * 3.6).toFixed(1)} km/h` : '—';
	}

	function fmtG(g: number | null | undefined) {
		return g !== null && g !== undefined ? `${g.toFixed(2)}G` : '—';
	}

	function fmtDate(timestamp: string) {
		return new Intl.DateTimeFormat('en-GB', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		}).format(new Date(timestamp));
	}

	function goalLabel(metric: string) {
		return (
			{
				reactionTime: 'Reaction time',
				maxG: 'Max G-force',
				peakSpeed: 'Peak speed',
				consistency: 'Consistency',
				elapsedTime: 'Elapsed time',
				accelerationPhase: 'Acceleration phase',
				endurance: 'Gates per session'
			} as Record<string, string>
		)[metric] ?? metric;
	}

	function consistencyLabel(cv: number | null | undefined) {
		if (cv === null || cv === undefined) return 'Not enough data yet';
		if (cv < 2) return 'Very repeatable';
		if (cv < 5) return 'Consistent';
		return 'Variable';
	}

	let latest = $derived(data.recentSessions?.[0] ?? null);
	let previous = $derived(data.recentSessions?.[1] ?? null);
	let latestIsReactionPb = $derived(
		latest?.best_reaction_ms !== null &&
		latest?.best_reaction_ms !== undefined &&
		data.personalBests.reaction_ms !== null &&
		latest.best_reaction_ms === data.personalBests.reaction_ms
	);
	let latestReactionChange = $derived(
		latest?.best_reaction_ms !== null &&
		latest?.best_reaction_ms !== undefined &&
		previous?.best_reaction_ms !== null &&
		previous?.best_reaction_ms !== undefined
			? latest.best_reaction_ms - previous.best_reaction_ms
			: null
	);
	let primaryGoal = $derived(data.activeGoals?.[0] ?? null);

	let headline = $derived.by(() => {
		if (data.sessionCount === 0) return 'Your training record starts here';
		if (latestIsReactionPb) return 'That last session moved the needle';
		if (latestReactionChange !== null && latestReactionChange < -5) return 'Your latest reaction was sharper';
		if (latestReactionChange !== null && latestReactionChange > 5) return 'Your latest reaction was a little slower';
		return 'Your recent performance is holding steady';
	});

	let headlineDetail = $derived.by(() => {
		if (data.sessionCount === 0) {
			return 'Upload from SD card or let your AppGatePro device send a session over Wi-Fi. Your analytics build from there.';
		}
		if (!latest) return 'Your training history is ready to explore.';
		if (latestIsReactionPb && latest.best_reaction_ms !== null) {
			return `You recorded a new best reaction of ${fmtReaction(latest.best_reaction_ms)} in your latest session.`;
		}
		if (latestReactionChange !== null && latest.best_reaction_ms !== null) {
			const amount = Math.abs(latestReactionChange);
			if (amount <= 5) {
				return `Best reaction was practically identical to your previous session — just ${amount.toFixed(0)} ms different.`;
			}
			return latestReactionChange < 0
				? `Best reaction was ${amount.toFixed(0)} ms quicker than your previous session.`
				: `Best reaction was ${amount.toFixed(0)} ms slower than your previous session — one session is context, not a trend.`;
		}
		return `Your latest session included ${latest.run_count} statistically eligible run${latest.run_count === 1 ? '' : 's'}.`;
	});
</script>

<svelte:head>
	<title>Home — AppGatePro</title>
</svelte:head>

<div class="mx-auto max-w-7xl space-y-8">
	<section class="overflow-hidden rounded-2xl border border-[#f5a623]/15 bg-[var(--theme-surface)]">
		<div class="grid gap-8 p-6 md:p-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(260px,0.8fr)] lg:items-end">
			<div>
				<p class="mb-3 text-xs font-semibold tracking-[0.18em] text-[#f5a623] uppercase">What to notice</p>
				<h2 class="hero-title max-w-3xl text-4xl leading-[0.98] font-bold text-[var(--theme-text-primary)] md:text-5xl">
					{headline}
				</h2>
				<p class="mt-4 max-w-2xl text-base leading-relaxed text-[var(--theme-text-secondary)]">
					{headlineDetail}
				</p>

				<div class="mt-6 flex flex-wrap gap-3">
					{#if latest}
						<a
							href={`/sessions/${latest.id}`}
							class="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#f5a623] px-4 py-2 text-sm font-bold text-[#0a0809] transition-colors hover:bg-[#c97e0a] focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[var(--theme-bg)] focus:outline-none"
						>
							Open latest session
							<span aria-hidden="true">→</span>
						</a>
					{:else}
						<a
							href="/upload"
							class="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#f5a623] px-4 py-2 text-sm font-bold text-[#0a0809] transition-colors hover:bg-[#c97e0a] focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[var(--theme-bg)] focus:outline-none"
						>
							Upload first session
							<span aria-hidden="true">→</span>
						</a>
					{/if}
					<a
						href="/analytics"
						class="inline-flex min-h-11 items-center rounded-lg border border-[var(--theme-border)] px-4 py-2 text-sm font-semibold text-[var(--theme-text-secondary)] transition-colors hover:border-[#f5a623]/30 hover:text-[var(--theme-text-primary)] focus:ring-2 focus:ring-[#f5a623] focus:outline-none"
					>
						Explore progress
					</a>
				</div>
			</div>

			{#if latest}
				<div class="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg)]/55 p-5">
					<div class="flex items-start justify-between gap-4">
						<div>
							<p class="text-xs font-semibold tracking-wider text-[var(--theme-text-subtle)] uppercase">Latest session</p>
							<p class="mt-1 text-sm font-semibold text-[var(--theme-text-primary)]">{fmtDate(latest.timestamp)}</p>
						</div>
						<span class="rounded-full bg-[#f5a623]/10 px-2.5 py-1 text-xs font-semibold text-[#f5a623]">
							{latest.run_count} run{latest.run_count === 1 ? '' : 's'}
						</span>
					</div>
					<div class="mt-6 grid grid-cols-2 gap-4">
						<div>
							<p class="text-xs text-[var(--theme-text-subtle)]">Best reaction</p>
							<p class="mt-1 text-2xl font-bold text-[var(--theme-text-primary)]">{fmtReaction(latest.best_reaction_ms)}</p>
						</div>
						<div>
							<p class="text-xs text-[var(--theme-text-subtle)]">Consistency</p>
							<p class="mt-1 text-sm font-semibold text-[var(--theme-text-primary)]">{consistencyLabel(latest.reaction_cv)}</p>
							{#if latest.reaction_cv !== null}
								<p class="mt-1 text-xs text-[var(--theme-text-subtle)]">CV {latest.reaction_cv?.toFixed(1)}%</p>
							{/if}
						</div>
					</div>
				</div>
			{/if}
		</div>
	</section>

	{#if data.sessionCount > 0}
		<section>
			<div class="mb-4 flex items-end justify-between gap-4">
				<div>
					<p class="text-xs font-semibold tracking-[0.16em] text-[var(--theme-text-subtle)] uppercase">Your evidence</p>
					<h3 class="section-title mt-1 text-2xl font-bold text-[var(--theme-text-primary)]">A few useful anchors</h3>
				</div>
			</div>

			<div class="grid gap-4 md:grid-cols-3">
				<div class="themed-card">
					<p class="text-xs font-semibold tracking-wider text-[var(--theme-text-subtle)] uppercase">Best reaction</p>
					<p class="mt-3 text-4xl font-bold text-[#f5a623]">{fmtReaction(data.personalBests.reaction_ms)}</p>
					<p class="mt-2 text-sm text-[var(--theme-text-secondary)]">Fastest statistically eligible reaction in your history.</p>
				</div>

				<div class="themed-card">
					<p class="text-xs font-semibold tracking-wider text-[var(--theme-text-subtle)] uppercase">Consistency</p>
					<p class="mt-3 text-2xl font-bold text-[var(--theme-text-primary)]">{consistencyLabel(data.consistency)}</p>
					<p class="mt-2 text-sm text-[var(--theme-text-secondary)]">
						{data.consistency !== null ? `Reaction CV ${data.consistency.toFixed(1)}% across eligible runs.` : 'More eligible runs are needed before this becomes meaningful.'}
					</p>
				</div>

				<div class="themed-card">
					{#if primaryGoal}
						<div class="flex items-start justify-between gap-3">
							<p class="text-xs font-semibold tracking-wider text-[var(--theme-text-subtle)] uppercase">Goal progress</p>
							<span class="text-sm font-bold text-[#f5a623]">{primaryGoal.progress}%</span>
						</div>
						<p class="mt-3 text-xl font-bold text-[var(--theme-text-primary)]">{goalLabel(primaryGoal.metric)}</p>
						<div class="mt-4 h-2 overflow-hidden rounded-full bg-[var(--theme-border)]">
							<div class="h-full rounded-full bg-[#f5a623]" style={`width:${primaryGoal.progress}%`}></div>
						</div>
						<a href="/goals" class="mt-4 inline-block text-sm font-semibold text-[var(--theme-text-secondary)] hover:text-[#f5a623]">View goal →</a>
					{:else}
						<p class="text-xs font-semibold tracking-wider text-[var(--theme-text-subtle)] uppercase">Goals</p>
						<p class="mt-3 text-xl font-bold text-[var(--theme-text-primary)]">Nothing set yet</p>
						<p class="mt-2 text-sm text-[var(--theme-text-secondary)]">Create a target when there is something specific you want to chase.</p>
						<a href="/goals" class="mt-4 inline-block text-sm font-semibold text-[#f5a623]">Set a goal →</a>
					{/if}
				</div>
			</div>
		</section>

		<section class="themed-card">
			<div class="mb-5 flex items-end justify-between gap-4">
				<div>
					<p class="text-xs font-semibold tracking-[0.16em] text-[var(--theme-text-subtle)] uppercase">Recent direction</p>
					<h3 class="section-title mt-1 text-2xl font-bold text-[var(--theme-text-primary)]">Reaction over recent sessions</h3>
				</div>
				<a href="/analytics" class="text-sm font-semibold text-[var(--theme-text-secondary)] hover:text-[#f5a623]">Explore progress →</a>
			</div>
			<ReactionProgression sessions={data.recentSessions} />
		</section>

		<section class="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
			<div class="themed-card">
				<div class="mb-5 flex items-center justify-between gap-4">
					<div>
						<p class="text-xs font-semibold tracking-[0.16em] text-[var(--theme-text-subtle)] uppercase">Recent training</p>
						<h3 class="section-title mt-1 text-2xl font-bold text-[var(--theme-text-primary)]">Your last sessions</h3>
					</div>
					<a href="/sessions" class="text-sm font-semibold text-[var(--theme-text-secondary)] hover:text-[#f5a623]">All sessions →</a>
				</div>

				<div class="divide-y divide-[var(--theme-border)]">
					{#each data.recentSessions as session, index}
						<a href={`/sessions/${session.id}`} class="group grid min-h-20 grid-cols-[1fr_auto] items-center gap-5 py-4 first:pt-0 last:pb-0">
							<div class="min-w-0">
								<div class="flex flex-wrap items-center gap-2">
									<p class="font-semibold text-[var(--theme-text-primary)] group-hover:text-[#f5a623]">{index === 0 ? 'Latest session' : fmtDate(session.timestamp)}</p>
									{#if index === 0 && latestIsReactionPb}
										<span class="rounded-full bg-[#3de8c8]/10 px-2 py-0.5 text-xs font-semibold text-[#3de8c8]">Reaction PB</span>
									{/if}
								</div>
								<p class="mt-1 text-sm text-[var(--theme-text-secondary)]">
									{session.run_count} run{session.run_count === 1 ? '' : 's'} · best reaction {fmtReaction(session.best_reaction_ms)}
									{#if session.has_valid_speed && session.best_peak_speed_ms !== null}
										· peak {fmtSpeed(session.best_peak_speed_ms)}
									{/if}
								</p>
							</div>
							<span class="text-lg text-[var(--theme-text-faint)] transition-transform group-hover:translate-x-1 group-hover:text-[#f5a623]">→</span>
						</a>
					{/each}
				</div>
			</div>

			<div class="themed-card">
				<p class="text-xs font-semibold tracking-[0.16em] text-[var(--theme-text-subtle)] uppercase">Record</p>
				<h3 class="section-title mt-1 text-2xl font-bold text-[var(--theme-text-primary)]">The long view</h3>
				<div class="mt-6 space-y-5">
					<div class="flex items-end justify-between border-b border-[var(--theme-border)] pb-4">
						<span class="text-sm text-[var(--theme-text-secondary)]">Sessions</span>
						<strong class="text-2xl text-[var(--theme-text-primary)]">{data.sessionCount}</strong>
					</div>
					<div class="flex items-end justify-between border-b border-[var(--theme-border)] pb-4">
						<span class="text-sm text-[var(--theme-text-secondary)]">Recorded runs</span>
						<strong class="text-2xl text-[var(--theme-text-primary)]">{data.totalRuns}</strong>
					</div>
					<div class="flex items-end justify-between border-b border-[var(--theme-border)] pb-4">
						<span class="text-sm text-[var(--theme-text-secondary)]">Peak speed <span class="text-[var(--theme-text-faint)]">(estimated)</span></span>
						<strong class="text-xl text-[var(--theme-text-primary)]">{fmtSpeed(data.personalBests.peak_speed_ms)}</strong>
					</div>
					<div class="flex items-end justify-between">
						<span class="text-sm text-[var(--theme-text-secondary)]">Max G</span>
						<strong class="text-xl text-[var(--theme-text-primary)]">{fmtG(data.personalBests.max_g)}</strong>
					</div>
				</div>
			</div>
		</section>
	{:else}
		<section class="themed-card py-12 text-center">
			<div class="mx-auto max-w-xl">
				<p class="text-xs font-semibold tracking-[0.16em] text-[#f5a623] uppercase">First session</p>
				<h3 class="section-title mt-2 text-3xl font-bold text-[var(--theme-text-primary)]">Give AppGatePro something to learn from</h3>
				<p class="mt-4 text-sm leading-relaxed text-[var(--theme-text-secondary)]">
					Your sensor data is the core experience. Video is optional supplementary evidence when you choose to use it.
				</p>
				<a href="/upload" class="mt-6 inline-flex min-h-11 items-center rounded-lg bg-[#f5a623] px-5 py-2.5 text-sm font-bold text-[#0a0809] hover:bg-[#c97e0a]">Upload a session</a>
			</div>
		</section>
	{/if}
</div>

<style>
	.hero-title,
	.section-title {
		font-family: 'Barlow Condensed', 'Barlow', system-ui, sans-serif;
	}
</style>

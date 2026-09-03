<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function fmtReaction(ms: number | null | undefined) {
		return ms == null ? '—' : `${(ms / 1000).toFixed(3)}s`;
	}
	function fmtSpeed(ms: number | null | undefined) {
		return ms == null ? '—' : `${(ms * 3.6).toFixed(1)} km/h`;
	}
	function fmtDate(timestamp: string) {
		return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(timestamp));
	}
	function goalLabel(metric: string) {
		return ({ reactionTime: 'Reaction time', maxG: 'Max G-force', peakSpeed: 'Peak speed', consistency: 'Consistency', elapsedTime: 'Elapsed time', accelerationPhase: 'Acceleration phase', endurance: 'Gates per session' } as Record<string, string>)[metric] ?? metric;
	}
	function consistencyLabel(cv: number | null | undefined) {
		if (cv == null) return 'Building evidence';
		if (cv < 2) return 'Very repeatable';
		if (cv < 5) return 'Consistent';
		return 'Variable';
	}

	let latest = $derived(data.recentSessions?.[0] ?? null);
	let primaryGoal = $derived(data.activeGoals?.[0] ?? null);
</script>

<svelte:head><title>Home Preview — AppGatePro</title></svelte:head>

<div class="mx-auto max-w-7xl space-y-6">
	<header class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
		<div>
			<p class="text-xs font-semibold tracking-[0.18em] text-[#f5a623] uppercase">Home preview</p>
			<h1 class="section-title mt-1 text-3xl font-bold text-[var(--theme-text-primary)] md:text-4xl">Welcome back</h1>
			<p class="mt-2 text-sm text-[var(--theme-text-secondary)]">Here’s what is happening with your training.</p>
		</div>
		<div class="rounded-xl border border-[#f5a623]/20 bg-[#f5a623]/5 px-4 py-3 text-sm">
			<p class="font-semibold text-[#f5a623]">Parallel preview</p>
			<p class="mt-0.5 text-xs text-[var(--theme-text-secondary)]">The current Home page remains unchanged.</p>
		</div>
	</header>

	{#if data.sessionCount === 0}
		<section class="themed-card py-12 text-center">
			<p class="text-xs font-semibold tracking-[0.16em] text-[#f5a623] uppercase">First session</p>
			<h2 class="section-title mt-2 text-3xl font-bold text-[var(--theme-text-primary)]">Your training history starts here</h2>
			<p class="mx-auto mt-3 max-w-xl text-sm text-[var(--theme-text-secondary)]">Upload a session and this page will become your quick read of recent training, goals and supported progress evidence.</p>
			<a href="/upload" class="mt-6 inline-flex min-h-11 items-center rounded-lg bg-[#f5a623] px-5 py-2.5 text-sm font-bold text-[#0a0809]">Upload a session</a>
		</section>
	{:else}
		<div class="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.75fr)]">
			<div class="space-y-6">
				<section class="themed-card overflow-hidden p-0">
					<div class="flex items-center justify-between border-b border-[var(--theme-border)] px-5 py-4">
						<div><p class="text-xs font-semibold tracking-[0.14em] text-[var(--theme-text-subtle)] uppercase">Training record</p><h2 class="mt-1 text-xl font-bold text-[var(--theme-text-primary)]">Recent sessions</h2></div>
						<a href="/sessions" class="text-sm font-semibold text-[#f5a623]">View all →</a>
					</div>
					<div class="divide-y divide-[var(--theme-border)]">
						{#each data.recentSessions.slice(0, 4) as session}
							<a href={`/sessions/${session.id}`} class="grid gap-4 px-5 py-4 transition-colors hover:bg-[#f5a623]/[0.03] sm:grid-cols-[minmax(0,1fr)_repeat(3,minmax(90px,auto))] sm:items-center">
								<div><p class="font-semibold text-[var(--theme-text-primary)]">{fmtDate(session.timestamp)}</p><p class="mt-1 text-xs text-[var(--theme-text-subtle)]">{session.run_count} eligible run{session.run_count === 1 ? '' : 's'} · {consistencyLabel(session.reaction_cv)}</p></div>
								<div><p class="text-[10px] tracking-wide text-[var(--theme-text-subtle)] uppercase">Best reaction</p><p class="mt-1 font-bold text-[var(--theme-text-primary)]">{fmtReaction(session.best_reaction_ms)}</p></div>
								<div><p class="text-[10px] tracking-wide text-[var(--theme-text-subtle)] uppercase">Peak speed</p><p class="mt-1 font-bold text-[var(--theme-text-primary)]">{session.has_valid_speed ? fmtSpeed(session.best_peak_speed_ms) : '—'}</p></div>
								<div class="hidden text-right sm:block"><span class="text-sm font-semibold text-[#f5a623]">Open →</span></div>
							</a>
						{/each}
					</div>
				</section>

				<section class="themed-card">
					<div class="flex flex-wrap items-end justify-between gap-3"><div><p class="text-xs font-semibold tracking-[0.14em] text-[var(--theme-text-subtle)] uppercase">Performance snapshot</p><h2 class="mt-1 text-xl font-bold text-[var(--theme-text-primary)]">Supported anchors</h2></div><a href="/progress-next" class="text-sm font-semibold text-[#f5a623]">Full Progress →</a></div>
					<div class="mt-5 grid gap-3 sm:grid-cols-3">
						<div class="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg)]/50 p-4"><p class="text-xs text-[var(--theme-text-subtle)]">Best reaction</p><p class="mt-2 text-3xl font-bold text-[var(--theme-text-primary)]">{fmtReaction(data.personalBests.reaction_ms)}</p><p class="mt-2 text-xs text-[var(--theme-text-secondary)]">Measured eligible history</p></div>
						<div class="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg)]/50 p-4"><p class="text-xs text-[var(--theme-text-subtle)]">Validated peak speed</p><p class="mt-2 text-3xl font-bold text-[var(--theme-text-primary)]">{fmtSpeed(data.personalBests.peak_speed_ms)}</p><p class="mt-2 text-xs text-[var(--theme-text-secondary)]">Only analytics-valid runs</p></div>
						<div class="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg)]/50 p-4"><p class="text-xs text-[var(--theme-text-subtle)]">Reaction repeatability</p><p class="mt-2 text-xl font-bold text-[var(--theme-text-primary)]">{consistencyLabel(data.consistency)}</p><p class="mt-2 text-xs text-[var(--theme-text-secondary)]">{data.consistency == null ? 'More eligible runs needed' : `CV ${data.consistency.toFixed(1)}% across eligible runs`}</p></div>
					</div>
					<div class="mt-5 rounded-xl border border-dashed border-[var(--theme-border)] p-4"><p class="text-sm font-semibold text-[var(--theme-text-primary)]">Why this is deliberately smaller than the visual mock-up</p><p class="mt-1 text-xs leading-relaxed text-[var(--theme-text-secondary)]">This parallel page only promotes metrics already supported by the current Home data contract. Estimated power, technique trends and broad improvement claims stay out until their Release 3 evidence contracts are wired here.</p></div>
				</section>
			</div>

			<aside class="space-y-6">
				<section class="themed-card">
					<div class="flex items-center justify-between"><h2 class="text-lg font-bold text-[var(--theme-text-primary)]">Goals</h2><a href="/goals" class="text-xs font-semibold text-[#f5a623]">View all →</a></div>
					{#if primaryGoal}
						<div class="mt-4 rounded-xl border border-[var(--theme-border)] p-4"><div class="flex items-start justify-between gap-3"><div><p class="font-semibold text-[var(--theme-text-primary)]">{goalLabel(primaryGoal.metric)}</p><p class="mt-1 text-xs text-[var(--theme-text-secondary)]">Current evidence toward target</p></div><span class="text-lg font-bold text-[#f5a623]">{primaryGoal.progress}%</span></div><div class="mt-4 h-2 overflow-hidden rounded-full bg-[var(--theme-border)]"><div class="h-full rounded-full bg-[#f5a623]" style={`width:${primaryGoal.progress}%`}></div></div></div>
					{:else}<div class="mt-4 rounded-xl border border-dashed border-[var(--theme-border)] p-4"><p class="text-sm text-[var(--theme-text-secondary)]">No active goal.</p><a href="/goals" class="mt-2 inline-block text-sm font-semibold text-[#f5a623]">Create one →</a></div>{/if}
				</section>

				<section class="themed-card">
					<p class="text-xs font-semibold tracking-[0.14em] text-[var(--theme-text-subtle)] uppercase">Latest session</p>
					{#if latest}<h2 class="mt-2 text-xl font-bold text-[var(--theme-text-primary)]">{fmtDate(latest.timestamp)}</h2><div class="mt-4 grid grid-cols-2 gap-3"><div><p class="text-xs text-[var(--theme-text-subtle)]">Reaction</p><p class="mt-1 font-bold text-[var(--theme-text-primary)]">{fmtReaction(latest.best_reaction_ms)}</p></div><div><p class="text-xs text-[var(--theme-text-subtle)]">Runs</p><p class="mt-1 font-bold text-[var(--theme-text-primary)]">{latest.run_count}</p></div></div><a href={`/sessions/${latest.id}`} class="mt-5 inline-flex min-h-11 items-center rounded-lg bg-[#f5a623] px-4 py-2 text-sm font-bold text-[#0a0809]">Open session →</a>{/if}
				</section>

				<section class="rounded-xl border border-[#3de8c8]/20 bg-[#3de8c8]/5 p-5"><p class="text-xs font-semibold tracking-[0.14em] text-[#3de8c8] uppercase">Next step</p><h2 class="mt-2 text-lg font-bold text-[var(--theme-text-primary)]">Use Progress for the longitudinal story</h2><p class="mt-2 text-sm leading-relaxed text-[var(--theme-text-secondary)]">Home stays a quick orientation layer. Deeper evidence, maturity and directional findings belong in the clean-sheet Progress experience.</p><a href="/progress-next" class="mt-4 inline-block text-sm font-semibold text-[#3de8c8]">View Progress →</a></section>
			</aside>
		</div>
	{/if}
</div>

<script lang="ts">
	interface SessionSummary {
		best_reaction_ms: number | null;
		best_peak_speed_ms: number | null;
		best_max_g?: number | null;
		has_valid_speed: boolean;
	}

	interface Props {
		sessions: SessionSummary[];
	}

	let { sessions }: Props = $props();
	let latest = $derived(sessions[sessions.length - 1] ?? null);
	let allTimeReaction = $derived.by(() => {
		const values = sessions.map((session) => session.best_reaction_ms).filter((value): value is number => value !== null);
		return values.length ? Math.min(...values) : null;
	});
	let allTimeSpeed = $derived.by(() => {
		const values = sessions.filter((session) => session.has_valid_speed).map((session) => session.best_peak_speed_ms).filter((value): value is number => value !== null);
		return values.length ? Math.max(...values) : null;
	});
	let allTimeG = $derived.by(() => {
		const values = sessions.map((session) => session.best_max_g).filter((value): value is number => value !== null);
		return values.length ? Math.max(...values) : null;
	});
	let hasValidSpeed = $derived(sessions.some((session) => session.has_valid_speed));

	function fmtReaction(value: number | null | undefined) {
		return value == null ? '—' : `${(value / 1000).toFixed(3)}s`;
	}
	function fmtSpeed(value: number | null | undefined) {
		return value == null ? '—' : `${(value * 3.6).toFixed(1)} km/h`;
	}
	function fmtG(value: number | null | undefined) {
		return value == null ? '—' : `${value.toFixed(2)}G`;
	}
</script>

<section class="rounded-2xl border border-[color:color-mix(in_srgb,var(--text-primary)_10%,transparent)] bg-[color:var(--surface)] p-4 shadow-sm sm:p-5" aria-labelledby="start-performance-title">
	<div class="flex flex-wrap items-end justify-between gap-3">
		<div>
			<p class="themed-text-subtle text-[10px] font-extrabold tracking-[0.16em] uppercase">Start performance</p>
			<h3 id="start-performance-title" class="themed-text-primary mt-1 text-lg font-bold">What the latest session actually delivered</h3>
		</div>
		<span class="themed-text-subtle text-xs">Latest session vs recorded ceiling</span>
	</div>

	<div class="mt-4 grid gap-px bg-[color:color-mix(in_srgb,var(--text-primary)_10%,transparent)] md:grid-cols-3">
		<div class="metric reaction">
			<div class="label"><span>Reaction</span><small>measured</small></div>
			<strong>{fmtReaction(latest?.best_reaction_ms)}</strong>
			<p>PB {fmtReaction(allTimeReaction)}</p>
		</div>
		<div class="metric speed">
			<div class="label"><span>Peak speed</span><small>estimated from IMU</small></div>
			<strong>{latest?.has_valid_speed ? fmtSpeed(latest.best_peak_speed_ms) : '—'}</strong>
			<p>{hasValidSpeed ? `PB ${fmtSpeed(allTimeSpeed)}` : 'No valid speed evidence'}</p>
		</div>
		<div class="metric force">
			<div class="label"><span>Peak force</span><small>measured max G</small></div>
			<strong>{fmtG(latest?.best_max_g)}</strong>
			<p>PB {fmtG(allTimeG)}</p>
		</div>
	</div>
</section>

<style>
	.metric { position: relative; padding: 1rem 1.1rem; background: var(--surface); }
	.metric::before { content: ''; position: absolute; inset: 0 auto 0 0; width: 2px; background: var(--metric-accent); opacity: .85; }
	.metric.reaction { --metric-accent: #d99000; }
	.metric.speed { --metric-accent: #ff6b3d; }
	.metric.force { --metric-accent: #3de8c8; }
	.label { display: flex; align-items: baseline; justify-content: space-between; gap: .8rem; }
	.label span { font-size: .72rem; font-weight: 750; color: var(--text-secondary); }
	.label small { font-size: .58rem; color: var(--text-subtle); }
	.metric strong { display: block; margin-top: .65rem; font-size: clamp(1.4rem, 2.5vw, 2.25rem); line-height: 1; letter-spacing: -.035em; font-variant-numeric: tabular-nums; color: var(--text-primary); }
	.metric p { margin: .55rem 0 0; font-size: .64rem; color: var(--text-subtle); }
</style>
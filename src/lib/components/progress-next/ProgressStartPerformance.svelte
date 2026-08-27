<script lang="ts">
	interface SessionPoint {
		timestamp: string;
		best_reaction_ms: number | null;
		best_peak_speed_ms: number | null;
		best_max_g: number | null;
	}

	interface Props {
		sessions: SessionPoint[];
		personalBests: {
			reaction_ms: number | null;
			peak_speed_ms: number | null;
			max_g: number | null;
		};
	}

	let { sessions, personalBests }: Props = $props();
	const latest = $derived(sessions.at(-1) ?? null);

	function fmtReaction(value: number | null | undefined) {
		return typeof value === 'number' ? `${(value / 1000).toFixed(3)}s` : '—';
	}

	function fmtSpeed(value: number | null | undefined) {
		return typeof value === 'number' ? `${(value * 3.6).toFixed(1)} km/h` : '—';
	}

	function fmtG(value: number | null | undefined) {
		return typeof value === 'number' ? `${value.toFixed(2)}G` : '—';
	}

	function series(key: 'best_reaction_ms' | 'best_peak_speed_ms' | 'best_max_g') {
		return sessions
			.slice(-10)
			.map((session) => session[key])
			.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
	}

	function bars(values: number[], lowerIsBetter = false) {
		if (!values.length) return [];
		const min = Math.min(...values);
		const max = Math.max(...values);
		const spread = Math.max(max - min, Math.abs(max || 1) * 0.08);
		return values.map((value) => {
			const normal = (value - min) / spread;
			const score = lowerIsBetter ? 1 - normal : normal;
			return 28 + Math.max(0, Math.min(1, score)) * 72;
		});
	}

	const reactionBars = $derived(bars(series('best_reaction_ms'), true));
	const speedBars = $derived(bars(series('best_peak_speed_ms')));
	const forceBars = $derived(bars(series('best_max_g')));
</script>

<section class="start-layer" aria-labelledby="start-performance-heading">
	<header>
		<div>
			<p class="eyebrow">2 · Start performance</p>
			<h2 id="start-performance-heading">What the latest gate session delivered</h2>
			<span>Measured outputs first. Recent shape adds context without pretending one session is a trend.</span>
		</div>
		{#if latest}
			<time datetime={latest.timestamp}>{new Date(latest.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</time>
		{/if}
	</header>

	<div class="metric-grid">
		<article class="metric reaction">
			<div class="metric-head"><span>Reaction</span><small>measured</small></div>
			<strong>{fmtReaction(latest?.best_reaction_ms)}</strong>
			<p>PB {fmtReaction(personalBests.reaction_ms)}</p>
			<div class="micro" aria-hidden="true">
				{#each reactionBars as height}<i style={`height:${height}%`}></i>{/each}
			</div>
		</article>
		<article class="metric speed">
			<div class="metric-head"><span>Peak speed</span><small>validated IMU</small></div>
			<strong>{fmtSpeed(latest?.best_peak_speed_ms)}</strong>
			<p>PB {fmtSpeed(personalBests.peak_speed_ms)}</p>
			<div class="micro" aria-hidden="true">
				{#each speedBars as height}<i style={`height:${height}%`}></i>{/each}
			</div>
		</article>
		<article class="metric force">
			<div class="metric-head"><span>Peak force</span><small>measured max G</small></div>
			<strong>{fmtG(latest?.best_max_g)}</strong>
			<p>PB {fmtG(personalBests.max_g)}</p>
			<div class="micro" aria-hidden="true">
				{#each forceBars as height}<i style={`height:${height}%`}></i>{/each}
			</div>
		</article>
	</div>
</section>

<style>
	.start-layer {
		border: 1px solid #1e3a52;
		border-radius: 1rem;
		background: linear-gradient(145deg, rgba(12, 30, 47, .96), rgba(8, 22, 35, .96));
		padding: 1rem;
	}
	header { display: flex; align-items: end; justify-content: space-between; gap: 1rem; }
	.eyebrow { margin: 0; color: #4ba3ff; font-size: .58rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
	h2 { margin: .28rem 0 0; font-size: 1rem; letter-spacing: -.02em; }
	header span, time { color: #71889d; font-size: .62rem; }
	header span { display: block; margin-top: .25rem; }
	time { white-space: nowrap; }
	.metric-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .55rem; margin-top: .85rem; }
	.metric { --tone:#4ba3ff; min-width: 0; border: 1px solid #1a344b; border-radius: .82rem; background: rgba(8, 23, 37, .88); padding: .85rem; }
	.metric.reaction { --tone:#8de51e; }
	.metric.speed { --tone:#35d4df; }
	.metric.force { --tone:#f0a719; }
	.metric-head { display: flex; justify-content: space-between; gap: .5rem; color: #9db1c3; font-size: .62rem; font-weight: 700; }
	.metric-head small { color: #5f778d; font-size: .54rem; font-weight: 500; }
	.metric strong { display: block; margin-top: .55rem; color: #f7fbff; font-size: clamp(1.25rem, 2.5vw, 2rem); line-height: 1; letter-spacing: -.035em; }
	.metric p { margin: .28rem 0 0; color: #70879b; font-size: .57rem; }
	.micro { display: flex; align-items: end; gap: .2rem; height: 1.7rem; margin-top: .7rem; }
	.micro i { flex: 1; min-width: .16rem; max-width: 1.1rem; border-radius: .18rem .18rem .05rem .05rem; background: var(--tone); opacity: .75; }
	@media (max-width: 700px) { .metric-grid { grid-template-columns: 1fr; } header { align-items: flex-start; } }
</style>

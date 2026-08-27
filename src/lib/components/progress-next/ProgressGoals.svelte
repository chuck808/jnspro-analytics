<script lang="ts">
	type GoalTarget = {
		target: number | null;
		start: number | null;
		current: number | null;
		deadline?: string | null;
	};

	interface Props {
		goalTargets: Record<string, GoalTarget>;
	}

	let { goalTargets }: Props = $props();

	const lowerIsBetter = new Set(['reactionTime', 'elapsedTime', 'accelerationPhase']);
	const labels: Record<string, string> = {
		reactionTime: 'Reaction time',
		elapsedTime: 'Elapsed time',
		accelerationPhase: 'Acceleration phase',
		peakSpeed: 'Peak speed',
		maxG: 'Peak G',
		consistency: 'Consistency'
	};

	function label(metric: string) {
		return labels[metric] ?? metric.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (char) => char.toUpperCase());
	}

	function progress(metric: string, goal: GoalTarget): number | null {
		const { start, current, target } = goal;
		if (start == null || current == null || target == null || start === target) return null;
		const raw = lowerIsBetter.has(metric)
			? ((start - current) / (start - target)) * 100
			: ((current - start) / (target - start)) * 100;
		return Math.round(Math.min(100, Math.max(0, raw)));
	}

	function displayValue(metric: string, value: number | null) {
		if (value == null) return '—';
		if (metric === 'reactionTime' || metric === 'elapsedTime' || metric === 'accelerationPhase') {
			return value >= 10 ? `${(value / 1000).toFixed(3)}s` : `${value.toFixed(3)}s`;
		}
		if (metric === 'peakSpeed') return `${value.toFixed(1)} km/h`;
		if (metric === 'maxG') return `${value.toFixed(2)}G`;
		return Number.isInteger(value) ? String(value) : value.toFixed(1);
	}

	function deadlineText(deadline?: string | null) {
		if (!deadline) return 'No deadline';
		return new Date(deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	const goals = $derived(Object.entries(goalTargets).slice(0, 2));
</script>

<section class="panel" aria-labelledby="goals-heading">
	<div class="heading-row">
		<div>
			<p>9 · Goals</p>
			<h2 id="goals-heading">What are you working towards?</h2>
		</div>
		<a href="/goals">View goals</a>
	</div>

	{#if goals.length === 0}
		<div class="empty">
			<span>◎</span>
			<strong>No active goal yet</strong>
			<p>Set a target when you want Progress to show the gap between today's evidence and where you want to get.</p>
			<a href="/goals">Set a goal</a>
		</div>
	{:else}
		<div class="goals">
			{#each goals as [metric, goal], index}
				{@const percent = progress(metric, goal)}
				<article class:featured={index === 0}>
					<div
						class="ring"
						style={`--progress:${percent ?? 0}`}
						aria-label={percent === null ? `${label(metric)} goal progress is still building` : `${label(metric)} goal is ${percent}% complete`}
					>
						<div class="ring-core">
							<strong>{percent === null ? '—' : percent}</strong>
							<span>{percent === null ? 'building' : '%'}</span>
						</div>
					</div>

					<div class="goal-copy">
						<span class="metric">{label(metric)}</span>
						<strong class="current">{displayValue(metric, goal.current)}</strong>
						<span class="deadline">{deadlineText(goal.deadline)}</span>

						<div class="journey" aria-label={`${label(metric)} goal evidence`}>
							<div><span>Start</span><strong>{displayValue(metric, goal.start)}</strong></div>
							<i aria-hidden="true">→</i>
							<div><span>Now</span><strong>{displayValue(metric, goal.current)}</strong></div>
							<i aria-hidden="true">→</i>
							<div><span>Target</span><strong>{displayValue(metric, goal.target)}</strong></div>
						</div>
					</div>
				</article>
			{/each}
		</div>
	{/if}
</section>

<style>
	.panel {
		height: 100%;
		border: 1px solid #1f3a51;
		border-radius: 1rem;
		background: linear-gradient(180deg, rgba(11, 30, 47, 0.96), rgba(8, 24, 38, 0.96));
		padding: 1rem;
	}

	.heading-row {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: 0.8rem;
	}

	.heading-row p {
		margin: 0;
		font-size: 0.58rem;
		font-weight: 800;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: #4ba3ff;
	}

	h2 { margin: 0.28rem 0 0; font-size: 0.92rem; letter-spacing: -0.02em; }
	.heading-row > a { color: #62b4ff; font-size: 0.58rem; text-decoration: none; }
	.heading-row > a:hover { text-decoration: underline; }

	.goals { display: grid; gap: 0.55rem; margin-top: 0.85rem; }
	article {
		display: grid;
		grid-template-columns: 5.3rem minmax(0, 1fr);
		align-items: center;
		gap: 0.85rem;
		border: 1px solid #183249;
		border-radius: 0.8rem;
		background: rgba(8, 25, 40, 0.76);
		padding: 0.8rem;
	}

	article.featured {
		border-color: #27506e;
		background: linear-gradient(145deg, rgba(13, 36, 55, .96), rgba(7, 24, 39, .88));
	}

	.ring {
		--progress: 0;
		display: grid;
		width: 5rem;
		aspect-ratio: 1;
		place-items: center;
		border-radius: 50%;
		background: conic-gradient(#8de51e calc(var(--progress) * 1%), #153249 0);
		box-shadow: 0 0 1.4rem rgba(141, 229, 30, .08);
	}

	.ring-core {
		display: grid;
		width: 3.9rem;
		aspect-ratio: 1;
		place-items: center;
		align-content: center;
		border: 1px solid #1d3c54;
		border-radius: 50%;
		background: #091b2b;
	}

	.ring-core strong { color: #f7fbff; font-size: 1.4rem; line-height: 1; }
	.ring-core span { margin-top: .16rem; color: #7890a4; font-size: .48rem; text-transform: uppercase; letter-spacing: .08em; }

	.goal-copy { min-width: 0; }
	.metric { display: block; color: #7d91a5; font-size: 0.55rem; }
	.current { display: block; margin-top: 0.16rem; color: #f4f9fd; font-size: 1.05rem; }
	.deadline { display: block; margin-top: .14rem; color: #647d92; font-size: .5rem; }

	.journey {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto minmax(0, 1fr);
		align-items: center;
		gap: .35rem;
		margin-top: .58rem;
		padding-top: .52rem;
		border-top: 1px solid #173149;
	}

	.journey div { min-width: 0; }
	.journey span, .journey strong { display: block; }
	.journey span { color: #5f788e; font-size: .46rem; text-transform: uppercase; letter-spacing: .08em; }
	.journey strong { margin-top: .12rem; overflow: hidden; color: #a9bac9; font-size: .54rem; text-overflow: ellipsis; white-space: nowrap; }
	.journey i { color: #35526a; font-size: .6rem; font-style: normal; }
	.journey div:nth-of-type(2) strong { color: #f3f8fc; }
	.journey div:nth-of-type(3) strong { color: #8de51e; }

	.empty { display: grid; min-height: 8rem; place-items: center; align-content: center; text-align: center; padding: 0.7rem; }
	.empty > span { color: #4ba3ff; font-size: 1.25rem; }
	.empty strong { margin-top: 0.4rem; font-size: 0.75rem; }
	.empty p { max-width: 19rem; margin: 0.32rem 0 0; color: #73889b; font-size: 0.56rem; line-height: 1.45; }
	.empty a { margin-top: 0.6rem; color: #8de51e; font-size: 0.58rem; text-decoration: none; }

	@media (max-width: 540px) {
		article { grid-template-columns: 4.5rem minmax(0, 1fr); }
		.ring { width: 4.2rem; }
		.ring-core { width: 3.25rem; }
		.journey { gap: .24rem; }
	}
</style>

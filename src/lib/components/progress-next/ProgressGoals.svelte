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
			{#each goals as [metric, goal]}
				{@const percent = progress(metric, goal)}
				<article>
					<div class="goal-top">
						<div>
							<span class="metric">{label(metric)}</span>
							<strong>{displayValue(metric, goal.current)}</strong>
						</div>
						{#if percent !== null}<b>{percent}%</b>{/if}
					</div>
					<div class="track" aria-hidden="true"><span style={`width: ${percent ?? 0}%`}></span></div>
					<div class="goal-meta">
						<span>Target {displayValue(metric, goal.target)}</span>
						<span>{deadlineText(goal.deadline)}</span>
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
	article { border: 1px solid #183249; border-radius: 0.72rem; background: rgba(8, 25, 40, 0.76); padding: 0.7rem; }
	.goal-top { display: flex; align-items: end; justify-content: space-between; gap: 0.6rem; }
	.metric { display: block; color: #7d91a5; font-size: 0.55rem; }
	.goal-top strong { display: block; margin-top: 0.2rem; font-size: 1.02rem; color: #f4f9fd; }
	.goal-top b { color: #8de51e; font-size: 0.78rem; }
	.track { height: 0.28rem; margin-top: 0.6rem; overflow: hidden; border-radius: 999px; background: #122a3e; }
	.track span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #45a9ff, #8de51e); }
	.goal-meta { display: flex; justify-content: space-between; gap: 0.55rem; margin-top: 0.42rem; color: #6f8498; font-size: 0.52rem; }

	.empty { display: grid; min-height: 8rem; place-items: center; align-content: center; text-align: center; padding: 0.7rem; }
	.empty > span { color: #4ba3ff; font-size: 1.25rem; }
	.empty strong { margin-top: 0.4rem; font-size: 0.75rem; }
	.empty p { max-width: 19rem; margin: 0.32rem 0 0; color: #73889b; font-size: 0.56rem; line-height: 1.45; }
	.empty a { margin-top: 0.6rem; color: #8de51e; font-size: 0.58rem; text-decoration: none; }
</style>

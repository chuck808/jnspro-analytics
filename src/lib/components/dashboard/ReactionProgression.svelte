<script lang="ts">
	type Point = {
		id: string;
		timestamp: string;
		best_reaction_ms: number | null;
	};

	let { sessions }: { sessions: Point[] } = $props();

	let points = $derived(
		(sessions ?? [])
			.filter((session) => session.best_reaction_ms !== null)
			.slice(0, 8)
			.reverse()
	);

	let values = $derived(points.map((point) => point.best_reaction_ms as number));
	let min = $derived(values.length ? Math.min(...values) : 0);
	let max = $derived(values.length ? Math.max(...values) : 0);
	let range = $derived(Math.max(1, max - min));

	function x(index: number) {
		return points.length <= 1 ? 50 : 6 + (index / (points.length - 1)) * 88;
	}

	function y(value: number) {
		return 16 + ((value - min) / range) * 68;
	}

	let polyline = $derived(points.map((point, index) => `${x(index)},${y(point.best_reaction_ms as number)}`).join(' '));

	function fmt(ms: number) {
		return `${(ms / 1000).toFixed(3)}s`;
	}
</script>

{#if points.length >= 2}
	<div class="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg)]/45 p-4 md:p-5">
		<div class="mb-4 flex items-end justify-between gap-4">
			<div>
				<p class="text-xs font-semibold tracking-[0.16em] text-[var(--theme-text-subtle)] uppercase">Reaction progression</p>
				<p class="mt-1 text-sm text-[var(--theme-text-secondary)]">Best eligible reaction from each recent session. Lower is faster.</p>
			</div>
			<div class="text-right">
				<p class="text-xs text-[var(--theme-text-subtle)]">Latest</p>
				<p class="text-lg font-bold text-[var(--theme-text-primary)]">{fmt(values[values.length - 1])}</p>
			</div>
		</div>

		<svg viewBox="0 0 100 100" class="h-40 w-full overflow-visible" role="img" aria-label="Recent best reaction times by session">
			<line x1="6" y1="16" x2="94" y2="16" stroke="var(--theme-border)" stroke-width="0.6" />
			<line x1="6" y1="50" x2="94" y2="50" stroke="var(--theme-border)" stroke-width="0.6" />
			<line x1="6" y1="84" x2="94" y2="84" stroke="var(--theme-border)" stroke-width="0.6" />
			<polyline points={polyline} fill="none" stroke="#f5a623" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
			{#each points as point, index}
				<circle cx={x(index)} cy={y(point.best_reaction_ms as number)} r={index === points.length - 1 ? 2.8 : 2} fill={index === points.length - 1 ? '#f5a623' : 'var(--theme-surface)'} stroke="#f5a623" stroke-width="1.2">
					<title>{fmt(point.best_reaction_ms as number)}</title>
				</circle>
			{/each}
		</svg>

		<div class="mt-2 flex items-center justify-between text-xs text-[var(--theme-text-subtle)]">
			<span>{fmt(values[0])}</span>
			<span>{points.length} recent sessions</span>
			<span>{fmt(values[values.length - 1])}</span>
		</div>
	</div>
{/if}

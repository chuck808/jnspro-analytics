<script lang="ts">
	import type { EvidenceView } from './ProgressTrendChart.svelte';

	interface Props {
		activeView: EvidenceView;
		onSelect: (view: EvidenceView) => void;
		trend: { reaction: number | null; speed: number | null };
		overallConsistency: { label: string; color?: string } | null;
	}

	let { activeView, onSelect, trend, overallConsistency }: Props = $props();

	function trendState(value: number | null, lowerIsBetter = false) {
		if (value === null) return { tone: 'neutral', text: 'No trend yet' };
		if (Math.abs(value) < 1) return { tone: 'neutral', text: 'Stable' };
		const improving = lowerIsBetter ? value < 0 : value > 0;
		return improving
			? { tone: 'positive', text: `↑ ${Math.abs(value).toFixed(1)}%` }
			: { tone: 'attention', text: `↓ ${Math.abs(value).toFixed(1)}%` };
	}

	let reactionState = $derived(trendState(trend.reaction, true));
	let speedState = $derived(trendState(trend.speed));
</script>

<aside class="rounded-2xl border border-[color:color-mix(in_srgb,var(--text-primary)_10%,transparent)] bg-[color:var(--surface)] p-4 shadow-sm sm:p-5" aria-label="Improvement breakdown">
	<div>
		<p class="themed-text-subtle text-[10px] font-extrabold tracking-[0.16em] uppercase">Improvement breakdown</p>
		<p class="themed-text-secondary mt-1 text-xs">Same evidence, three lenses.</p>
	</div>

	<div class="mt-3 divide-y divide-[color:color-mix(in_srgb,var(--text-primary)_8%,transparent)]">
		<button class:selected={activeView === 'reaction'} class="breakdown-row" onclick={() => onSelect('reaction')}>
			<span class="symbol reaction">R</span>
			<span class="copy"><strong>Reaction</strong><small>Measured</small></span>
			<span class="result" data-tone={reactionState.tone}>{reactionState.text}</span>
		</button>
		<button class:selected={activeView === 'speed'} class="breakdown-row" onclick={() => onSelect('speed')}>
			<span class="symbol speed">S</span>
			<span class="copy"><strong>Peak speed</strong><small>Estimated from IMU</small></span>
			<span class="result" data-tone={speedState.tone}>{speedState.text}</span>
		</button>
		<button class:selected={activeView === 'consistency'} class="breakdown-row" onclick={() => onSelect('consistency')}>
			<span class="symbol consistency">C</span>
			<span class="copy"><strong>Consistency</strong><small>Reaction CV</small></span>
			<span class="result" style={overallConsistency?.color ? `color:${overallConsistency.color}` : undefined}>{overallConsistency?.label ?? 'Building evidence'}</span>
		</button>
	</div>

	<p class="themed-text-subtle mt-3 text-[11px] leading-5">Select a row to bring its evidence into the main view.</p>
</aside>

<style>
	.breakdown-row {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: .7rem;
		width: 100%;
		border: 0;
		padding: .9rem .15rem;
		background: transparent;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}
	.breakdown-row.selected { background: linear-gradient(90deg, color-mix(in srgb, var(--accent) 8%, transparent), transparent 75%); }
	.symbol { display: grid; place-items: center; width: 1.75rem; height: 1.75rem; border-radius: .6rem; font-size: .65rem; font-weight: 900; }
	.symbol.reaction { color: #d99000; background: #d9900015; }
	.symbol.speed { color: #ff6b3d; background: #ff6b3d15; }
	.symbol.consistency { color: #20b98b; background: #20b98b15; }
	.copy strong, .copy small { display: block; }
	.copy strong { font-size: .78rem; color: var(--text-primary); }
	.copy small { margin-top: .15rem; font-size: .62rem; color: var(--text-subtle); }
	.result { max-width: 7rem; text-align: right; font-size: .68rem; font-weight: 750; color: var(--text-secondary); }
	.result[data-tone='positive'] { color: #20b98b; }
	.result[data-tone='attention'] { color: #e4564f; }
</style>
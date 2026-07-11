<script lang="ts">
	/**
	 * Speed Heatmap Chart
	 * Displays speed intensity as a heatmap grid
	 */

	export interface HeatmapCell {
		intensity: number; // 0-1 range
		value?: number;
		label?: string;
	}

	let {
		cells = [],
		columns = 20,
		compact = false,
		title = 'Speed Intensity Heatmap',
		subtitle = 'Speed intensity distribution across time segments',
		unit = 'km/h'
	}: {
		cells?: HeatmapCell[];
		columns?: number;
		compact?: boolean;
		title?: string;
		subtitle?: string;
		unit?: string;
	} = $props();

	const rows = $derived(Math.ceil(cells.length / columns));
	const maxIntensity = $derived(cells.length > 0 ? Math.max(...cells.map((c) => c.intensity)) : 1);
	const avgIntensity = $derived(
		cells.length > 0 ? cells.reduce((sum, c) => sum + c.intensity, 0) / cells.length : 0
	);

	function getColor(intensity: number): string {
		// Normalize intensity to 0-1 range
		const normalized = intensity / (maxIntensity || 1);
		// Use cyan/teal color scheme matching the app
		return `rgba(61, 232, 200, ${normalized})`;
	}
</script>

<section class:compact class="chart-card">
	<div class="chart-header">
		<div>
			<h3>{title}</h3>
			{#if subtitle}<p class="subtitle">{subtitle}</p>{/if}
		</div>
		{#if avgIntensity > 0}
			<div class="stat-pill">Avg {(avgIntensity * 100).toFixed(0)}% intensity</div>
		{/if}
	</div>

	{#if cells.length === 0}
		<div class="empty-state">No heatmap data available to display.</div>
	{:else}
		<div class="heatmap-container">
			<div
				class="heatmap-grid"
				style="grid-template-columns: repeat({columns}, 1fr); grid-template-rows: repeat({rows}, 1fr);"
			>
				{#each cells as cell, i}
					<div
						class="heatmap-cell"
						style="background: {getColor(cell.intensity)};"
						role="img"
						aria-label={cell.label ??
							`Cell ${i + 1}: ${(cell.intensity * 100).toFixed(0)}% intensity`}
						title={cell.label ??
							`${(cell.intensity * 100).toFixed(0)}% intensity${cell.value ? ` (${cell.value.toFixed(1)} ${unit})` : ''}`}
					></div>
				{/each}
			</div>
		</div>

		<div class="stats-grid">
			<div><span>Cells</span><strong>{cells.length}</strong></div>
			<div><span>Avg Intensity</span><strong>{(avgIntensity * 100).toFixed(0)}%</strong></div>
			<div><span>Max Intensity</span><strong>{(maxIntensity * 100).toFixed(0)}%</strong></div>
			<div><span>Grid</span><strong>{columns}×{rows}</strong></div>
		</div>

		<div class="legend-bar">
			<span class="legend-label">Low</span>
			<div class="gradient-bar"></div>
			<span class="legend-label">High</span>
		</div>
	{/if}
</section>

<style>
	.chart-card {
		background: var(--theme-surface);
		border: 1px solid rgba(245, 166, 35, 0.18);
		border-radius: 18px;
		padding: 1rem;
		color: var(--theme-text-primary);
		box-shadow: 0 18px 60px rgba(0, 0, 0, 0.22);
	}
	.chart-card.compact {
		padding: 0.75rem;
	}
	.chart-header {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		align-items: flex-start;
		margin-bottom: 0.75rem;
	}
	h3 {
		margin: 0;
		font-size: 1rem;
		color: var(--theme-text-primary);
	}
	.subtitle {
		margin: 0.25rem 0 0;
		color: var(--theme-text-secondary);
		font-size: 0.85rem;
	}
	.stat-pill {
		white-space: nowrap;
		border: 1px solid rgba(61, 232, 200, 0.35);
		color: #3de8c8;
		border-radius: 999px;
		padding: 0.35rem 0.65rem;
		font-size: 0.8rem;
	}
	.heatmap-container {
		margin: 0.75rem 0;
	}
	.heatmap-grid {
		display: grid;
		gap: 2px;
		background: var(--theme-bg);
		padding: 2px;
		border-radius: 8px;
	}
	.heatmap-cell {
		aspect-ratio: 1;
		min-height: 12px;
		border-radius: 2px;
		transition: all 0.2s ease;
		cursor: pointer;
		border: 1px solid rgba(61, 232, 200, 0.1);
	}
	.heatmap-cell:hover {
		transform: scale(1.15);
		z-index: 10;
		box-shadow: 0 4px 12px rgba(61, 232, 200, 0.4);
		border-color: rgba(61, 232, 200, 0.5);
	}
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.5rem;
		margin-top: 0.75rem;
	}
	.stats-grid div {
		background: var(--theme-bg);
		border-radius: 12px;
		padding: 0.55rem;
	}
	.stats-grid span {
		display: block;
		color: var(--theme-text-subtle);
		font-size: 0.72rem;
	}
	.stats-grid strong {
		display: block;
		margin-top: 0.15rem;
		font-size: 0.86rem;
		color: var(--theme-text-primary);
	}
	.legend-bar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}
	.legend-label {
		font-size: 0.75rem;
		color: var(--theme-text-secondary);
		white-space: nowrap;
	}
	.gradient-bar {
		flex: 1;
		height: 8px;
		border-radius: 4px;
		background: linear-gradient(
			to right,
			rgba(61, 232, 200, 0.1),
			rgba(61, 232, 200, 0.5),
			rgba(61, 232, 200, 1)
		);
		border: 1px solid rgba(61, 232, 200, 0.2);
	}
	.empty-state {
		padding: 2rem;
		text-align: center;
		color: var(--theme-text-secondary);
		border: 1px dashed var(--theme-border);
		border-radius: 14px;
	}
	@media (max-width: 640px) {
		.chart-header {
			flex-direction: column;
		}
		.stats-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>

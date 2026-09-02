<script lang="ts">
	import type { DropOffEvidenceModel, DropOffBand } from './dropOffEvidence';

	let { evidence }: { evidence: DropOffEvidenceModel } = $props();

	// detectDropOff() can never report a run earlier than 3 (its loop only
	// checks from the 3rd observation onward) — this is the true floor, not an
	// arbitrary chart minimum.
	const AXIS_MIN = 3;
	// Scaled to the account's own real range (with a small floor so a single
	// early cluster doesn't fill the whole axis) rather than always padding out
	// to run 12+ — real usage tends to cluster hard at the low end, and a fixed
	// wide axis just leaves most of the chart empty.
	const axisMax = $derived(Math.max(6, ...evidence.history.map((entry) => entry.dropOffRun)) + 1);

	// Insets the mapped range a few percent on each side so a column sitting at
	// the very first or last run (very common — real usage clusters hard at
	// AXIS_MIN) has room for its own width and count label without spilling
	// past the card's edge. Applied once here so zones/columns/ticks all stay
	// aligned to the same coordinate space.
	function xPercent(run: number) {
		const raw = (run - AXIS_MIN) / (axisMax - AXIS_MIN);
		return 4 + raw * 92;
	}

	const zones = $derived.by(() => {
		const start = xPercent(AXIS_MIN);
		const end = xPercent(axisMax);
		const midStart = Math.max(start, Math.min(end, xPercent(5)));
		const lateStart = Math.max(start, Math.min(end, xPercent(8)));
		return [
			{ band: 'early' as DropOffBand, label: 'Early', left: start, width: midStart - start },
			{ band: 'mid' as DropOffBand, label: 'Mid', left: midStart, width: lateStart - midStart },
			{ band: 'late' as DropOffBand, label: 'Late', left: lateStart, width: end - lateStart }
		];
	});

	// Grouped into a count per exact run number, so sessions that share the
	// same fade point add up into one column's height instead of piling into
	// illegible overlapping markers — real usage clusters hard on a handful of
	// run numbers, which a per-session marker can't show cleanly.
	const columns = $derived.by(() => {
		const counts = new Map<number, { band: DropOffBand; count: number }>();
		for (const entry of evidence.history) {
			const existing = counts.get(entry.dropOffRun);
			if (existing) existing.count += 1;
			else counts.set(entry.dropOffRun, { band: entry.band, count: 1 });
		}
		const maxCount = Math.max(1, ...Array.from(counts.values()).map((c) => c.count));
		return Array.from(counts.entries())
			.map(([run, { band, count }]) => ({
				run,
				band,
				count,
				left: xPercent(run),
				heightPercent: Math.max((count / maxCount) * 100, 14)
			}))
			.sort((a, b) => a.run - b.run);
	});
</script>

<section class="drop-off" aria-labelledby="drop-off-heading">
	<header>
		<p class="eyebrow">Drop-off position</p>
		<h2 id="drop-off-heading">Does a fade show up, and where?</h2>
		<span>
			Checks whether speed drops more than 6% below a session's own best partway through. A
			session with no detected fade is a genuinely good result, not missing data.
		</span>
	</header>

	<div class="detection-stat" data-has-rate={evidence.detectionRate !== null}>
		{#if evidence.detectionRate !== null}
			<strong>{evidence.detectedSessionCount} of {evidence.eligibleSessionCount}</strong>
			<span>sessions showed a detected fade</span>
		{:else}
			<strong>—</strong>
			<span>Not enough eligible sessions yet</span>
		{/if}
	</div>
	<p class="detection-statement">{evidence.presentation.detectionStatement}</p>

	{#if evidence.detectedSessionCount > 0}
		<div
			class="dropoff-axis"
			aria-label="Run number where a fade was first detected, one column per run number sized by how many sessions"
		>
			<div class="zones">
				{#each zones as zone (zone.band)}
					<div class="zone" data-band={zone.band} style={`left:${zone.left}%; width:${zone.width}%`}>
						<span>{zone.label}</span>
					</div>
				{/each}
			</div>

			<div class="columns">
				{#each columns as column (column.run)}
					<div
						class="column"
						style={`left:${column.left}%`}
						title={`Run ${column.run} · ${column.count} session${column.count === 1 ? '' : 's'}`}
					>
						<b>{column.count}</b>
						<div class="bar" data-band={column.band} style={`height:${column.heightPercent}%`}></div>
					</div>
				{/each}
			</div>

			<div class="ticks">
				<span style={`left:${xPercent(AXIS_MIN)}%`}>Run {AXIS_MIN}</span>
				<span style={`left:${xPercent(8)}%`}>Run 8</span>
				<span style={`left:${xPercent(axisMax)}%`}>Run {axisMax}+</span>
			</div>
		</div>
		<p class="trend-statement">{evidence.presentation.distributionStatement}</p>
	{:else}
		<p class="no-detections">{evidence.presentation.distributionStatement}</p>
	{/if}
</section>

<style>
	.drop-off {
		margin-top: 0.75rem;
		padding: 1rem 1.1rem;
		border: 1px solid #1e3a52;
		border-radius: 1rem;
		background: linear-gradient(145deg, rgba(12, 30, 47, 0.96), rgba(8, 22, 35, 0.96));
	}

	.eyebrow {
		margin: 0;
		font-size: 0.6rem;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #4ba3ff;
	}

	h2 {
		margin: 0.28rem 0 0;
		font-size: 1rem;
		letter-spacing: -0.02em;
	}

	header > span {
		display: block;
		max-width: 46rem;
		margin-top: 0.25rem;
		font-size: 0.64rem;
		line-height: 1.45;
		color: #71889d;
	}

	.detection-stat {
		display: flex;
		align-items: baseline;
		gap: 0.55rem;
		margin-top: 0.9rem;
		padding: 0.85rem 0.9rem;
		border: 1px solid #1b3449;
		border-radius: 0.75rem;
		background: rgba(7, 20, 32, 0.7);
	}

	.detection-stat strong {
		font-size: 1.15rem;
		color: #dfffb4;
	}

	.detection-stat[data-has-rate='false'] strong {
		color: #71889d;
	}

	.detection-stat span {
		font-size: 0.62rem;
		color: #7f95a7;
	}

	.detection-statement,
	.trend-statement,
	.no-detections {
		margin: 0.6rem 0 0;
		font-size: 0.66rem;
		line-height: 1.55;
		color: #91a6b7;
	}

	.dropoff-axis {
		position: relative;
		overflow: hidden;
		height: 8rem;
		margin-top: 1rem;
		padding: 0 0.3rem;
	}

	.zones {
		position: absolute;
		inset: 0 0.3rem 1.7rem 0.3rem;
		border-radius: 0.55rem;
		overflow: hidden;
		background: rgba(16, 35, 51, 0.4);
		border: 1px solid #1b3449;
	}

	.zone {
		position: absolute;
		top: 0;
		bottom: 0;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding-top: 0.35rem;
	}

	.zone[data-band='early'] {
		background: rgba(255, 115, 84, 0.1);
	}

	.zone[data-band='mid'] {
		background: rgba(255, 179, 26, 0.1);
	}

	.zone[data-band='late'] {
		background: rgba(141, 229, 30, 0.1);
	}

	.zone span {
		font-size: 0.56rem;
		font-weight: 750;
		letter-spacing: 0.07em;
		text-transform: uppercase;
		color: #8ba0b3;
	}

	.columns {
		position: absolute;
		left: 0.3rem;
		right: 0.3rem;
		bottom: 1.7rem;
		height: calc(100% - 1.7rem - 1.4rem);
	}

	.column {
		position: absolute;
		bottom: 0;
		display: flex;
		width: 2.4rem;
		height: 100%;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
		gap: 0.3rem;
		transform: translateX(-50%);
	}

	.column b {
		font-size: 0.66rem;
		font-weight: 800;
		color: #dce8f2;
	}

	.bar {
		width: 1.3rem;
		min-height: 0.3rem;
		border-radius: 0.3rem 0.3rem 0.15rem 0.15rem;
	}

	.bar[data-band='early'] {
		background: #ff7354;
	}

	.bar[data-band='mid'] {
		background: #ffb31a;
	}

	.bar[data-band='late'] {
		background: #8de51e;
	}

	.ticks {
		position: relative;
		height: 1.4rem;
	}

	.ticks span {
		position: absolute;
		top: 0.4rem;
		transform: translateX(-50%);
		font-size: 0.56rem;
		color: #7f95a7;
		white-space: nowrap;
	}

	.ticks span:first-child {
		transform: translateX(0);
	}

	.ticks span:last-child {
		transform: translateX(-100%);
	}
</style>

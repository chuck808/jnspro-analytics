<script lang="ts">
	import type { PeakSpeedSupportingSessionsModel } from './peakSpeedSupportingSessions';

	let { evidence }: { evidence: PeakSpeedSupportingSessionsModel } = $props();

	function kmh(speedMs: number): string {
		return `${(speedMs * 3.6).toFixed(1)} km/h`;
	}

	function dateLabel(timestamp: string): string {
		return new Intl.DateTimeFormat('en', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		}).format(new Date(timestamp));
	}
</script>

<section class="supporting-proof" aria-labelledby="peak-speed-supporting-title">
	<div class="section-heading">
		<div>
			<p class="eyebrow">Session-level proof</p>
			<h2 id="peak-speed-supporting-title">Validated-speed sessions</h2>
		</div>
		<span class="count">{evidence.sessions.length} supporting</span>
	</div>

	<p class="section-copy">
		Only sessions already admitted by the Peak Speed evidence model appear here. Unsupported account
		sessions cannot enter this proof.
	</p>

	<details open={evidence.sessions.length <= 4}>
		<summary>Trace the supporting sessions</summary>
		<div class="session-list">
			{#each evidence.sessions as session}
				<a class="session-row" href={`/sessions/${session.id}`}>
					<div class="session-identity">
						<strong>{dateLabel(session.timestamp)}</strong>
						<span>Open session evidence</span>
					</div>
					<div class="measurements">
						<span><small>Best</small>{kmh(session.bestSpeedMs)}</span>
						{#if session.averageSpeedMs !== null}
							<span><small>Average · supporting only</small>{kmh(session.averageSpeedMs)}</span>
						{/if}
					</div>
					{#if session.inDirectionComparison}
						<span class="badge">Direction evidence</span>
					{:else}
						<span class="badge measured">Measured only</span>
					{/if}
				</a>
			{/each}
		</div>
	</details>
</section>

<style>
	.supporting-proof {
		border: 1px solid #1d3449;
		border-radius: 0.9rem;
		padding: 1rem 1.1rem;
		background: linear-gradient(180deg, rgba(10, 27, 43, 0.98), rgba(6, 18, 30, 0.98));
		color: #f7fbff;
	}

	.section-heading,
	.session-row,
	.measurements {
		display: flex;
		align-items: center;
	}

	.section-heading {
		justify-content: space-between;
		gap: 1rem;
	}

	.eyebrow {
		margin: 0 0 0.2rem;
		font-size: 0.58rem;
		font-weight: 800;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: #ff7555;
	}

	h2 {
		margin: 0;
		font-size: 1rem;
		letter-spacing: -0.02em;
	}

	.count,
	.badge {
		border-radius: 999px;
		padding: 0.3rem 0.55rem;
		font-size: 0.55rem;
		font-weight: 750;
		white-space: nowrap;
	}

	.count {
		background: rgba(255, 117, 85, 0.12);
		color: #ffc0b2;
	}

	.section-copy {
		margin: 0.65rem 0 0.9rem;
		font-size: 0.68rem;
		line-height: 1.55;
		color: #a6b7c5;
	}

	details {
		border-top: 1px solid #1b3449;
		padding-top: 0.85rem;
	}

	summary {
		cursor: pointer;
		font-size: 0.65rem;
		font-weight: 750;
		color: #dce8f2;
	}

	.session-list {
		display: grid;
		gap: 0.45rem;
		margin-top: 0.85rem;
	}

	.session-row {
		gap: 1rem;
		justify-content: space-between;
		padding: 0.75rem 0.85rem;
		border: 1px solid #1b3449;
		border-radius: 0.7rem;
		background: rgba(7, 20, 32, 0.7);
		color: inherit;
		text-decoration: none;
	}

	.session-row:hover,
	.session-row:focus-visible {
		border-color: #75473f;
	}

	.session-identity {
		display: grid;
		gap: 0.15rem;
		min-width: 9rem;
	}

	.session-identity strong { font-size: 0.68rem; }
	.session-identity span,
	small {
		font-size: 0.55rem;
		color: #71889b;
	}

	.measurements {
		gap: 1.25rem;
		margin-left: auto;
	}

	.measurements span {
		display: grid;
		gap: 0.1rem;
		font-size: 0.65rem;
		font-weight: 750;
		text-align: right;
	}

	.badge {
		background: rgba(56, 217, 202, 0.13);
		color: #7de7dc;
	}

	.badge.measured {
		background: rgba(127, 149, 167, 0.14);
		color: #a6b7c5;
	}

	@media (max-width: 720px) {
		.session-row {
			align-items: flex-start;
			flex-direction: column;
		}

		.measurements {
			margin-left: 0;
			width: 100%;
			justify-content: space-between;
		}

		.measurements span {
			text-align: left;
		}
	}
</style>

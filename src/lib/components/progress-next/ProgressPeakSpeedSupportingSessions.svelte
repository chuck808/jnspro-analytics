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
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 1rem;
		padding: 1.25rem;
		background: var(--color-surface, #fff);
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

	.eyebrow,
	.section-copy,
	.session-identity span,
	small {
		color: var(--color-text-muted, #6b7280);
	}

	.eyebrow {
		margin: 0 0 0.2rem;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	h2 {
		margin: 0;
		font-size: 1.15rem;
	}

	.count,
	.badge {
		border-radius: 999px;
		padding: 0.3rem 0.6rem;
		font-size: 0.75rem;
		font-weight: 700;
		white-space: nowrap;
	}

	.count {
		background: var(--color-surface-subtle, #f3f4f6);
	}

	.section-copy {
		margin: 0.65rem 0 1rem;
		font-size: 0.9rem;
		line-height: 1.5;
	}

	details {
		border-top: 1px solid var(--color-border, #e5e7eb);
		padding-top: 0.85rem;
	}

	summary {
		cursor: pointer;
		font-weight: 700;
	}

	.session-list {
		display: grid;
		gap: 0.65rem;
		margin-top: 0.85rem;
	}

	.session-row {
		gap: 1rem;
		justify-content: space-between;
		padding: 0.8rem;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 0.75rem;
		color: inherit;
		text-decoration: none;
	}

	.session-row:hover,
	.session-row:focus-visible {
		border-color: currentColor;
	}

	.session-identity {
		display: grid;
		gap: 0.15rem;
		min-width: 9rem;
	}

	.session-identity span,
	small {
		font-size: 0.75rem;
	}

	.measurements {
		gap: 1.25rem;
		margin-left: auto;
	}

	.measurements span {
		display: grid;
		gap: 0.1rem;
		font-weight: 700;
		text-align: right;
	}

	.badge {
		background: #ecfdf5;
		color: #047857;
	}

	.badge.measured {
		background: #f3f4f6;
		color: #4b5563;
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

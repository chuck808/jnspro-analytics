<script lang="ts">
	import type { ReactionSupportingSessionsModel } from './reactionSupportingSessions';

	let { evidence }: { evidence: ReactionSupportingSessionsModel } = $props();

	function reactionValue(value: number | null) {
		return value === null ? '—' : `${(value / 1000).toFixed(3)}s`;
	}

	function dateLabel(value: string) {
		return new Date(value).toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}
</script>

<section class="supporting-sessions" aria-label="Sessions behind Reaction evidence">
	<header>
		<div>
			<p>Supporting sessions</p>
			<h2>See the sessions behind the evidence</h2>
			<span>
				Direction badges mark the exact evidence windows already used by the Reaction and
				repeatability models. A session can support one without supporting the other.
			</span>
		</div>
		<div class="window-summary">
			<strong>{evidence.reactionDirectionSessionIds.length}</strong>
			<span>Reaction direction</span>
			<strong>{evidence.repeatabilityDirectionSessionIds.length}</strong>
			<span>Repeatability direction</span>
		</div>
	</header>

	<div class="session-list">
		{#each evidence.sessions as session}
			<a class="session-row" href={`/sessions/${session.id}`}>
				<div class="session-date">
					<strong>{dateLabel(session.timestamp)}</strong>
					<span>Open session →</span>
				</div>

				<dl>
					<div>
						<dt>Average</dt>
						<dd>{reactionValue(session.averageReactionMs)}</dd>
					</div>
					<div>
						<dt>Best</dt>
						<dd>{reactionValue(session.bestReactionMs)}</dd>
					</div>
					<div>
						<dt>Reaction CV</dt>
						<dd>{session.reactionCv === null ? '—' : `${session.reactionCv.toFixed(1)}%`}</dd>
					</div>
				</dl>

				<div class="support-badges" aria-label="Evidence supported by this session">
					{#if session.supportsReactionDirection}
						<span class="earned">Reaction direction</span>
					{:else}
						<span>Reaction history</span>
					{/if}

					{#if session.supportsRepeatabilityDirection}
						<span class="earned">Repeatability direction</span>
					{:else if session.supportsRepeatability}
						<span>Repeatability measured</span>
					{:else}
						<span class="unavailable">No repeatability measure</span>
					{/if}
				</div>
			</a>
		{/each}
	</div>
</section>

<style>
	.supporting-sessions {
		margin-top: 0.75rem;
		padding: 1rem 1.1rem;
		border: 1px solid #1d3449;
		border-radius: 0.9rem;
		background: linear-gradient(180deg, rgba(10, 27, 43, 0.98), rgba(6, 18, 30, 0.98));
	}

	.supporting-sessions > header {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 1rem;
	}

	header p {
		margin: 0;
		font-size: 0.58rem;
		font-weight: 800;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: #4ba3ff;
	}

	header h2 {
		margin: 0.25rem 0 0;
		font-size: 1rem;
		letter-spacing: -0.02em;
	}

	header div > span {
		display: block;
		max-width: 44rem;
		margin-top: 0.35rem;
		font-size: 0.68rem;
		line-height: 1.5;
		color: #93a8b9;
	}

	.window-summary {
		display: grid;
		grid-template-columns: auto auto;
		gap: 0.2rem 0.55rem;
		align-items: baseline;
		min-width: 12rem;
		padding: 0.65rem 0.75rem;
		border: 1px solid #1b3449;
		border-radius: 0.65rem;
		background: rgba(7, 20, 32, 0.7);
	}

	.window-summary strong {
		font-size: 0.72rem;
		color: #dfffb4;
	}

	.window-summary span {
		margin: 0;
		font-size: 0.52rem;
		color: #7f95a7;
	}

	.session-list {
		display: grid;
		gap: 0.45rem;
		margin-top: 0.9rem;
	}

	.session-row {
		display: grid;
		grid-template-columns: minmax(9rem, 0.7fr) minmax(18rem, 1fr) minmax(18rem, 1.2fr);
		gap: 1rem;
		align-items: center;
		padding: 0.7rem 0.8rem;
		border: 1px solid #1b3449;
		border-radius: 0.7rem;
		background: rgba(7, 20, 32, 0.7);
		color: inherit;
		text-decoration: none;
	}

	.session-row:hover {
		border-color: #315a79;
		background: rgba(11, 31, 48, 0.9);
	}

	.session-date strong,
	.session-date span {
		display: block;
	}

	.session-date strong {
		font-size: 0.68rem;
	}

	.session-date span {
		margin-top: 0.2rem;
		font-size: 0.52rem;
		color: #6f8799;
	}

	dl {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.45rem;
		margin: 0;
	}

	dt {
		font-size: 0.48rem;
		color: #6f8799;
	}

	dd {
		margin: 0.15rem 0 0;
		font-size: 0.62rem;
		font-weight: 750;
		color: #dce8f2;
	}

	.support-badges {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: 0.35rem;
	}

	.support-badges span {
		padding: 0.28rem 0.45rem;
		border: 1px solid #274158;
		border-radius: 999px;
		font-size: 0.48rem;
		font-weight: 700;
		color: #8298aa;
	}

	.support-badges .earned {
		border-color: rgba(141, 229, 30, 0.28);
		background: rgba(141, 229, 30, 0.08);
		color: #dfffb4;
	}

	.support-badges .unavailable {
		border-style: dashed;
		color: #60788c;
	}

	@media (max-width: 900px) {
		.supporting-sessions > header {
			align-items: stretch;
			flex-direction: column;
		}

		.session-row {
			grid-template-columns: 1fr;
		}

		.support-badges {
			justify-content: flex-start;
		}
	}

	@media (max-width: 520px) {
		dl {
			grid-template-columns: 1fr;
		}
	}
</style>

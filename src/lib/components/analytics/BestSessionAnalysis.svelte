<script lang="ts">
	interface SessionData {
		sessionId: string;
		timestamp: string;
		techniqueScores: any;
		insightPack: any;
		analysis: any;
	}

	interface Props {
		sessions: SessionData[];
	}

	let { sessions }: Props = $props();

	let bestSession = $derived.by(() => {
		if (sessions.length === 0) return null;

		// Find session with highest overall technique score
		const scored = sessions.filter((s) => s.techniqueScores?.overall);
		if (scored.length === 0) return null;

		const best = scored.reduce((prev, current) => {
			return current.techniqueScores.overall > prev.techniqueScores.overall ? current : prev;
		});

		return {
			...best,
			date: new Date(best.timestamp).toLocaleDateString('en-GB', {
				weekday: 'long',
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			}),
			strengths: best.insightPack?.strengths ?? [],
			quality: best.analysis?.intelligence?.sessionQuality ?? null,
			repeatability: best.analysis?.intelligence?.repeatability?.overall ?? null
		};
	});
</script>

{#if bestSession}
	<div class="themed-card rounded-xl p-5">
		<div class="mb-4">
			<div class="mb-2 flex items-center gap-2">
				<span class="text-2xl">🏆</span>
				<h3 class="themed-text-primary text-base font-bold">Best Session Analysis</h3>
			</div>
			<p class="themed-text-subtle text-xs">Insights from your highest-scoring session</p>
		</div>

		<div class="themed-nested-card mb-4 rounded-lg p-4">
			<div class="mb-3 flex items-center justify-between">
				<div>
					<p class="themed-text-subtle text-sm">Session Date</p>
					<p class="themed-text-primary text-base font-semibold">
						{bestSession.date}
					</p>
				</div>
				<div class="text-right">
					<p class="themed-text-subtle text-sm">Overall Score</p>
					<p class="text-3xl font-bold text-[#3de8c8]">
						{bestSession.techniqueScores.overall.toFixed(0)}
					</p>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-3 border-t border-[color:var(--border)] pt-3">
				<div>
					<p class="themed-text-subtle mb-1 text-xs">Session Quality</p>
					<p class="themed-text-primary text-lg font-semibold">
						{bestSession.quality !== null ? bestSession.quality.toFixed(0) : '—'}/100
					</p>
				</div>
				<div>
					<p class="themed-text-subtle mb-1 text-xs">Repeatability</p>
					<p class="themed-text-primary text-lg font-semibold">
						{bestSession.repeatability !== null ? bestSession.repeatability.toFixed(0) : '—'}/100
					</p>
				</div>
			</div>
		</div>

		{#if bestSession.strengths.length > 0}
			<div class="mb-4">
				<h4 class="mb-2 text-xs font-semibold tracking-wider text-[#3de8c8] uppercase">
					💪 What Made This Session Great
				</h4>
				<div class="flex flex-wrap gap-2">
					{#each bestSession.strengths as strength}
						<span
							class="rounded-full border border-[#3de8c8]/30 bg-[#3de8c8]/10 px-3 py-1.5 text-sm text-[#3de8c8]"
						>
							{strength}
						</span>
					{/each}
				</div>
			</div>
		{/if}

		<div class="border-t border-[color:var(--border)] pt-4">
			<p class="themed-text-subtle text-xs">
				💡 <span class="font-semibold">Tip:</span> Review this session to understand what conditions and
				approach led to your best performance. Try to replicate these factors in future training.
			</p>
		</div>

		<div class="mt-3">
			<a
				href="/sessions/{bestSession.sessionId}"
				class="inline-flex items-center gap-2 rounded-lg bg-[color:var(--accent)] px-4 py-2
                       text-sm font-semibold text-[color:var(--bg)] transition-colors hover:bg-[color:var(--accent-dark)]"
			>
				<span>View Full Session</span>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</a>
		</div>
	</div>
{:else}
	<div class="themed-card rounded-xl p-5">
		<p class="themed-text-subtle py-4 text-center text-sm">
			Complete more sessions with full analysis to see your best session breakdown.
		</p>
	</div>
{/if}

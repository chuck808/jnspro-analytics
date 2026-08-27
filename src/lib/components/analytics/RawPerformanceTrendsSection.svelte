<script lang="ts">
	import { scoreConsistency } from '$lib/performance-engine';
	import ProgressTrendChart, { type EvidenceView } from './progress/ProgressTrendChart.svelte';
	import ProgressImprovementBreakdown from './progress/ProgressImprovementBreakdown.svelte';
	import ProgressStartPerformance from './progress/ProgressStartPerformance.svelte';

	interface SessionSummary {
		id: string;
		timestamp: string;
		run_count: number;
		best_reaction_ms: number | null;
		avg_reaction_ms: number | null;
		best_peak_speed_ms: number | null;
		avg_peak_speed_ms: number | null;
		best_max_g?: number | null;
		avg_max_g?: number | null;
		reaction_cv: number | null;
		has_valid_speed: boolean;
	}

	interface Props {
		sessions: SessionSummary[];
		trend: { reaction: number | null; speed: number | null };
		isMobile: boolean;
		onOpenHelp: (key: string) => void;
		goalTargets?: Record<string, any>;
	}

	let { sessions, trend, isMobile, onOpenHelp, goalTargets = {} }: Props = $props();
	let activeView = $state<EvidenceView>('reaction');
	let overallConsistency = $derived(
		scoreConsistency(sessions.map((session) => session.avg_reaction_ms).filter((value): value is number => value !== null))
	);
</script>

{#if sessions.length >= 3}
	<div class="space-y-4">
		<div class="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(18rem,0.68fr)]">
			<ProgressTrendChart
				{sessions}
				{activeView}
				{isMobile}
				{trend}
				{overallConsistency}
				{goalTargets}
				{onOpenHelp}
			/>
			<ProgressImprovementBreakdown
				{activeView}
				onSelect={(view) => (activeView = view)}
				{trend}
				{overallConsistency}
			/>
		</div>
		<ProgressStartPerformance {sessions} />
	</div>
{/if>
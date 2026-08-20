<script lang="ts">
	import { getContext } from 'svelte';
	import DeepDiveRunDiagnostics from '$lib/components/session/DeepDiveRunDiagnostics.svelte';

	let { data, children }: { data: any; children: any } = $props();
	const ctx: any = getContext('session');

	let selectedRun = $derived(ctx.selectedRun);
	let performanceAnalysis = $derived(ctx.performanceAnalysis);
	let techniqueScoreBreakdown = $derived(ctx.techniqueScoreBreakdown);
	let coachDiagnostics = $derived(ctx.coachDiagnostics);
	let jerkProfile = $derived(ctx.jerkProfile);
	let riderLevel = $derived(ctx.riderLevel);
	let isMobile = $derived(ctx.isMobile);
</script>

{@render children()}

{#if selectedRun}
	<div class="mt-5">
		<DeepDiveRunDiagnostics
			{selectedRun}
			{performanceAnalysis}
			{techniqueScoreBreakdown}
			{coachDiagnostics}
			{jerkProfile}
			{riderLevel}
			{isMobile}
			onOpenHelp={(key: string) => ctx.openHelp(key)}
		/>
	</div>
{/if}

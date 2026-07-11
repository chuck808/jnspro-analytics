<script lang="ts">
	import type { CoachDiagnostic } from '$lib/performance-engine/coachDiagnostics';

	interface Props {
		diagnostics: CoachDiagnostic[];
		compact?: boolean;
	}

	let { diagnostics, compact = false }: Props = $props();

	function getToneColor(tone: 'positive' | 'warning' | 'neutral') {
		if (tone === 'positive') return '#3de8c8';
		if (tone === 'warning') return '#ff6b3d';
		return '#f5a623';
	}

	function getToneIcon(tone: 'positive' | 'warning' | 'neutral') {
		if (tone === 'positive') return '✓';
		if (tone === 'warning') return '⚠';
		return '○';
	}
</script>

<div class="themed-card space-y-4 rounded-xl p-5">
	<div class="flex items-center justify-between">
		<h3 class="themed-text-primary text-base font-bold">Coach Insights</h3>
		<span class="themed-text-subtle themed-nested-card rounded px-2 py-1 text-xs">
			{diagnostics.length} insight{diagnostics.length !== 1 ? 's' : ''}
		</span>
	</div>

	{#if diagnostics.length === 0}
		<div class="py-8 text-center">
			<p class="themed-text-secondary text-sm">No coaching insights available</p>
			<p class="themed-text-subtle mt-1 text-xs">Complete more runs to generate insights</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each diagnostics as diagnostic}
				{@const toneColor = getToneColor(diagnostic.tone)}
				{@const toneIcon = getToneIcon(diagnostic.tone)}

				<div
					class="themed-nested-card rounded-lg border-l-4 p-4 transition-all hover:shadow-md"
					style="border-left-color: {toneColor};"
				>
					<!-- Header -->
					<div class="mb-3 flex items-start justify-between gap-3">
						<div class="flex flex-1 items-center gap-2">
							<span
								class="flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold"
								style="background-color: {toneColor}20; color: {toneColor};"
							>
								{toneIcon}
							</span>
							<h4 class="themed-text-primary text-sm font-semibold">{diagnostic.title}</h4>
						</div>
					</div>

					<!-- Summary -->
					<p class="themed-text-secondary mb-3 text-sm leading-relaxed">
						{diagnostic.summary}
					</p>

					<!-- Evidence -->
					{#if diagnostic.evidence && diagnostic.evidence.length > 0 && !compact}
						<div class="mb-3">
							<p class="themed-text-subtle mb-2 text-xs font-semibold tracking-wider uppercase">
								Evidence:
							</p>
							<ul class="space-y-1.5">
								{#each diagnostic.evidence as evidence}
									<li class="themed-text-secondary flex items-start gap-2 text-xs">
										<span class="themed-accent mt-0.5">•</span>
										<span class="flex-1">{evidence}</span>
									</li>
								{/each}
							</ul>
						</div>
					{/if}

					<!-- Prescription -->
					{#if diagnostic.prescription && diagnostic.prescription.length > 0}
						<div class="border-t border-[color:var(--border)] pt-3">
							<p
								class="mb-2 text-xs font-semibold tracking-wider uppercase"
								style="color: {toneColor};"
							>
								Next Steps:
							</p>
							<ul class="space-y-1.5">
								{#each diagnostic.prescription as action}
									<li class="themed-text-secondary flex items-start gap-2 text-xs">
										<span style="color: {toneColor};" class="mt-0.5">→</span>
										<span class="flex-1">{action}</span>
									</li>
								{/each}
							</ul>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

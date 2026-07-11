<script lang="ts">
	import type { ReportSection, ReportDetailLevel } from '$lib/report-engine/types';
	import ReportMetricGrid from './ReportMetricGrid.svelte';
	import ReportChart from './ReportChart.svelte';

	let {
		section,
		detailLevel
	}: {
		section: ReportSection;
		detailLevel: ReportDetailLevel;
	} = $props();

	// Accent colour per section type — used for the left rule and label
	let accent = $derived(
		section.type === 'executive-summary'
			? '#f5a623'
			: section.type === 'key-findings'
				? '#1a1410'
				: section.type === 'session-quality'
					? '#1a1410'
					: section.type === 'technique-analysis'
						? '#1a1410'
						: section.type === 'recommendations'
							? '#f5a623'
							: section.type === 'watch-for'
								? '#6b5f4d'
								: section.type === 'data-quality'
									? '#9a8f7a'
									: section.type === 'progress-trends'
										? '#1a1410'
										: '#9a8f7a'
	);

	// Only executive summary and recommendations get amber treatment
	let isHighlighted = $derived(
		section.type === 'executive-summary' || section.type === 'recommendations'
	);

	// Data quality is visually de-emphasised
	let isSubdued = $derived(section.type === 'data-quality' || section.type === 'appendix');

	// Watch-for gets a distinct forward-looking treatment
	let isWatchFor = $derived(section.type === 'watch-for');

	let hasContent = $derived(
		section.content.length > 0 ||
			(section.metrics && section.metrics.length > 0) ||
			(section.charts && section.charts.length > 0)
	);

	// Parse tone prefix from content lines
	function getTone(line: string): 'warning' | 'positive' | 'neutral' | 'plain' {
		if (line.startsWith('⚠')) return 'warning';
		if (line.startsWith('✓')) return 'positive';
		if (line.startsWith('→') || line.startsWith('•')) return 'neutral';
		if (line.startsWith('   ')) return 'plain'; // indented
		return 'plain';
	}

	function stripPrefix(line: string): string {
		return line.replace(/^[⚠✓→•]\s*/, '').trim();
	}
</script>

{#if hasContent}
	<section class="report-section border-b border-[#ede8e0] py-7 {isSubdued ? 'opacity-75' : ''}">
		<!-- Section label -->
		<div class="mb-4 flex items-center gap-3">
			<!-- Left rule — amber for highlighted, subtle for others -->
			<div
				class="h-4 w-0.5 flex-shrink-0 rounded-full"
				style="background:{accent}; opacity:{isSubdued ? 0.4 : 1}"
			></div>
			<h2 class="section-label" style="color:{isSubdued ? '#c8bfaf' : '#9a8f7a'}">
				{section.title}
			</h2>
		</div>

		<!-- Watch-for: distinct callout treatment -->
		{#if isWatchFor && section.content.length > 0}
			<div class="rounded-lg border border-[#ede8e0] bg-[#faf8f5] p-5">
				<p class="mb-3 text-[10px] font-bold tracking-widest text-[#9a8f7a] uppercase">
					Indicators to monitor next session
				</p>
				<ul class="space-y-2.5">
					{#each section.content as line}
						{#if line.trim().length > 0 && !line.startsWith('Indicators')}
							<li class="flex items-start gap-3">
								<span class="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-[#f5a623]"></span>
								<p class="text-sm leading-relaxed text-[#3d3530]">{line.replace(/^•\s*/, '')}</p>
							</li>
						{/if}
					{/each}
				</ul>
			</div>

			<!-- Key findings: insight cards with tone -->
		{:else if section.type === 'key-findings' && section.content.length > 0}
			{@const pairs = (() => {
				// Group lines into {prefix, title, body} pairs
				// Pattern: "⚠ Title" followed by "   body text"
				const result: { tone: string; title: string; body: string }[] = [];
				let i = 0;
				const lines = section.content.filter((l) => l.trim().length > 0);
				while (i < lines.length) {
					const line = lines[i];
					const tone = getTone(line);
					if (tone !== 'plain') {
						const title = stripPrefix(line);
						const nextLine = lines[i + 1];
						const body = nextLine && nextLine.startsWith('   ') ? nextLine.trim() : '';
						result.push({ tone, title, body });
						i += body ? 2 : 1;
					} else {
						result.push({ tone: 'plain', title: line, body: '' });
						i++;
					}
				}
				return result;
			})()}
			<div class="space-y-3">
				{#each pairs as item}
					{@const borderCol =
						item.tone === 'warning'
							? '#ff6b3d'
							: item.tone === 'positive'
								? '#3de8c8'
								: item.tone === 'neutral'
									? '#f5a623'
									: '#ede8e0'}
					{@const dotCol =
						item.tone === 'warning'
							? '#ff6b3d'
							: item.tone === 'positive'
								? '#3de8c8'
								: item.tone === 'neutral'
									? '#f5a623'
									: '#c8bfaf'}
					<div
						class="flex gap-3 rounded-lg border-l-2 bg-[#faf8f5] p-4"
						style="border-color:{borderCol}"
					>
						<div class="min-w-0 flex-1">
							<p class="text-sm leading-snug font-semibold text-[#1a1410]">{item.title}</p>
							{#if item.body}
								<p class="mt-1 text-sm leading-relaxed text-[#6b5f4d]">{item.body}</p>
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<!-- Standard prose sections -->
		{:else if section.content.length > 0}
			<div class="space-y-2">
				{#each section.content as line}
					{#if line.trim().length === 0}
						<!-- skip blank lines -->
					{:else if line.startsWith('---')}
						<p class="pt-3 pb-1 text-[10px] font-bold tracking-widest text-[#9a8f7a] uppercase">
							{line.replace(/^-+\s*/, '').replace(/\s*-+$/, '')}
						</p>
					{:else if line.startsWith('⚠')}
						<div class="flex items-start gap-2">
							<span class="mt-0.5 flex-shrink-0 text-sm font-bold text-[#ff6b3d]">⚠</span>
							<p class="text-sm leading-relaxed font-medium text-[#3d3530]">
								{stripPrefix(line)}
							</p>
						</div>
					{:else if line.startsWith('✓')}
						<div class="flex items-start gap-2">
							<span class="mt-0.5 flex-shrink-0 text-sm font-bold text-[#2db89e]">✓</span>
							<p class="text-sm leading-relaxed text-[#3d3530]">{stripPrefix(line)}</p>
						</div>
					{:else if line.startsWith('→') || line.startsWith('•')}
						<div class="flex items-start gap-2 pl-1">
							<span class="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-[#c8bfaf]"></span>
							<p class="text-sm leading-relaxed text-[#6b5f4d]">{stripPrefix(line)}</p>
						</div>
					{:else if line.startsWith('   ')}
						<p class="pl-5 text-xs leading-relaxed text-[#9a8f7a] italic">{line.trim()}</p>
					{:else}
						<p class="text-sm leading-relaxed text-[#3d3530]">{line}</p>
					{/if}
				{/each}
			</div>
		{/if}

		<!-- Metrics grid -->
		{#if section.metrics && section.metrics.length > 0}
			<div class="mt-5">
				<ReportMetricGrid metrics={section.metrics} />
			</div>
		{/if}

		<!-- Actual charts -->
		{#if section.charts && section.charts.length > 0}
			<div class="mt-4 space-y-2">
				{#each section.charts.filter((c) => c.includeByDefault) as chart}
					<ReportChart
						title={chart.title}
						description={chart.description}
						chartType={chart.chartType}
						data={chart.data ?? []}
					/>
				{/each}
			</div>
		{/if}
	</section>
{/if}

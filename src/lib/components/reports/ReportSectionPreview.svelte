<script lang="ts">
    import type { ReportSection, ReportDetailLevel } from '$lib/report-engine/types';
    import ReportMetricGrid from './ReportMetricGrid.svelte';
    import ReportChart from './ReportChart.svelte';

    let {
        section,
        detailLevel,
    }: {
        section:     ReportSection;
        detailLevel: ReportDetailLevel;
    } = $props();

    // Accent colour per section type — used for the left rule and label
    let accent = $derived(
        section.type === 'executive-summary'  ? '#f5a623' :
        section.type === 'key-findings'       ? '#1a1410' :
        section.type === 'session-quality'    ? '#1a1410' :
        section.type === 'technique-analysis' ? '#1a1410' :
        section.type === 'recommendations'    ? '#f5a623' :
        section.type === 'watch-for'          ? '#6b5f4d' :
        section.type === 'data-quality'       ? '#9a8f7a' :
        section.type === 'progress-trends'    ? '#1a1410' :
        '#9a8f7a'
    );

    // Only executive summary and recommendations get amber treatment
    let isHighlighted = $derived(
        section.type === 'executive-summary' ||
        section.type === 'recommendations'
    );

    // Data quality is visually de-emphasised
    let isSubdued = $derived(
        section.type === 'data-quality' ||
        section.type === 'appendix'
    );

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
<section class="report-section py-7 border-b border-[#ede8e0] {isSubdued ? 'opacity-75' : ''}">

    <!-- Section label -->
    <div class="flex items-center gap-3 mb-4">
        <!-- Left rule — amber for highlighted, subtle for others -->
        <div class="w-0.5 h-4 rounded-full flex-shrink-0"
             style="background:{accent}; opacity:{isSubdued ? 0.4 : 1}">
        </div>
        <h2 class="section-label" style="color:{isSubdued ? '#c8bfaf' : '#9a8f7a'}">
            {section.title}
        </h2>
    </div>

    <!-- Watch-for: distinct callout treatment -->
    {#if isWatchFor && section.content.length > 0}
        <div class="bg-[#faf8f5] border border-[#ede8e0] rounded-lg p-5">
            <p class="text-[10px] font-bold uppercase tracking-widest text-[#9a8f7a] mb-3">
                Indicators to monitor next session
            </p>
            <ul class="space-y-2.5">
                {#each section.content as line}
                    {#if line.trim().length > 0 && !line.startsWith('Indicators')}
                        <li class="flex items-start gap-3">
                            <span class="w-1 h-1 rounded-full bg-[#f5a623] flex-shrink-0 mt-2"></span>
                            <p class="text-sm text-[#3d3530] leading-relaxed">{line.replace(/^•\s*/, '')}</p>
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
            const lines = section.content.filter(l => l.trim().length > 0);
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
                    item.tone === 'warning'  ? '#ff6b3d' :
                    item.tone === 'positive' ? '#3de8c8' :
                    item.tone === 'neutral'  ? '#f5a623' :
                    '#ede8e0'}
                {@const dotCol =
                    item.tone === 'warning'  ? '#ff6b3d' :
                    item.tone === 'positive' ? '#3de8c8' :
                    item.tone === 'neutral'  ? '#f5a623' :
                    '#c8bfaf'}
                <div class="flex gap-3 p-4 rounded-lg bg-[#faf8f5] border-l-2"
                     style="border-color:{borderCol}">
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold text-[#1a1410] leading-snug">{item.title}</p>
                        {#if item.body}
                            <p class="text-sm text-[#6b5f4d] mt-1 leading-relaxed">{item.body}</p>
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
                    <p class="text-[10px] font-bold uppercase tracking-widest text-[#9a8f7a] pt-3 pb-1">
                        {line.replace(/^-+\s*/, '').replace(/\s*-+$/, '')}
                    </p>
                {:else if line.startsWith('⚠')}
                    <div class="flex items-start gap-2">
                        <span class="text-[#ff6b3d] text-sm font-bold flex-shrink-0 mt-0.5">⚠</span>
                        <p class="text-sm font-medium text-[#3d3530] leading-relaxed">
                            {stripPrefix(line)}
                        </p>
                    </div>
                {:else if line.startsWith('✓')}
                    <div class="flex items-start gap-2">
                        <span class="text-[#2db89e] text-sm font-bold flex-shrink-0 mt-0.5">✓</span>
                        <p class="text-sm text-[#3d3530] leading-relaxed">{stripPrefix(line)}</p>
                    </div>
                {:else if line.startsWith('→') || line.startsWith('•')}
                    <div class="flex items-start gap-2 pl-1">
                        <span class="w-1 h-1 rounded-full bg-[#c8bfaf] flex-shrink-0 mt-2"></span>
                        <p class="text-sm text-[#6b5f4d] leading-relaxed">{stripPrefix(line)}</p>
                    </div>
                {:else if line.startsWith('   ')}
                    <p class="text-xs text-[#9a8f7a] leading-relaxed pl-5 italic">{line.trim()}</p>
                {:else}
                    <p class="text-sm text-[#3d3530] leading-relaxed">{line}</p>
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
            {#each section.charts.filter(c => c.includeByDefault) as chart}
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

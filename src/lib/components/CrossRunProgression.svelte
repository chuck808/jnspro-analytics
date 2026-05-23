<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import type { Chart as ChartType } from 'chart.js';
    import { getSessionRunLink } from '$lib/utils/deepLinks';

    interface ProgressionDataPoint {
        runNumber: number;
        reactionMs: number | null;
        maxG: number | null;
        peakSpeedKmh: number | null;
        techniqueScore: number | null;
    }

    let { 
        data = [] as ProgressionDataPoint[],
        selectedMetric = $bindable('reactionMs'),
        isMobile = false,
        sessionId = undefined,
    }: { 
        data: ProgressionDataPoint[];
        selectedMetric?: string;
        isMobile?: boolean;
        sessionId?: string;
    } = $props();

    let chartEl: HTMLCanvasElement | null = $state(null);
    let chartInstance: ChartType | null = $state(null);

    const metrics = [
        { key: 'reactionMs', label: 'Reaction Time', unit: 's', color: '#f5a623', divisor: 1000, decimals: 3 },
        { key: 'maxG', label: 'Max G-Force', unit: 'G', color: '#ff6b3d', divisor: 1, decimals: 2 },
        { key: 'peakSpeedKmh', label: 'Peak Speed', unit: 'km/h', color: '#3de8c8', divisor: 1, decimals: 1 },
        { key: 'techniqueScore', label: 'Technique Score', unit: '/100', color: '#9a8f7a', divisor: 1, decimals: 0 },
    ];

    const currentMetric = $derived(metrics.find(m => m.key === selectedMetric) ?? metrics[0]);

    async function renderChart() {
        if (!chartEl || data.length === 0) return;

        const { Chart, registerables } = await import('chart.js');
        Chart.register(...registerables);

        if (chartInstance) {
            chartInstance.destroy();
        }

        const labels = data.map(d => `Run ${d.runNumber}`);
        const values = data.map(d => {
            const val = d[selectedMetric as keyof ProgressionDataPoint];
            return typeof val === 'number' ? val / currentMetric.divisor : null;
        });

        // Read current theme colours from CSS variables so chart responds to light/dark
        const style       = getComputedStyle(document.documentElement);
        const themeGrid   = style.getPropertyValue('--theme-border').trim()   || '#221c18';
        const themeTick   = style.getPropertyValue('--theme-text-secondary').trim() || '#9a8f7a';
        const themeSurface = style.getPropertyValue('--theme-surface').trim() || '#131010';
        const themeText   = style.getPropertyValue('--theme-text-primary').trim()   || '#f0ece4';
        const themeBg     = style.getPropertyValue('--theme-bg').trim()       || '#0a0809';

        chartInstance = new Chart(chartEl, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: currentMetric.label,
                    data: values,
                    borderColor: currentMetric.color,
                    backgroundColor: `${currentMetric.color}20`,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: currentMetric.color,
                    pointBorderColor: themeBg,
                    pointBorderWidth: 2,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                onClick: sessionId ? (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const runNumber = data[index].runNumber;
                        const link = getSessionRunLink(sessionId, runNumber);
                        goto(link);
                    }
                } : undefined,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: themeSurface,
                        titleColor: themeText,
                        bodyColor: themeTick,
                        borderColor: themeGrid,
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: (context) => {
                                const val = context.parsed.y;
                                return val !== null 
                                    ? `${currentMetric.label}: ${val.toFixed(currentMetric.decimals)}${currentMetric.unit}`
                                    : 'No data';
                            }
                        }
                    },
                },
                scales: {
                    x: {
                        grid: { color: themeGrid },
                        ticks: { 
                            color: themeTick,
                            font: { size: isMobile ? 10 : 11 }
                        },
                        title: { 
                            display: !isMobile, 
                            text: 'Run Number', 
                            color: themeTick 
                        },
                    },
                    y: {
                        grid: { color: themeGrid },
                        ticks: { 
                            color: currentMetric.color,
                            font: { size: isMobile ? 10 : 11 },
                            callback: (val) => `${val}${currentMetric.unit}`
                        },
                        title: { 
                            display: !isMobile, 
                            text: currentMetric.label, 
                            color: currentMetric.color 
                        },
                    },
                },
            },
        });
    }

    $effect(() => {
        selectedMetric;
        data;
        isMobile;
        renderChart();
    });

    onMount(() => {
        return () => {
            if (chartInstance) chartInstance.destroy();
        };
    });

    // Analyze trends
    const trend = $derived.by(() => {
        if (data.length < 2) return null;
        
        const values = data
            .map(d => d[selectedMetric as keyof ProgressionDataPoint])
            .filter((v): v is number => typeof v === 'number');
        
        if (values.length < 2) return null;

        const first = values[0];
        const last = values[values.length - 1];
        
        // For reaction time, lower is better, so reverse the logic
        const isLowerBetter = selectedMetric === 'reactionMs';
        const percentChange = ((last - first) / first) * 100;
        const improving = isLowerBetter ? percentChange < 0 : percentChange > 0;
        
        return {
            improving,
            percentChange: Math.abs(percentChange),
            trend: improving ? 'improving' : 'degrading',
        };
    });
</script>

<div class="themed-card rounded-xl p-5">
    <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
            <h3 class="text-sm font-semibold themed-text-primary mb-1">📊 Cross-Run Progression</h3>
            <p class="text-xs themed-text-subtle">Track performance trends across all runs in this session</p>
        </div>
        
        <!-- Metric Selector -->
        <div class="flex gap-2 flex-wrap">
            {#each metrics as metric}
                <button
                    onclick={() => selectedMetric = metric.key}
                    class="px-3 py-1.5 text-xs rounded-lg border transition-colors
                           focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[color:var(--theme-surface)]
                           {selectedMetric === metric.key
                               ? 'bg-[#f5a623]/10 border-[#f5a623]/40 text-[#f5a623]'
                               : 'themed-nested-card border-[color:var(--theme-border)] themed-text-secondary hover:border-[#f5a623]/20'}"
                >
                    {metric.label}
                </button>
            {/each}
        </div>
    </div>

    <!-- Chart -->
    <div class="{isMobile ? 'h-48' : 'h-64'}">
        <canvas bind:this={chartEl}></canvas>
    </div>

    <!-- Trend Insight -->
    {#if trend}
        <div class="mt-4 flex items-start gap-3 p-3 themed-nested-card rounded-lg border border-[color:var(--theme-border)]">
            <svg class="w-4 h-4 flex-shrink-0 mt-0.5 {trend.improving ? 'text-[#3de8c8]' : 'text-[#f5a623]'}" 
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {#if trend.improving}
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                {:else}
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"/>
                {/if}
            </svg>
            <div class="flex-1">
                <p class="text-xs font-semibold {trend.improving ? 'text-[#3de8c8]' : 'text-[#f5a623]'} mb-0.5">
                    {trend.improving ? '✓ Improving' : '⚠ Degrading'}
                </p>
                <p class="text-xs themed-text-secondary">
                    {currentMetric.label} {trend.improving ? 'improved' : 'degraded'} by {trend.percentChange.toFixed(1)}% from first to last run
                    {#if !trend.improving && selectedMetric !== 'techniqueScore'}
                        — possible fatigue detected
                    {/if}
                </p>
            </div>
        </div>
    {/if}
</div>
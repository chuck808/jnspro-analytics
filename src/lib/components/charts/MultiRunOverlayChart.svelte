<script lang="ts">
    import { onMount } from 'svelte';
    import { detectMultiRunDivergence, type DivergenceAnalysis } from '$lib/analytics/divergenceDetection';

    interface RunData {
        runNumber: number;
        data: number[];
        elapsedMs: number;
        color: string;
    }

    interface Props {
        runs: RunData[];
        metric?: 'gForce' | 'speed' | 'jerk';
        height?: string;
    }

    let { 
        runs,
        metric = 'gForce',
        height = 'h-64'
    }: Props = $props();

    let chartCanvas: HTMLCanvasElement;
    let chart: any = null;

    // Predefined colors for up to 4 runs
    const CHART_COLORS = [
        '#3de8c8', // Teal
        '#f5a623', // Amber
        '#ff6b3d', // Orange
        '#9b87f5', // Purple
    ];

    // Metric configuration
    const metricConfig = {
        gForce: {
            label: 'G-Force',
            unit: 'G',
            color: '#f5a623',
        },
        speed: {
            label: 'Speed',
            unit: 'km/h',
            color: '#ff6b3d',
        },
        jerk: {
            label: 'Jerk',
            unit: 'm/s³',
            color: '#3de8c8',
        },
    };

    // Calculate divergence analysis
    let divergence = $derived.by(() => {
        if (runs.length < 2) return null;
        
        // Use the first run's elapsed time as reference
        const elapsedMs = runs[0].elapsedMs;
        
        const runsData = runs.map(r => ({
            data: r.data,
            label: `Run ${r.runNumber}`,
        }));
        
        return detectMultiRunDivergence(runsData, elapsedMs);
    });

    async function renderChart() {
        if (!chartCanvas || runs.length === 0) return;

        // Destroy existing chart
        if (chart) {
            chart.destroy();
            chart = null;
        }

        // Import Chart.js
        const { Chart, registerables } = await import('chart.js');
        Chart.register(...registerables);

        // Prepare datasets
        const datasets = runs.map((run, idx) => {
            const maxLength = Math.max(...runs.map(r => r.data.length));
            const timePerSample = run.elapsedMs / 1000 / (run.data.length > 1 ? run.data.length - 1 : 1);
            
            return {
                label: `Run ${run.runNumber}`,
                data: run.data,
                borderColor: run.color || CHART_COLORS[idx % CHART_COLORS.length],
                backgroundColor: `${run.color || CHART_COLORS[idx % CHART_COLORS.length]}20`,
                borderWidth: 2,
                fill: false,
                tension: 0.3,
                pointRadius: 0,
                pointHoverRadius: 4,
            };
        });

        // Use longest run for time labels
        const longestRun = runs.reduce((max, r) => r.data.length > max.data.length ? r : max);
        const timePerSample = longestRun.elapsedMs / 1000 / (longestRun.data.length > 1 ? longestRun.data.length - 1 : 1);
        const labels = longestRun.data.map((_, i) => (i * timePerSample).toFixed(2));

        // Create chart
        chart = new Chart(chartCanvas, {
            type: 'line',
            data: {
                labels,
                datasets,
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: '#9a8f7a',
                            font: {
                                size: 11,
                                family: 'Inter, system-ui, sans-serif',
                            },
                            boxWidth: 12,
                            padding: 10,
                            usePointStyle: true,
                        },
                    },
                    tooltip: {
                        backgroundColor: '#131010',
                        titleColor: '#f0ece4',
                        bodyColor: '#9a8f7a',
                        borderColor: '#221c18',
                        borderWidth: 1,
                        padding: 10,
                        displayColors: true,
                        callbacks: {
                            label: function(context: any) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y.toFixed(2);
                                return `${label}: ${value}${metricConfig[metric].unit}`;
                            }
                        }
                    },
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Time (s)',
                            color: '#9a8f7a',
                            font: {
                                size: 11,
                                family: 'Inter, system-ui, sans-serif',
                            },
                        },
                        grid: {
                            color: '#221c18',
                        },
                        ticks: {
                            color: '#9a8f7a',
                            font: {
                                size: 10,
                            },
                            maxTicksLimit: 10,
                        },
                    },
                    y: {
                        title: {
                            display: true,
                            text: `${metricConfig[metric].label} (${metricConfig[metric].unit})`,
                            color: '#9a8f7a',
                            font: {
                                size: 11,
                                family: 'Inter, system-ui, sans-serif',
                            },
                        },
                        grid: {
                            color: '#221c18',
                        },
                        ticks: {
                            color: '#9a8f7a',
                            font: {
                                size: 10,
                            },
                        },
                    },
                },
            },
        });
    }

    onMount(() => {
        renderChart();
        return () => {
            if (chart) {
                chart.destroy();
            }
        };
    });

    // Re-render when runs change
    $effect(() => {
        runs; // Track dependency
        if (chartCanvas) {
            setTimeout(() => renderChart(), 0);
        }
    });
</script>

<div class="bg-[#131010] border border-[#221c18] rounded-xl p-5">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
        <div>
            <h3 class="text-sm font-semibold text-[#f0ece4]">
                📊 Multi-Run Comparison
            </h3>
            <p class="text-xs text-[#6b5f4d] mt-0.5">
                {runs.length} runs overlaid · {metricConfig[metric].label}
            </p>
        </div>
        
        {#if divergence}
            <div class="text-right">
                <p class="text-xs text-[#6b5f4d]">Consistency</p>
                <p class="text-lg font-bold" style="color: {
                    divergence.consistencyScore >= 85 ? '#3de8c8' :
                    divergence.consistencyScore >= 70 ? '#f5a623' :
                    divergence.consistencyScore >= 55 ? '#ffcc44' : '#ff4444'
                }">
                    {Math.round(divergence.consistencyScore)}%
                </p>
            </div>
        {/if}
    </div>

    <!-- Chart -->
    <div class="{height} mb-4">
        <canvas bind:this={chartCanvas}></canvas>
    </div>

    <!-- Divergence Insight -->
    {#if divergence}
        <div class="bg-[#0a0809] rounded-lg p-4 border border-[#221c18]">
            <div class="flex items-start gap-3">
                <span class="text-2xl" aria-hidden="true">
                    {divergence.consistencyScore >= 85 ? '🎯' :
                     divergence.consistencyScore >= 70 ? '✅' :
                     divergence.consistencyScore >= 55 ? '⚠️' : '🔍'}
                </span>
                <div class="flex-1">
                    <p class="text-xs font-semibold text-[#f5a623] mb-1">Analysis</p>
                    <p class="text-sm text-[#9a8f7a]">{divergence.insight}</p>
                    
                    {#if divergence.pairwiseAnalysis.length > 0}
                        <div class="mt-3 space-y-1.5">
                            {#each divergence.pairwiseAnalysis as pa}
                                {@const similarity = pa.analysis.similarityScore}
                                <div class="flex items-center gap-2 text-xs">
                                    <span class="text-[#6b5f4d] min-w-[100px]">
                                        {pa.run1} ↔ {pa.run2}
                                    </span>
                                    <div class="flex-1 bg-[#221c18] rounded-full h-1.5">
                                        <div 
                                            class="h-1.5 rounded-full transition-all"
                                            style="width: {similarity}%; background: {
                                                similarity >= 85 ? '#3de8c8' :
                                                similarity >= 70 ? '#f5a623' : '#ff4444'
                                            }">
                                        </div>
                                    </div>
                                    <span class="text-[#9a8f7a] min-w-[45px] text-right">
                                        {Math.round(similarity)}%
                                    </span>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    {/if}

    <!-- Legend (run colors) -->
    <div class="mt-4 flex flex-wrap gap-3">
        {#each runs as run, idx}
            <div class="flex items-center gap-2">
                <div 
                    class="w-3 h-3 rounded-full"
                    style="background: {run.color || CHART_COLORS[idx % CHART_COLORS.length]}">
                </div>
                <span class="text-xs text-[#9a8f7a]">
                    Run {run.runNumber}
                </span>
            </div>
        {/each}
    </div>
</div>

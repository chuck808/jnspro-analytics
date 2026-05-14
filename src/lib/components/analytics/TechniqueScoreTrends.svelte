<script lang="ts">
    import { onMount } from 'svelte';
    
    interface TechniqueScoreData {
        sessionDate: string;
        sessionNumber: number;
        overall: number | null;
        launchQuality: number | null;
        explosiveness: number | null;
        speedCarry: number | null;
        smoothness: number | null;
        impulseTiming: number | null;
        repeatability: number | null;
    }
    
    interface Props {
        data: TechniqueScoreData[];
        isMobile?: boolean;
    }
    
    let { data, isMobile = false }: Props = $props();
    
    let chartCanvas: HTMLCanvasElement;
    let chart: any = null;
    
    // Dimension visibility toggles
    let visibleDimensions = $state({
        overall: true,
        launchQuality: true,
        explosiveness: true,
        speedCarry: true,
        smoothness: true,
        impulseTiming: true,
        repeatability: true,
    });
    
    const dimensions = [
        { key: 'overall' as const, label: 'Overall', color: '#3de8c8', icon: '⭐' },
        { key: 'launchQuality' as const, label: 'Launch Quality', color: '#4a9eff', icon: '🚀' },
        { key: 'explosiveness' as const, label: 'Explosiveness', color: '#ff6b3d', icon: '💥' },
        { key: 'speedCarry' as const, label: 'Speed Carry', color: '#f5a623', icon: '⚡' },
        { key: 'smoothness' as const, label: 'Smoothness', color: '#9b59b6', icon: '〰️' },
        { key: 'impulseTiming' as const, label: 'Impulse Timing', color: '#e74c3c', icon: '⏱️' },
        { key: 'repeatability' as const, label: 'Repeatability', color: '#1abc9c', icon: '🔁' },
    ];
    
    onMount(() => {
        (async () => {
            const Chart = (await import('chart.js/auto')).default;
            
            if (chartCanvas) {
                const ctx = chartCanvas.getContext('2d');
                if (ctx) {
                    chart = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: data.map(d => d.sessionDate),
                            datasets: dimensions.map(dim => ({
                                label: dim.label,
                                data: data.map(d => d[dim.key]),
                                borderColor: dim.color,
                                backgroundColor: dim.color + '20',
                                borderWidth: dim.key === 'overall' ? 3 : 2,
                                tension: 0.3,
                                hidden: !visibleDimensions[dim.key],
                                pointRadius: 4,
                                pointHoverRadius: 6,
                            }))
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
                                    display: false, // We'll use custom toggles
                                },
                                tooltip: {
                                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                    padding: 12,
                                    titleColor: '#3de8c8',
                                    bodyColor: '#ffffff',
                                    callbacks: {
                                        label: (context) => {
                                            const value = context.parsed.y;
                                            if (value === null) return '';
                                            return `${context.dataset.label}: ${value.toFixed(0)}`;
                                        }
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    min: 0,
                                    max: 100,
                                    ticks: {
                                        color: '#999',
                                        callback: (value) => `${value}`,
                                    },
                                    grid: {
                                        color: 'rgba(255, 255, 255, 0.1)',
                                    }
                                },
                                x: {
                                    ticks: {
                                        color: '#999',
                                        maxRotation: 45,
                                        minRotation: 45,
                                    },
                                    grid: {
                                        display: false,
                                    }
                                }
                            }
                        }
                    });
                }
            }
        })();
        
        return () => {
            if (chart) chart.destroy();
        };
    });
    
    function toggleDimension(key: keyof typeof visibleDimensions) {
        visibleDimensions[key] = !visibleDimensions[key];
        if (chart) {
            const datasetIndex = dimensions.findIndex(d => d.key === key);
            if (datasetIndex !== -1) {
                chart.setDatasetVisibility(datasetIndex, visibleDimensions[key]);
                chart.update();
            }
        }
    }
</script>

<div class="themed-card rounded-xl p-5">
    <div class="mb-4">
        <h3 class="text-base font-bold themed-text-primary mb-2">
            Technique Score Trends
        </h3>
        <p class="text-xs themed-text-subtle">
            Track your technique development across the last {data.length} sessions
        </p>
    </div>
    
    <!-- Dimension toggles -->
    <div class="flex flex-wrap gap-2 mb-4">
        {#each dimensions as dim}
            <button
                onclick={() => toggleDimension(dim.key)}
                class="px-3 py-1.5 rounded-full text-xs font-medium transition-all border"
                class:opacity-100={visibleDimensions[dim.key]}
                class:opacity-40={!visibleDimensions[dim.key]}
                style="background-color: {visibleDimensions[dim.key] ? dim.color + '20' : 'transparent'}; 
                       border-color: {dim.color}; 
                       color: {dim.color};">
                <span class="mr-1">{dim.icon}</span>
                {dim.label}
            </button>
        {/each}
    </div>
    
    <!-- Chart canvas -->
    <div class="relative" style="height: {isMobile ? '300px' : '400px'};">
        <canvas bind:this={chartCanvas}></canvas>
    </div>
    
    <!-- Trend summary -->
    {#if data.length >= 3}
        <div class="mt-4 pt-4 border-t border-[color:var(--border)]">
            <p class="text-xs themed-text-subtle">
                💡 <span class="font-semibold">Tip:</span> Toggle dimensions on/off to focus on specific areas. 
                Look for upward trends in areas you've been training.
            </p>
        </div>
    {/if}
</div>

<script lang="ts">
    import { onMount } from 'svelte';
    import { scoreConsistency } from '$lib/performance-engine';
    import { getChartOptions } from '$lib/utils/chartConfig';
    import HelpButton from '$lib/components/HelpButton.svelte';

    interface SessionSummary {
        id: string;
        timestamp: string;
        run_count: number;
        best_reaction_ms: number | null;
        avg_reaction_ms: number | null;
        best_peak_speed_ms: number | null;
        avg_peak_speed_ms: number | null;
        reaction_cv: number | null;
        has_valid_speed: boolean;
    }

    interface Trend {
        reaction: number | null;
        speed: number | null;
    }

    interface Props {
        sessions: SessionSummary[];
        trend: Trend;
        isMobile: boolean;
        onOpenHelp: (key: string) => void;
        goalTargets?: Record<string, any>;
    }

    let { sessions, trend, isMobile, onOpenHelp, goalTargets = {} }: Props = $props();

    let reactionChartEl: HTMLCanvasElement | null = $state(null);
    let speedChartEl: HTMLCanvasElement | null = $state(null);
    let consistencyEl: HTMLCanvasElement | null = $state(null);
    let chartInstances: any[] = [];

    let overallConsistency = $derived(scoreConsistency(sessions.map(s => s.avg_reaction_ms).filter((v): v is number => v !== null)));

    function fmtDate(ts: string) {
        return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }

    function trendArrow(pct: number | null, lowerIsBetter = false) {
        if (pct === null) return { icon: '—', color: '#9a8f7a', text: 'No trend data' };
        const improving = lowerIsBetter ? pct < 0 : pct > 0;
        const stable = Math.abs(pct) < 1;
        if (stable) return { icon: '→', color: '#9a8f7a', text: 'Stable' };
        return improving
            ? { icon: '↑', color: '#3de8c8', text: `${Math.abs(pct).toFixed(1)}% improving` }
            : { icon: '↓', color: '#ff4444', text: `${Math.abs(pct).toFixed(1)}% declining` };
    }

    async function renderCharts() {
        if (sessions.length < 2) return;
        const { Chart, registerables } = await import('chart.js');
        Chart.register(...registerables);
        chartInstances.forEach(c => c.destroy());
        chartInstances = [];

        const darkTick = '#9a8f7a';
        const amber = '#f5a623';
        const speed = '#ff6b3d';
        const teal = '#3de8c8';
        const labels = sessions.map(s => fmtDate(s.timestamp));
        const baseOpts = getChartOptions(isMobile);

        if (reactionChartEl) {
            const datasets: any[] = [
                {
                    label: 'Best reaction (s)',
                    data: sessions.map(s => s.best_reaction_ms ? s.best_reaction_ms / 1000 : null),
                    borderColor: amber,
                    backgroundColor: `${amber}20`,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    pointRadius: isMobile ? 2 : 4,
                    pointBackgroundColor: amber
                },
                {
                    label: 'Avg reaction (s)',
                    data: sessions.map(s => s.avg_reaction_ms ? s.avg_reaction_ms / 1000 : null),
                    borderColor: `${amber}60`,
                    borderDash: [4, 4],
                    borderWidth: 1.5,
                    fill: false,
                    tension: 0.3,
                    pointRadius: isMobile ? 1 : 2
                }
            ];

            // Add goal target line if exists
            if (goalTargets.reactionTime?.target) {
                datasets.push({
                    label: '🎯 Goal target',
                    data: Array(sessions.length).fill(goalTargets.reactionTime.target / 1000),
                    borderColor: teal,
                    borderWidth: 2,
                    borderDash: [8, 4],
                    fill: false,
                    pointRadius: 0,
                    tension: 0
                });
            }

            const c = new Chart(reactionChartEl, {
                type: 'line',
                data: {
                    labels,
                    datasets
                },
                options: {
                    ...baseOpts,
                    plugins: {
                        ...baseOpts.plugins,
                        legend: {
                            display: !isMobile,
                            labels: { color: darkTick, boxWidth: 12, font: { size: 11 } }
                        }
                    },
                    scales: {
                        ...baseOpts.scales,
                        y: { ...baseOpts.scales?.y, reverse: true, title: { display: !isMobile, text: 'Reaction time (s)', color: darkTick } }
                    }
                } as any
            });
            chartInstances.push(c);
        }

        if (speedChartEl && sessions.some(s => s.has_valid_speed)) {
            const speedDatasets: any[] = [
                {
                    label: 'Best peak speed (km/h)',
                    data: sessions.map(s => s.best_peak_speed_ms ? s.best_peak_speed_ms * 3.6 : null),
                    borderColor: speed,
                    backgroundColor: `${speed}20`,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    pointRadius: isMobile ? 2 : 4,
                    pointBackgroundColor: speed
                }
            ];

            // Add goal target line if exists
            if (goalTargets.peakSpeed?.target) {
                speedDatasets.push({
                    label: '🎯 Goal target',
                    data: Array(sessions.length).fill(goalTargets.peakSpeed.target * 3.6),
                    borderColor: teal,
                    borderWidth: 2,
                    borderDash: [8, 4],
                    fill: false,
                    pointRadius: 0,
                    tension: 0
                });
            }

            const c = new Chart(speedChartEl, {
                type: 'line',
                data: {
                    labels,
                    datasets: speedDatasets
                },
                options: {
                    ...baseOpts,
                    scales: {
                        ...baseOpts.scales,
                        y: { ...baseOpts.scales?.y, title: { display: !isMobile, text: 'Speed (km/h)', color: darkTick } }
                    }
                } as any
            });
            chartInstances.push(c);
        }

        if (consistencyEl && sessions.length >= 3) {
            const c = new Chart(consistencyEl, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [
                        {
                            label: 'Reaction CV %',
                            data: sessions.map(s => s.reaction_cv),
                            backgroundColor: sessions.map(s => {
                                const cv = s.reaction_cv ?? 10;
                                if (cv < 2) return `${teal}CC`;
                                if (cv < 5) return `${amber}CC`;
                                return '#ff444490';
                            }),
                            borderRadius: 4
                        }
                    ]
                },
                options: {
                    ...baseOpts,
                    scales: {
                        ...baseOpts.scales,
                        y: { ...baseOpts.scales?.y, title: { display: !isMobile, text: 'CV % (lower = more consistent)', color: darkTick } }
                    }
                } as any
            });
            chartInstances.push(c);
        }
    }

    $effect(() => {
        sessions.length;
        isMobile;
        renderCharts();
    });

    let chartHSm = $derived(isMobile ? 'h-40' : 'h-52');
    let chartHMed = $derived(isMobile ? 'h-36' : 'h-48');
</script>

{#if sessions.length >= 3}
    <!-- Trend charts -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="bg-[#131010] border border-[#221c18] rounded-xl p-5">
            <div class="flex items-start justify-between gap-4 mb-1">
                <div class="flex items-center gap-2">
                    <div>
                        <h3 class="text-sm font-semibold text-[#f0ece4]">Reaction Time Trend</h3>
                        <p class="text-xs text-[#6b5f4d] mt-0.5">Lower is better · Y-axis reversed</p>
                    </div>
                    <HelpButton onclick={() => onOpenHelp('reactionTrend')} />
                </div>
                {#if trend.reaction !== null}
                    {@const t = trendArrow(trend.reaction, true)}
                    <span class="text-sm font-bold flex-shrink-0" style="color:{t.color}">{t.icon} {t.text}</span>
                {/if}
            </div>
            <div class="{chartHSm}"><canvas bind:this={reactionChartEl}></canvas></div>
        </div>

        <div class="bg-[#131010] border border-[#221c18] rounded-xl p-5">
            <div class="flex items-start justify-between gap-4 mb-1">
                <div class="flex items-center gap-2">
                    <div>
                        <h3 class="text-sm font-semibold text-[#f0ece4]">Peak Speed Trend</h3>
                        <p class="text-xs text-[#6b5f4d] mt-0.5">⚠ Estimated from IMU · Higher is better</p>
                    </div>
                    <HelpButton onclick={() => onOpenHelp('speedTrend')} />
                </div>
                {#if trend.speed !== null}
                    {@const t = trendArrow(trend.speed, false)}
                    <span class="text-sm font-bold flex-shrink-0" style="color:{t.color}">{t.icon} {t.text}</span>
                {/if}
            </div>
            <div class="{chartHSm}">
                {#if sessions.some(s => s.has_valid_speed)}
                    <canvas bind:this={speedChartEl}></canvas>
                {:else}
                    <div class="h-full flex items-center justify-center">
                        <p class="text-sm text-[#6b5f4d]">No valid speed data yet</p>
                    </div>
                {/if}
            </div>
        </div>
    </div>

    <!-- Consistency chart -->
    <div class="bg-[#131010] border border-[#221c18] rounded-xl p-5">
        <div class="flex items-start justify-between gap-4 mb-4">
            <div class="flex items-center gap-2">
                <div>
                    <h3 class="text-sm font-semibold text-[#f0ece4]">Reaction Consistency per Session</h3>
                    <p class="text-xs text-[#6b5f4d] mt-0.5">CV % — lower = more consistent within a session</p>
                </div>
                <HelpButton onclick={() => onOpenHelp('sessionConsistency')} />
            </div>
            {#if overallConsistency}
                <div class="text-right flex-shrink-0">
                    <p class="text-lg font-bold" style="color:{overallConsistency.color}">{overallConsistency.label}</p>
                    <p class="text-xs text-[#6b5f4d]">across all sessions</p>
                </div>
            {/if}
        </div>
        <div class="{chartHMed}"><canvas bind:this={consistencyEl}></canvas></div>
        <div class="flex gap-4 mt-3 text-xs text-[#6b5f4d]">
            <span><span class="text-[#3de8c8]">■</span> Outstanding (&lt;2%)</span>
            <span><span class="text-[#f5a623]">■</span> Good (&lt;5%)</span>
            <span><span class="text-[#ff4444]">■</span> Variable (5%+)</span>
        </div>
    </div>
{/if}

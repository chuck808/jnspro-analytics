<script lang="ts">
    interface HistoricalStats {
        allTimeBestReactionMs: number | null;
        allTimeBestMaxG: number | null;
        allTimeBestPeakSpeedKmh: number | null;
        recentAverageReactionMs: number | null;
        recentAverageMaxG: number | null;
        sessionCount: number;
    }

    let { 
        currentReactionMs = null,
        currentMaxG = null,
        currentPeakSpeedKmh = null,
        historical = null,
    }: { 
        currentReactionMs?: number | null;
        currentMaxG?: number | null;
        currentPeakSpeedKmh?: number | null;
        historical?: HistoricalStats | null;
    } = $props();

    interface RankingData {
        metric: string;
        current: number | null;
        allTimeBest: number | null;
        recentAverage: number | null;
        unit: string;
        lowerIsBetter: boolean;
        formatValue: (val: number) => string;
    }

    const rankings = $derived<RankingData[]>([
        {
            metric: 'Reaction Time',
            current: currentReactionMs,
            allTimeBest: historical?.allTimeBestReactionMs ?? null,
            recentAverage: historical?.recentAverageReactionMs ?? null,
            unit: 's',
            lowerIsBetter: true,
            formatValue: (val) => (val / 1000).toFixed(3),
        },
        {
            metric: 'Max G-Force',
            current: currentMaxG,
            allTimeBest: historical?.allTimeBestMaxG ?? null,
            recentAverage: historical?.recentAverageMaxG ?? null,
            unit: 'G',
            lowerIsBetter: false,
            formatValue: (val) => val.toFixed(2),
        },
        {
            metric: 'Peak Speed',
            current: currentPeakSpeedKmh,
            allTimeBest: historical?.allTimeBestPeakSpeedKmh ?? null,
            recentAverage: null,
            unit: 'km/h',
            lowerIsBetter: false,
            formatValue: (val) => val.toFixed(1),
        },
    ]);

    function calculateRanking(current: number | null, best: number | null, lowerIsBetter: boolean): {
        isPB: boolean;
        percentOfBest: number;
        status: 'pb' | 'excellent' | 'good' | 'average';
    } | null {
        if (current === null || best === null) return null;

        const isPB = lowerIsBetter ? current <= best : current >= best;
        
        let percentOfBest: number;
        if (lowerIsBetter) {
            percentOfBest = (best / current) * 100;
        } else {
            percentOfBest = (current / best) * 100;
        }

        const status: 'pb' | 'excellent' | 'good' | 'average' = 
            isPB ? 'pb' :
            percentOfBest >= 95 ? 'excellent' :
            percentOfBest >= 85 ? 'good' :
            'average';

        return { isPB, percentOfBest, status };
    }

    function compareToRecent(current: number | null, recent: number | null, lowerIsBetter: boolean): {
        trend: 'improving' | 'declining' | 'stable';
        percentDiff: number;
    } | null {
        if (current === null || recent === null) return null;

        const diff = current - recent;
        const percentDiff = Math.abs((diff / recent) * 100);

        let trend: 'improving' | 'declining' | 'stable' = 'stable';
        
        if (percentDiff > 2) { // Only consider meaningful differences
            if (lowerIsBetter) {
                trend = diff < 0 ? 'improving' : 'declining';
            } else {
                trend = diff > 0 ? 'improving' : 'declining';
            }
        }

        return { trend, percentDiff };
    }

    const statusConfig = {
        pb: { icon: '🏆', label: 'Personal Best!', color: '#3de8c8' },
        excellent: { icon: '⭐', label: 'Excellent', color: '#f5a623' },
        good: { icon: '✓', label: 'Good', color: '#9a8f7a' },
        average: { icon: '○', label: 'Average', color: '#6b5f4d' },
    };

    const trendConfig = {
        improving: { icon: '📈', label: 'Trending Up', color: '#3de8c8' },
        stable: { icon: '━', label: 'Stable', color: '#9a8f7a' },
        declining: { icon: '📉', label: 'Trending Down', color: '#f5a623' },
    };
</script>

<div class="bg-[#131010] border border-[#221c18] rounded-xl p-5">
    <div class="mb-4">
        <h3 class="text-sm font-semibold text-[#f0ece4] mb-1">📊 Historical Context</h3>
        <p class="text-xs text-[#6b5f4d]">
            {#if historical?.sessionCount}
                Compare to your all-time bests from {historical.sessionCount} sessions
            {:else}
                Historical performance data unavailable
            {/if}
        </p>
    </div>

    {#if historical}
        <div class="space-y-3">
            {#each rankings as ranking}
                {@const rank = calculateRanking(ranking.current, ranking.allTimeBest, ranking.lowerIsBetter)}
                {@const trend = compareToRecent(ranking.current, ranking.recentAverage, ranking.lowerIsBetter)}
                
                <div class="bg-[#0a0809] rounded-lg p-4 border border-[#221c18]">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex-1">
                            <p class="text-sm font-semibold text-[#f0ece4] mb-1">{ranking.metric}</p>
                            {#if rank}
                                <div class="flex items-center gap-2">
                                    <span class="text-xs font-bold px-2 py-0.5 rounded"
                                          style="background:{statusConfig[rank.status].color}20; color:{statusConfig[rank.status].color}">
                                        {statusConfig[rank.status].icon} {statusConfig[rank.status].label}
                                    </span>
                                    {#if !rank.isPB}
                                        <span class="text-xs text-[#6b5f4d]">
                                            {rank.percentOfBest.toFixed(0)}% of PB
                                        </span>
                                    {/if}
                                </div>
                            {/if}
                        </div>
                    </div>

                    <div class="grid grid-cols-3 gap-3 text-xs">
                        <div>
                            <p class="text-[#6b5f4d] mb-1">Current</p>
                            <p class="font-mono font-bold text-[#f0ece4]">
                                {ranking.current !== null ? ranking.formatValue(ranking.current) : '—'}{ranking.unit}
                            </p>
                        </div>
                        <div>
                            <p class="text-[#6b5f4d] mb-1">All-Time Best</p>
                            <p class="font-mono font-bold text-[#f5a623]">
                                {ranking.allTimeBest !== null ? ranking.formatValue(ranking.allTimeBest) : '—'}{ranking.unit}
                            </p>
                        </div>
                        {#if ranking.recentAverage !== null}
                            <div>
                                <p class="text-[#6b5f4d] mb-1">Recent Avg</p>
                                <p class="font-mono font-bold text-[#9a8f7a]">
                                    {ranking.formatValue(ranking.recentAverage)}{ranking.unit}
                                </p>
                            </div>
                        {/if}
                    </div>

                    {#if trend && trend.trend !== 'stable'}
                        <div class="mt-3 pt-3 border-t border-[#221c18]">
                            <div class="flex items-center gap-2">
                                <span class="text-xs font-semibold"
                                      style="color:{trendConfig[trend.trend].color}">
                                    {trendConfig[trend.trend].icon} {trendConfig[trend.trend].label}
                                </span>
                                <span class="text-xs text-[#6b5f4d]">
                                    {trend.percentDiff.toFixed(1)}% vs recent average
                                </span>
                            </div>
                        </div>
                    {/if}
                </div>
            {/each}
        </div>

        <div class="mt-4 p-3 bg-[#0a0809] rounded-lg border border-[#221c18]">
            <p class="text-xs text-[#9a8f7a]">
                💡 <strong class="text-[#f0ece4]">Note:</strong> Recent average is calculated from your last 5 sessions. 
                Keep training consistently to see improvement trends!
            </p>
        </div>
    {:else}
        <div class="text-center py-8">
            <p class="text-sm text-[#6b5f4d] mb-2">No historical data available yet</p>
            <p class="text-xs text-[#9a8f7a]">
                Complete more sessions to unlock historical context and trend analysis
            </p>
        </div>
    {/if}
</div>

<script lang="ts">
    interface RunData {
        runNumber: number;
        reactionMs: number | null;
        maxG: number | null;
        peakSpeedKmh: number | null;
        techniqueScore: number | null;
        elapsedMs: number | null;
        speedProfile: string | null;
    }

    let { 
        runs = [] as RunData[],
        selectedRun1 = $bindable(0),
        selectedRun2 = $bindable(1),
    }: { 
        runs: RunData[];
        selectedRun1?: number;
        selectedRun2?: number;
    } = $props();

    const run1 = $derived(runs[selectedRun1] ?? null);
    const run2 = $derived(runs[selectedRun2] ?? null);

    function formatReaction(ms: number | null): string {
        return ms !== null ? (ms / 1000).toFixed(3) + 's' : '—';
    }

    function formatSpeed(kmh: number | null): string {
        return kmh !== null ? kmh.toFixed(1) + ' km/h' : '—';
    }

    function formatG(g: number | null): string {
        return g !== null ? g.toFixed(2) + 'G' : '—';
    }

    function formatTime(ms: number | null): string {
        if (ms === null) return '—';
        return `${Math.floor(ms / 1000).toString().padStart(2, '0')}:${(ms % 1000).toString().padStart(3, '0')}`;
    }

    function calculateDifference(val1: number | null, val2: number | null, lowerIsBetter = false): {
        percent: number;
        better: 'run1' | 'run2' | 'equal';
        text: string;
    } | null {
        if (val1 === null || val2 === null) return null;
        
        const diff = val2 - val1;
        const percentDiff = Math.abs((diff / val1) * 100);
        
        let better: 'run1' | 'run2' | 'equal' = 'equal';
        if (Math.abs(diff) > 0.01) {
            if (lowerIsBetter) {
                better = diff < 0 ? 'run2' : 'run1';
            } else {
                better = diff > 0 ? 'run2' : 'run1';
            }
        }
        
        const sign = diff > 0 ? '+' : '';
        return {
            percent: percentDiff,
            better,
            text: `${sign}${percentDiff.toFixed(1)}%`,
        };
    }

    const metrics = $derived([
        {
            label: 'Reaction Time',
            run1: formatReaction(run1?.reactionMs ?? null),
            run2: formatReaction(run2?.reactionMs ?? null),
            diff: calculateDifference(run1?.reactionMs ?? null, run2?.reactionMs ?? null, true),
        },
        {
            label: 'Max G-Force',
            run1: formatG(run1?.maxG ?? null),
            run2: formatG(run2?.maxG ?? null),
            diff: calculateDifference(run1?.maxG ?? null, run2?.maxG ?? null, false),
        },
        {
            label: 'Peak Speed',
            run1: formatSpeed(run1?.peakSpeedKmh ?? null),
            run2: formatSpeed(run2?.peakSpeedKmh ?? null),
            diff: calculateDifference(run1?.peakSpeedKmh ?? null, run2?.peakSpeedKmh ?? null, false),
        },
        {
            label: 'Technique Score',
            run1: run1?.techniqueScore !== null ? `${run1.techniqueScore}/100` : '—',
            run2: run2?.techniqueScore !== null ? `${run2.techniqueScore}/100` : '—',
            diff: calculateDifference(run1?.techniqueScore ?? null, run2?.techniqueScore ?? null, false),
        },
        {
            label: 'Elapsed Time',
            run1: run1 ? formatTime(run1.elapsedMs) : '—',
            run2: run2 ? formatTime(run2.elapsedMs) : '—',
            diff: calculateDifference(run1?.elapsedMs ?? null, run2?.elapsedMs ?? null, true),
        },
    ]);

    const summary = $derived.by(() => {
        if (!run1 || !run2) return null;
        
        let run1Better = 0;
        let run2Better = 0;
        
        metrics.forEach(m => {
            if (m.diff?.better === 'run1') run1Better++;
            if (m.diff?.better === 'run2') run2Better++;
        });
        
        return {
            run1Better,
            run2Better,
            winner: run1Better > run2Better ? 'run1' : run2Better > run1Better ? 'run2' : 'tie',
        };
    });
</script>

<div class="bg-[#131010] border border-[#221c18] rounded-xl p-5">
    <div class="mb-4">
        <h3 class="text-sm font-semibold text-[#f0ece4] mb-1">🔍 Run Comparison</h3>
        <p class="text-xs text-[#6b5f4d]">Side-by-side comparison of two runs from this session</p>
    </div>

    <!-- Run Selectors -->
    <div class="grid grid-cols-2 gap-3 mb-4">
        <div>
            <label for="run1-select" class="block text-xs font-medium text-[#9a8f7a] mb-2">Run 1</label>
            <select
                id="run1-select"
                bind:value={selectedRun1}
                class="w-full bg-[#0a0809] border border-[#221c18] rounded-lg px-3 py-2 text-sm text-[#f0ece4]
                       focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:border-transparent"
            >
                {#each runs as run, idx}
                    <option value={idx}>Run {run.runNumber}</option>
                {/each}
            </select>
        </div>
        <div>
            <label for="run2-select" class="block text-xs font-medium text-[#9a8f7a] mb-2">Run 2</label>
            <select
                id="run2-select"
                bind:value={selectedRun2}
                class="w-full bg-[#0a0809] border border-[#221c18] rounded-lg px-3 py-2 text-sm text-[#f0ece4]
                       focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:border-transparent"
            >
                {#each runs as run, idx}
                    <option value={idx}>Run {run.runNumber}</option>
                {/each}
            </select>
        </div>
    </div>

    {#if run1 && run2}
        <!-- Summary -->
        {#if summary}
            <div class="mb-4 p-3 bg-[#0a0809] rounded-lg border border-[#221c18]">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="text-sm font-semibold text-[#f0ece4]">
                            {summary.winner === 'tie' ? '🤝 Tied' : summary.winner === 'run1' ? '🏆 Run 1 Better' : '🏆 Run 2 Better'}
                        </span>
                    </div>
                    <div class="text-xs text-[#9a8f7a]">
                        Run 1: {summary.run1Better} metrics ahead · Run 2: {summary.run2Better} metrics ahead
                    </div>
                </div>
            </div>
        {/if}

        <!-- Comparison Table -->
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <caption class="sr-only">Comparison between Run {run1.runNumber} and Run {run2.runNumber}</caption>
                <thead>
                    <tr class="border-b border-[#221c18]">
                        <th scope="col" class="text-left pb-3 text-xs font-semibold text-[#9a8f7a] uppercase tracking-wider pr-4">
                            Metric
                        </th>
                        <th scope="col" class="text-right pb-3 text-xs font-semibold text-[#9a8f7a] uppercase tracking-wider pr-4">
                            Run {run1.runNumber}
                        </th>
                        <th scope="col" class="text-center pb-3 text-xs font-semibold text-[#9a8f7a] uppercase tracking-wider pr-4">
                            Δ
                        </th>
                        <th scope="col" class="text-right pb-3 text-xs font-semibold text-[#9a8f7a] uppercase tracking-wider">
                            Run {run2.runNumber}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {#each metrics as metric}
                        <tr class="border-b border-[#221c18]/50 hover:bg-[#171210] transition-colors">
                            <td class="py-3 pr-4 text-[#f0ece4] font-medium">{metric.label}</td>
                            <td class="py-3 pr-4 text-right font-mono {metric.diff?.better === 'run1' ? 'text-[#3de8c8]' : 'text-[#9a8f7a]'}">
                                {metric.run1}
                                {#if metric.diff?.better === 'run1'}
                                    <span class="ml-1 text-[#3de8c8]">●</span>
                                {/if}
                            </td>
                            <td class="py-3 pr-4 text-center">
                                {#if metric.diff}
                                    <span class="text-xs px-2 py-0.5 rounded {metric.diff.better !== 'equal' ? 'bg-[#f5a623]/10 text-[#f5a623]' : 'text-[#6b5f4d]'}">
                                        {metric.diff.text}
                                    </span>
                                {/if}
                            </td>
                            <td class="py-3 text-right font-mono {metric.diff?.better === 'run2' ? 'text-[#3de8c8]' : 'text-[#9a8f7a]'}">
                                {metric.run2}
                                {#if metric.diff?.better === 'run2'}
                                    <span class="ml-1 text-[#3de8c8]">●</span>
                                {/if}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>

        <p class="text-xs text-[#6b5f4d] mt-3">
            <span class="text-[#3de8c8]">●</span> = Better performance
        </p>
    {:else}
        <div class="text-center py-8 text-[#6b5f4d]">
            <p class="text-sm">Select two runs to compare</p>
        </div>
    {/if}
</div>

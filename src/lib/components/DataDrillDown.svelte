<script lang="ts">
    interface DataSample {
        timeS: number;
        value: number;
        label?: string;
    }

    let { 
        title = 'Run Data',
        data = [] as DataSample[],
        unit = '',
        runNumber = 1,
        metric = 'G-Force',
    }: { 
        title?: string;
        data?: DataSample[];
        unit?: string;
        runNumber?: number;
        metric?: string;
    } = $props();

    let isExpanded = $state(false);
    let showTable = $state(false);

    function toggleExpanded() {
        isExpanded = !isExpanded;
    }

    function toggleTable() {
        showTable = !showTable;
    }

    function exportToCSV() {
        if (data.length === 0) return;

        const headers = ['Time (s)', `${metric} (${unit})`];
        const csvContent = [
            headers.join(','),
            ...data.map(d => `${d.timeS.toFixed(3)},${d.value.toFixed(3)}`)
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `run-${runNumber}-${metric.toLowerCase().replace(/\s+/g, '-')}-data.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    const stats = $derived.by(() => {
        if (data.length === 0) return null;

        const values = data.map(d => d.value);
        const max = Math.max(...values);
        const min = Math.min(...values);
        const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
        const maxIdx = values.indexOf(max);
        const timeAtMax = data[maxIdx]?.timeS ?? 0;

        return { max, min, avg, timeAtMax, sampleCount: data.length };
    });
</script>

<div class="bg-[#131010] border border-[#221c18] rounded-xl overflow-hidden">
    <!-- Header -->
    <button
        onclick={toggleExpanded}
        class="w-full px-5 py-4 flex items-center justify-between hover:bg-[#171210] transition-colors
               focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#f5a623]"
        aria-expanded={isExpanded}
    >
        <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-[#f5a623] transition-transform {isExpanded ? 'rotate-90' : ''}" 
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
            <h3 class="text-sm font-semibold text-[#f0ece4]">📋 {title}</h3>
        </div>
        <span class="text-xs text-[#6b5f4d]">{data.length} samples</span>
    </button>

    {#if isExpanded}
        <div class="px-5 pb-5 border-t border-[#221c18]">
            <!-- Quick Stats -->
            {#if stats}
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 mb-4">
                    <div class="bg-[#0a0809] rounded-lg p-3">
                        <p class="text-xs text-[#6b5f4d] mb-0.5">Max</p>
                        <p class="text-sm font-bold text-[#f5a623]">{stats.max.toFixed(2)}{unit}</p>
                    </div>
                    <div class="bg-[#0a0809] rounded-lg p-3">
                        <p class="text-xs text-[#6b5f4d] mb-0.5">Min</p>
                        <p class="text-sm font-bold text-[#f0ece4]">{stats.min.toFixed(2)}{unit}</p>
                    </div>
                    <div class="bg-[#0a0809] rounded-lg p-3">
                        <p class="text-xs text-[#6b5f4d] mb-0.5">Average</p>
                        <p class="text-sm font-bold text-[#9a8f7a]">{stats.avg.toFixed(2)}{unit}</p>
                    </div>
                    <div class="bg-[#0a0809] rounded-lg p-3">
                        <p class="text-xs text-[#6b5f4d] mb-0.5">Peak at</p>
                        <p class="text-sm font-bold text-[#3de8c8]">{stats.timeAtMax.toFixed(2)}s</p>
                    </div>
                </div>
            {/if}

            <!-- Action Buttons -->
            <div class="flex gap-2 mb-4">
                <button
                    onclick={toggleTable}
                    class="flex items-center gap-2 px-3 py-2 text-xs rounded-lg border transition-colors
                           focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[#131010]
                           {showTable
                               ? 'bg-[#f5a623]/10 border-[#f5a623]/40 text-[#f5a623]'
                               : 'bg-[#0a0809] border-[#221c18] text-[#9a8f7a] hover:border-[#f5a623]/20'}"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                    </svg>
                    {showTable ? 'Hide' : 'Show'} Data Table
                </button>

                <button
                    onclick={exportToCSV}
                    class="flex items-center gap-2 px-3 py-2 text-xs rounded-lg border transition-colors
                           bg-[#0a0809] border-[#221c18] text-[#9a8f7a] hover:border-[#f5a623]/20
                           focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[#131010]"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    Export CSV
                </button>
            </div>

            <!-- Data Table -->
            {#if showTable}
                <div class="bg-[#0a0809] rounded-lg border border-[#221c18] overflow-hidden">
                    <div class="max-h-64 overflow-y-auto">
                        <table class="w-full text-xs">
                            <caption class="sr-only">Detailed data samples for {title}</caption>
                            <thead class="sticky top-0 bg-[#131010] border-b border-[#221c18]">
                                <tr>
                                    <th scope="col" class="text-left px-3 py-2 font-semibold text-[#9a8f7a]">Sample</th>
                                    <th scope="col" class="text-right px-3 py-2 font-semibold text-[#9a8f7a]">Time (s)</th>
                                    <th scope="col" class="text-right px-3 py-2 font-semibold text-[#9a8f7a]">{metric} ({unit})</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each data as sample, idx}
                                    {@const isPeak = stats && Math.abs(sample.value - stats.max) < 0.001}
                                    <tr class="border-b border-[#221c18]/30 hover:bg-[#171210] transition-colors
                                               {isPeak ? 'bg-[#f5a623]/5' : ''}">
                                        <td class="px-3 py-2 text-[#6b5f4d]">#{idx + 1}</td>
                                        <td class="px-3 py-2 text-right font-mono text-[#9a8f7a]">{sample.timeS.toFixed(3)}</td>
                                        <td class="px-3 py-2 text-right font-mono {isPeak ? 'text-[#f5a623] font-bold' : 'text-[#f0ece4]'}">
                                            {sample.value.toFixed(3)}
                                            {#if isPeak}
                                                <span class="ml-1 text-[#f5a623]">⭐</span>
                                            {/if}
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                    <div class="px-3 py-2 bg-[#131010] border-t border-[#221c18] text-xs text-[#6b5f4d]">
                        <span class="text-[#f5a623]">⭐</span> = Peak value
                    </div>
                </div>
            {/if}
        </div>
    {/if}
</div>

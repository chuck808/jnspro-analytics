<script lang="ts">
    import type { SessionAnalysis } from '$lib/performance-engine';
    
    interface Props {
        analysis: SessionAnalysis;
    }
    
    let { analysis }: Props = $props();
    
    type SortColumn = 'runNumber' | 'reaction' | 'explosiveness' | 'smoothness' | 'efficiency' | 'overall';
    let sortColumn = $state<SortColumn>('runNumber');
    let sortDirection = $state<'asc' | 'desc'>('asc');
    
    const columns = [
        { key: 'runNumber' as const, label: 'Run', icon: '#' },
        { key: 'reaction' as const, label: 'Reaction', icon: '⚡' },
        { key: 'explosiveness' as const, label: 'Explosive', icon: '💥' },
        { key: 'smoothness' as const, label: 'Smooth', icon: '〰️' },
        { key: 'efficiency' as const, label: 'Efficiency', icon: '⚙️' },
        { key: 'overall' as const, label: 'Overall', icon: '⭐' },
    ];
    
    let sortedRuns = $derived.by(() => {
        const runs = analysis.runs || [];
        const sorted = [...runs].sort((a, b) => {
            let aVal: number | null = null;
            let bVal: number | null = null;
            
            if (sortColumn === 'runNumber') {
                aVal = a.runNumber ?? 0;
                bVal = b.runNumber ?? 0;
            } else {
                // Get technique scores
                const aScores = a.technique;
                const bScores = b.technique;
                aVal = aScores?.[sortColumn] ?? null;
                bVal = bScores?.[sortColumn] ?? null;
            }
            
            if (aVal === null && bVal === null) return 0;
            if (aVal === null) return 1;
            if (bVal === null) return -1;
            
            return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        });
        
        return sorted;
    });
    
    // Find best and worst for each dimension
    let bestWorst = $derived.by(() => {
        const runs = analysis.runs || [];
        const result: Record<string, { best: number | null, worst: number | null }> = {};
        
        columns.forEach(col => {
            if (col.key === 'runNumber') return;
            
            const values = runs
                .map(r => r.technique?.[col.key] ?? null)
                .filter((v): v is number => v !== null);
            
            result[col.key] = {
                best: values.length > 0 ? Math.max(...values) : null,
                worst: values.length > 0 ? Math.min(...values) : null,
            };
        });
        
        return result;
    });
    
    function toggleSort(column: SortColumn) {
        if (sortColumn === column) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            sortColumn = column;
            sortDirection = 'desc'; // Default to descending for scores
        }
    }
    
    function getScoreColor(score: number | null) {
        if (!score) return '#6b5f4d';
        if (score >= 80) return '#3de8c8';
        if (score >= 60) return '#f5a623';
        if (score >= 40) return '#ff6b3d';
        return '#ff4444';
    }
    
    function isBest(value: number | null, column: string) {
        if (!value || column === 'runNumber') return false;
        return value === bestWorst[column]?.best;
    }
    
    function isWorst(value: number | null, column: string) {
        if (!value || column === 'runNumber') return false;
        return value === bestWorst[column]?.worst;
    }
</script>

<div class="themed-card rounded-xl p-5">
    <div class="mb-4">
        <h3 class="text-base font-bold themed-text-primary mb-2">
            Run Comparison Matrix
        </h3>
        <p class="text-xs themed-text-subtle">
            Compare all runs side-by-side across 6 technique dimensions
        </p>
    </div>
    
    <div class="overflow-x-auto -mx-5 px-5">
        <table class="w-full text-xs">
            <thead>
                <tr class="border-b border-[color:var(--border)]">
                    {#each columns as col}
                        <th class="pb-2 px-2 text-left">
                            <button
                                onclick={() => toggleSort(col.key)}
                                class="flex items-center gap-1 themed-text-secondary hover:themed-text-primary transition-colors font-semibold group">
                                <span class="text-base">{col.icon}</span>
                                <span class="hidden sm:inline">{col.label}</span>
                                {#if sortColumn === col.key}
                                    <span class="themed-accent text-xs">
                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                    </span>
                                {/if}
                            </button>
                        </th>
                    {/each}
                </tr>
            </thead>
            <tbody>
                {#each sortedRuns as run}
                    <tr class="border-b border-[color:var(--border)]/50 hover:bg-[color:var(--card-nested)] transition-colors">
                        <td class="py-2 px-2 font-mono font-semibold themed-text-primary">
                            {run.runNumber}
                        </td>
                        {#each columns.slice(1) as col}
                            {@const rawValue = run.technique?.[col.key as keyof typeof run.technique]}
                            {@const value = typeof rawValue === 'number' ? rawValue : null}
                            {@const best = isBest(value, col.key)}
                            {@const worst = isWorst(value, col.key)}
                            <td class="py-2 px-2">
                                {#if value !== null}
                                    <div class="flex items-center gap-1">
                                        <span 
                                            class="font-semibold"
                                            style="color: {getScoreColor(value)};">
                                            {value.toFixed(0)}
                                        </span>
                                        {#if best}
                                            <span class="text-[#3de8c8] text-base">🏆</span>
                                        {:else if worst}
                                            <span class="text-[#ff6b3d] text-base">⬇️</span>
                                        {/if}
                                    </div>
                                {:else}
                                    <span class="themed-text-subtle">—</span>
                                {/if}
                            </td>
                        {/each}
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
    
    <div class="mt-4 pt-4 border-t border-[color:var(--border)] flex items-center justify-between text-xs themed-text-subtle">
        <div class="flex items-center gap-3">
            <div class="flex items-center gap-1">
                <span class="text-base">🏆</span>
                <span>Best</span>
            </div>
            <div class="flex items-center gap-1">
                <span class="text-base">⬇️</span>
                <span>Lowest</span>
            </div>
        </div>
        <span>Click column headers to sort</span>
    </div>
</div>

<script lang="ts">
    import type { SessionAnalysis } from '$lib/performance-engine';
    
    interface Props {
        analysis: SessionAnalysis;
    }
    
    let { analysis }: Props = $props();
    
    let impulseData = $derived(analysis.selectedRun?.physics?.impulse);
    
    const metrics = $derived([
        {
            label: 'Total Impulse',
            value: impulseData?.totalImpulseNs,
            unit: 'N·s',
            icon: '⚡',
            color: '#3de8c8',
            description: 'Total force applied',
        },
        {
            label: 'Time to 50%',
            value: impulseData?.timeToHalfImpulseS,
            unit: 's',
            icon: '⏱️',
            color: '#f5a623',
            description: 'How quickly you reach half power',
        },
        {
            label: 'Front-Loaded',
            value: impulseData?.frontLoadedScore,
            unit: '/100',
            icon: '🚀',
            color: '#4a9eff',
            description: 'Power concentrated at start',
        },
        {
            label: 'Efficiency',
            value: impulseData?.impulseEfficiency,
            unit: '%',
            icon: '⚙️',
            color: '#9b59b6',
            description: 'How effectively force is applied',
        },
    ]);
</script>

{#if impulseData}
    <div class="themed-card rounded-xl p-5">
        <div class="mb-4">
            <h3 class="text-base font-bold themed-text-primary mb-2">
                Impulse Analysis
            </h3>
            <p class="text-xs themed-text-subtle">
                Force application breakdown for selected run
            </p>
        </div>
        
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {#each metrics as metric}
                <div class="themed-nested-card rounded-lg p-4">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="text-2xl">{metric.icon}</span>
                        <span class="text-xs font-semibold themed-text-subtle uppercase tracking-wider">
                            {metric.label}
                        </span>
                    </div>
                    
                    {#if metric.value !== null && metric.value !== undefined}
                        <div class="mb-1">
                            <span 
                                class="text-2xl font-bold"
                                style="color: {metric.color};">
                                {metric.value.toFixed(metric.unit === 's' ? 2 : 0)}
                            </span>
                            <span class="text-sm themed-text-subtle ml-1">
                                {metric.unit}
                            </span>
                        </div>
                        <p class="text-xs themed-text-subtle">
                            {metric.description}
                        </p>
                    {:else}
                        <p class="text-sm themed-text-subtle italic">
                            No data
                        </p>
                    {/if}
                </div>
            {/each}
        </div>
        
        <div class="mt-4 pt-4 border-t border-[color:var(--border)]">
            <p class="text-xs themed-text-subtle">
                💡 <span class="font-semibold">Tip:</span> Higher front-loaded scores indicate explosive starts. 
                Higher efficiency means more effective force application.
            </p>
        </div>
    </div>
{/if}

<script lang="ts">
    import type { CoachDiagnostic } from '$lib/performance-engine/coachDiagnostics';
    
    interface Props {
        diagnostics: CoachDiagnostic[];
        compact?: boolean;
    }
    
    let { diagnostics, compact = false }: Props = $props();
    
    function getToneColor(tone: 'positive' | 'warning' | 'neutral') {
        if (tone === 'positive') return '#3de8c8';
        if (tone === 'warning') return '#ff6b3d';
        return '#f5a623';
    }
    
    function getToneIcon(tone: 'positive' | 'warning' | 'neutral') {
        if (tone === 'positive') return '✓';
        if (tone === 'warning') return '⚠';
        return '○';
    }
    
    function getAudienceBadge(audience: string) {
        const badges: Record<string, string> = {
            grom: 'Beginner',
            rider: 'Intermediate',
            elite: 'Advanced',
            coach: 'Coach View'
        };
        return badges[audience] || audience;
    }
</script>

<div class="themed-card rounded-xl p-5 space-y-4">
    <div class="flex items-center justify-between">
        <h3 class="text-base font-bold themed-text-primary">Coach Insights</h3>
        <span class="text-xs themed-text-subtle px-2 py-1 rounded themed-nested-card">
            {diagnostics.length} insight{diagnostics.length !== 1 ? 's' : ''}
        </span>
    </div>
    
    {#if diagnostics.length === 0}
        <div class="text-center py-8">
            <p class="text-sm themed-text-secondary">No coaching insights available</p>
            <p class="text-xs themed-text-subtle mt-1">Complete more runs to generate insights</p>
        </div>
    {:else}
        <div class="space-y-4">
            {#each diagnostics as diagnostic}
                {@const toneColor = getToneColor(diagnostic.tone)}
                {@const toneIcon = getToneIcon(diagnostic.tone)}
                
                <div 
                    class="border-l-4 rounded-lg p-4 themed-nested-card transition-all hover:shadow-md"
                    style="border-left-color: {toneColor};"
                >
                    <!-- Header -->
                    <div class="flex items-start justify-between gap-3 mb-3">
                        <div class="flex items-center gap-2 flex-1">
                            <span 
                                class="flex items-center justify-center w-6 h-6 rounded-full text-sm font-bold"
                                style="background-color: {toneColor}20; color: {toneColor};"
                            >
                                {toneIcon}
                            </span>
                            <h4 class="text-sm font-semibold themed-text-primary">{diagnostic.title}</h4>
                        </div>
                        {#if diagnostic.audience}
                            <span class="text-[10px] px-2 py-0.5 rounded themed-bg-accent themed-accent uppercase tracking-wider">
                                {getAudienceBadge(diagnostic.audience)}
                            </span>
                        {/if}
                    </div>
                    
                    <!-- Summary -->
                    <p class="text-sm themed-text-secondary mb-3 leading-relaxed">
                        {diagnostic.summary}
                    </p>
                    
                    <!-- Evidence -->
                    {#if diagnostic.evidence && diagnostic.evidence.length > 0 && !compact}
                        <div class="mb-3">
                            <p class="text-xs font-semibold themed-text-subtle uppercase tracking-wider mb-2">Evidence:</p>
                            <ul class="space-y-1.5">
                                {#each diagnostic.evidence as evidence}
                                    <li class="flex items-start gap-2 text-xs themed-text-secondary">
                                        <span class="themed-accent mt-0.5">•</span>
                                        <span class="flex-1">{evidence}</span>
                                    </li>
                                {/each}
                            </ul>
                        </div>
                    {/if}
                    
                    <!-- Prescription -->
                    {#if diagnostic.prescription && diagnostic.prescription.length > 0}
                        <div class="pt-3 border-t border-[color:var(--border)]">
                            <p class="text-xs font-semibold uppercase tracking-wider mb-2" style="color: {toneColor};">
                                Next Steps:
                            </p>
                            <ul class="space-y-1.5">
                                {#each diagnostic.prescription as action}
                                    <li class="flex items-start gap-2 text-xs themed-text-secondary">
                                        <span style="color: {toneColor};" class="mt-0.5">→</span>
                                        <span class="flex-1">{action}</span>
                                    </li>
                                {/each}
                            </ul>
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    {/if}
</div>

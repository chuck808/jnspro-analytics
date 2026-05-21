<script lang="ts">
    import type { SessionNarrative } from '$lib/performance-engine/language/types';

    interface Props {
        narrative: SessionNarrative;
        detailLevel?: 'coach' | 'brief';
    }

    let { narrative, detailLevel = 'coach' }: Props = $props();

    // Map priority to visual styling
    function priorityColor(priority: string) {
        switch (priority) {
            case 'critical': return '#ff4444';
            case 'important': return '#f5a623';
            case 'watch': return '#ffcc44';
            default: return 'var(--accent, #3de8c8)';
        }
    }

    function priorityIcon(priority: string) {
        switch (priority) {
            case 'critical': return '⚠️';
            case 'important': return '⚡';
            case 'watch': return '👁️';
            default: return '💡';
        }
    }
</script>

<div class="space-y-4">
    <!-- Main Message -->
    <div class="space-y-3">
        <div class="flex items-start gap-3">
            <span class="text-2xl flex-shrink-0" aria-hidden="true">
                {priorityIcon(narrative.message.priority)}
            </span>
            <div class="flex-1">
                <h4 class="text-base font-semibold themed-text-primary mb-1">
                    {narrative.message.headline}
                </h4>
                <p class="text-sm themed-text-secondary">
                    {narrative.message.impact}
                </p>
            </div>
        </div>

        {#if detailLevel === 'coach'}
            <!-- Why This Matters -->
            {#if narrative.message.whyThisMatters}
                <div class="themed-nested-card rounded-lg p-3">
                    <p class="text-xs font-semibold themed-text-subtle uppercase tracking-wider mb-1">
                        Why this matters
                    </p>
                    <p class="text-sm themed-text-secondary">
                        {narrative.message.whyThisMatters}
                    </p>
                </div>
            {/if}

            <!-- Action -->
            {#if narrative.message.action}
                <div class="themed-nested-card rounded-lg p-3 border-l-2" 
                     style="border-color: {priorityColor(narrative.message.priority)}">
                    <p class="text-xs font-semibold themed-text-subtle uppercase tracking-wider mb-1">
                        Recommended action
                    </p>
                    <p class="text-sm themed-text-primary font-medium">
                        {narrative.message.action}
                    </p>
                </div>
            {/if}

            <!-- Watch For -->
            {#if narrative.message.watchFor}
                <div class="themed-nested-card rounded-lg p-3">
                    <p class="text-xs font-semibold themed-text-subtle uppercase tracking-wider mb-1">
                        Watch for
                    </p>
                    <p class="text-sm themed-text-secondary">
                        {narrative.message.watchFor}
                    </p>
                </div>
            {/if}
        {/if}
    </div>

    <!-- Trust & Confidence -->
    {#if detailLevel === 'coach'}
        <div class="flex items-center gap-4 text-xs themed-text-subtle">
            <div class="flex items-center gap-1.5">
                <span class="capitalize">{narrative.message.confidence}</span>
                <span>confidence</span>
            </div>
            <span class="opacity-50">•</span>
            <div class="flex items-center gap-1.5">
                <span>{narrative.trust.basedOnRuns}</span>
                <span>runs analyzed</span>
            </div>
            {#if (narrative.trust.excludedRuns ?? 0) > 0}
                <span class="opacity-50">•</span>
                <span>{narrative.trust.excludedRuns} excluded</span>
            {/if}
        </div>
    {/if}

    <!-- Warnings -->
    {#if narrative.warnings.length > 0}
        <div class="space-y-2">
            {#each narrative.warnings as warning}
                <div class="flex items-start gap-2 text-xs themed-text-subtle bg-[color:var(--accent)]/5 rounded-lg p-2">
                    <svg class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <p>{warning}</p>
                </div>
            {/each}
        </div>
    {/if}

    <!-- Blocked/Caution Metrics -->
    {#if detailLevel === 'coach' && (narrative.trust.blockedMetrics.length > 0 || narrative.trust.cautionMetrics.length > 0)}
        <div class="text-xs space-y-1.5">
            {#if narrative.trust.blockedMetrics.length > 0}
                <div class="flex items-center gap-2 themed-text-subtle">
                    <span class="opacity-60">⛔</span>
                    <span>Blocked: {narrative.trust.blockedMetrics.join(', ')}</span>
                </div>
            {/if}
            {#if narrative.trust.cautionMetrics.length > 0}
                <div class="flex items-center gap-2 themed-text-subtle">
                    <span class="opacity-60">⚠️</span>
                    <span>Use with caution: {narrative.trust.cautionMetrics.join(', ')}</span>
                </div>
            {/if}
        </div>
    {/if}
</div>

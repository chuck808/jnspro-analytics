<script lang="ts">
    interface DiagnosticPattern {
        issue: string;
        occurrences: number;
        lastSeen: string;
        tone: 'positive' | 'warning' | 'neutral';
    }
    
    interface Props {
        patterns: DiagnosticPattern[];
    }
    
    let { patterns }: Props = $props();
    
    function getToneColor(tone: 'positive' | 'warning' | 'neutral') {
        switch (tone) {
            case 'positive': return '#3de8c8';
            case 'warning': return '#ff6b3d';
            case 'neutral': return '#f5a623';
            default: return '#999';
        }
    }
    
    function getToneIcon(tone: 'positive' | 'warning' | 'neutral') {
        switch (tone) {
            case 'positive': return '✅';
            case 'warning': return '⚠️';
            case 'neutral': return 'ℹ️';
            default: return '•';
        }
    }
    
    function formatDate(dateString: string) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
</script>

<div class="themed-card rounded-xl p-5">
    <div class="mb-4">
        <h3 class="text-base font-bold themed-text-primary mb-2">
            Recurring Patterns
        </h3>
        <p class="text-xs themed-text-subtle">
            Insights that have appeared multiple times across your last 10 sessions
        </p>
    </div>
    
    {#if patterns.length === 0}
        <div class="py-8 text-center">
            <p class="text-sm themed-text-subtle">
                No recurring patterns detected yet. Complete more sessions to see trends.
            </p>
        </div>
    {:else}
        <div class="space-y-3">
            {#each patterns as pattern}
                <div 
                    class="border-l-4 rounded-lg p-4 themed-nested-card"
                    style="border-color: {getToneColor(pattern.tone)};">
                    <div class="flex items-start justify-between gap-3">
                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="text-lg">{getToneIcon(pattern.tone)}</span>
                                <p class="text-sm font-semibold themed-text-primary">
                                    {pattern.issue}
                                </p>
                            </div>
                            <p class="text-xs themed-text-subtle">
                                Last seen: {formatDate(pattern.lastSeen)}
                            </p>
                        </div>
                        <div class="flex-shrink-0">
                            <div 
                                class="px-3 py-1 rounded-full text-xs font-bold"
                                style="background-color: {getToneColor(pattern.tone)}20; color: {getToneColor(pattern.tone)};">
                                {pattern.occurrences}x
                            </div>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
        
        <div class="mt-4 pt-4 border-t border-[color:var(--border)]">
            <p class="text-xs themed-text-subtle">
                💡 <span class="font-semibold">Tip:</span> Recurring warnings indicate areas that need consistent attention. 
                Work with your coach to address these patterns.
            </p>
        </div>
    {/if}
</div>

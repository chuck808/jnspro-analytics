<script lang="ts">
    interface SessionData {
        sessionId: string;
        timestamp: string;
        techniqueScores: any;
        insightPack: any;
        analysis: any;
    }
    
    interface Props {
        sessions: SessionData[];
    }
    
    let { sessions }: Props = $props();
    
    let bestSession = $derived.by(() => {
        if (sessions.length === 0) return null;
        
        // Find session with highest overall technique score
        const scored = sessions.filter(s => s.techniqueScores?.overall);
        if (scored.length === 0) return null;
        
        const best = scored.reduce((prev, current) => {
            return (current.techniqueScores.overall > prev.techniqueScores.overall) ? current : prev;
        });
        
        return {
            ...best,
            date: new Date(best.timestamp).toLocaleDateString('en-GB', { 
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
            }),
            strengths: best.insightPack?.strengths ?? [],
            quality: best.analysis?.intelligence?.sessionQuality ?? null,
            repeatability: best.analysis?.intelligence?.repeatability?.overall ?? null,
        };
    });
</script>

{#if bestSession}
    <div class="themed-card rounded-xl p-5">
        <div class="mb-4">
            <div class="flex items-center gap-2 mb-2">
                <span class="text-2xl">🏆</span>
                <h3 class="text-base font-bold themed-text-primary">
                    Best Session Analysis
                </h3>
            </div>
            <p class="text-xs themed-text-subtle">
                Insights from your highest-scoring session
            </p>
        </div>
        
        <div class="themed-nested-card rounded-lg p-4 mb-4">
            <div class="flex items-center justify-between mb-3">
                <div>
                    <p class="text-sm themed-text-subtle">Session Date</p>
                    <p class="text-base font-semibold themed-text-primary">
                        {bestSession.date}
                    </p>
                </div>
                <div class="text-right">
                    <p class="text-sm themed-text-subtle">Overall Score</p>
                    <p class="text-3xl font-bold text-[#3de8c8]">
                        {bestSession.techniqueScores.overall.toFixed(0)}
                    </p>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-3 pt-3 border-t border-[color:var(--border)]">
                <div>
                    <p class="text-xs themed-text-subtle mb-1">Session Quality</p>
                    <p class="text-lg font-semibold themed-text-primary">
                        {bestSession.quality !== null ? bestSession.quality.toFixed(0) : '—'}/100
                    </p>
                </div>
                <div>
                    <p class="text-xs themed-text-subtle mb-1">Repeatability</p>
                    <p class="text-lg font-semibold themed-text-primary">
                        {bestSession.repeatability !== null ? bestSession.repeatability.toFixed(0) : '—'}/100
                    </p>
                </div>
            </div>
        </div>
        
        {#if bestSession.strengths.length > 0}
            <div class="mb-4">
                <h4 class="text-xs font-semibold text-[#3de8c8] uppercase tracking-wider mb-2">
                    💪 What Made This Session Great
                </h4>
                <div class="flex flex-wrap gap-2">
                    {#each bestSession.strengths as strength}
                        <span class="px-3 py-1.5 rounded-full bg-[#3de8c8]/10 text-[#3de8c8] text-sm border border-[#3de8c8]/30">
                            {strength}
                        </span>
                    {/each}
                </div>
            </div>
        {/if}
        
        <div class="pt-4 border-t border-[color:var(--border)]">
            <p class="text-xs themed-text-subtle">
                💡 <span class="font-semibold">Tip:</span> Review this session to understand what conditions 
                and approach led to your best performance. Try to replicate these factors in future training.
            </p>
        </div>
        
        <div class="mt-3">
            <a 
                href="/sessions/{bestSession.sessionId}"
                class="inline-flex items-center gap-2 px-4 py-2 bg-[color:var(--accent)] hover:bg-[color:var(--accent-dark)]
                       text-[color:var(--bg)] text-sm font-semibold rounded-lg transition-colors">
                <span>View Full Session</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
            </a>
        </div>
    </div>
{:else}
    <div class="themed-card rounded-xl p-5">
        <p class="text-sm themed-text-subtle text-center py-4">
            Complete more sessions with full analysis to see your best session breakdown.
        </p>
    </div>
{/if}

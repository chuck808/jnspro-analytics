<script lang="ts">
    interface SessionInsights {
        sessionId: string;
        timestamp: string;
        strengths: string[];
        limiters: string[];
    }
    
    interface Props {
        sessionInsights: SessionInsights[];
    }
    
    let { sessionInsights }: Props = $props();
    
    // Analyze evolution
    let evolution = $derived.by(() => {
        if (sessionInsights.length < 2) return null;
        
        const allStrengths = new Map<string, number[]>();
        const allLimiters = new Map<string, number[]>();
        
        sessionInsights.forEach((session, index) => {
            session.strengths.forEach(strength => {
                if (!allStrengths.has(strength)) {
                    allStrengths.set(strength, []);
                }
                allStrengths.get(strength)!.push(index);
            });
            
            session.limiters.forEach(limiter => {
                if (!allLimiters.has(limiter)) {
                    allLimiters.set(limiter, []);
                }
                allLimiters.get(limiter)!.push(index);
            });
        });
        
        // Consistent strengths (appeared in most sessions)
        const consistentStrengths = Array.from(allStrengths.entries())
            .filter(([_, indices]) => indices.length >= Math.ceil(sessionInsights.length * 0.6))
            .map(([name, indices]) => ({ name, frequency: indices.length }))
            .sort((a, b) => b.frequency - a.frequency);
        
        // Resolved limiters (appeared early but not in recent sessions)
        const midpoint = Math.floor(sessionInsights.length / 2);
        const resolvedLimiters = Array.from(allLimiters.entries())
            .filter(([_, indices]) => {
                const appearedEarly = indices.some(i => i < midpoint);
                const appearedRecently = indices.some(i => i >= sessionInsights.length - 2);
                return appearedEarly && !appearedRecently;
            })
            .map(([name]) => name);
        
        // Persistent limiters (still showing up)
        const persistentLimiters = Array.from(allLimiters.entries())
            .filter(([_, indices]) => {
                const appearedRecently = indices.some(i => i >= sessionInsights.length - 2);
                return appearedRecently && indices.length >= 2;
            })
            .map(([name, indices]) => ({ name, frequency: indices.length }))
            .sort((a, b) => b.frequency - a.frequency);
        
        // Emerging strengths (appeared more recently)
        const emergingStrengths = Array.from(allStrengths.entries())
            .filter(([_, indices]) => {
                const firstAppearance = Math.min(...indices);
                return firstAppearance >= midpoint && indices.length >= 2;
            })
            .map(([name]) => name);
        
        return {
            consistentStrengths,
            emergingStrengths,
            resolvedLimiters,
            persistentLimiters
        };
    });
    
    function formatDate(dateString: string) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
</script>

<div class="themed-card rounded-xl p-5">
    <div class="mb-4">
        <h3 class="text-base font-bold themed-text-primary mb-2">
            Strengths & Limiters Evolution
        </h3>
        <p class="text-xs themed-text-subtle">
            Track how your strengths and areas for improvement change over time
        </p>
    </div>
    
    {#if !evolution || sessionInsights.length < 2}
        <div class="py-8 text-center">
            <p class="text-sm themed-text-subtle">
                Complete at least 2 sessions with analysis to see evolution patterns.
            </p>
        </div>
    {:else}
        <div class="space-y-4">
            <!-- Consistent Strengths -->
            {#if evolution.consistentStrengths.length > 0}
                <div>
                    <h4 class="text-xs font-semibold text-[#3de8c8] uppercase tracking-wider mb-2 flex items-center gap-2">
                        <span>💪</span>
                        <span>Consistent Strengths</span>
                    </h4>
                    <div class="flex flex-wrap gap-2">
                        {#each evolution.consistentStrengths as strength}
                            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#3de8c8]/10 
                                       text-[#3de8c8] text-sm border border-[#3de8c8]/30">
                                <span>{strength.name}</span>
                                <span class="text-xs opacity-70">({strength.frequency}/{sessionInsights.length})</span>
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}
            
            <!-- Emerging Strengths -->
            {#if evolution.emergingStrengths.length > 0}
                <div>
                    <h4 class="text-xs font-semibold text-[#4a9eff] uppercase tracking-wider mb-2 flex items-center gap-2">
                        <span>🌱</span>
                        <span>Emerging Strengths</span>
                    </h4>
                    <div class="flex flex-wrap gap-2">
                        {#each evolution.emergingStrengths as strength}
                            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4a9eff]/10 
                                       text-[#4a9eff] text-sm border border-[#4a9eff]/30">
                                {strength}
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}
            
            <!-- Resolved Limiters -->
            {#if evolution.resolvedLimiters.length > 0}
                <div>
                    <h4 class="text-xs font-semibold text-[#3de8c8] uppercase tracking-wider mb-2 flex items-center gap-2">
                        <span>✅</span>
                        <span>Resolved Issues</span>
                    </h4>
                    <div class="flex flex-wrap gap-2">
                        {#each evolution.resolvedLimiters as limiter}
                            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#3de8c8]/10 
                                       text-[#3de8c8] text-sm border border-[#3de8c8]/30 line-through opacity-70">
                                {limiter}
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}
            
            <!-- Persistent Limiters -->
            {#if evolution.persistentLimiters.length > 0}
                <div>
                    <h4 class="text-xs font-semibold text-[#ff6b3d] uppercase tracking-wider mb-2 flex items-center gap-2">
                        <span>🎯</span>
                        <span>Persistent Focus Areas</span>
                    </h4>
                    <div class="flex flex-wrap gap-2">
                        {#each evolution.persistentLimiters as limiter}
                            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ff6b3d]/10 
                                       text-[#ff6b3d] text-sm border border-[#ff6b3d]/30">
                                <span>{limiter.name}</span>
                                <span class="text-xs opacity-70">({limiter.frequency}/{sessionInsights.length})</span>
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}
        </div>
        
        <div class="mt-4 pt-4 border-t border-[color:var(--border)]">
            <p class="text-xs themed-text-subtle">
                💡 <span class="font-semibold">Insight:</span> Consistent strengths are your reliable foundation. 
                Persistent limiters need targeted training to improve.
            </p>
        </div>
    {/if}
</div>

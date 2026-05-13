<script lang="ts">
    /**
     * Session Comparison Modal
     * Compare two sessions side-by-side with delta calculations and insights
     */

    interface SessionSummary {
        id: string;
        timestamp: string;
        run_count: number;
        best_reaction_ms: number | null;
        avg_reaction_ms: number | null;
        best_max_g: number | null;
        best_peak_speed_ms: number | null;
        reaction_cv: number | null;
        bike_name?: string | null;
        weather?: string | null;
        surface?: string | null;
    }

    interface Props {
        session1: SessionSummary;
        session2: SessionSummary;
        open: boolean;
    }

    let { 
        session1,
        session2,
        open = $bindable() 
    }: Props = $props();

    // Calculate delta with direction indicator
    function calculateDelta(
        value1: number | null,
        value2: number | null,
        lowerIsBetter: boolean = false
    ): {
        absolute: number | null;
        percent: number | null;
        improved: boolean;
        color: string;
        arrow: string;
    } {
        if (value1 === null || value2 === null) {
            return { absolute: null, percent: null, improved: false, color: '#6b5f4d', arrow: '—' };
        }

        const absolute = value2 - value1;
        const percent = value1 !== 0 ? (absolute / value1) * 100 : 0;
        
        // Determine if this is an improvement
        const improved = lowerIsBetter 
            ? absolute < 0  // For reaction time, lower is better
            : absolute > 0; // For max G, speed, higher is better

        const color = improved ? '#3de8c8' : (absolute === 0 ? '#9a8f7a' : '#ff4444');
        const arrow = absolute > 0 ? '↑' : (absolute < 0 ? '↓' : '→');

        return { absolute, percent, improved, color, arrow };
    }

    // Comparison metrics
    let comparison = $derived.by(() => {
        return {
            reaction: calculateDelta(
                session1.best_reaction_ms,
                session2.best_reaction_ms,
                true // lower is better
            ),
            avgReaction: calculateDelta(
                session1.avg_reaction_ms,
                session2.avg_reaction_ms,
                true
            ),
            maxG: calculateDelta(
                session1.best_max_g,
                session2.best_max_g,
                false // higher is better
            ),
            speed: calculateDelta(
                session1.best_peak_speed_ms,
                session2.best_peak_speed_ms,
                false
            ),
            consistency: calculateDelta(
                session1.reaction_cv,
                session2.reaction_cv,
                true // lower CV = better consistency
            ),
        };
    });

    // Generate insights based on comparison
    let insights = $derived.by(() => {
        const messages: string[] = [];

        // Reaction time insight
        if (comparison.reaction.improved && comparison.reaction.percent !== null) {
            messages.push(
                `✅ Reaction time improved by ${Math.abs(comparison.reaction.percent).toFixed(1)}% ` +
                `(${Math.abs(comparison.reaction.absolute!).toFixed(0)}ms faster)`
            );
        } else if (comparison.reaction.absolute !== null && comparison.reaction.absolute > 10) {
            messages.push(
                `⚠️ Reaction time slower by ${comparison.reaction.absolute.toFixed(0)}ms ` +
                `— check warmup routine and focus`
            );
        }

        // Max G insight
        if (comparison.maxG.improved && comparison.maxG.percent !== null && Math.abs(comparison.maxG.percent) > 5) {
            messages.push(
                `💪 Explosive power increased ${comparison.maxG.percent.toFixed(1)}% ` +
                `— stronger initial stroke`
            );
        } else if (comparison.maxG.absolute !== null && comparison.maxG.absolute < -0.2) {
            messages.push(
                `📉 Peak G-force dropped by ${Math.abs(comparison.maxG.absolute).toFixed(2)}G ` +
                `— may indicate fatigue or technique change`
            );
        }

        // Consistency insight
        if (comparison.consistency.improved && comparison.consistency.absolute !== null) {
            messages.push(
                `🎯 Consistency improved — reaction time CV reduced by ${Math.abs(comparison.consistency.percent!).toFixed(1)}%`
            );
        } else if (comparison.consistency.absolute !== null && comparison.consistency.absolute > 1) {
            messages.push(
                `⚠️ More variable performance — CV increased by ${comparison.consistency.absolute.toFixed(1)}%`
            );
        }

        // Equipment change
        if (session1.bike_name && session2.bike_name && session1.bike_name !== session2.bike_name) {
            messages.push(
                `🔧 Equipment changed: ${session1.bike_name} → ${session2.bike_name}`
            );
        }

        // Environmental conditions
        if (session1.weather && session2.weather && session1.weather !== session2.weather) {
            messages.push(
                `🌤️ Conditions changed: ${session1.weather} → ${session2.weather}`
            );
        }

        return messages.length > 0 ? messages : ['No significant changes detected between sessions'];
    });

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    }

    function formatValue(value: number | null, decimals: number = 2, suffix: string = ''): string {
        return value !== null ? `${value.toFixed(decimals)}${suffix}` : '—';
    }

    function formatReaction(ms: number | null): string {
        return ms !== null ? `${(ms / 1000).toFixed(3)}s` : '—';
    }

    function formatSpeed(ms: number | null): string {
        return ms !== null ? `${(ms * 3.6).toFixed(1)} km/h` : '—';
    }

    function formatDelta(delta: typeof comparison.reaction, isMs: boolean = false, isSpeed: boolean = false): string {
        if (delta.absolute === null) return '—';
        
        const sign = delta.absolute > 0 ? '+' : '';
        
        if (isMs) {
            return `${sign}${delta.absolute.toFixed(0)}ms`;
        } else if (isSpeed) {
            return `${sign}${(delta.absolute * 3.6).toFixed(1)} km/h`;
        }
        
        return `${sign}${delta.absolute.toFixed(2)}`;
    }

    function close() {
        open = false;
    }
</script>

{#if open}
    <div class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4"
         role="button"
         tabindex="0"
         onclick={(e) => e.target === e.currentTarget && close()}
         onkeydown={(e) => (e.key === 'Escape' || (e.key === 'Enter' && e.target === e.currentTarget)) && close()}
         aria-label="Close comparison modal">
        <div class="w-full max-w-5xl my-8"
             role="dialog"
             tabindex="-1"
             aria-modal="true"
             aria-labelledby="comparison-title"
             onclick={(e) => e.stopPropagation()}
             onkeydown={(e) => e.stopPropagation()}>
            
            <!-- Header -->
            <div class="bg-[#131010] border-b border-[#221c18] rounded-t-xl px-5 py-4">
                <div class="flex items-center justify-between gap-4">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-[#f5a623]/10 flex items-center justify-center">
                            <svg class="w-4 h-4 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                            </svg>
                        </div>
                        <div>
                            <h2 id="comparison-title" class="text-base font-bold text-[#f0ece4]">Session Comparison</h2>
                            <p class="text-xs text-[#6b5f4d]">Side-by-side performance analysis</p>
                        </div>
                    </div>
                    <button
                        onclick={close}
                        class="w-8 h-8 flex items-center justify-center rounded-lg text-[#6b5f4d]
                               hover:text-[#f0ece4] hover:bg-[#221c18] transition-colors
                               focus:outline-none focus:ring-2 focus:ring-[#f5a623]"
                        aria-label="Close">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Content -->
            <div class="bg-[#131010] rounded-b-xl p-5 space-y-5">
                
                <!-- Session Headers -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-[#0a0809] border border-[#221c18] rounded-xl p-4">
                        <p class="text-xs text-[#6b5f4d] mb-1">Session 1 (Earlier)</p>
                        <p class="text-sm font-bold text-[#f0ece4]">{formatDate(session1.timestamp)}</p>
                        <p class="text-xs text-[#9a8f7a] mt-1">{session1.run_count} runs</p>
                        {#if session1.bike_name}
                            <p class="text-xs text-[#6b5f4d] mt-0.5">🚴 {session1.bike_name}</p>
                        {/if}
                    </div>
                    <div class="bg-[#0a0809] border border-[#221c18] rounded-xl p-4">
                        <p class="text-xs text-[#6b5f4d] mb-1">Session 2 (Later)</p>
                        <p class="text-sm font-bold text-[#f0ece4]">{formatDate(session2.timestamp)}</p>
                        <p class="text-xs text-[#9a8f7a] mt-1">{session2.run_count} runs</p>
                        {#if session2.bike_name}
                            <p class="text-xs text-[#6b5f4d] mt-0.5">🚴 {session2.bike_name}</p>
                        {/if}
                    </div>
                </div>

                <!-- Insights -->
                <div class="bg-[#f5a623]/10 border border-[#f5a623]/20 rounded-xl p-4">
                    <h3 class="text-sm font-semibold text-[#f5a623] mb-3">Key Changes</h3>
                    <div class="space-y-1.5">
                        {#each insights as insight}
                            <p class="text-sm text-[#f0ece4]">{insight}</p>
                        {/each}
                    </div>
                </div>

                <!-- Metric Comparisons -->
                <div class="space-y-3">
                    <h3 class="text-sm font-semibold text-[#f0ece4]">Performance Metrics</h3>
                    
                    <!-- Best Reaction Time -->
                    <div class="bg-[#0a0809] border border-[#221c18] rounded-xl p-4">
                        <div class="grid grid-cols-[1fr,auto,1fr] items-center gap-4">
                            <div class="text-right">
                                <p class="text-xs text-[#6b5f4d] mb-1">Session 1</p>
                                <p class="text-lg font-bold text-[#f0ece4]">{formatReaction(session1.best_reaction_ms)}</p>
                            </div>
                            <div class="flex flex-col items-center gap-1 min-w-[120px]">
                                <p class="text-xs font-medium text-[#9a8f7a]">Best Reaction</p>
                                <div class="flex items-center gap-2">
                                    <span class="text-2xl" style="color: {comparison.reaction.color}">{comparison.reaction.arrow}</span>
                                    <div class="text-center">
                                        <p class="text-sm font-bold" style="color: {comparison.reaction.color}">
                                            {formatDelta(comparison.reaction, true)}
                                        </p>
                                        {#if comparison.reaction.percent !== null}
                                            <p class="text-xs text-[#6b5f4d]">
                                                {Math.abs(comparison.reaction.percent).toFixed(1)}%
                                            </p>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <p class="text-xs text-[#6b5f4d] mb-1">Session 2</p>
                                <p class="text-lg font-bold text-[#f0ece4]">{formatReaction(session2.best_reaction_ms)}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Peak G-Force -->
                    <div class="bg-[#0a0809] border border-[#221c18] rounded-xl p-4">
                        <div class="grid grid-cols-[1fr,auto,1fr] items-center gap-4">
                            <div class="text-right">
                                <p class="text-xs text-[#6b5f4d] mb-1">Session 1</p>
                                <p class="text-lg font-bold text-[#f0ece4]">{formatValue(session1.best_max_g, 2, 'G')}</p>
                            </div>
                            <div class="flex flex-col items-center gap-1 min-w-[120px]">
                                <p class="text-xs font-medium text-[#9a8f7a]">Peak G-Force</p>
                                <div class="flex items-center gap-2">
                                    <span class="text-2xl" style="color: {comparison.maxG.color}">{comparison.maxG.arrow}</span>
                                    <div class="text-center">
                                        <p class="text-sm font-bold" style="color: {comparison.maxG.color}">
                                            {formatDelta(comparison.maxG)}
                                        </p>
                                        {#if comparison.maxG.percent !== null}
                                            <p class="text-xs text-[#6b5f4d]">
                                                {Math.abs(comparison.maxG.percent).toFixed(1)}%
                                            </p>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <p class="text-xs text-[#6b5f4d] mb-1">Session 2</p>
                                <p class="text-lg font-bold text-[#f0ece4]">{formatValue(session2.best_max_g, 2, 'G')}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Peak Speed -->
                    {#if session1.best_peak_speed_ms !== null && session2.best_peak_speed_ms !== null}
                        <div class="bg-[#0a0809] border border-[#221c18] rounded-xl p-4">
                            <div class="grid grid-cols-[1fr,auto,1fr] items-center gap-4">
                                <div class="text-right">
                                    <p class="text-xs text-[#6b5f4d] mb-1">Session 1</p>
                                    <p class="text-lg font-bold text-[#f0ece4]">{formatSpeed(session1.best_peak_speed_ms)}</p>
                                </div>
                                <div class="flex flex-col items-center gap-1 min-w-[120px]">
                                    <p class="text-xs font-medium text-[#9a8f7a]">Peak Speed</p>
                                    <div class="flex items-center gap-2">
                                        <span class="text-2xl" style="color: {comparison.speed.color}">{comparison.speed.arrow}</span>
                                        <div class="text-center">
                                            <p class="text-sm font-bold" style="color: {comparison.speed.color}">
                                                {formatDelta(comparison.speed, false, true)}
                                            </p>
                                            {#if comparison.speed.percent !== null}
                                                <p class="text-xs text-[#6b5f4d]">
                                                    {Math.abs(comparison.speed.percent).toFixed(1)}%
                                                </p>
                                            {/if}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <p class="text-xs text-[#6b5f4d] mb-1">Session 2</p>
                                    <p class="text-lg font-bold text-[#f0ece4]">{formatSpeed(session2.best_peak_speed_ms)}</p>
                                </div>
                            </div>
                        </div>
                    {/if}

                    <!-- Consistency -->
                    {#if session1.reaction_cv !== null && session2.reaction_cv !== null}
                        <div class="bg-[#0a0809] border border-[#221c18] rounded-xl p-4">
                            <div class="grid grid-cols-[1fr,auto,1fr] items-center gap-4">
                                <div class="text-right">
                                    <p class="text-xs text-[#6b5f4d] mb-1">Session 1</p>
                                    <p class="text-lg font-bold text-[#f0ece4]">{formatValue(session1.reaction_cv, 1, '%')}</p>
                                </div>
                                <div class="flex flex-col items-center gap-1 min-w-[120px]">
                                    <p class="text-xs font-medium text-[#9a8f7a]">Consistency (CV)</p>
                                    <div class="flex items-center gap-2">
                                        <span class="text-2xl" style="color: {comparison.consistency.color}">{comparison.consistency.arrow}</span>
                                        <div class="text-center">
                                            <p class="text-sm font-bold" style="color: {comparison.consistency.color}">
                                                {formatDelta(comparison.consistency, false, false)}%
                                            </p>
                                            <p class="text-xs text-[#6b5f4d]">Lower = Better</p>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <p class="text-xs text-[#6b5f4d] mb-1">Session 2</p>
                                    <p class="text-lg font-bold text-[#f0ece4]">{formatValue(session2.reaction_cv, 1, '%')}</p>
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>

                <!-- Close Button -->
                <div class="flex justify-end pt-2">
                    <button
                        onclick={close}
                        class="px-4 py-2 bg-[#221c18] hover:bg-[#2d2520] text-[#f0ece4] text-sm font-semibold
                               rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#f5a623]">
                        Close
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}

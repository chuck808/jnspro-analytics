<script lang="ts">
    interface Target {
        metric: string;
        current: number | null;
        target: number;
        unit: string;
        lowerIsBetter: boolean;
        description: string;
    }

    let { 
        reactionMs = null,
        maxG = null,
        techniqueScore = null,
        riderLevel = 'intermediate',
    }: { 
        reactionMs?: number | null;
        maxG?: number | null;
        techniqueScore?: number | null;
        riderLevel?: string;
    } = $props();

    // Define targets based on rider level
    const levelTargets: Record<string, { reaction: number; maxG: number; technique: number }> = {
        grom: { reaction: 350, maxG: 2.0, technique: 60 },
        intermediate: { reaction: 280, maxG: 2.3, technique: 70 },
        club: { reaction: 250, maxG: 2.5, technique: 75 },
        elite: { reaction: 220, maxG: 2.8, technique: 80 },
        pro: { reaction: 200, maxG: 3.0, technique: 85 },
    };

    const currentTargets = $derived(levelTargets[riderLevel] ?? levelTargets.intermediate);

    const targets = $derived<Target[]>([
        {
            metric: 'Reaction Time',
            current: reactionMs,
            target: currentTargets.reaction,
            unit: 'ms',
            lowerIsBetter: true,
            description: 'Time from gate drop to first pedal stroke',
        },
        {
            metric: 'Max G-Force',
            current: maxG,
            target: currentTargets.maxG,
            unit: 'G',
            lowerIsBetter: false,
            description: 'Peak acceleration during the start',
        },
        {
            metric: 'Technique Score',
            current: techniqueScore,
            target: currentTargets.technique,
            unit: '/100',
            lowerIsBetter: false,
            description: 'Overall technique quality rating',
        },
    ]);

    function calculateProgress(current: number | null, target: number, lowerIsBetter: boolean): {
        percent: number;
        status: 'met' | 'close' | 'needs-work';
        gap: number;
    } | null {
        if (current === null) return null;

        let percent: number;
        let gap: number;

        if (lowerIsBetter) {
            // For metrics where lower is better
            percent = Math.min(100, (target / current) * 100);
            gap = current - target;
        } else {
            // For metrics where higher is better
            percent = Math.min(100, (current / target) * 100);
            gap = target - current;
        }

        const status: 'met' | 'close' | 'needs-work' = 
            percent >= 100 ? 'met' :
            percent >= 90 ? 'close' :
            'needs-work';

        return { percent, status, gap };
    }

    const statusColors = {
        met: { bg: '#3de8c8', text: '#3de8c8', icon: '✓' },
        close: { bg: '#f5a623', text: '#f5a623', icon: '◐' },
        'needs-work': { bg: '#9a8f7a', text: '#9a8f7a', icon: '○' },
    };
</script>

<div class="bg-[#131010] border border-[#221c18] rounded-xl p-5">
    <div class="mb-4">
        <h3 class="text-sm font-semibold text-[#f0ece4] mb-1">🎯 Performance Targets</h3>
        <p class="text-xs text-[#6b5f4d]">Personalized goals for {riderLevel} level riders</p>
    </div>

    <div class="space-y-4">
        {#each targets as target}
            {@const progress = calculateProgress(target.current, target.target, target.lowerIsBetter)}
            <div class="bg-[#0a0809] rounded-lg p-4 border border-[#221c18]">
                <div class="flex items-start justify-between mb-2">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <p class="text-sm font-semibold text-[#f0ece4]">{target.metric}</p>
                            {#if progress}
                                <span class="text-xs font-bold px-2 py-0.5 rounded"
                                      style="background:{statusColors[progress.status].bg}20; color:{statusColors[progress.status].text}">
                                    {statusColors[progress.status].icon} {progress.status === 'met' ? 'Target Met!' : progress.status === 'close' ? 'Close' : 'In Progress'}
                                </span>
                            {/if}
                        </div>
                        <p class="text-xs text-[#6b5f4d] mb-3">{target.description}</p>
                    </div>
                </div>

                <!-- Progress Bar -->
                {#if progress}
                    <div class="mb-2">
                        <div class="w-full bg-[#221c18] rounded-full h-2 overflow-hidden">
                            <div
                                class="h-2 rounded-full transition-all duration-500"
                                style="width:{progress.percent}%; background:{statusColors[progress.status].bg}"
                            ></div>
                        </div>
                    </div>
                {/if}

                <!-- Current vs Target -->
                <div class="flex items-center justify-between text-xs">
                    <div>
                        <span class="text-[#6b5f4d]">Current:</span>
                        <span class="ml-1 font-mono font-bold text-[#f0ece4]">
                            {target.current !== null ? `${target.current.toFixed(target.unit === 'ms' ? 0 : 1)}${target.unit}` : '—'}
                        </span>
                    </div>
                    <div>
                        <span class="text-[#6b5f4d]">Target:</span>
                        <span class="ml-1 font-mono font-bold text-[#f5a623]">
                            {target.target}{target.unit}
                        </span>
                    </div>
                    {#if progress && progress.gap !== 0}
                        <div>
                            <span class="text-[#6b5f4d]">Gap:</span>
                            <span class="ml-1 font-mono font-bold"
                                  style="color:{progress.status === 'met' ? statusColors.met.text : statusColors['needs-work'].text}">
                                {progress.status === 'met' ? '-' : (target.lowerIsBetter ? '+' : '')}{Math.abs(progress.gap).toFixed(target.unit === 'ms' ? 0 : 1)}{target.unit}
                            </span>
                        </div>
                    {/if}
                </div>

                <!-- Advice -->
                {#if progress && progress.status !== 'met'}
                    <div class="mt-3 pt-3 border-t border-[#221c18]">
                        <p class="text-xs text-[#9a8f7a]">
                            {#if target.metric === 'Reaction Time'}
                                Focus on anticipation drills and consistent gate starts
                            {:else if target.metric === 'Max G-Force'}
                                Work on explosive power and first pedal stroke technique
                            {:else if target.metric === 'Technique Score'}
                                Review weaknesses and focus on smoothness and efficiency
                            {/if}
                        </p>
                    </div>
                {/if}
            </div>
        {/each}
    </div>

    <div class="mt-4 p-3 bg-[#0a0809] rounded-lg border border-[#221c18]">
        <p class="text-xs text-[#9a8f7a]">
            💡 <strong class="text-[#f0ece4]">Tip:</strong> Targets are based on typical performance for {riderLevel} level riders. 
            Adjust your profile settings to see personalized goals.
        </p>
    </div>
</div>

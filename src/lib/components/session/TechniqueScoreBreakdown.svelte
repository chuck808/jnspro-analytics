<script lang="ts">
    import type { TechniqueScoreBreakdown as TechniqueScoreBreakdownType } from '$lib/performance-engine/techniqueScoring';
    
    interface Props {
        scores: TechniqueScoreBreakdownType;
        showLabels?: boolean;
        compact?: boolean;
    }
    
    let { scores, showLabels = true, compact = false }: Props = $props();
    
    const dimensions = [
        { key: 'launchQuality', label: 'Launch Quality', icon: '🚀', description: 'Reaction time & initial drive',
          basis: 'measured', basisNote: 'From measured reaction time' },
        { key: 'explosiveness', label: 'Explosiveness', icon: '💥', description: 'Peak power & acceleration',
          basis: 'measured', basisNote: 'From peak G-force' },
        { key: 'speedCarry', label: 'Speed Carry', icon: '⚡', description: 'Maintaining velocity',
          basis: 'derived', basisNote: 'Derived from IMU speed estimate' },
        { key: 'smoothness', label: 'Smoothness', icon: '〰️', description: 'Force application consistency',
          basis: 'derived', basisNote: 'Derived from jerk analysis' },
        { key: 'impulseTiming', label: 'Impulse Timing', icon: '⏱️', description: 'Force application timing',
          basis: 'derived', basisNote: 'Derived from G-force integration' },
        { key: 'repeatability', label: 'Repeatability', icon: '🔁', description: 'Run-to-run consistency',
          basis: 'derived', basisNote: 'Derived from reaction time spread' },
    ];
    
    function getScoreColor(score: number | null) {
        if (score === null || score === undefined) return '#6b5f4d';
        if (score >= 80) return '#3de8c8';
        if (score >= 60) return '#f5a623';
        if (score >= 40) return '#ff6b3d';
        return '#ff4444';
    }
    
    function getScoreLabel(score: number | null): string {
        if (score === null || score === undefined) return 'Unknown';
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Developing';
        return 'Needs Work';
    }
</script>

<div class="grid grid-cols-1 {compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'} gap-4">
    {#each dimensions as dimension}
        {@const score = scores[dimension.key as keyof typeof scores] as number | null}
        {@const label = scores.labels?.[dimension.key as keyof typeof scores.labels]}
        {@const color = getScoreColor(score)}
        
        <div class="themed-nested-card rounded-lg p-4 border border-[color:var(--border)] transition-all" style="border-color: {color}33;">
            <!-- Header -->
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                    <span class="text-xl">{dimension.icon}</span>
                    <div>
                        <h4 class="text-sm font-semibold themed-text-primary">{dimension.label}</h4>
                        {#if !compact}
                            <p class="text-[10px] themed-text-subtle">{dimension.description}</p>
                        {/if}
                    </div>
                </div>
            </div>
            
            <!-- Score Display -->
            <div class="flex items-end justify-between mb-2">
                <div>
                    <div class="flex items-baseline gap-1">
                        <span class="text-3xl font-bold" style="color: {color}">
                            {score ?? '—'}
                        </span>
                        {#if score !== null}
                            <span class="text-sm themed-text-subtle">/100</span>
                        {/if}
                    </div>
                    {#if showLabels && label}
                        <p class="text-xs font-medium mt-1" style="color: {color}">
                            {label.charAt(0).toUpperCase() + label.slice(1)}
                        </p>
                    {:else if showLabels && score !== null}
                        <p class="text-xs font-medium mt-1" style="color: {color}">
                            {getScoreLabel(score)}
                        </p>
                    {/if}
                </div>
                
                <!-- Mini gauge -->
                <div class="w-16 h-16">
                    <svg viewBox="0 0 36 36" class="w-full h-full -rotate-90">
                        <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--border)" stroke-width="2.5"/>
                        {#if score !== null}
                            <circle 
                                cx="18" 
                                cy="18" 
                                r="15.9155" 
                                fill="none"
                                stroke={color}
                                stroke-width="2.5" 
                                stroke-linecap="round"
                                stroke-dasharray="{(score / 100) * 100} 100"
                            />
                        {/if}
                    </svg>
                </div>
            </div>
            
            <!-- Progress Bar -->
            <div class="w-full bg-[color:var(--border)] rounded-full h-1.5 overflow-hidden">
                {#if score !== null}
                    <div 
                        class="h-1.5 rounded-full transition-all duration-500"
                        style="width: {score}%; background: {color};"
                    ></div>
                {/if}
            </div>

            <!-- Metric basis -->
            {#if !compact}
                <p class="text-[10px] themed-text-subtle mt-2 flex items-center gap-1">
                    <span class="opacity-60">{dimension.basis === 'measured' ? '📡' : '∫'}</span>
                    {dimension.basisNote}
                </p>
            {/if}
        </div>
    {/each}
</div>

{#if !compact}
    <div class="mt-4 flex items-center gap-4 text-xs themed-text-subtle">
        <div class="flex items-center gap-1.5">
            <div class="w-3 h-3 rounded-full bg-[#3de8c8]"></div>
            <span>Excellent (80+)</span>
        </div>
        <div class="flex items-center gap-1.5">
            <div class="w-3 h-3 rounded-full bg-[#f5a623]"></div>
            <span>Good (60-79)</span>
        </div>
        <div class="flex items-center gap-1.5">
            <div class="w-3 h-3 rounded-full bg-[#ff6b3d]"></div>
            <span>Developing (40-59)</span>
        </div>
        <div class="flex items-center gap-1.5">
            <div class="w-3 h-3 rounded-full bg-[#ff4444]"></div>
            <span>Needs Work (&lt;40)</span>
        </div>
    </div>
{/if}
<script lang="ts">
    interface SessionData {
        sessionId: string;
        timestamp: string;
        techniqueScores: any;
    }
    
    interface Props {
        sessions: SessionData[];
    }
    
    let { sessions }: Props = $props();
    
    // Track benchmark achievements over time
    let achievements = $derived.by(() => {
        const levels = ['excellent', 'good', 'developing'];
        const thresholds = { excellent: 80, good: 60, developing: 40 };
        
        const results = levels.map(level => {
            const threshold = thresholds[level as keyof typeof thresholds];
            const achieved = sessions.filter(s => 
                s.techniqueScores?.overall && s.techniqueScores.overall >= threshold
            ).length;
            
            return {
                level,
                threshold,
                achieved,
                total: sessions.length,
                percentage: sessions.length > 0 ? (achieved / sessions.length) * 100 : 0,
            };
        });
        
        return results;
    });
    
    // Recent milestone
    let recentMilestone = $derived.by(() => {
        const recentSessions = sessions.slice(-5);
        const excellentCount = recentSessions.filter(s => 
            s.techniqueScores?.overall && s.techniqueScores.overall >= 80
        ).length;
        
        if (excellentCount >= 3) {
            return {
                text: `Achieved Excellent in ${excellentCount}/5 recent sessions! 🎉`,
                color: '#3de8c8',
            };
        }
        
        const goodCount = recentSessions.filter(s => 
            s.techniqueScores?.overall && s.techniqueScores.overall >= 60
        ).length;
        
        if (goodCount >= 4) {
            return {
                text: `Achieved Good or better in ${goodCount}/5 recent sessions`,
                color: '#f5a623',
            };
        }
        
        return null;
    });
    
    function getLevelColor(level: string) {
        switch (level) {
            case 'excellent': return '#3de8c8';
            case 'good': return '#f5a623';
            case 'developing': return '#ff6b3d';
            default: return '#6b5f4d';
        }
    }
    
    function getLevelIcon(level: string) {
        switch (level) {
            case 'excellent': return '🏆';
            case 'good': return '⭐';
            case 'developing': return '📈';
            default: return '•';
        }
    }
</script>

<div class="themed-card rounded-xl p-5">
    <div class="mb-4">
        <h3 class="text-base font-bold themed-text-primary mb-2">
            Performance Level Achievement
        </h3>
        <p class="text-xs themed-text-subtle">
            Track how often you reach each performance benchmark
        </p>
    </div>
    
    {#if sessions.length > 0}
        <div class="space-y-4">
            {#each achievements as achievement}
                {@const color = getLevelColor(achievement.level)}
                {@const icon = getLevelIcon(achievement.level)}
                
                <div>
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                            <span class="text-xl">{icon}</span>
                            <span class="text-sm font-semibold capitalize themed-text-primary">
                                {achievement.level}
                            </span>
                            <span class="text-xs themed-text-subtle">
                                ({achievement.threshold}+)
                            </span>
                        </div>
                        <div class="text-right">
                            <span class="text-sm font-bold themed-text-primary">
                                {achievement.achieved}/{achievement.total}
                            </span>
                            <span class="text-xs themed-text-subtle ml-2">
                                ({achievement.percentage.toFixed(0)}%)
                            </span>
                        </div>
                    </div>
                    
                    <!-- Progress bar -->
                    <div class="w-full h-2 rounded-full bg-[color:var(--card-nested)] overflow-hidden">
                        <div 
                            class="h-full transition-all duration-500 rounded-full"
                            style="width: {achievement.percentage}%; background-color: {color};"></div>
                    </div>
                </div>
            {/each}
        </div>
        
        {#if recentMilestone}
            <div 
                class="mt-4 p-4 rounded-lg"
                style="background-color: {recentMilestone.color}20; border: 1px solid {recentMilestone.color}30;">
                <p 
                    class="text-sm font-semibold text-center"
                    style="color: {recentMilestone.color};">
                    {recentMilestone.text}
                </p>
            </div>
        {/if}
        
        <div class="mt-4 pt-4 border-t border-[color:var(--border)]">
            <p class="text-xs themed-text-subtle">
                💡 <span class="font-semibold">Goal:</span> Aim for consistent "Excellent" performances (80+) 
                to demonstrate mastery. Track your progression over time.
            </p>
        </div>
    {:else}
        <p class="text-sm themed-text-subtle text-center py-4">
            Complete sessions to track your benchmark achievements.
        </p>
    {/if}
</div>

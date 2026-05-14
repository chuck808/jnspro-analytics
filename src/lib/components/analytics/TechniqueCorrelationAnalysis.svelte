<script lang="ts">
    interface SessionData {
        techniqueScores: any;
        insightPack: any;
    }
    
    interface Props {
        sessions: SessionData[];
    }
    
    let { sessions }: Props = $props();
    
    const dimensions = ['reaction', 'explosiveness', 'smoothness', 'efficiency'];
    
    // Calculate correlation between dimensions
    let correlations = $derived.by(() => {
        if (sessions.length < 5) return [];
        
        const results: any[] = [];
        
        // Check each pair of dimensions
        for (let i = 0; i < dimensions.length; i++) {
            for (let j = i + 1; j < dimensions.length; j++) {
                const dim1 = dimensions[i];
                const dim2 = dimensions[j];
                
                // Get data points
                const points = sessions
                    .filter(s => s.insightPack?.scores?.[dim1] && s.insightPack?.scores?.[dim2])
                    .map(s => ({
                        x: s.insightPack.scores[dim1],
                        y: s.insightPack.scores[dim2],
                    }));
                
                if (points.length < 3) continue;
                
                // Calculate correlation coefficient
                const n = points.length;
                const sumX = points.reduce((sum, p) => sum + p.x, 0);
                const sumY = points.reduce((sum, p) => sum + p.y, 0);
                const sumXY = points.reduce((sum, p) => sum + (p.x * p.y), 0);
                const sumX2 = points.reduce((sum, p) => sum + (p.x * p.x), 0);
                const sumY2 = points.reduce((sum, p) => sum + (p.y * p.y), 0);
                
                const numerator = (n * sumXY) - (sumX * sumY);
                const denominator = Math.sqrt(((n * sumX2) - (sumX * sumX)) * ((n * sumY2) - (sumY * sumY)));
                
                const correlation = denominator !== 0 ? numerator / denominator : 0;
                
                // Only show strong correlations
                if (Math.abs(correlation) > 0.4) {
                    results.push({
                        dim1,
                        dim2,
                        correlation,
                        strength: Math.abs(correlation),
                    });
                }
            }
        }
        
        return results.sort((a, b) => b.strength - a.strength);
    });
    
    function formatDimensionName(dim: string) {
        return dim.charAt(0).toUpperCase() + dim.slice(1);
    }
    
    function getCorrelationColor(correlation: number) {
        if (correlation > 0.6) return '#3de8c8';
        if (correlation > 0.4) return '#f5a623';
        return '#ff6b3d';
    }
    
    function getInsight(dim1: string, dim2: string, correlation: number) {
        const positive = correlation > 0;
        const verb = positive ? 'tends to improve' : 'may affect';
        return `When ${formatDimensionName(dim1)} improves, ${formatDimensionName(dim2)} ${verb}`;
    }
</script>

<div class="themed-card rounded-xl p-5">
    <div class="mb-4">
        <h3 class="text-base font-bold themed-text-primary mb-2">
            Technique Dimension Relationships
        </h3>
        <p class="text-xs themed-text-subtle">
            Discover how different aspects of your technique influence each other
        </p>
    </div>
    
    {#if sessions.length < 5}
        <div class="py-8 text-center">
            <p class="text-sm themed-text-subtle">
                Complete at least 5 sessions with technique analysis to see correlation insights.
            </p>
        </div>
    {:else if correlations.length === 0}
        <div class="py-8 text-center">
            <p class="text-sm themed-text-subtle">
                No strong correlations detected yet. Keep training to reveal patterns.
            </p>
        </div>
    {:else}
        <div class="space-y-3">
            {#each correlations as corr}
                {@const color = getCorrelationColor(corr.correlation)}
                
                <div class="themed-nested-card rounded-lg p-4">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                            <div 
                                class="w-2 h-2 rounded-full"
                                style="background-color: {color};"></div>
                            <span class="text-sm font-semibold themed-text-primary">
                                {formatDimensionName(corr.dim1)} ↔️ {formatDimensionName(corr.dim2)}
                            </span>
                        </div>
                        <span 
                            class="text-sm font-bold"
                            style="color: {color};">
                            {(corr.correlation * 100).toFixed(0)}%
                        </span>
                    </div>
                    
                    <p class="text-xs themed-text-subtle">
                        {getInsight(corr.dim1, corr.dim2, corr.correlation)}
                    </p>
                    
                    <!-- Strength indicator -->
                    <div class="mt-2 w-full h-1 rounded-full bg-[color:var(--card)] overflow-hidden">
                        <div 
                            class="h-full rounded-full transition-all"
                            style="width: {corr.strength * 100}%; background-color: {color};"></div>
                    </div>
                </div>
            {/each}
        </div>
        
        <div class="mt-4 pt-4 border-t border-[color:var(--border)]">
            <p class="text-xs themed-text-subtle">
                💡 <span class="font-semibold">Training Tip:</span> Focus on areas with strong correlations - 
                improving one dimension can naturally boost related areas.
            </p>
        </div>
    {/if}
</div>

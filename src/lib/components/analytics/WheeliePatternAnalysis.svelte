<script lang="ts">
  /**
   * Wheelie Pattern Analysis Component
   * Shows front wheel lift patterns and their impact on performance
   */

  interface WheelieDataPoint {
    sessionDate: string;
    sessionNumber: number;
    wheelieRate: number; // % of runs with front wheel lift
    avgReactionMs: number | null;
    avgReactionWithWheelieMs: number | null;
    avgReactionWithoutWheelieMs: number | null;
  }

  interface Props {
    data: WheelieDataPoint[];
    isMobile?: boolean;
  }

  let { data, isMobile = false }: Props = $props();

  // Calculate wheelie pattern insights
  let wheelieInsights = $derived.by(() => {
    if (data.length === 0) return null;
    
    const avgWheelieRate = data.reduce((sum, d) => sum + d.wheelieRate, 0) / data.length;
    
    // Check if wheelies correlate with better/worse performance
    const sessionsWithData = data.filter(d => 
      d.avgReactionWithWheelieMs !== null && 
      d.avgReactionWithoutWheelieMs !== null
    );
    
    let wheelieImpact: 'faster' | 'slower' | 'neutral' | null = null;
    let avgDifference = 0;
    
    if (sessionsWithData.length > 0) {
      const differences = sessionsWithData.map(d => 
        d.avgReactionWithWheelieMs! - d.avgReactionWithoutWheelieMs!
      );
      avgDifference = differences.reduce((a, b) => a + b, 0) / differences.length;
      
      if (avgDifference < -10) wheelieImpact = 'faster';
      else if (avgDifference > 10) wheelieImpact = 'slower';
      else wheelieImpact = 'neutral';
    }
    
    return {
      avgWheelieRate: Math.round(avgWheelieRate),
      wheelieImpact,
      avgDifference: Math.abs(Math.round(avgDifference)),
      recentTrend: data.length >= 3 
        ? (data.slice(-3).reduce((sum, d) => sum + d.wheelieRate, 0) / 3) -
          (data.slice(0, 3).reduce((sum, d) => sum + d.wheelieRate, 0) / 3)
        : null
    };
  });
</script>

<div class="bg-[#131010] border border-[#221c18] rounded-xl p-5">
  <div class="flex items-start justify-between gap-4 mb-4">
    <div>
      <h3 class="text-sm font-semibold text-[#f0ece4]">Wheelie Pattern Analysis</h3>
      <p class="text-xs text-[#6b5f4d] mt-1">Front wheel lift frequency & performance impact</p>
    </div>
    {#if wheelieInsights}
      <div class="text-right">
        <div class="text-xs text-[#6b5f4d]">Wheelie Rate</div>
        <div class="text-2xl font-bold text-[#f5a623]">{wheelieInsights.avgWheelieRate}%</div>
        <div class="text-xs text-[#9a8f7a]">of runs</div>
      </div>
    {/if}
  </div>

  {#if wheelieInsights}
    <!-- Wheelie rate visualization -->
    <div class="mb-4">
      <div class="flex items-end gap-1 h-32">
        {#each data as point}
          {@const height = (point.wheelieRate / 100) * 100}
          <div class="flex-1 flex flex-col items-center gap-1">
            <span class="text-[9px] text-[#6b5f4d]">{point.wheelieRate}%</span>
            <div class="w-full rounded-t transition-all bg-[#f5a623]"
                 style="height:{height}%; min-height:4px">
            </div>
            <span class="text-[9px] text-[#6b5f4d] rotate-45 origin-top-left whitespace-nowrap mt-1">
              {point.sessionDate}
            </span>
          </div>
        {/each}
      </div>
    </div>

    <!-- Performance impact analysis -->
    {#if wheelieInsights.wheelieImpact}
      <div class="space-y-3">
        <div class="p-3 rounded-lg {
          wheelieInsights.wheelieImpact === 'faster' ? 'bg-[#3de8c8]/10 border border-[#3de8c8]/20' :
          wheelieInsights.wheelieImpact === 'slower' ? 'bg-[#ff4444]/10 border border-[#ff4444]/20' :
          'bg-[#f5a623]/10 border border-[#f5a623]/20'
        }">
          <div class="flex items-start gap-2">
            <span class="text-lg">
              {#if wheelieInsights.wheelieImpact === 'faster'}🚀
              {:else if wheelieInsights.wheelieImpact === 'slower'}⚠️
              {:else}➡️
              {/if}
            </span>
            <div class="flex-1">
              <p class="text-sm font-semibold {
                wheelieInsights.wheelieImpact === 'faster' ? 'text-[#3de8c8]' :
                wheelieInsights.wheelieImpact === 'slower' ? 'text-[#ff4444]' :
                'text-[#f5a623]'
              }">
                {#if wheelieInsights.wheelieImpact === 'faster'}
                  Wheelies correlate with faster reactions
                {:else if wheelieInsights.wheelieImpact === 'slower'}
                  Wheelies correlate with slower reactions
                {:else}
                  Wheelies have no clear performance impact
                {/if}
              </p>
              <p class="text-xs text-[#9a8f7a] mt-1">
                {#if wheelieInsights.wheelieImpact === 'faster'}
                  Runs with front wheel lift are ~{wheelieInsights.avgDifference}ms faster on average
                {:else if wheelieInsights.wheelieImpact === 'slower'}
                  Runs with front wheel lift are ~{wheelieInsights.avgDifference}ms slower on average
                {:else}
                  No significant difference in reaction times with/without wheelies
                {/if}
              </p>
            </div>
          </div>
        </div>

        {#if wheelieInsights.recentTrend !== null}
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="p-2 bg-[#0a0809] rounded border border-[#221c18]">
              <div class="text-[#6b5f4d] mb-1">Recent trend</div>
              <div class="text-[#f0ece4] font-semibold">
                {#if wheelieInsights.recentTrend > 5}
                  More wheelies lately
                {:else if wheelieInsights.recentTrend < -5}
                  Fewer wheelies lately
                {:else}
                  Consistent pattern
                {/if}
              </div>
            </div>
            <div class="p-2 bg-[#0a0809] rounded border border-[#221c18]">
              <div class="text-[#6b5f4d] mb-1">Recommendation</div>
              <div class="text-[#f0ece4] font-semibold">
                {#if wheelieInsights.wheelieImpact === 'faster'}
                  Keep using wheelies
                {:else if wheelieInsights.wheelieImpact === 'slower'}
                  Try controlled starts
                {:else}
                  Test both techniques
                {/if}
              </div>
            </div>
          </div>
        {/if}
      </div>
    {:else}
      <p class="text-xs text-[#6b5f4d] italic">
        Need more varied session data to determine wheelie impact on performance
      </p>
    {/if}
  {/if}
</div>

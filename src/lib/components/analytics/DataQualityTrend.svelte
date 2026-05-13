<script lang="ts">
  /**
   * Data Quality Trend Component
   * Tracks sensor calibration and data reliability across sessions
   */

  interface DataQualityPoint {
    sessionDate: string;
    sessionNumber: number;
    biasCorrection: number | null;
    qualityRating: 'excellent' | 'good' | 'fair' | 'calibrate' | 'unknown';
    analyticsValid: boolean;
  }

  interface Props {
    data: DataQualityPoint[];
    isMobile?: boolean;
  }

  let { data, isMobile = false }: Props = $props();

  // Quality score mapping
  const qualityScores = {
    excellent: 100,
    good: 75,
    fair: 50,
    calibrate: 25,
    unknown: 0
  };

  const qualityColors = {
    excellent: '#3de8c8',
    good: '#f5a623',
    fair: '#ffcc44',
    calibrate: '#ff4444',
    unknown: '#6b5f4d'
  };

  // Calculate average bias correction trend
  let biasTrend = $derived.by(() => {
    const validBias = data.filter(d => d.biasCorrection !== null);
    if (validBias.length < 2) return null;
    
    const first = validBias.slice(0, Math.min(5, validBias.length));
    const last = validBias.slice(-Math.min(5, validBias.length));
    
    const firstAvg = first.reduce((a, b) => a + Math.abs(b.biasCorrection!), 0) / first.length;
    const lastAvg = last.reduce((a, b) => a + Math.abs(b.biasCorrection!), 0) / last.length;
    
    const change = lastAvg - firstAvg;
    
    return {
      direction: change > 0.5 ? 'worsening' : change < -0.5 ? 'improving' : 'stable',
      current: lastAvg.toFixed(2),
      change: change.toFixed(2)
    };
  });

  // Quality distribution
  let qualityStats = $derived.by(() => {
    const ratings = data.map(d => d.qualityRating);
    const total = ratings.length;
    
    return {
      excellent: Math.round((ratings.filter(r => r === 'excellent').length / total) * 100),
      good: Math.round((ratings.filter(r => r === 'good').length / total) * 100),
      fair: Math.round((ratings.filter(r => r === 'fair').length / total) * 100),
      needsCalibration: Math.round((ratings.filter(r => r === 'calibrate').length / total) * 100),
    };
  });
</script>

<div class="bg-[#131010] border border-[#221c18] rounded-xl p-5">
  <div class="flex items-start justify-between gap-4 mb-4">
    <div>
      <h3 class="text-sm font-semibold text-[#f0ece4]">Sensor Data Quality</h3>
      <p class="text-xs text-[#6b5f4d] mt-1">Calibration stability & data reliability</p>
    </div>
    {#if biasTrend}
      <div class="text-right">
        <div class="text-xs text-[#6b5f4d]">Avg Bias</div>
        <div class="text-lg font-bold" style="color:{
          biasTrend.direction === 'worsening' ? '#ff4444' :
          biasTrend.direction === 'improving' ? '#3de8c8' : '#f5a623'
        }">{biasTrend.current} m/s²</div>
        <div class="text-xs {
          biasTrend.direction === 'worsening' ? 'text-[#ff4444]' :
          biasTrend.direction === 'improving' ? 'text-[#3de8c8]' : 'text-[#9a8f7a]'
        }">
          {biasTrend.direction}
        </div>
      </div>
    {/if}
  </div>

  <!-- Session quality timeline -->
  <div class="mb-4">
    <div class="flex items-center justify-between mb-3">
      <p class="text-xs text-[#6b5f4d]">Quality per session</p>
      <div class="flex items-center gap-2 text-xs">
        {#each [
          { label: 'Excellent', color: qualityColors.excellent },
          { label: 'Good', color: qualityColors.good },
          { label: 'Fair', color: qualityColors.fair },
          { label: 'Calibrate', color: qualityColors.calibrate },
        ] as legend}
          <div class="flex items-center gap-1">
            <div class="w-2 h-2 rounded-full" style="background:{legend.color}"></div>
            <span class="text-[#9a8f7a]">{legend.label}</span>
          </div>
        {/each}
      </div>
    </div>
    
    <!-- Session badges grid -->
    <div class="flex flex-wrap gap-2">
      {#each data as session}
        <div class="flex flex-col items-center gap-1 group">
          <div 
            class="w-10 h-10 rounded-lg flex items-center justify-center border-2 transition-transform group-hover:scale-110"
            style="
              background:{qualityColors[session.qualityRating]}20; 
              border-color:{qualityColors[session.qualityRating]};
            "
            title="{session.sessionDate}: {session.qualityRating} (bias: {session.biasCorrection?.toFixed(2) ?? 'N/A'} m/s²)"
          >
            <span class="text-xs font-bold" style="color:{qualityColors[session.qualityRating]}">
              {#if session.qualityRating === 'excellent'}✓
              {:else if session.qualityRating === 'good'}•
              {:else if session.qualityRating === 'fair'}~
              {:else}⚠
              {/if}
            </span>
          </div>
          <span class="text-[9px] text-[#6b5f4d]">{session.sessionNumber}</span>
        </div>
      {/each}
    </div>
  </div>

  <!-- Summary stats -->
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
    {#each [
      { label: 'Excellent', percent: qualityStats.excellent, color: qualityColors.excellent },
      { label: 'Good', percent: qualityStats.good, color: qualityColors.good },
      { label: 'Fair', percent: qualityStats.fair, color: qualityColors.fair },
      { label: 'Needs Cal.', percent: qualityStats.needsCalibration, color: qualityColors.calibrate },
    ] as stat}
      <div class="bg-[#0a0809] rounded-lg p-2 border border-[#221c18]">
        <div class="text-[10px] text-[#6b5f4d] mb-0.5">{stat.label}</div>
        <div class="text-lg font-bold" style="color:{stat.color}">{stat.percent}%</div>
      </div>
    {/each}
  </div>

  {#if biasTrend}
    <p class="text-xs text-[#9a8f7a] italic">
      {#if biasTrend.direction === 'worsening'}
        ⚠️ Sensor bias increasing — check device mounting & calibration
      {:else if biasTrend.direction === 'improving'}
        ✅ Sensor calibration improving — setup is stable
      {:else}
        ➡️ Sensor calibration stable — consistent data quality
      {/if}
    </p>
  {/if}

  {#if qualityStats.needsCalibration > 20}
    <div class="mt-3 p-3 bg-[#ff4444]/10 border border-[#ff4444]/20 rounded-lg">
      <p class="text-xs text-[#ff4444] font-semibold">
        ⚠️ {qualityStats.needsCalibration}% of sessions need calibration
      </p>
      <p class="text-xs text-[#9a8f7a] mt-1">
        Recalibrate your device or check sensor mounting consistency
      </p>
    </div>
  {/if}
</div>

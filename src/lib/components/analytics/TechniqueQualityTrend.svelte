<script lang="ts">
  /**
   * Technique Quality Trend Component
   * Shows how technique scores evolve across sessions
   */

  interface TechniqueDataPoint {
    sessionDate: string;
    sessionNumber: number;
    overall: number | null;
    reaction: number | null;
    explosiveness: number | null;
    smoothness: number | null;
    efficiency: number | null;
  }

  interface Props {
    data: TechniqueDataPoint[];
    isMobile?: boolean;
  }

  let { data, isMobile = false }: Props = $props();

  let chartCanvas: HTMLCanvasElement | null = $state(null);

  // Calculate trend direction
  let trend = $derived.by(() => {
    if (data.length < 2) return null;
    const validScores = data.filter(d => d.overall !== null).map(d => d.overall!);
    if (validScores.length < 2) return null;
    
    const first = validScores.slice(0, Math.min(3, validScores.length));
    const last = validScores.slice(-Math.min(3, validScores.length));
    const firstAvg = first.reduce((a, b) => a + b, 0) / first.length;
    const lastAvg = last.reduce((a, b) => a + b, 0) / last.length;
    const change = lastAvg - firstAvg;
    
    return {
      direction: change > 2 ? 'improving' : change < -2 ? 'declining' : 'stable',
      change: Math.round(change),
      current: Math.round(lastAvg)
    };
  });

  async function renderChart() {
    const cssVars     = getComputedStyle(document.documentElement);
    const themeGrid   = cssVars.getPropertyValue('--theme-border').trim()         || '#221c18';
    const themeTick   = cssVars.getPropertyValue('--theme-text-secondary').trim() || '#9a8f7a';
    const themeSubtle = cssVars.getPropertyValue('--theme-text-subtle').trim()    || '#6b5f4d';
    const themeBg     = cssVars.getPropertyValue('--theme-bg').trim()             || '#0a0809';
    const themeSurface = cssVars.getPropertyValue('--theme-surface').trim()       || '#131010';
    const themeText   = cssVars.getPropertyValue('--theme-text-primary').trim()   || '#f0ece4';
    if (!chartCanvas || data.length === 0) return;

    const { Chart, registerables } = await import('chart.js');
    Chart.register(...registerables);

    const labels = data.map(d => d.sessionDate);
    
    new Chart(chartCanvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Technique Consistency',
            data: data.map(d => d.overall),
            borderColor: '#f5a623',
            backgroundColor: '#f5a62320',
            borderWidth: 2,
            fill: true,
            tension: 0.3,
            pointRadius: 3,
            pointHoverRadius: 5,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: !isMobile,
            labels: { color: themeTick, font: { size: 11 } }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          }
        },
        scales: {
          x: {
            ticks: { color: themeSubtle, maxRotation: 45, font: { size: isMobile ? 9 : 10 } }
          },
          y: {
            min: 0,
            max: 100,
            ticks: { color: themeTick, font: { size: isMobile ? 9 : 10 } },
            title: { display: !isMobile, text: 'Score / 100', color: themeTick }
          }
        }
      }
    });
  }

  $effect(() => {
    if (chartCanvas) renderChart();
  });
</script>

<div class="bg-[#131010] border border-[#221c18] rounded-xl p-5">
  <div class="flex items-start justify-between gap-4 mb-4">
    <div>
      <h3 class="text-sm font-semibold text-[#f0ece4]">Technique Quality Over Time</h3>
      <p class="text-xs text-[#6b5f4d] mt-1">How your start execution is evolving</p>
    </div>
    {#if trend}
      <div class="text-right">
        <div class="text-xs text-[#6b5f4d]">Current</div>
        <div class="text-2xl font-bold" style="color:{
          trend.direction === 'improving' ? '#3de8c8' :
          trend.direction === 'declining' ? '#ff4444' : '#f5a623'
        }">{trend.current}</div>
        <div class="text-xs {
          trend.direction === 'improving' ? 'text-[#3de8c8]' :
          trend.direction === 'declining' ? 'text-[#ff4444]' : 'text-[#9a8f7a]'
        }">
          {trend.change > 0 ? '+' : ''}{trend.change} pts
        </div>
      </div>
    {/if}
  </div>

  <div class="h-64">
    <canvas bind:this={chartCanvas}></canvas>
  </div>

  {#if trend}
    <p class="text-xs text-[#9a8f7a] mt-3 italic">
      {#if trend.direction === 'improving'}
        ✅ Your technique scores are trending upward — practice is paying off
      {:else if trend.direction === 'declining'}
        ⚠️ Technique scores declining — check for fatigue or form breakdown
      {:else}
        ➡️ Technique scores holding steady — consistency maintained
      {/if}
    </p>
  {/if}
</div>
<script lang="ts">
  /**
   * Power Output Trend Component
   * Shows strength development through estimated power over time
   */

  interface PowerDataPoint {
    sessionDate: string;
    sessionNumber: number;
    peakPowerW: number | null;
    avgPowerW: number | null;
    riderWeightKg: number | null;
  }

  interface Props {
    data: PowerDataPoint[];
    isMobile?: boolean;
  }

  let { data, isMobile = false }: Props = $props();

  let chartCanvas: HTMLCanvasElement | null = $state(null);

  // Calculate power-to-weight ratio for sessions with weight data
  let powerToWeightData = $derived(data.map(d => ({
    ...d,
    powerToWeight: d.peakPowerW && d.riderWeightKg 
      ? (d.peakPowerW / d.riderWeightKg).toFixed(1)
      : null
  })));

  // Power trend
  let trend = $derived.by(() => {
    const valid = data.filter(d => d.peakPowerW !== null);
    if (valid.length < 2) return null;
    
    const first = valid.slice(0, Math.min(3, valid.length));
    const last = valid.slice(-Math.min(3, valid.length));
    
    const firstAvg = first.reduce((a, b) => a + b.peakPowerW!, 0) / first.length;
    const lastAvg = last.reduce((a, b) => a + b.peakPowerW!, 0) / last.length;
    
    const change = lastAvg - firstAvg;
    const changePct = (change / firstAvg) * 100;
    
    return {
      direction: changePct > 5 ? 'increasing' : changePct < -5 ? 'decreasing' : 'stable',
      current: Math.round(lastAvg),
      change: Math.round(change),
      changePct: changePct.toFixed(1)
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
            label: 'Peak Power (W)',
            data: data.map(d => d.peakPowerW),
            borderColor: '#ff6b3d',
            backgroundColor: '#ff6b3d20',
            borderWidth: 2,
            fill: true,
            tension: 0.3,
            pointRadius: 3,
            yAxisID: 'y'
          },
          {
            label: 'Avg Power (W)',
            data: data.map(d => d.avgPowerW),
            borderColor: '#f5a623',
            borderWidth: 1.5,
            fill: false,
            tension: 0.3,
            pointRadius: 2,
            yAxisID: 'y',
            hidden: true,
          },
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
            callbacks: {
              afterLabel: (context) => {
                const index = context.dataIndex;
                const ptw = powerToWeightData[index]?.powerToWeight;
                return ptw ? `${ptw} W/kg` : '';
              }
            }
          }
        },
        scales: {
          x: {
            ticks: { color: themeSubtle, maxRotation: 45, font: { size: isMobile ? 9 : 10 } }
          },
          y: {
            ticks: { color: themeTick, font: { size: isMobile ? 9 : 10 } },
            title: { display: !isMobile, text: 'Power (W)', color: themeTick }
          }
        }
      }
    });
  }

  $effect(() => {
    if (chartCanvas) renderChart();
  });

  // Check if we have enough weight data
  let hasWeightData = $derived(powerToWeightData.filter(d => d.powerToWeight !== null).length > 0);
</script>

<div class="bg-[#131010] border border-[#221c18] rounded-xl p-5">
  <div class="flex items-start justify-between gap-4 mb-4">
    <div>
      <h3 class="text-sm font-semibold text-[#f0ece4]">Power Output Development</h3>
      <p class="text-xs text-[#6b5f4d] mt-1">Strength & explosiveness trends</p>
    </div>
    {#if trend}
      <div class="text-right">
        <div class="text-xs text-[#6b5f4d]">Peak Power</div>
        <div class="text-2xl font-bold" style="color:{
          trend.direction === 'increasing' ? '#3de8c8' :
          trend.direction === 'decreasing' ? '#ff4444' : '#f5a623'
        }">{trend.current}W</div>
        <div class="text-xs {
          trend.direction === 'increasing' ? 'text-[#3de8c8]' :
          trend.direction === 'decreasing' ? 'text-[#ff4444]' : 'text-[#9a8f7a]'
        }">
          {trend.change > 0 ? '+' : ''}{trend.change}W ({trend.changePct}%)
        </div>
      </div>
    {/if}
  </div>

  <div class="h-64">
    <canvas bind:this={chartCanvas}></canvas>
  </div>

  {#if trend}
    <p class="text-xs text-[#9a8f7a] mt-3 italic">
      {#if trend.direction === 'increasing'}
        ✅ Power output trending up — strength training is working
      {:else if trend.direction === 'decreasing'}
        ⚠️ Power output declining — check recovery or training load
      {:else}
        ➡️ Power output stable — maintaining strength levels
      {/if}
    </p>
  {/if}

  {#if !hasWeightData}
    <div class="mt-3 p-3 bg-[#f5a623]/10 border border-[#f5a623]/20 rounded-lg">
      <p class="text-xs text-[#f5a623] font-semibold">
        💡 Add your body weight in profile settings
      </p>
      <p class="text-xs text-[#9a8f7a] mt-1">
        Track power-to-weight ratio for better strength progress monitoring
      </p>
    </div>
  {/if}

  <p class="text-xs text-[#6b5f4d] mt-2">
    ⚠️ Power estimated from mass × acceleration. Not measured with power meter.
  </p>
</div>
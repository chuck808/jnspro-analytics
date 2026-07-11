<script lang="ts">
	import HelpButton from '$lib/components/HelpButton.svelte';

	interface SessionData {
		id: string;
		timestamp: string;
		bestVsAvgGapPercent: number | null;
		optimalSetLength: number | null;
		dropOffRun: number | null;
		best_peak_speed_ms: number | null;
		reaction_cv: number | null;
	}

	interface Props {
		sessions: SessionData[];
		isMobile: boolean;
		onOpenHelp: (key: string) => void;
	}

	let { sessions, isMobile, onOpenHelp }: Props = $props();

	let chart1El: HTMLCanvasElement | null = $state(null);
	let chart2El: HTMLCanvasElement | null = $state(null);
	let chart3El: HTMLCanvasElement | null = $state(null);
	let chart4El: HTMLCanvasElement | null = $state(null);
	let chartInstances: any[] = [];

	function fmtDate(ts: string) {
		return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
	}

	async function renderCharts() {
		const cssVars = getComputedStyle(document.documentElement);
		const themeGrid = cssVars.getPropertyValue('--theme-border').trim() || '#221c18';
		const themeTick = cssVars.getPropertyValue('--theme-text-secondary').trim() || '#9a8f7a';
		const themeSubtle = cssVars.getPropertyValue('--theme-text-subtle').trim() || '#6b5f4d';
		const themeBg = cssVars.getPropertyValue('--theme-bg').trim() || '#0a0809';
		const themeSurface = cssVars.getPropertyValue('--theme-surface').trim() || '#131010';
		const themeText = cssVars.getPropertyValue('--theme-text-primary').trim() || '#f0ece4';
		if (sessions.length < 3) return;

		const { Chart, registerables } = await import('chart.js');
		Chart.register(...registerables);

		chartInstances.forEach((c) => c.destroy());
		chartInstances = [];

		const amber = '#f5a623';
		const teal = '#3de8c8';
		const red = '#ff4444';
		const speed = '#ff6b3d';
		const labels = sessions.map((s) => fmtDate(s.timestamp));

		const baseOpts = {
			responsive: true,
			maintainAspectRatio: false,
			interaction: { mode: 'index' as const, intersect: false },
			plugins: {
				legend: { display: false },
				tooltip: {
					backgroundColor: themeSurface,
					titleColor: themeText,
					bodyColor: themeTick,
					borderColor: themeGrid,
					borderWidth: 1,
					padding: 12,
					displayColors: true
				}
			},
			scales: {
				x: {
					ticks: { color: themeTick, font: { size: isMobile ? 9 : 11 } },
					grid: { color: `${themeGrid}40` }
				},
				y: {
					ticks: { color: themeTick, font: { size: isMobile ? 9 : 11 } },
					grid: { color: `${themeGrid}40` }
				}
			}
		};

		// Chart 1: Best vs Average Gap Trend
		if (chart1El) {
			const gapData = sessions.map((s) => s.bestVsAvgGapPercent);
			const c = new Chart(chart1El, {
				type: 'line',
				data: {
					labels,
					datasets: [
						{
							label: 'Best vs Avg Gap %',
							data: gapData,
							borderColor: teal,
							backgroundColor: `${teal}20`,
							borderWidth: 2,
							fill: true,
							tension: 0.3,
							pointRadius: isMobile ? 3 : 5,
							pointBackgroundColor: gapData.map((v) => {
								if (v === null) return themeTick;
								if (v < 5) return teal;
								if (v < 15) return amber;
								return red;
							}),
							pointBorderColor: '#0a0809',
							pointBorderWidth: 2
						}
					]
				},
				options: {
					...baseOpts,
					scales: {
						...baseOpts.scales,
						y: {
							...baseOpts.scales.y,
							reverse: true, // Lower gap is better
							title: { display: !isMobile, text: 'Gap % (lower = better)', color: themeTick }
						}
					}
				} as any
			});
			chartInstances.push(c);
		}

		// Chart 2: Optimal Set Length Trend
		if (chart2El) {
			const setLengthData = sessions.map((s) => s.optimalSetLength);
			const c = new Chart(chart2El, {
				type: 'bar',
				data: {
					labels,
					datasets: [
						{
							label: 'Optimal Set Length (runs)',
							data: setLengthData,
							backgroundColor: setLengthData.map((v) => {
								if (v === null) return `${themeTick}60`;
								if (v >= 8) return `${teal}CC`;
								if (v >= 5) return `${amber}CC`;
								return `${red}90`;
							}),
							borderRadius: 6,
							borderWidth: 0
						}
					]
				},
				options: {
					...baseOpts,
					scales: {
						...baseOpts.scales,
						y: {
							...baseOpts.scales.y,
							beginAtZero: true,
							title: { display: !isMobile, text: 'Runs before fatigue', color: themeTick }
						}
					}
				} as any
			});
			chartInstances.push(c);
		}

		// Chart 3: Drop-Off Position Trend
		if (chart3El) {
			const dropOffData = sessions.map((s) => s.dropOffRun);
			const c = new Chart(chart3El, {
				type: 'line',
				data: {
					labels,
					datasets: [
						{
							label: 'Drop-off at run #',
							data: dropOffData,
							borderColor: red,
							backgroundColor: `${red}20`,
							borderWidth: 2,
							fill: true,
							tension: 0.3,
							pointRadius: isMobile ? 3 : 5,
							pointBackgroundColor: dropOffData.map((v) => {
								if (v === null) return themeTick;
								if (v > 8) return teal; // Later is better
								if (v > 5) return amber;
								return red;
							}),
							pointBorderColor: '#0a0809',
							pointBorderWidth: 2
						}
					]
				},
				options: {
					...baseOpts,
					scales: {
						...baseOpts.scales,
						y: {
							...baseOpts.scales.y,
							beginAtZero: true,
							title: { display: !isMobile, text: 'Run number', color: themeTick }
						}
					}
				} as any
			});
			chartInstances.push(c);
		}

		// Chart 4: Speed vs Consistency Overlay (Dual-axis)
		if (chart4El) {
			const speedData = sessions.map((s) =>
				s.best_peak_speed_ms ? s.best_peak_speed_ms * 3.6 : null
			);
			const consistencyData = sessions.map((s) => s.reaction_cv);

			const c = new Chart(chart4El, {
				type: 'line',
				data: {
					labels,
					datasets: [
						{
							label: 'Peak Speed (km/h)',
							data: speedData,
							borderColor: speed,
							backgroundColor: `${speed}20`,
							borderWidth: 2,
							fill: false,
							tension: 0.3,
							pointRadius: isMobile ? 2 : 4,
							pointBackgroundColor: speed,
							yAxisID: 'y'
						},
						{
							label: 'Consistency CV %',
							data: consistencyData,
							borderColor: teal,
							backgroundColor: `${teal}20`,
							borderWidth: 2,
							borderDash: [5, 5],
							fill: false,
							tension: 0.3,
							pointRadius: isMobile ? 2 : 4,
							pointBackgroundColor: teal,
							yAxisID: 'y1'
						}
					]
				},
				options: {
					...baseOpts,
					plugins: {
						...baseOpts.plugins,
						legend: {
							display: !isMobile,
							labels: { color: themeTick, boxWidth: 12, font: { size: 11 } }
						}
					},
					scales: {
						x: baseOpts.scales.x,
						y: {
							type: 'linear' as const,
							position: 'left' as const,
							ticks: { color: speed, font: { size: isMobile ? 9 : 11 } },
							grid: { color: `${themeGrid}40` },
							title: { display: !isMobile, text: 'Speed (km/h)', color: speed }
						},
						y1: {
							type: 'linear' as const,
							position: 'right' as const,
							ticks: { color: teal, font: { size: isMobile ? 9 : 11 } },
							grid: { display: false },
							reverse: true, // Lower CV is better
							title: { display: !isMobile, text: 'CV % (lower=better)', color: teal }
						}
					}
				} as any
			});
			chartInstances.push(c);
		}
	}

	$effect(() => {
		sessions.length;
		isMobile;
		renderCharts();
	});

	let chartH = $derived(isMobile ? 'h-48' : 'h-56');
</script>

{#if sessions.length >= 3}
	<div class="space-y-5">
		<!-- Section Header -->
		<div class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
			<div class="mb-2 flex items-center justify-between">
				<div>
					<h2 class="text-lg font-bold text-[#f0ece4]">Performance Patterns</h2>
					<p class="mt-1 text-sm text-[#9a8f7a]">
						Coaching-focused insights that explain the why behind your data
					</p>
				</div>
				<span class="rounded-full bg-[#f5a623]/20 px-3 py-1.5 text-xs font-medium text-[#f5a623]">
					Core Analysis
				</span>
			</div>
		</div>

		<!-- Chart 1: Best vs Average Gap Trend -->
		<div class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
			<div class="mb-4">
				<div class="mb-1 flex items-center gap-2">
					<h3 class="text-sm font-semibold text-[#f0ece4]">Best vs Average Gap Trend</h3>
					<HelpButton onclick={() => onOpenHelp('bestVsAvgGap')} />
				</div>
				<p class="text-xs text-[#9a8f7a]">
					Shows how close your average performance is to your best — smaller gap means better
					consistency
				</p>
			</div>
			<div class={chartH}>
				<canvas bind:this={chart1El}></canvas>
			</div>
			<div class="mt-3 flex gap-4 text-xs text-[#6b5f4d]">
				<span><span class="text-[#3de8c8]">●</span> Excellent (&lt;5%)</span>
				<span><span class="text-[#f5a623]">●</span> Good (&lt;15%)</span>
				<span><span class="text-[#ff4444]">●</span> Variable (15%+)</span>
			</div>
		</div>

		<!-- Chart 2: Optimal Set Length Trend -->
		<div class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
			<div class="mb-4">
				<div class="mb-1 flex items-center gap-2">
					<h3 class="text-sm font-semibold text-[#f0ece4]">Optimal Set Length Trend</h3>
					<HelpButton onclick={() => onOpenHelp('optimalSetLength')} />
				</div>
				<p class="text-xs text-[#9a8f7a]">
					How many quality runs you can sustain before fatigue — helps plan training volume
				</p>
			</div>
			<div class={chartH}>
				<canvas bind:this={chart2El}></canvas>
			</div>
			<div class="mt-3 flex gap-4 text-xs text-[#6b5f4d]">
				<span><span class="text-[#3de8c8]">■</span> Strong (8+ runs)</span>
				<span><span class="text-[#f5a623]">■</span> Moderate (5-7 runs)</span>
				<span><span class="text-[#ff4444]">■</span> Limited (&lt;5 runs)</span>
			</div>
		</div>

		<!-- Charts 3 & 4: Two-column grid -->
		<div class="grid grid-cols-1 gap-5 xl:grid-cols-2">
			<!-- Chart 3: Drop-Off Position Trend -->
			<div class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
				<div class="mb-4">
					<div class="mb-1 flex items-center gap-2">
						<h3 class="text-sm font-semibold text-[#f0ece4]">Drop-Off Position Trend</h3>
						<HelpButton onclick={() => onOpenHelp('dropOffPosition')} />
					</div>
					<p class="text-xs text-[#9a8f7a]">
						Where performance typically deteriorates — later is better
					</p>
				</div>
				<div class={chartH}>
					<canvas bind:this={chart3El}></canvas>
				</div>
				<div class="mt-3 flex gap-3 text-xs text-[#6b5f4d]">
					<span><span class="text-[#3de8c8]">●</span> Late (8+)</span>
					<span><span class="text-[#f5a623]">●</span> Mid (5-7)</span>
					<span><span class="text-[#ff4444]">●</span> Early (&lt;5)</span>
				</div>
			</div>

			<!-- Chart 4: Speed vs Consistency Overlay -->
			<div class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
				<div class="mb-4">
					<div class="mb-1 flex items-center gap-2">
						<h3 class="text-sm font-semibold text-[#f0ece4]">Speed vs Consistency Trade-Off</h3>
						<HelpButton onclick={() => onOpenHelp('speedVsConsistency')} />
					</div>
					<p class="text-xs text-[#9a8f7a]">
						Shows the relationship between peak speed and consistency — ideal is both high
					</p>
				</div>
				<div class={chartH}>
					<canvas bind:this={chart4El}></canvas>
				</div>
				<p class="mt-3 text-xs text-[#6b5f4d]">
					<span class="text-[#ff6b3d]">━━━</span> Speed (higher better) ·
					<span class="text-[#3de8c8]">- - -</span> Consistency (lower CV better)
				</p>
			</div>
		</div>

		<!-- Insights summary -->
		<div class="rounded-xl border border-[#f5a623]/20 bg-[#0a0809] p-4">
			<p class="text-xs text-[#9a8f7a]">
				<span class="font-semibold text-[#f5a623]">💡 Coaching Tip:</span>
				These patterns directly inform training decisions — watch for improving gaps, extending optimal
				length, and delaying drop-off points as key progress indicators.
			</p>
		</div>
	</div>
{/if}

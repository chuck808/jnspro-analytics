<script lang="ts">
	import type { LayoutData } from './$types';
	import { onMount, setContext } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import HelpPanel from '$lib/components/HelpPanel.svelte';
	import { ReportOptionsPanel, ReportPreview } from '$lib/components/reports';
	import {
		buildCoachSessionReport,
		buildDiagnosticReport,
		buildRiderParentReport,
		buildProgressReport,
		buildProgressChartSeries
	} from '$lib/report-engine';
	import type {
		GeneratedReport,
		ReportDetailLevel,
		ReportType,
		ProgressReportInput
	} from '$lib/report-engine/types';
	import type { ProgressChartSessionPoint } from '$lib/report-engine/progressCharts';
	import {
		type DetailLevel,
		buildCoachDiagnostics,
		computeSessionInsights
	} from '$lib/performance-engine';
	import { analyseSessionIntelligence } from '$lib/performance-engine';
	import {
		analyseCrossSessionIntelligence,
		buildSessionPerformanceSummary
	} from '$lib/performance-engine/crossSession';
	import { applyTruthRulesToReport } from '$lib/performance-engine/crossSession/truthRules';
	import { createAnalysisView } from '$lib/analysis-views';
	import { buildChartSeries } from '$lib/performance-engine';
	import { getExclusionReasons } from '$lib/types/runs';
	import { getUCICategory } from '$lib/utils/uciCategories';

	let { data, children }: { data: LayoutData; children: any } = $props();

	// ── Shared reactive state ──────────────────────────────────────────────────

	let selectedRunIdx = $state(0);
	let isMobile = $state(false);
	let scrolled = $state(false);

	// Help panel
	let helpKey = $state('');
	let helpOpen = $state(false);
	function openHelp(key: string) {
		helpKey = key;
		helpOpen = true;
	}

	// Report state
	let report: GeneratedReport | null = $state(null);
	let generating = $state(false);
	let showReport = $state(false);
	let showReportOptions = $state(false);
	let reportType = $state<ReportType>('coach-session');
	let reportDetailLevel = $state<ReportDetailLevel>('coach');
	let includeCharts = $state(true);
	let includeDiag = $state(true);
	let includeAppendix = $state(false);
	let includeGoals = $state(false);

	onMount(() => {
		isMobile = window.innerWidth < 640;

		// Initialise selectedRunIdx from URL ?run= param
		const urlParams = new URLSearchParams(window.location.search);
		const runParam = urlParams.get('run');
		if (runParam) {
			const runNumber = parseInt(runParam, 10);
			const idx = data.runs.findIndex((r: any) => r.run_number === runNumber);
			if (idx >= 0) selectedRunIdx = idx;
		}

		const handleResize = () => {
			isMobile = window.innerWidth < 640;
		};
		const handleScroll = () => {
			scrolled = window.scrollY > 200;
		};
		window.addEventListener('resize', handleResize);
		window.addEventListener('scroll', handleScroll);
		return () => {
			window.removeEventListener('resize', handleResize);
			window.removeEventListener('scroll', handleScroll);
		};
	});

	// Keep ?run= in sync with selection
	$effect(() => {
		if (!browser || !data.runs[selectedRunIdx]) return;
		const runNumber = data.runs[selectedRunIdx].run_number;
		const url = new URL(window.location.href);
		url.searchParams.set('run', String(runNumber));
		window.history.replaceState({}, '', url.toString());
	});

	// ── Performance Engine (single source of truth) ───────────────────────────
	// Runs through computeSessionInsights() — shared with the client-side live
	// setup preview on the Overview page, so the two can never drift apart.

	let sessionInsights = $derived(
		computeSessionInsights({
			session: { ...data.session, runs: (data as any).analysisRuns as any },
			riderContext: {
				riderLevel: (data.session.rider_profiles as any)?.rider_level,
				riderWeightKg: data.riderWeight,
				bikeWeightKg: data.bikeWeight,
				crankLengthMm: data.crankLength,
				sessionFocus: (data.session as any).session_focus ?? null,
				rideFeel: (data.session as any).ride_feel ?? null,
				weatherCondition: (data.session as any).weather_conditions ?? null,
				trackSurface: (data.session as any).track_surface ?? null
			},
			selectedRunIndex: selectedRunIdx,
			riderLevel: (data.session.rider_profiles as any)?.rider_level
		})
	);

	let performanceAnalysis = $derived(sessionInsights.performanceAnalysis);
	let techniqueScoreBreakdown = $derived(sessionInsights.techniqueScoreBreakdown);
	let insightPack = $derived(sessionInsights.insightPack);

	let analysisView = $derived(createAnalysisView(performanceAnalysis, 'coach'));
	let chartSeries = $derived(buildChartSeries(performanceAnalysis));

	let selectedRun = $derived(data.runs[selectedRunIdx]);
	let selectedGate = $derived((selectedRun as any)?.gate_runs ?? null);
	let riderLevel = $derived((data.session.rider_profiles as any)?.rider_level ?? null);

	let coachDiagnostics = $derived.by(() => {
		if (!techniqueScoreBreakdown) return [];
		return buildCoachDiagnostics(performanceAnalysis, techniqueScoreBreakdown, {
			sessionFocus: (data.session as any).session_focus ?? null,
			rideFeel: (data.session as any).ride_feel ?? null
		});
	});
	let uciCategory = $derived(getUCICategory((data.session.rider_profiles as any)?.date_of_birth));

	let sessionDate = $derived(
		new Date(data.session.timestamp).toLocaleDateString('en-GB', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		})
	);

	// ── Report generation ─────────────────────────────────────────────────────

	let consistency = $derived(
		performanceAnalysis.summary.consistencyScore !== null
			? {
					cv: performanceAnalysis.summary.consistencyScore,
					label: performanceAnalysis.summary.consistencyLabel ?? 'Unknown'
				}
			: null
	);

	let techniqueScores = $derived(performanceAnalysis.selectedRun?.technique);
	let jerkProfile = $derived(
		performanceAnalysis.selectedRun?.physics?.jerk
			? {
					...performanceAnalysis.selectedRun.physics.jerk,
					data:
						performanceAnalysis.selectedRun.physics.jerkSeries?.map((p: any) => ({
							timeS: p.timeS,
							jerk: p.value
						})) ?? []
				}
			: null
	);
	let impulse = $derived(performanceAnalysis.selectedRun?.physics?.impulse);
	let weaknesses = $derived(performanceAnalysis.weaknesses);
	let recommendations = $derived(performanceAnalysis.recommendations);

	function buildSessionInput() {
			const engineDetailLevel =
				reportDetailLevel === 'simple'
					? 'grom'
					: reportDetailLevel === 'standard'
						? 'rider'
						: reportDetailLevel === 'coach'
							? 'coach'
							: reportDetailLevel === 'technical'
								? 'coach'
								: 'rider';

			const view = createAnalysisView(performanceAnalysis, engineDetailLevel);
			const allRuns = performanceAnalysis.runs ?? [];

			const runSummaries = allRuns.map((r: any) => ({
				runNumber: r.runNumber ?? 0,
				reactionMs: r.reactionMs ?? null,
				maxG: r.maxG ?? null,
				peakSpeedKmh:
					r.physics?.measuredPeakSpeedKmh ??
					(r.physics?.speedKmh?.length ? Math.max(...r.physics.speedKmh) : null),
				techniqueOverall: r.technique?.overall ?? null,
				analyticsValid: r.analyticsValid ?? false
			}));

			const intelligence = performanceAnalysis.intelligence;
			const bestVsAvgGap = intelligence?.bestVsAvg?.gapPercent ?? null;
			const dropOffRun = intelligence?.dropOff?.dropOffRun ?? null;
			const optimalSetLength = intelligence?.setLength?.optimal ?? runSummaries.length;
			const qualityScore = intelligence?.sessionQuality ?? null;
			const repeatabilityScore = intelligence?.repeatability?.overall ?? null;
			const cvPercent = consistency?.cv ?? null;

			const primaryRecs = (view.nextActions ?? [])
				.filter((a: string) => a?.trim().length > 0)
				.slice(0, 3)
				.map((action: string, i: number) => ({
					id: `action-${i}`,
					title: action.split(':')[0]?.trim() ?? `Focus ${i + 1}`,
					body: action,
					priority: (i === 0 ? 'high' : 'medium') as 'high' | 'medium' | 'low'
				}));

			const weaknessRecs =
				reportDetailLevel === 'coach' || reportDetailLevel === 'technical'
					? (weaknesses ?? [])
							.filter((w: any) => w?.area && typeof w.score === 'number' && w.score < 60)
							.slice(0, 2)
							.map((w: any, i: number) => ({
								id: `weakness-${i}`,
								title: w.area === 'Repeatability' ? 'Improve start consistency' : w.area,
								body: w.advice?.[0] ?? `${w.area} needs attention`,
								priority: ((w.score ?? 0) < 40 ? 'high' : 'medium') as 'high' | 'medium' | 'low'
							}))
					: [];

			const seen = new Set<string>();
			const mergedRecs = [...primaryRecs, ...weaknessRecs]
				.filter((rec) => {
					const key = rec.title.toLowerCase().slice(0, 30);
					if (seen.has(key)) return false;
					seen.add(key);
					return true;
				})
				.slice(0, 5)
				.map((rec, i) => ({ ...rec, id: `rec-${i}` }));

			const selectedRunAnalysis = performanceAnalysis.selectedRun;
			const techniqueSummary = selectedRunAnalysis?.technique
				? {
						overall: selectedRunAnalysis.technique.overall ?? null,
						reaction: selectedRunAnalysis.technique.reaction ?? null,
						explosiveness: selectedRunAnalysis.technique.explosiveness ?? null,
						smoothness: selectedRunAnalysis.technique.smoothness ?? null,
						efficiency: selectedRunAnalysis.technique.efficiency ?? null,
						wheelieRunCount: (data as any).analysisRuns.filter(
							(r: any) => r.gate_runs?.front_wheel_lifted
						).length,
						controlledLiftCount: 0,
						excessiveLiftCount: 0,
						summary: selectedRunAnalysis.physics?.jerk?.insight ?? jerkProfile?.insight ?? null
					}
				: null;

			const watchItems: string[] = [];
			(view.insights ?? [])
				.filter((i: any) => i.tone === 'warning')
				.slice(0, 2)
				.forEach((i: any) => watchItems.push(i.title));
			if (dropOffRun !== null) watchItems.push(`Performance dropped off at run ${dropOffRun}`);
			if (bestVsAvgGap !== null && bestVsAvgGap > 10)
				watchItems.push(`${bestVsAvgGap.toFixed(0)}% gap between best and average run`);

			const quality = performanceAnalysis.selectedRun?.physics?.dataQuality;

			const sessionInput = {
				riderName: (data as any).profile?.name ?? (data as any).profile?.display_name ?? undefined,
				sessionId: data.session.id,
				sessionTitle: sessionDate,
				sessionDate: sessionDate,
				runCount: (data as any).analysisRuns.length,
				excludedRunCount: data.sessionStats.excluded_run_count ?? 0,
				excludedReasons: data.runs.flatMap((r: any) => getExclusionReasons(r.tags)),
				sessionFocus: (data.session as any).session_focus ?? null,
				trackSurface: (data.session as any).track_surface ?? null,
				weatherCondition: (data.session as any).weather_conditions ?? null,
				rideFeel: (data.session as any).ride_feel ?? null,
				sessionNotes: (data.sessionNotes ?? []).map((n: any) => ({
					note_type: n.note_type,
					content: n.content,
					author_role: n.author_role ?? null,
					created_at: n.created_at
				})),
				riderLevel: riderLevel ?? undefined,
				sessionReport: {
					sessionQuality: qualityScore,
					headline: view.headline,
					confidence: 50,
					repeatability:
						cvPercent !== null
							? { overall: repeatabilityScore, cvPercent, label: consistency?.label ?? null }
							: null,
					bestVsAvg: bestVsAvgGap !== null ? { gapPercent: bestVsAvgGap } : null,
					setLength: {
						optimal: optimalSetLength,
						message:
							optimalSetLength < (data as any).analysisRuns.length
								? `Quality held for ${optimalSetLength} of ${(data as any).analysisRuns.length} runs`
								: null
					},
					dropOff: { dropOffRun },
					phaseAnalysis: null,
					impulseAnalysis: impulse
						? {
								totalImpulseNs: impulse.totalImpulseNs,
								timeToHalfImpulseS: impulse.timeToHalfImpulseS,
								frontLoadedScore: impulse.frontLoadedScore,
								impulseEfficiency: impulse.impulseEfficiency
							}
						: null,
					runSummaries,
					recommendations: mergedRecs
				},
				sessionNarrative: {
					message: {
						headline: view.headline,
						impact: view.summary,
						action: mergedRecs[0]?.body ?? null,
						whyThisMatters: view.insights?.[0]?.body ?? null,
						watchFor: watchItems[0] ?? null
					},
					trust: {
						confidence: 'moderate' as const,
						basedOnRuns: (data as any).analysisRuns.length,
						excludedRuns: data.sessionStats.excluded_run_count ?? 0,
						excludedReasons: data.runs
							.filter(() => data.sessionStats.excluded_run_count > 0)
							.flatMap((r: any) => getExclusionReasons(r.tags)),
						trustedMetrics: ['reaction time'],
						cautionMetrics:
							(data.session as any).track_surface === 'wet' ||
							(data.session as any).track_surface === 'muddy'
								? ['speed', 'explosiveness']
								: [],
						blockedMetrics: []
					},
					insights: (view.insights ?? []).map((i: any) => ({
						title: i.title,
						body: i.body,
						tone: i.tone
					}))
				},
				techniqueSummary,
				dataQuality: {
					label: quality?.badge ?? null,
					biasCorrection: data.runs[0]?.gate_runs?.bias_correction_ms2 ?? null,
					analyticsValid: !(performanceAnalysis.hasCalibrationWarning ?? false),
					blocksPower: !performanceAnalysis.profileComplete,
					blocksSpeed: performanceAnalysis.hasCalibrationWarning ?? false
				},
				recommendations: mergedRecs,
				// Goal progress this session — surfaces in report context
				goalProgress:
					(data as any).goalProgress?.length > 0
						? (data as any).goalProgress.map((g: any) => ({
								goalId: g.goalId,
								metric: g.metric,
								metricLabel: g.metricLabel,
								improvement: g.improvement,
								percentToGoal: g.percentToGoal,
								isSignificant: g.isSignificant ?? false
							}))
						: null,
				// Build actual chart data from performance analysis
				charts: includeCharts
					? [
							// Acceleration/G-Force chart
							{
								id: 'gforce-chart',
								title: 'G-Force Trace',
								description:
									'Acceleration through the run — shows force application timing and peak.',
								chartType: 'line' as const,
								dataKey: 'acceleration',
								includeByDefault: true,
								data:
									chartSeries?.acceleration?.map((p: any, i: number) => ({
										x: p.timeS ?? i * 0.01,
										y: p.value ?? 0
									})) ?? []
							},
							// Run progression chart (reaction times)
							{
								id: 'run-progression-chart',
								title: 'Run-by-Run Performance',
								description:
									'Reaction time across all runs — shows consistency and drop-off patterns.',
								chartType: 'bar' as const,
								dataKey: 'runProgression',
								includeByDefault: true,
								data: allRuns.map((r: any, i: number) => ({
									x: i + 1,
									y: (r.reactionMs ?? 0) / 1000 // Convert to seconds
								}))
							},
							// Speed curve (if available)
							...(chartSeries?.speed && chartSeries.speed.length > 0
								? [
										{
											id: 'speed-chart',
											title: 'Speed Development',
											description: 'Estimated speed curve from IMU data.',
											chartType: 'line' as const,
											dataKey: 'speed',
											includeByDefault: true,
											data: chartSeries.speed.map((p: any, i: number) => ({
												x: p.timeS ?? i * 0.01,
												y: p.value ?? 0
											}))
										}
									]
								: [])
					]
				: undefined
		};

		return sessionInput;
	}

	function currentBuildOptions() {
		return {
			detailLevel: reportDetailLevel,
			includeCharts,
			includeDiagnostics: includeDiag,
			includeAppendix
		};
	}

	async function generateReport() {
		generating = true;
		try {
			const sessionInput = buildSessionInput();
			const buildOptions = currentBuildOptions();

			if (reportType === 'diagnostic') {
				report = buildDiagnosticReport(sessionInput, buildOptions);
			} else if (reportType === 'rider-parent') {
				report = buildRiderParentReport({ kind: 'session', session: sessionInput }, buildOptions);
			} else if (reportType === 'progress') {
				report = buildProgressReport(buildProgressInputFromSession(), buildOptions);
			} else {
				report = buildCoachSessionReport(sessionInput, buildOptions);
			}

			showReport = true;
		} catch (error) {
			console.error('Failed to generate report:', error);
		} finally {
			generating = false;
		}
	}

	function closeReport() {
		showReport = false;
	}

	/**
	 * Builds and sends a report to a linked coach. Always rebuilds fresh
	 * rather than reusing the on-screen `report` — for coach-session reports
	 * specifically, sessionNotes is forced to [] here regardless of what's
	 * shown on screen, since session_notes is rider-private and must never
	 * ride along inside a report sent to a coach. The shared coaching thread
	 * (coach_rider_messages) is how a coach sees rider-shared context instead.
	 */
	async function sendReportToCoach(linkId: string): Promise<boolean> {
		const buildOptions = currentBuildOptions();
		let reportToSend;

		if (reportType === 'diagnostic') {
			reportToSend = buildDiagnosticReport(buildSessionInput(), buildOptions);
		} else if (reportType === 'rider-parent') {
			reportToSend = buildRiderParentReport(
				{ kind: 'session', session: buildSessionInput() },
				buildOptions
			);
		} else if (reportType === 'progress') {
			reportToSend = buildProgressReport(buildProgressInputFromSession(), buildOptions);
		} else {
			const safeInput = { ...buildSessionInput(), sessionNotes: [] };
			reportToSend = buildCoachSessionReport(safeInput, buildOptions);
		}

		try {
			const res = await fetch('/api/coach/report-shares', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ linkId, report: reportToSend })
			});
			return res.ok;
		} catch (err) {
			console.error('Failed to send report to coach:', err);
			return false;
		}
	}

	// ── Cross-Session Intelligence ────────────────────────────────────────────

	// Per-session summaries — shared by crossSessionReport (below) and the
	// Progress Report chart wiring (buildProgressInputFromSession), so this
	// computation only happens once.
	let sessionIntelligenceSummaries = $derived.by(() => {
		const sessions = (data as any).advancedAnalytics?.sessions;
		if (!sessions) return [];

		return sessions.map((s: any) => {
			const runs =
				s.runs?.map((r: any) => ({
					reactionMs: r.reaction_time_ms,
					peakSpeed: r.peak_speed_ms ? r.peak_speed_ms * 3.6 : null,
					maxG: r.max_g
				})) ?? [];

			const intelligence = runs.length > 0 ? analyseSessionIntelligence(runs) : null;

			return buildSessionPerformanceSummary(
				{
					sessionId: s.id,
					date: s.timestamp,
					runCount: s.run_count || runs.length,
					bestReactionMs: s.best_reaction_ms,
					avgReactionMs: s.avg_reaction_ms,
					bestPeakSpeedMs: s.best_peak_speed_ms,
					avgPeakSpeedMs: s.avg_peak_speed_ms,
					bestMaxG: s.best_max_g,
					avgMaxG: s.avg_max_g,
					weatherCondition: s.weather_conditions ?? null,
					trackSurface: s.track_surface ?? null,
					sessionFocus: s.session_focus ?? null,
					rideFeel: s.ride_feel ?? null,
					bikeId: s.bike_id ?? null,
					riderProfileId: s.rider_profile_id ?? null
				},
				intelligence
			);
		});
	});

	let crossSessionReport = $derived.by(() => {
		if (sessionIntelligenceSummaries.length < 3) return null;
		const rawReport = analyseCrossSessionIntelligence(sessionIntelligenceSummaries);
		return applyTruthRulesToReport(rawReport);
	});

	// Builds a ProgressReportInput (crossSessionReport + real chart series) for
	// generating a Progress Report from the session-detail page. Only 6 of the
	// 9 progress chart series are available here (technique/power/smoothness
	// need chart_data-driven analyseSession(), which only the Analytics page
	// runs today — see progressCharts.ts).
	function buildProgressInputFromSession(): ProgressReportInput {
		const allRuns: any[] = (data as any).advancedAnalytics?.allRuns ?? [];

		const chartPoints: ProgressChartSessionPoint[] = sessionIntelligenceSummaries.map(
			(s: any, i: number) => {
				const sessionRuns = allRuns.filter((r) => r.session_id === s.sessionId);
				const validBias = sessionRuns
					.map((r) => r.bias_correction_ms2)
					.filter((v): v is number => typeof v === 'number');
				const wheelieCount = sessionRuns.filter((r) => r.front_wheel_lifted).length;

				return {
					sessionId: s.sessionId,
					sessionIndex: i + 1,
					date: s.date,
					bestReactionTimeSec: s.bestReactionTimeSec,
					avgReactionTimeSec: s.avgReactionTimeSec,
					bestVsAvgGapPercent: s.bestVsAvgGapPercent,
					optimalSetLength: s.optimalSetLength,
					dropOffRun: s.dropOffRun,
					runCount: s.runCount,
					dataQualityBias:
						validBias.length > 0 ? validBias.reduce((a, b) => a + b, 0) / validBias.length : null,
					dataQualityValid:
						sessionRuns.length > 0 ? sessionRuns.every((r) => r.analytics_valid) : null,
					wheelieRatePercent:
						sessionRuns.length > 0 ? (wheelieCount / sessionRuns.length) * 100 : null
				};
			}
		);

		return {
			riderName: (data as any).profile?.name ?? (data as any).profile?.display_name ?? undefined,
			sessionCount: (data as any).advancedAnalytics?.sessionCount ?? sessionIntelligenceSummaries.length,
			personalBests: {
				bestReactionMs: (data as any).allTimePBs?.bestReactionMs ?? null,
				bestPeakSpeedKmh: (data as any).allTimePBs?.bestSpeedMs
					? (data as any).allTimePBs.bestSpeedMs * 3.6
					: null,
				bestMaxG: (data as any).allTimePBs?.bestMaxG ?? null
			},
			crossSessionReport: crossSessionReport ?? undefined,
			charts: buildProgressChartSeries(chartPoints)
		};
	}

	// ── Expose shared state to child pages via Svelte context ─────────────────

	setContext('session', {
		get data() {
			return data;
		},
		get selectedRunIdx() {
			return selectedRunIdx;
		},
		set selectedRunIdx(v: number) {
			selectedRunIdx = v;
		},
		get selectedRun() {
			return selectedRun;
		},
		get selectedGate() {
			return selectedGate;
		},
		get isMobile() {
			return isMobile;
		},
		get riderLevel() {
			return riderLevel;
		},
		get sessionDate() {
			return sessionDate;
		},
		get uciCategory() {
			return uciCategory;
		},
		get performanceAnalysis() {
			return performanceAnalysis;
		},
		get analysisView() {
			return analysisView;
		},
		get chartSeries() {
			return chartSeries;
		},
		get consistency() {
			return consistency;
		},
		get techniqueScores() {
			return techniqueScores;
		},
		get jerkProfile() {
			return jerkProfile;
		},
		get weaknesses() {
			return weaknesses;
		},
		get recommendations() {
			return recommendations;
		},
		get crossSessionReport() {
			return crossSessionReport;
		},
		get techniqueScoreBreakdown() {
			return techniqueScoreBreakdown;
		},
		get coachDiagnostics() {
			return coachDiagnostics;
		},
		get insightPack() {
			return insightPack;
		},
		openHelp,
		openReport: () => {
			showReportOptions = true;
		}
	});

	// ── Sub-page nav helpers ──────────────────────────────────────────────────

	let currentPath = $derived($page.url.pathname);
	let sessionBase = $derived(`/sessions/${data.session.id}`);

	// Top tab bar — underline style inside rounded card
	function tabClass(path: string) {
		const active =
			path === sessionBase ? currentPath === sessionBase : currentPath.startsWith(path);
		return active
			? 'px-4 py-3 text-sm font-semibold themed-accent border-b-2 border-[color:var(--color-jns-amber)] transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[color:var(--color-jns-amber)]/40'
			: 'px-4 py-3 text-sm font-medium themed-text-secondary hover:themed-text-primary border-b-2 border-transparent transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[color:var(--color-jns-amber)]/40';
	}

	// Sticky footer pills (compact, used once scrolled)
	function navClass(path: string) {
		const active =
			path === sessionBase ? currentPath === sessionBase : currentPath.startsWith(path);
		return active
			? 'px-4 py-1.5 rounded-lg text-xs font-semibold themed-bg-accent themed-accent border border-[color:var(--accent)]/30'
			: 'px-4 py-1.5 rounded-lg text-xs font-medium themed-text-secondary hover:themed-text-primary hover:bg-[color:var(--card-nested)] transition-colors';
	}
</script>

<!-- ══════════════════════════════════════════════════════
     OPTION A: UNDERLINE TAB BAR — always visible below header
     ══════════════════════════════════════════════════════ -->
<div
	class="no-print mb-5 rounded-xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface)]"
>
	<nav class="flex items-center px-1" aria-label="Session sections">
		<a href={sessionBase} class={tabClass(sessionBase)}>Overview</a>
		<a href="{sessionBase}/analysis" class={tabClass(`${sessionBase}/analysis`)}>Analysis</a>
		<a href="{sessionBase}/detail" class={tabClass(`${sessionBase}/detail`)}>Deep Dive</a>
	</nav>
</div>

<div class="no-print pb-20">
	{@render children()}
</div>

<!-- ══════════════════════════════════════════════════════
     STICKY FOOTER — always visible, gives run context + report shortcut
     ══════════════════════════════════════════════════════ -->
{#if scrolled}
	<div
		class="no-print fixed right-0 bottom-0 left-0 z-40 border-t border-[color:var(--theme-border)] bg-[color:var(--theme-surface)]/95 shadow-lg backdrop-blur-sm"
	>
		<div class="mx-auto max-w-7xl px-4 py-2.5 sm:px-6 lg:px-8">
			<div class="flex items-center justify-between gap-4">
				<!-- Sub-page navigation -->
				<nav class="flex items-center gap-1" aria-label="Session sections">
					<a href={sessionBase} class={navClass(sessionBase)}>Overview</a>
					<a href="{sessionBase}/analysis" class={navClass(`${sessionBase}/analysis`)}>Analysis</a>
					<a href="{sessionBase}/detail" class={navClass(`${sessionBase}/detail`)}>Deep Dive</a>
				</nav>

				<!-- Session info (desktop) -->
				<div class="themed-text-secondary hidden items-center gap-2 text-xs md:flex">
					<span>{sessionDate}</span>
					<span>•</span>
					<span>{data.sessionStats.run_count} runs</span>
					{#if selectedRun}
						<span>•</span>
						<span class="themed-accent">Run #{selectedRun.run_number}</span>
					{/if}
				</div>

				<!-- Report button -->
				<button
					onclick={() => (showReportOptions = true)}
					class="flex items-center gap-2 rounded-lg bg-[color:var(--accent)] px-4 py-2
                           text-sm font-semibold text-[color:var(--bg)] transition-colors hover:bg-[color:var(--accent-dark)]
                           focus:ring-2 focus:ring-[color:var(--accent)] focus:ring-offset-2 focus:ring-offset-[color:var(--card)] focus:outline-none"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
					<span class="hidden sm:inline">Report</span>
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Report Options Modal -->
{#if showReportOptions}
	<div
		class="no-print fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4"
		role="button"
		tabindex="0"
		onclick={(e) => e.target === e.currentTarget && (showReportOptions = false)}
		onkeydown={(e) =>
			(e.key === 'Escape' || (e.key === 'Enter' && e.target === e.currentTarget)) &&
			(showReportOptions = false)}
		aria-label="Close report options"
	>
		<div
			class="my-8 w-full max-w-3xl"
			role="dialog"
			tabindex="-1"
			aria-modal="true"
			aria-labelledby="report-options-title"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<div
				class="themed-card flex items-center justify-between gap-4 rounded-t-xl border-b border-[color:var(--border)] px-5 py-4"
			>
				<div class="flex items-center gap-3">
					<div class="themed-bg-accent flex h-8 w-8 items-center justify-center rounded-lg">
						<svg
							class="themed-accent h-4 w-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
					</div>
					<div>
						<h2 id="report-options-title" class="themed-text-primary text-base font-bold">
							Generate Session Report
						</h2>
						<p class="themed-text-subtle text-xs">Customize your report options</p>
					</div>
				</div>
				<button
					onclick={() => (showReportOptions = false)}
					class="themed-text-subtle hover:themed-text-primary flex h-8 w-8 items-center justify-center
                           rounded-lg transition-colors hover:bg-[color:var(--card-nested)]
                           focus:ring-2 focus:ring-[color:var(--accent)] focus:outline-none"
					aria-label="Close"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
			<div class="themed-card space-y-4 rounded-b-xl p-5">
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div>
						<ReportOptionsPanel
							bind:reportType
							bind:detailLevel={reportDetailLevel}
							bind:includeCharts
							bind:includeDiag
							bind:includeAppendix
							bind:includeGoals
							hasActiveGoals={(data as any).goalProgress?.length > 0}
							progressAvailable={sessionIntelligenceSummaries.length >= 3}
							onGenerate={async () => {
								await generateReport();
								showReportOptions = false;
							}}
							{generating}
						/>
					</div>
					<div class="themed-nested-card rounded-lg p-4">
						<h4 class="themed-accent mb-3 text-xs font-semibold tracking-wider uppercase">
							What's Included
						</h4>
						<ul class="themed-text-secondary space-y-2 text-xs">
							<li class="flex items-start gap-2">
								<span class="themed-accent">•</span><span
									>Executive summary with confidence indicator</span
								>
							</li>
							<li class="flex items-start gap-2">
								<span class="themed-accent">•</span><span
									>Session quality metrics and repeatability analysis</span
								>
							</li>
							<li class="flex items-start gap-2">
								<span class="themed-accent">•</span><span
									>Technique breakdown with scores and recommendations</span
								>
							</li>
							{#if includeCharts}<li class="flex items-start gap-2">
									<span class="text-[#3de8c8]">•</span><span
										>Visual charts and performance curves</span
									>
								</li>{/if}
							{#if includeDiag}<li class="flex items-start gap-2">
									<span class="text-[#3de8c8]">•</span><span
										>Data quality assessment and diagnostics</span
									>
								</li>{/if}
							{#if includeAppendix}<li class="flex items-start gap-2">
									<span class="text-[#3de8c8]">•</span><span
										>Technical appendix with raw metrics</span
									>
								</li>{/if}
						</ul>
						<div class="mt-4 border-t border-[color:var(--border)] pt-4">
							<p class="themed-text-subtle text-[10px]">
								Reports can be printed or saved as PDF. JSON export available for data analysis.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Report Preview Modal -->
{#if showReport && report}
	<div
		class="report-modal-backdrop fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4"
		role="button"
		tabindex="0"
		onclick={(e) => e.target === e.currentTarget && closeReport()}
		onkeydown={(e) =>
			(e.key === 'Escape' || (e.key === 'Enter' && e.target === e.currentTarget)) && closeReport()}
		aria-label="Close report preview"
	>
		<div
			class="report-modal-dialog my-8 w-full max-w-5xl"
			role="dialog"
			tabindex="-1"
			aria-modal="true"
			aria-labelledby="report-title"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<ReportPreview
				{report}
				onClose={closeReport}
				coachLinks={(data as any).coachLinks ?? []}
				onSendToCoach={sendReportToCoach}
			/>
		</div>
	</div>
{/if}

<style>
	/* The report modal is a position:fixed overlay with overflow-y-auto, which
	   browsers generally can't paginate correctly when printing — content
	   renders blank or clipped to one page. Reset it to normal flow for print
	   so ReportPreview's own print styles (report-print.css equivalent inline
	   in that component) can lay out the full multi-page document. */
	@media print {
		.report-modal-backdrop {
			position: static !important;
			inset: auto !important;
			z-index: auto !important;
			display: block !important;
			overflow: visible !important;
			background: none !important;
			padding: 0 !important;
		}
		.report-modal-dialog {
			margin: 0 !important;
			max-width: none !important;
			width: auto !important;
		}
	}
</style>

<div class="no-print">
	<HelpPanel {helpKey} bind:open={helpOpen} />
</div>

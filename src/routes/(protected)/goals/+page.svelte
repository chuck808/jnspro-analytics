<script lang="ts">
    import type { PageData, ActionData } from './$types';
    import { HealthStatusDashboard, GoalProgressCard, AdjustmentSuggestionModal } from '$lib/components/goals';

    let { data, form }: { data: PageData; form: ActionData } = $props();

    const METRICS = [
        { id: 'reactionTime',     label: 'Reaction Time',       unit: 's',    direction: 'lower',  category: 'Gate',
          desc: 'Best reaction time across recent runs',       format: (v: number) => `${(v/1000).toFixed(3)}s`, inputUnit: 's', toDb: (v: number) => v * 1000, fromDb: (v: number) => v / 1000 },
        { id: 'maxG',             label: 'Peak G-Force',         unit: 'G',     direction: 'higher', category: 'Gate',
          desc: 'Highest G-force recorded',                   format: (v: number) => `${v.toFixed(2)}G` },
        { id: 'consistency',      label: 'Consistency Score',    unit: '%',     direction: 'higher', category: 'Gate',
          desc: 'Reaction time consistency (higher = better)', format: (v: number) => `${v.toFixed(1)}%` },
        { id: 'elapsedTime',      label: 'Elapsed Time',         unit: 's',     direction: 'lower',  category: 'Gate',
          desc: 'Best elapsed time for a gate run',           format: (v: number) => `${v.toFixed(3)}s` },
        { id: 'accelerationPhase',label: 'Acceleration Phase',   unit: 's',     direction: 'lower',  category: 'Technique',
          desc: 'Time to reach peak speed',                   format: (v: number) => `${v.toFixed(3)}s` },
        { id: 'endurance',        label: 'Gates per Session',    unit: 'runs',  direction: 'higher', category: 'Fitness',
          desc: 'Number of gate runs in a single session',    format: (v: number) => `${Math.round(v)} runs` },
    ] as const;

    type MetricId = typeof METRICS[number]['id'];

    function getMetric(id: string) {
        return METRICS.find(m => m.id === id);
    }

    let showAddForm    = $state(false);
    let selectedMetric = $state<MetricId>('reactionTime');
    let creating       = $state(false);
    let showCompleted  = $state(false);
    let showSuggestions = $state(false);
    let showFeatures = $state(false);
    let selectedGoalForSuggestions: any = $state(null);

    let activeGoals    = $derived((data.goals as any[]).filter(g => !g.completed_at));
    let completedGoals = $derived((data.goals as any[]).filter(g =>  g.completed_at));

    let currentForMetric = $derived(
        (data.currentValues as any)?.[selectedMetric] as number | null ?? null
    );

    // Calculate overall stats
    let overallStats = $derived(() => {
        if (activeGoals.length === 0) return null;
        
        const totalProgress = activeGoals.reduce((sum, g) => sum + (g.percentComplete || 0), 0);
        const avgProgress = totalProgress / activeGoals.length;
        
        const onTrack = activeGoals.filter(g => g.progressStatus === 'on_track' || g.progressStatus === 'ahead').length;
        const needsAttention = activeGoals.filter(g => g.progressStatus === 'behind' || g.progressStatus === 'way_behind').length;
        
        const withPredictions = activeGoals.filter(g => g.prediction?.sessionsRemaining !== null).length;
        
        return {
            totalActive: activeGoals.length,
            avgProgress: Math.round(avgProgress),
            onTrack,
            needsAttention,
            withPredictions
        };
    });

    function fmtValue(metric: ReturnType<typeof getMetric>, val: number | null | undefined): string {
        if (val === null || val === undefined) return '—';
        return metric?.format(val) ?? String(val);
    }

    function successFor(key: string) { return (form as any)?.[key] === true; }
    function errorFor(key: string)   { return (form as any)?.[key] as string | undefined; }
</script>

<svelte:head>
    <title>Training Goals — AppGatePro</title>
</svelte:head>

<div class="space-y-6">

    <!-- Hero Section -->
    <div class="relative overflow-hidden themed-card rounded-2xl p-8">
        <div class="relative z-10">
            <div class="flex items-start justify-between gap-4 flex-wrap mb-4">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                        <div class="w-12 h-12 rounded-full themed-bg-accent flex items-center justify-center">
                            <svg class="w-6 h-6 themed-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                            </svg>
                        </div>
                        <div>
                            <h1 class="text-3xl font-bold themed-text-primary">Training Goals</h1>
                            <p class="text-sm themed-accent font-medium mt-1">Your Personal Performance Coach</p>
                        </div>
                    </div>
                    <p class="text-sm themed-text-secondary max-w-2xl leading-relaxed">
                        Set performance targets, get predictions on when you'll achieve them, monitor your health, 
                        and receive adjustments to keep you on track—all while preventing burnout and injury.
                    </p>
                </div>
                <button
                    onclick={() => showAddForm = !showAddForm}
                    class="flex items-center gap-2 px-5 py-3 bg-[#f5a623] hover:bg-[#c97e0a]
                           text-[#0a0809] font-semibold text-sm rounded-lg transition-all shadow-lg shadow-[#f5a623]/20
                           hover:shadow-xl hover:shadow-[#f5a623]/30 min-h-[44px]
                           focus:outline-none focus:ring-2 focus:ring-[#f5a623]">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                    {showAddForm ? 'Cancel' : 'Create Goal'}
                </button>
            </div>

            <!-- Feature Pills -->
            {#if !showAddForm && activeGoals.length === 0}
                <div class="flex flex-wrap gap-2 mt-6">
                    <div class="px-3 py-1.5 bg-[#3de8c8]/10 border border-[#3de8c8]/30 rounded-full text-xs text-[#3de8c8] font-medium flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                        Advanced Predictions
                    </div>
                    <div class="px-3 py-1.5 bg-[#f5a623]/10 border border-[#f5a623]/30 rounded-full text-xs text-[#f5a623] font-medium flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                        </svg>
                        Confidence Intervals
                    </div>
                    <div class="px-3 py-1.5 bg-[#ff6b3d]/10 border border-[#ff6b3d]/30 rounded-full text-xs text-[#ff6b3d] font-medium flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                        </svg>
                        Injury Risk Detection
                    </div>
                    <div class="px-3 py-1.5 bg-[#9a8f7a]/10 border border-[#9a8f7a]/30 rounded-full text-xs text-[#9a8f7a] font-medium flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
                        </svg>
                        Adaptive Adjustments
                    </div>
                </div>
            {/if}
        </div>

        <!-- Background decoration -->
        <div class="absolute top-0 right-0 w-64 h-64 bg-[#f5a623]/5 rounded-full blur-3xl"></div>
    </div>

    <!-- Stats Overview -->
    {#if overallStats()}
        {@const stats = overallStats()!}
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="themed-card rounded-xl p-4">
                <div class="flex items-center gap-2 mb-2">
                    <div class="w-8 h-8 rounded-lg themed-bg-accent flex items-center justify-center">
                        <svg class="w-4 h-4 themed-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
                        </svg>
                    </div>
                    <p class="text-xs text-[#6b5f4d] uppercase tracking-wide">Active Goals</p>
                </div>
                <p class="text-2xl font-bold text-[#f0ece4]">{stats.totalActive}</p>
                <p class="text-xs text-[#9a8f7a] mt-1">In progress</p>
            </div>

            <div class="bg-[#131010] border border-[#221c18] rounded-xl p-4">
                <div class="flex items-center gap-2 mb-2">
                    <div class="w-8 h-8 rounded-lg bg-[#3de8c8]/10 flex items-center justify-center">
                        <svg class="w-4 h-4 text-[#3de8c8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                        </svg>
                    </div>
                    <p class="text-xs text-[#6b5f4d] uppercase tracking-wide">Avg Progress</p>
                </div>
                <p class="text-2xl font-bold text-[#3de8c8]">{stats.avgProgress}%</p>
                <p class="text-xs text-[#9a8f7a] mt-1">Overall completion</p>
            </div>

            <div class="bg-[#131010] border border-[#221c18] rounded-xl p-4">
                <div class="flex items-center gap-2 mb-2">
                    <div class="w-8 h-8 rounded-lg bg-[#3de8c8]/10 flex items-center justify-center">
                        <svg class="w-4 h-4 text-[#3de8c8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </div>
                    <p class="text-xs text-[#6b5f4d] uppercase tracking-wide">On Track</p>
                </div>
                <p class="text-2xl font-bold text-[#3de8c8]">{stats.onTrack}</p>
                <p class="text-xs text-[#9a8f7a] mt-1">Meeting targets</p>
            </div>

            <div class="bg-[#131010] border border-[#221c18] rounded-xl p-4">
                <div class="flex items-center gap-2 mb-2">
                    <div class="w-8 h-8 rounded-lg bg-[#ff6b3d]/10 flex items-center justify-center">
                        <svg class="w-4 h-4 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                    </div>
                    <p class="text-xs text-[#6b5f4d] uppercase tracking-wide">Tracked</p>
                </div>
                <p class="text-2xl font-bold text-[#f5a623]">{stats.withPredictions}</p>
                <p class="text-xs text-[#9a8f7a] mt-1">With predictions</p>
            </div>
        </div>
    {/if}

    <!-- AI Features Showcase (for new users) -->
    {#if activeGoals.length === 0 && !showAddForm}
        <button
            onclick={() => showFeatures = !showFeatures}
            class="w-full text-left">
            <div class="bg-[#131010] border border-[#221c18] hover:border-[#f5a623]/30 rounded-xl p-5 transition-colors">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-[#f5a623]/10 flex items-center justify-center">
                            <svg class="w-5 h-5 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                      d="M13 10V3L4 14h7v7l9-11h-7z"/>
                            </svg>
                        </div>
                        <div>
                            <h3 class="text-base font-semibold text-[#f0ece4]">
                                What makes our Goals system special?
                            </h3>
                            <p class="text-sm text-[#9a8f7a] mt-0.5">
                                Discover the features that act as your personal coach
                            </p>
                        </div>
                    </div>
                    <svg class="w-5 h-5 text-[#9a8f7a] transition-transform {showFeatures ? 'rotate-180' : ''}" 
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                </div>
            </div>
        </button>

        {#if showFeatures}
            <div class="grid md:grid-cols-2 gap-4">
                <!-- Feature 1: Advanced Predictions -->
                <div class="bg-gradient-to-br from-[#3de8c8]/5 to-[#131010] border border-[#3de8c8]/20 rounded-xl p-6">
                    <div class="w-12 h-12 rounded-xl bg-[#3de8c8]/10 flex items-center justify-center mb-4">
                        <svg class="w-6 h-6 text-[#3de8c8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-[#f0ece4] mb-2">Advanced Predictions</h3>
                    <p class="text-sm text-[#9a8f7a] leading-relaxed mb-4">
                        Analyzes your progress using polynomial regression and exponential fitting to predict 
                        <strong class="text-[#3de8c8]">exactly when</strong> you'll hit your target.
                    </p>
                    <div class="bg-[#0a0809] border border-[#221c18] rounded-lg p-3">
                        <p class="text-xs text-[#6b5f4d] mb-1">Example prediction:</p>
                        <p class="text-sm text-[#f0ece4]">
                            "<span class="text-[#3de8c8] font-semibold">5-9 sessions</span>, most likely 
                            <span class="text-[#3de8c8] font-semibold">7 sessions</span> remaining"
                        </p>
                        <p class="text-xs text-[#9a8f7a] mt-2">
                            Based on your current improvement rate with 85% confidence
                        </p>
                    </div>
                </div>

                <!-- Feature 2: Health Monitoring -->
                <div class="bg-gradient-to-br from-[#ff6b3d]/5 to-[#131010] border border-[#ff6b3d]/20 rounded-xl p-6">
                    <div class="w-12 h-12 rounded-xl bg-[#ff6b3d]/10 flex items-center justify-center mb-4">
                        <svg class="w-6 h-6 text-[#ff6b3d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-[#f0ece4] mb-2">Injury Prevention</h3>
                    <p class="text-sm text-[#9a8f7a] leading-relaxed mb-4">
                        Continuous monitoring detects fatigue patterns and overtraining risks 
                        <strong class="text-[#ff6b3d]">before injury happens</strong>, keeping you safe.
                    </p>
                    <div class="space-y-2">
                        <div class="flex items-start gap-2">
                            <div class="w-5 h-5 rounded bg-[#3de8c8]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg class="w-3 h-3 text-[#3de8c8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                                </svg>
                            </div>
                            <p class="text-xs text-[#9a8f7a]">Fatigue score tracking (0-100)</p>
                        </div>
                        <div class="flex items-start gap-2">
                            <div class="w-5 h-5 rounded bg-[#3de8c8]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg class="w-3 h-3 text-[#3de8c8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                                </svg>
                            </div>
                            <p class="text-xs text-[#9a8f7a]">Training load spike detection</p>
                        </div>
                        <div class="flex items-start gap-2">
                            <div class="w-5 h-5 rounded bg-[#3de8c8]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg class="w-3 h-3 text-[#3de8c8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                                </svg>
                            </div>
                            <p class="text-xs text-[#9a8f7a]">Recommended rest days</p>
                        </div>
                    </div>
                </div>

                <!-- Feature 3: Adaptive Adjustments -->
                <div class="bg-gradient-to-br from-[#f5a623]/5 to-[#131010] border border-[#f5a623]/20 rounded-xl p-6">
                    <div class="w-12 h-12 rounded-xl bg-[#f5a623]/10 flex items-center justify-center mb-4">
                        <svg class="w-6 h-6 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-[#f0ece4] mb-2">Smart Adjustments</h3>
                    <p class="text-sm text-[#9a8f7a] leading-relaxed mb-4">
                        When you're ahead or behind schedule, get 
                        <strong class="text-[#f5a623]">specific suggestions</strong> to keep you motivated and on track.
                    </p>
                    <div class="bg-[#0a0809] border border-[#221c18] rounded-lg p-3">
                        <p class="text-xs text-[#6b5f4d] mb-2">Example suggestions:</p>
                        <div class="space-y-2">
                            <div class="flex items-start gap-2">
                                <svg class="w-4 h-4 text-[#3de8c8] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                                </svg>
                                <p class="text-xs text-[#f0ece4]">Set a stretch goal - you're crushing it!</p>
                            </div>
                            <div class="flex items-start gap-2">
                                <svg class="w-4 h-4 text-[#f5a623] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                </svg>
                                <p class="text-xs text-[#f0ece4]">Extend deadline by 2 weeks for safety</p>
                            </div>
                            <div class="flex items-start gap-2">
                                <svg class="w-4 h-4 text-[#ff6b3d] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                                </svg>
                                <p class="text-xs text-[#f0ece4]">Pause goal - prioritize recovery</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Feature 4: Progress Status -->
                <div class="bg-gradient-to-br from-[#9a8f7a]/5 to-[#131010] border border-[#9a8f7a]/20 rounded-xl p-6">
                    <div class="w-12 h-12 rounded-xl bg-[#9a8f7a]/10 flex items-center justify-center mb-4">
                        <svg class="w-6 h-6 text-[#9a8f7a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-[#f0ece4] mb-2">Real-Time Status</h3>
                    <p class="text-sm text-[#9a8f7a] leading-relaxed mb-4">
                        Instant feedback on your progress with 
                        <strong class="text-[#9a8f7a]">visual indicators</strong> showing if you're ahead, on track, or need to adjust.
                    </p>
                    <div class="space-y-2">
                        <div class="flex items-center gap-2 p-2 bg-[#3de8c8]/5 border border-[#3de8c8]/20 rounded">
                            <svg class="w-4 h-4 text-[#3de8c8] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                            </svg>
                            <span class="text-xs text-[#3de8c8] font-medium">Way Ahead</span>
                            <span class="text-xs text-[#6b5f4d]">· 30%+ ahead of schedule</span>
                        </div>
                        <div class="flex items-center gap-2 p-2 bg-[#f5a623]/5 border border-[#f5a623]/20 rounded">
                            <svg class="w-4 h-4 text-[#f5a623] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <span class="text-xs text-[#f5a623] font-medium">On Track</span>
                            <span class="text-xs text-[#6b5f4d]">· Within 10% of target</span>
                        </div>
                        <div class="flex items-center gap-2 p-2 bg-[#ff6b3d]/5 border border-[#ff6b3d]/20 rounded">
                            <svg class="w-4 h-4 text-[#ff6b3d] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                            </svg>
                            <span class="text-xs text-[#ff6b3d] font-medium">Behind</span>
                            <span class="text-xs text-[#6b5f4d]">· Needs adjustment</span>
                        </div>
                    </div>
                </div>
            </div>
        {/if}
    {/if}

    <!-- PHASE 5: Health Status Dashboard -->
    {#if data.healthCheck}
        <HealthStatusDashboard 
            healthCheck={data.healthCheck}
        />
    {:else if data.sessionCount > 0 && data.sessionCount < 10}
        <div class="themed-card rounded-xl p-4 text-sm">
            <p class="themed-text-primary font-medium mb-1">Training health — available at 10 sessions</p>
            <p class="themed-text-secondary">
                Fatigue and training load analysis needs enough sessions to distinguish real patterns from normal variation.
                {10 - data.sessionCount} more session{10 - data.sessionCount === 1 ? '' : 's'} to unlock.
            </p>
        </div>
    {/if}

    {#if data.sessionCount === 0}
        <div class="bg-[#131010] border border-[#f5a623]/20 rounded-xl p-4 text-sm">
            <p class="text-[#f5a623] font-medium mb-1">No session data yet</p>
            <p class="text-[#9a8f7a]">
                Upload sessions to get automatic current value tracking.
                You can still create goals manually.
            </p>
        </div>
    {/if}

    <!-- Add goal form -->
    {#if showAddForm}
        <div class="bg-[#131010] border border-[#f5a623]/20 rounded-xl p-6">
            <h2 class="text-base font-semibold text-[#f0ece4] mb-4">New Training Goal</h2>

            {#if successFor('createSuccess')}
                <div class="mb-4 p-3 bg-[#3de8c8]/10 border border-[#3de8c8]/30 rounded-lg text-[#3de8c8] text-sm">
                    Goal created successfully
                </div>
            {/if}
            {#if errorFor('createError')}
                <div class="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
                    {errorFor('createError')}
                </div>
            {/if}

            <form method="POST" action="?/createGoal"
                  onsubmit={() => creating = true}
                  class="space-y-4">

                <div>
                    <label for="metric" class="block text-xs font-medium text-[#9a8f7a] mb-1.5">
                        Performance metric
                    </label>
                    <select id="metric" name="metric"
                            bind:value={selectedMetric}
                            class="input-field w-full">
                        {#each ['Gate', 'Technique', 'Fitness'] as cat}
                            <optgroup label={cat}>
                                {#each METRICS.filter(m => m.category === cat) as m}
                                    <option value={m.id}>{m.label} ({m.unit})</option>
                                {/each}
                            </optgroup>
                        {/each}
                    </select>
                    <p class="text-xs text-[#6b5f4d] mt-1">
                        {getMetric(selectedMetric)?.desc ?? ''}
                        {#if currentForMetric !== null}
                            · Current: {getMetric(selectedMetric)?.format(currentForMetric)}
                        {/if}
                    </p>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label for="start_value" class="block text-xs font-medium text-[#9a8f7a] mb-1.5">
                            Start value ({getMetric(selectedMetric)?.unit})
                        </label>
                        <input id="start_value" name="start_value" type="number" step="any" required
                               value={currentForMetric !== null ? ((getMetric(selectedMetric) as any)?.fromDb?.(currentForMetric) ?? currentForMetric).toFixed(3) : ''}
                               class="input-field w-full"
                               placeholder="e.g. 0.650" />
                        <p class="text-xs text-[#6b5f4d] mt-1">Where you are now</p>
                    </div>
                    <div>
                        <label for="target_value" class="block text-xs font-medium text-[#9a8f7a] mb-1.5">
                            Target ({getMetric(selectedMetric)?.unit})
                            <span class="text-[#6b5f4d] font-normal ml-1">
                                — {getMetric(selectedMetric)?.direction === 'lower' ? 'lower' : 'higher'} is better
                            </span>
                        </label>
                        <input id="target_value" name="target_value" type="number" step="any" required
                               class="input-field w-full" placeholder="e.g. 200" />
                    </div>
                    <div>
                        <label for="deadline" class="block text-xs font-medium text-[#9a8f7a] mb-1.5">
                            Target date
                        </label>
                        <input id="deadline" name="deadline" type="date" required
                               min={new Date().toISOString().split('T')[0]}
                               class="input-field w-full" />
                    </div>
                </div>

                <button type="submit" disabled={creating} class="btn-primary">
                    {creating ? 'Creating...' : 'Create goal'}
                </button>
            </form>
        </div>
    {/if}

    <!-- Active goals -->
    {#if activeGoals.length === 0 && !showAddForm}
        <!-- Empty state already shown in features section above -->
    {:else if activeGoals.length > 0}
        <div class="space-y-4">
            {#each data.goalsWithIntelligence.filter(g => !g.completed_at) as goal}
                {@const metric = getMetric(goal.metric)}
                {@const current = goal.computed_current ?? goal.current_value}
                {@const lowerIsBetter = metric?.direction === 'lower'}
                
                {@const pct = (() => {
                    if (current === null || current === undefined || goal.start_value === null || goal.target_value === null) return 0;
                    if (lowerIsBetter) {
                        return Math.min(100, Math.max(0, ((goal.start_value - current) / (goal.start_value - goal.target_value)) * 100));
                    } else {
                        return Math.min(100, Math.max(0, ((current - goal.start_value) / (goal.target_value - goal.start_value)) * 100));
                    }
                })()}

                {@const progressColor = pct >= 80 ? '#3de8c8' : pct >= 50 ? '#f5a623' : pct >= 25 ? '#ffcc44' : '#ff4444'}

                {@const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null}
                {@const daysText = daysLeft === null ? '—' : daysLeft < 0 ? 'Overdue' : daysLeft === 0 ? 'Due today' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                {@const daysColor = daysLeft === null ? '#9a8f7a' : daysLeft < 0 ? '#ff4444' : daysLeft <= 7 ? '#f5a623' : '#9a8f7a'}

                <div class="bg-[#131010] border border-[#221c18] rounded-xl p-5 transition-colors">
                    <div class="flex items-start justify-between gap-4 flex-wrap mb-4">
                        <div>
                            <div class="flex items-center gap-2 mb-0.5">
                                <span class="text-xs font-medium text-[#6b5f4d] uppercase tracking-wider">
                                    {metric?.category ?? ''}
                                </span>
                                <span class="text-xs text-[#6b5f4d]">·</span>
                                <span class="text-xs" style="color:{daysColor}">
                                    {daysText}
                                </span>
                            </div>
                            <h3 class="text-base font-semibold text-[#f0ece4]">{metric?.label ?? goal.metric}</h3>
                        </div>

                        <div class="flex items-center gap-2 flex-wrap">
                            {#if (goal as any).adaptiveAnalysis?.suggestions && (goal as any).adaptiveAnalysis.suggestions.length > 0}
                                <button
                                    onclick={() => selectedGoalForSuggestions = goal}
                                    class="px-3 py-1.5 text-xs text-[#f5a623] bg-[#f5a623]/10
                                           hover:bg-[#f5a623]/20 border border-[#f5a623]/20
                                           rounded-lg transition-colors min-h-[44px] flex items-center gap-1.5
                                           focus:outline-none focus:ring-2 focus:ring-[#f5a623]">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                                    </svg>
                                    View Suggestions ({(goal as any).adaptiveAnalysis.suggestions.length})
                                </button>
                            {/if}
                            <form method="POST" action="?/completeGoal">
                                <input type="hidden" name="goal_id" value={goal.id} />
                                <button type="submit"
                                        class="px-3 py-1.5 text-xs text-[#3de8c8] bg-[#3de8c8]/10
                                               hover:bg-[#3de8c8]/20 border border-[#3de8c8]/20
                                               rounded-lg transition-colors min-h-[44px]
                                               focus:outline-none focus:ring-2 focus:ring-[#3de8c8]">
                                    Mark complete
                                </button>
                            </form>
                            <form method="POST" action="?/deleteGoal">
                                <input type="hidden" name="goal_id" value={goal.id} />
                                <button type="submit"
                                        class="px-3 py-1.5 text-xs text-[#ff4444] bg-red-900/10
                                               hover:bg-red-900/20 border border-[#ff6b3d]/20
                                               rounded-lg transition-colors min-h-[44px]
                                               focus:outline-none focus:ring-2 focus:ring-red-500">
                                    Delete
                                </button>
                            </form>
                        </div>
                    </div>

                    <!-- Progress bar -->
                    <div class="mb-4">
                        <div class="flex items-end justify-between text-xs mb-1.5 flex-wrap gap-1">
                            <div class="flex gap-3 flex-wrap">
                                <span class="text-[#6b5f4d]">
                                    Start: <span class="text-[#f0ece4]">{fmtValue(metric, goal.start_value)}</span>
                                </span>
                                <span class="text-[#6b5f4d]">
                                    Current: 
                                    {#if current === null && goal.metric === 'peakSpeed'}
                                        <span class="text-[#6b5f4d] italic">not available — check device calibration</span>
                                    {:else}
                                        <span class="font-bold" style="color:{progressColor}">{fmtValue(metric, current)}</span>
                                    {/if}
                                </span>
                                <span class="text-[#6b5f4d]">
                                    Target: <span class="text-[#f0ece4]">{fmtValue(metric, goal.target_value)}</span>
                                </span>
                                {#if goal.progressStatus}
                                    <span class="text-[#6b5f4d]">
                                        Status: <span class="font-medium capitalize" style="color:{progressColor}">{goal.progressStatus.replace('_', ' ')}</span>
                                    </span>
                                {/if}
                            </div>
                            <span class="font-bold text-sm" style="color:{progressColor}">{Math.round(pct)}%</span>
                        </div>
                        <div class="w-full bg-[#221c18] rounded-full h-2.5">
                            <div class="h-2.5 rounded-full transition-all duration-500"
                                 style="width:{pct}%; background:{progressColor}">
                            </div>
                        </div>
                    </div>

                    <!-- PHASE 5: Prediction -->
                    {#if goal.prediction && goal.prediction.sessionsRemaining !== null}
                        <div class="mb-4 p-3 bg-[#f5a623]/5 rounded-lg border border-[#f5a623]/10">
                            <div class="flex items-center justify-between mb-1">
                                <p class="text-xs uppercase tracking-wide text-[#f5a623] font-medium">Prediction</p>
                                <span class="text-xs px-2 py-0.5 rounded-full bg-[#f5a623]/20 text-[#f5a623]">
                                    {goal.prediction.type}
                                </span>
                            </div>
                            <div class="flex items-baseline gap-2">
                                <p class="text-lg font-bold text-[#f0ece4]">
                                    {goal.prediction.confidenceInterval?.median || goal.prediction.sessionsRemaining}
                                </p>
                                <p class="text-sm text-[#9a8f7a]">sessions remaining</p>
                                {#if goal.prediction.confidenceInterval}
                                    <p class="text-xs text-[#6b5f4d]">
                                        ({goal.prediction.confidenceInterval.lower}-{goal.prediction.confidenceInterval.upper} range)
                                    </p>
                                {/if}
                            </div>
                            <p class="text-xs text-[#6b5f4d] mt-1 italic">
                                {goal.prediction.metadata.reason}
                            </p>
                        </div>
                    {/if}

                    <!-- Milestones -->
                    {#if Array.isArray(goal.goal_milestones) && goal.goal_milestones.length > 0}
                        <div class="border-t border-[#221c18] pt-3 mt-3">
                            <p class="text-xs font-medium text-[#6b5f4d] mb-2">Milestones</p>
                            <div class="flex flex-wrap gap-2">
                                {#each goal.goal_milestones as m}
                                    {#if m && m.value !== undefined && m.achieved_at}
                                        <span class="text-xs px-2 py-1 bg-[#0a0809] rounded-lg text-[#9a8f7a]">
                                            {fmtValue(metric, m.value)} · {new Date(m.achieved_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
                                        </span>
                                    {/if}
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    {/if}

    <!-- Completed goals -->
    {#if completedGoals.length > 0}
        <div>
            <button
                onclick={() => showCompleted = !showCompleted}
                class="text-sm text-[#6b5f4d] hover:text-[#9a8f7a] transition-colors mb-3
                       focus:outline-none focus:ring-2 focus:ring-[#f5a623] rounded">
                {showCompleted ? '▾' : '▸'} {completedGoals.length} completed goal{completedGoals.length !== 1 ? 's' : ''}
            </button>

            {#if showCompleted}
                <div class="space-y-3">
                    {#each completedGoals as goal}
                        {@const metric = getMetric(goal.metric)}
                        <div class="bg-[#131010] border border-[#3de8c8]/20 rounded-xl p-4 opacity-75">
                            <div class="flex items-center justify-between gap-4">
                                <div>
                                    <span class="text-xs text-[#3de8c8] font-medium">✓ Completed</span>
                                    <p class="text-sm font-semibold text-[#f0ece4]">{metric?.label ?? goal.metric}</p>
                                    <p class="text-xs text-[#6b5f4d]">
                                        Target: {fmtValue(metric, goal.target_value)}
                                        {#if goal.completed_at}
                                            · {new Date(goal.completed_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                                        {/if}
                                    </p>
                                </div>
                                <form method="POST" action="?/deleteGoal">
                                    <input type="hidden" name="goal_id" value={goal.id} />
                                    <button type="submit"
                                            class="text-xs text-[#6b5f4d] hover:text-[#ff4444] transition-colors min-h-[44px] px-2">
                                        Remove
                                    </button>
                                </form>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    {/if}

</div>

<!-- Adjustment Suggestions Modal -->
{#if selectedGoalForSuggestions && (selectedGoalForSuggestions as any).adaptiveAnalysis}
    <AdjustmentSuggestionModal
        suggestions={(selectedGoalForSuggestions as any).adaptiveAnalysis.suggestions}
        bind:open={selectedGoalForSuggestions}
        onClose={() => selectedGoalForSuggestions = null}
        onApply={async (suggestion) => {
            // Submit the form to apply the suggestion
            const formData = new FormData();
            formData.append('goal_id', selectedGoalForSuggestions.id);
            formData.append('adjustment_type', suggestion.type);
            
            // Add the appropriate value based on type
            if (suggestion.type === 'increase_target' || suggestion.type === 'decrease_target') {
                formData.append('new_value', String(suggestion.suggestedValue));
            } else if (suggestion.type === 'extend_deadline' || suggestion.type === 'shorten_deadline') {
                // Convert Date to ISO string if needed
                const dateValue = suggestion.suggestedValue instanceof Date 
                    ? suggestion.suggestedValue.toISOString().split('T')[0]
                    : suggestion.suggestedValue;
                formData.append('new_value', dateValue);
            }

            try {
                const response = await fetch('?/applySuggestion', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    // Close modal and reload page to show updated goal
                    selectedGoalForSuggestions = null;
                    window.location.reload();
                }
            } catch (error) {
                console.error('Error applying suggestion:', error);
            }
        }}
    />
{/if}

<style>
    :global(.input-field) {
        padding: 0.625rem 1rem;
        background: #0a0809;
        border: 1px solid #221c18;
        border-radius: 0.5rem;
        color: #f0ece4;
        font-size: 0.875rem;
        transition: border-color 0.15s, box-shadow 0.15s;
    }
    :global(.input-field:focus) {
        outline: none;
        border-color: #f5a623;
        box-shadow: 0 0 0 1px #f5a623;
    }
    :global(.btn-primary) {
        padding: 0.625rem 1.25rem;
        min-height: 44px;
        background: #f5a623;
        color: #0a0809;
        font-weight: 600;
        font-size: 0.875rem;
        border-radius: 0.5rem;
        border: none;
        cursor: pointer;
        transition: background-color 0.15s;
    }
    :global(.btn-primary:hover)    { background: #c97e0a; }
    :global(.btn-primary:disabled) { opacity: 0.5; cursor: not-allowed; }
</style>
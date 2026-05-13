<script lang="ts">
    import type { PageData } from './$types';
    let { data }: { data: PageData } = $props();

    function fmtReaction(ms: number | null) { return ms !== null ? (ms/1000).toFixed(3)+'s' : '—'; }
    function fmtSpeed(ms: number | null)    { return ms !== null ? (ms*3.6).toFixed(1) : '—'; }
    function fmtG(g: number | null)          { return g  !== null ? g.toFixed(2)+'G' : '—'; }
    function fmtConsistency(cv: number | null | undefined) {
        if (cv === null || cv === undefined) return { value: '—', label: 'No data', color: '#6b5f4d' };
        if (cv < 2) return { value: cv.toFixed(1)+'%', label: 'Outstanding', color: '#3de8c8' };
        if (cv < 5) return { value: cv.toFixed(1)+'%', label: 'Good', color: '#f5a623' };
        return { value: cv.toFixed(1)+'%', label: 'Variable', color: '#ff4444' };
    }

    let consistencyData = $derived(fmtConsistency(data.consistency));
</script>

<svelte:head>
    <title>Dashboard — AppGatePro</title>
</svelte:head>

<div class="space-y-6">

    <!-- Welcome banner -->
    <div class="themed-card">
        <h2 class="text-xl font-bold themed-text-primary mb-1">
            Welcome back, {data.profile?.name?.split(' ')[0] ?? 'Rider'} 👋
        </h2>
        <p class="text-sm themed-text-secondary">
            {#if data.sessionCount === 0}
                Upload your first session to start tracking your BMX performance.
            {:else if data.sessionCount === 1}
                You've uploaded {data.sessionCount} session with {data.totalRuns} run{data.totalRuns !== 1 ? 's' : ''}.
            {:else}
                You've uploaded {data.sessionCount} sessions with {data.totalRuns} total runs.
            {/if}
        </p>
    </div>

    <!-- Quick stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {#each [
            {
                label: 'Total Sessions',
                value: data.sessionCount > 0 ? String(data.sessionCount) : '—',
                sub:   data.sessionCount > 0 ? `${data.totalRuns} total runs` : 'Upload your first session',
                icon:  'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
            },
            {
                label: 'Best Reaction',
                value: data.sessionCount > 0 ? fmtReaction(data.personalBests.reaction_ms) : '—',
                sub:   data.sessionCount > 0 ? 'all time best' : 'No data yet',
                icon:  'M13 10V3L4 14h7v7l9-11h-7z'
            },
            {
                label: 'Peak Speed',
                value: data.sessionCount > 0 ? fmtSpeed(data.personalBests.peak_speed_ms) : '—',
                sub:   data.sessionCount > 0 ? 'km/h · estimated' : 'No data yet',
                icon:  'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
            },
            {
                label: 'Consistency',
                value: consistencyData.value,
                sub:   consistencyData.label,
                icon:  'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
            }
        ] as stat}
            <div class="themed-card themed-card-hover">
                <div class="flex items-start justify-between mb-2">
                    <p class="text-xs themed-text-secondary uppercase tracking-wider">{stat.label}</p>
                    <svg class="w-4 h-4 themed-text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={stat.icon}/>
                    </svg>
                </div>
                <p class="text-3xl font-bold themed-accent">{stat.value}</p>
                <p class="text-xs themed-text-subtle mt-1">{stat.sub}</p>
            </div>
        {/each}
    </div>

    <!-- Active Goals -->
    {#if data.activeGoals && data.activeGoals.length > 0}
        <div class="themed-card">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-semibold themed-text-primary">Active Goals</h3>
                <a href="/goals"
                   class="text-xs themed-text-secondary hover:themed-accent transition-colors
                          focus:outline-none focus:ring-2 focus:ring-[#f5a623] rounded">
                    View all →
                </a>
            </div>

            <div class="space-y-3">
                {#each data.activeGoals as goal}
                    <div class="themed-nested-card">
                        <div class="flex items-start justify-between mb-2">
                            <div class="flex-1">
                                <p class="text-sm font-medium themed-text-primary mb-1">
                                    {goal.metric === 'reactionTime'     ? 'Reaction Time' :
                                     goal.metric === 'maxG'             ? 'Max G-Force' :
                                     goal.metric === 'peakSpeed'        ? 'Peak Speed' :
                                     goal.metric === 'consistency'      ? 'Consistency' :
                                     goal.metric === 'elapsedTime'      ? 'Elapsed Time' :
                                     goal.metric === 'accelerationPhase'? 'Acceleration Phase' :
                                     goal.metric === 'endurance'        ? 'Gates per Session' :
                                     goal.metric}
                                </p>
                                <p class="text-xs themed-text-secondary">
                                    Target: {goal.target_value?.toFixed(2) ?? '—'}
                                    {#if goal.current_value !== null}
                                        · Current: {goal.current_value.toFixed(2)}
                                    {/if}
                                </p>
                            </div>
                            <div class="text-right flex-shrink-0 ml-3">
                                {#if goal.isOverdue}
                                    <span class="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-400">Overdue</span>
                                {:else if goal.daysUntilDeadline <= 7}
                                    <span class="text-xs px-2 py-0.5 rounded bg-[#f5a623]/10 themed-accent">{goal.daysUntilDeadline}d left</span>
                                {:else}
                                    <span class="text-xs themed-text-subtle">{goal.daysUntilDeadline} days</span>
                                {/if}
                            </div>
                        </div>

                        <div class="w-full themed-progress-track rounded-full h-2 overflow-hidden">
                            <div
                                class="h-full rounded-full transition-all duration-500"
                                style="width:{goal.progress}%; background:{goal.progress >= 75 ? '#3de8c8' : goal.progress >= 25 ? '#f5a623' : '#6b5f4d'}">
                            </div>
                        </div>
                        <p class="text-xs themed-text-subtle mt-1">{goal.progress}% complete</p>
                    </div>
                {/each}
            </div>

            <a href="/goals"
               class="mt-4 flex items-center justify-center gap-2 p-3 rounded-lg themed-nested-surface
                      hover:bg-[var(--theme-surface-hover)] themed-border hover:border-[#f5a623]/20
                      transition-all text-sm themed-text-secondary hover:themed-accent min-h-[44px]
                      focus:outline-none focus:ring-2 focus:ring-[#f5a623]">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                Create New Goal
            </a>
        </div>
    {/if}

    {#if data.sessionCount === 0}
        <!-- First time upload CTA -->
        <div class="themed-card border-[#f5a623]/20 text-center">
            <div class="w-16 h-16 bg-[#f5a623]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 themed-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                </svg>
            </div>
            <h3 class="text-lg font-semibold themed-text-primary mb-2">Upload your first session</h3>
            <p class="text-sm themed-text-secondary mb-6 max-w-sm mx-auto">
                Copy the JSON file from your AppGatePro SD card and upload it to start seeing your analytics.
            </p>
            <a href="/upload"
               class="inline-flex items-center gap-2 px-6 py-3 themed-bg-accent hover:bg-[#c97e0a]
                      font-semibold rounded-lg transition-colors text-sm min-h-[44px]
                      focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[var(--theme-bg)]">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                </svg>
                Upload Session
            </a>
        </div>

    {:else}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <!-- Recent sessions -->
            <div class="themed-card">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-sm font-semibold themed-text-primary">Recent Sessions</h3>
                    <a href="/sessions"
                       class="text-xs themed-text-secondary hover:themed-accent transition-colors
                              focus:outline-none focus:ring-2 focus:ring-[#f5a623] rounded">
                        View all →
                    </a>
                </div>

                {#if data.recentSessions.length === 0}
                    <p class="text-sm themed-text-subtle text-center py-8">No sessions yet</p>
                {:else}
                    <div class="space-y-2">
                        {#each data.recentSessions as session}
                            <a href="/sessions/{session.id}"
                               class="flex items-center gap-4 p-3 rounded-lg themed-nested-surface
                                      hover:bg-[var(--theme-surface-hover)] transition-colors group min-h-[44px]
                                      focus:outline-none focus:ring-2 focus:ring-[#f5a623]
                                      focus:ring-offset-2 focus:ring-offset-[var(--theme-surface)]">
                                <div class="w-10 text-center flex-shrink-0">
                                    <p class="text-sm font-bold themed-accent">{new Date(session.timestamp).getDate()}</p>
                                    <p class="text-xs themed-text-subtle">{new Date(session.timestamp).toLocaleDateString('en-GB',{month:'short'})}</p>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-2 mb-0.5">
                                        <p class="text-sm font-medium themed-text-primary">{session.run_count} runs</p>
                                        {#if session.reaction_cv !== null && session.reaction_cv < 2}
                                            <span class="text-xs px-1.5 py-0.5 rounded bg-[#3de8c8]/10 text-[#3de8c8]">Consistent</span>
                                        {/if}
                                    </div>
                                    <p class="text-xs themed-text-subtle">
                                        Best: {fmtReaction(session.best_reaction_ms)}
                                        {#if session.has_valid_speed} · {fmtSpeed(session.best_peak_speed_ms)}{/if}
                                    </p>
                                </div>
                                <svg class="w-4 h-4 themed-text-subtle group-hover:themed-accent transition-colors flex-shrink-0"
                                     fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                                </svg>
                            </a>
                        {/each}
                    </div>
                {/if}
            </div>

            <!-- Quick actions + personal bests -->
            <div class="space-y-4">

                <div class="themed-card">
                    <h3 class="text-sm font-semibold themed-text-primary mb-3">Quick Actions</h3>
                    <div class="space-y-2">
                        {#each [
                            {
                                href: '/upload',
                                label: 'Upload Session',
                                sub: 'Add more training data',
                                amber: true,
                                icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12'
                            },
                            {
                                href: '/analytics',
                                label: 'View Analytics',
                                sub: 'Trends, charts & insights',
                                amber: false,
                                icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                            },
                            {
                                href: '/sessions',
                                label: 'All Sessions',
                                sub: `Browse all ${data.sessionCount} sessions`,
                                amber: false,
                                icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
                            },
                        ] as action}
                            <a href={action.href}
                               class="flex items-center gap-3 p-3 rounded-lg transition-all group min-h-[44px]
                                      focus:outline-none focus:ring-2 focus:ring-[#f5a623]
                                      {action.amber
                                          ? 'bg-[#f5a623]/10 hover:bg-[#f5a623]/20 border border-[#f5a623]/20 hover:border-[#f5a623]/40'
                                          : 'themed-nested-surface hover:bg-[var(--theme-surface-hover)] themed-border hover:border-[#f5a623]/20'}">
                                <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
                                            {action.amber ? 'bg-[#f5a623]/20 group-hover:bg-[#f5a623]/30' : 'themed-progress-track'}">
                                    <svg class="w-5 h-5 {action.amber ? 'themed-accent' : 'themed-text-secondary'}"
                                         fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={action.icon}/>
                                    </svg>
                                </div>
                                <div class="flex-1">
                                    <p class="text-sm font-medium themed-text-primary">{action.label}</p>
                                    <p class="text-xs themed-text-secondary">{action.sub}</p>
                                </div>
                                <svg class="w-4 h-4 flex-shrink-0 transition-colors
                                            {action.amber ? 'themed-accent' : 'themed-text-subtle group-hover:themed-accent'}"
                                     fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                                </svg>
                            </a>
                        {/each}
                    </div>
                </div>

                <!-- Personal bests -->
                {#if data.personalBests.reaction_ms}
                    <div class="themed-card">
                        <h3 class="text-sm font-semibold themed-text-primary mb-3">Personal Bests</h3>
                        <div class="space-y-2 text-sm">
                            <div class="flex items-center justify-between">
                                <span class="themed-text-secondary">Reaction</span>
                                <span class="font-bold themed-accent">{fmtReaction(data.personalBests.reaction_ms)}</span>
                            </div>
                            {#if data.personalBests.peak_speed_ms}
                                <div class="flex items-center justify-between">
                                    <span class="themed-text-secondary">Speed</span>
                                    <span class="font-bold themed-accent">{fmtSpeed(data.personalBests.peak_speed_ms)} km/h</span>
                                </div>
                            {/if}
                            {#if data.personalBests.max_g}
                                <div class="flex items-center justify-between">
                                    <span class="themed-text-secondary">Max G</span>
                                    <span class="font-bold themed-accent">{fmtG(data.personalBests.max_g)}</span>
                                </div>
                            {/if}
                        </div>
                    </div>
                {/if}

            </div>
        </div>
    {/if}

</div>

<style>
    /* Themed utility classes using CSS variables */
    .themed-card {
        background: var(--theme-surface);
        border: 1px solid var(--theme-border);
        border-radius: 0.75rem;
        padding: 1.25rem;
    }

    .themed-card-hover:hover {
        border-color: rgba(245, 166, 35, 0.2);
        transition: border-color 0.2s;
    }

    .themed-nested-card {
        background: var(--theme-bg);
        border: 1px solid var(--theme-border);
        border-radius: 0.5rem;
        padding: 1rem;
        transition: border-color 0.2s;
    }

    .themed-nested-card:hover {
        border-color: rgba(245, 166, 35, 0.2);
    }

    .themed-nested-surface {
        background: var(--theme-bg);
    }

    .themed-border {
        border: 1px solid var(--theme-border);
    }

    .themed-text-primary {
        color: var(--theme-text-primary);
    }

    .themed-text-secondary {
        color: var(--theme-text-secondary);
    }

    .themed-text-subtle {
        color: var(--theme-text-subtle);
    }

    .themed-progress-track {
        background: var(--theme-border);
    }
</style>

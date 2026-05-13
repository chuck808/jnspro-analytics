<script lang="ts">
    import type { PageData } from './$types';
    let { data }: { data: PageData } = $props();

    function fmtReaction(ms: number | null) { return ms !== null ? (ms/1000).toFixed(3)+'s' : '—'; }
    function fmtSpeed(ms: number | null)    { return ms !== null ? (ms*3.6).toFixed(1) : '—'; }
    function fmtG(g: number | null)          { return g  !== null ? g.toFixed(2)+'G' : '—'; }
    function fmtConsistency(cv: number | null) {
        if (cv === null) return { value: '—', label: 'No data', color: '#6b5f4d' };
        if (cv < 2) return { value: cv.toFixed(1)+'%', label: 'Outstanding', color: '#3de8c8' };
        if (cv < 5) return { value: cv.toFixed(1)+'%', label: 'Good', color: '#f5a623' };
        return { value: cv.toFixed(1)+'%', label: 'Variable', color: '#ff4444' };
    }

    let consistencyData = $derived(fmtConsistency(data.consistency));

    // Generate insights based on user data
    type Insight = {
        iconPath: string;
        text: string;
        detail: string;
        color: string;
    };
    
    let insights = $derived.by(() => {
        const result: Insight[] = [];
        if (data.sessionCount === 0) return result;

        // Consistency insight
        if (data.consistency !== null && data.consistency < 2) {
            result.push({
                iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
                text: 'Outstanding consistency',
                detail: `Your reaction times vary by only ${data.consistency.toFixed(1)}%`,
                color: '#3de8c8'
            });
        } else if (data.consistency !== null && data.consistency > 8) {
            result.push({
                iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
                text: 'Focus on consistency',
                detail: 'Your reaction times vary significantly between runs',
                color: '#f5a623'
            });
        }

        // Recent activity
        if (data.recentSessions.length > 0) {
            const latestSession = data.recentSessions[0];
            const daysSince = Math.floor((Date.now() - new Date(latestSession.timestamp).getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysSince === 0) {
                result.push({
                    iconPath: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z',
                    text: 'Trained today',
                    detail: `${latestSession.run_count} runs completed`,
                    color: '#ff6b3d'
                });
            } else if (daysSince <= 2) {
                result.push({
                    iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
                    text: 'Staying active',
                    detail: `Last session ${daysSince} day${daysSince > 1 ? 's' : ''} ago`,
                    color: '#3de8c8'
                });
            } else if (daysSince > 7) {
                result.push({
                    iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
                    text: 'Time to train',
                    detail: `${daysSince} days since your last session`,
                    color: '#9a8f7a'
                });
            }
        }

        // Performance insight
        if (data.personalBests.reaction_ms && data.personalBests.reaction_ms < 150) {
            result.push({
                iconPath: 'M13 10V3L4 14h7v7l9-11h-7z',
                text: 'Elite reaction time',
                detail: `${fmtReaction(data.personalBests.reaction_ms)} is exceptional`,
                color: '#f5a623'
            });
        }

        return result.slice(0, 3); // Max 3 insights
    });

    // Determine next recommended action
    let nextAction = $derived.by(() => {
        if (data.sessionCount === 0) {
            return {
                title: 'Upload your first session',
                description: 'Start tracking your performance data',
                href: '/upload',
                icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12'
            };
        }
        
        if (data.activeGoals && data.activeGoals.length === 0) {
            return {
                title: 'Set a training goal',
                description: 'Track progress toward specific targets',
                href: '/goals',
                icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z'
            };
        }

        const recentSessions = data.recentSessions;
        if (recentSessions.length > 0) {
            const daysSince = Math.floor((Date.now() - new Date(recentSessions[0].timestamp).getTime()) / (1000 * 60 * 60 * 24));
            if (daysSince > 3) {
                return {
                    title: 'Record a new session',
                    description: 'Keep your training momentum going',
                    href: '/upload',
                    icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12'
                };
            }
        }

        return {
            title: 'View detailed analytics',
            description: 'Explore trends and performance patterns',
            href: '/analytics',
            icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
        };
    });
</script>

<svelte:head>
    <title>Dashboard — AppGatePro</title>
</svelte:head>

<div class="space-y-6">

    <!-- Welcome banner with insights -->
    <div class="bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-900 dark:to-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-xl p-6">
        <div class="flex items-start justify-between mb-4">
            <div>
                <h2 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-1 flex items-center gap-2">
                    Welcome back, {data.profile?.name?.split(' ')[0] ?? 'Rider'}
                    <svg class="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"/>
                    </svg>
                </h2>
                <p class="text-sm text-neutral-600 dark:text-neutral-500">
                    {#if data.sessionCount === 0}
                        Upload your first session to start tracking your BMX performance.
                    {:else if data.sessionCount === 1}
                        You've uploaded {data.sessionCount} session with {data.totalRuns} run{data.totalRuns !== 1 ? 's' : ''}.
                    {:else}
                        You've uploaded {data.sessionCount} sessions with {data.totalRuns} total runs.
                    {/if}
                </p>
            </div>
            {#if data.sessionCount > 0}
                <div class="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
                    <div class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span class="text-xs font-semibold text-amber-500">Active</span>
                </div>
            {/if}
        </div>

        <!-- Quick Insights -->
        {#if insights.length > 0}
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-neutral-300 dark:border-neutral-800">
                {#each insights as insight}
                    <div class="flex items-start gap-3 p-3 bg-neutral-200/50 dark:bg-neutral-950/50 rounded-lg border border-neutral-300/50 dark:border-neutral-800/50">
                        <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style="background-color: {insight.color}15">
                            <svg class="w-5 h-5" style="color: {insight.color}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={insight.iconPath}/>
                            </svg>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-0.5">{insight.text}</p>
                            <p class="text-xs text-neutral-600 dark:text-neutral-500">{insight.detail}</p>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>

    <!-- Next Action Recommendation (above the fold) -->
    {#if nextAction}
        <a href={nextAction.href}
           class="block bg-[#f5a623] hover:bg-[#c97e0a] rounded-xl p-5 transition-all transform hover:scale-[1.01]
                  focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[#0a0809]
                  shadow-lg shadow-[#f5a623]/20 hover:shadow-xl hover:shadow-[#f5a623]/30">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-[#0a0809] rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg class="w-6 h-6 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={nextAction.icon}/>
                    </svg>
                </div>
                <div class="flex-1">
                    <p class="text-base font-bold text-[#0a0809] mb-0.5">
                        {nextAction.title}
                    </p>
                    <p class="text-sm text-[#0a0809]/70">{nextAction.description}</p>
                </div>
                <svg class="w-5 h-5 text-[#0a0809] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
            </div>
        </a>
    {/if}

    <!-- Key Stats (Simplified) -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {#each [
            {
                label: 'Best Reaction',
                value: data.sessionCount > 0 ? fmtReaction(data.personalBests.reaction_ms) : '—',
                sub:   data.sessionCount > 0 ? 'all time best' : 'No data yet',
                icon:  'M13 10V3L4 14h7v7l9-11h-7z',
                highlight: data.personalBests.reaction_ms && data.personalBests.reaction_ms < 150
            },
            {
                label: 'Peak Speed',
                value: data.sessionCount > 0 ? fmtSpeed(data.personalBests.peak_speed_ms) : '—',
                sub:   data.sessionCount > 0 ? 'km/h · estimated' : 'No data yet',
                icon:  'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
                highlight: false
            },
            {
                label: 'Consistency',
                value: consistencyData.value,
                sub:   consistencyData.label,
                icon:  'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
                highlight: data.consistency !== null && data.consistency < 2
            },
            {
                label: 'Total Sessions',
                value: data.sessionCount > 0 ? String(data.sessionCount) : '—',
                sub:   data.sessionCount > 0 ? `${data.totalRuns} total runs` : 'Upload first session',
                icon:  'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
                highlight: false
            }
        ] as stat}
            <div class="bg-[#131010] border rounded-xl p-5 transition-all
                        {stat.highlight ? 'border-[#f5a623]/40 shadow-lg shadow-[#f5a623]/10' : 'border-[#221c18] hover:border-[#f5a623]/20'}">
                <div class="flex items-start justify-between mb-2">
                    <p class="text-xs text-[#9a8f7a] uppercase tracking-wider font-medium">{stat.label}</p>
                    <svg class="w-4 h-4 flex-shrink-0 {stat.highlight ? 'text-[#f5a623]' : 'text-[#6b5f4d]'}" 
                         fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={stat.icon}/>
                    </svg>
                </div>
                <div class="flex items-baseline gap-2">
                    <p class="text-3xl font-bold text-[#f5a623]">{stat.value}</p>
                    {#if stat.highlight}
                        <span class="text-xs px-1.5 py-0.5 bg-[#f5a623]/10 text-[#f5a623] rounded">★</span>
                    {/if}
                </div>
                <p class="text-xs text-[#6b5f4d] mt-1">{stat.sub}</p>
            </div>
        {/each}
    </div>

    <!-- Active Goals -->
    {#if data.activeGoals && data.activeGoals.length > 0}
        <div class="bg-[#131010] border border-[#221c18] rounded-xl p-5">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-semibold text-[#f0ece4] uppercase tracking-wide">Active Goals</h3>
                <a href="/goals"
                   class="text-xs text-[#9a8f7a] hover:text-[#f5a623] transition-colors font-medium
                          focus:outline-none focus:ring-2 focus:ring-[#f5a623] rounded px-2 py-1">
                    View all →
                </a>
            </div>

            <div class="space-y-3">
                {#each data.activeGoals as goal}
                    <div class="bg-[#0a0809] rounded-lg p-4 border border-[#221c18] hover:border-[#f5a623]/20 transition-colors">
                        <div class="flex items-start justify-between mb-2">
                            <div class="flex-1">
                                <p class="text-sm font-medium text-[#f0ece4] mb-1">
                                    {goal.metric === 'reactionTime'     ? 'Reaction Time' :
                                     goal.metric === 'maxG'             ? 'Max G-Force' :
                                     goal.metric === 'peakSpeed'        ? 'Peak Speed' :
                                     goal.metric === 'consistency'      ? 'Consistency' :
                                     goal.metric === 'elapsedTime'      ? 'Elapsed Time' :
                                     goal.metric === 'accelerationPhase'? 'Acceleration Phase' :
                                     goal.metric === 'endurance'        ? 'Gates per Session' :
                                     goal.metric}
                                </p>
                                <p class="text-xs text-[#9a8f7a]">
                                    Target: {goal.target_value?.toFixed(2) ?? '—'}
                                    {#if goal.current_value !== null}
                                        · Current: {goal.current_value.toFixed(2)}
                                    {/if}
                                </p>
                            </div>
                            <div class="text-right flex-shrink-0 ml-3">
                                {#if goal.isOverdue}
                                    <span class="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-400 font-medium">Overdue</span>
                                {:else if goal.daysUntilDeadline <= 7}
                                    <span class="text-xs px-2 py-0.5 rounded bg-[#f5a623]/10 text-[#f5a623] font-medium">{goal.daysUntilDeadline}d left</span>
                                {:else}
                                    <span class="text-xs text-[#6b5f4d]">{goal.daysUntilDeadline} days</span>
                                {/if}
                            </div>
                        </div>

                        <div class="w-full bg-[#221c18] rounded-full h-2 overflow-hidden">
                            <div
                                class="h-full rounded-full transition-all duration-500"
                                style="width:{goal.progress}%; background:{goal.progress >= 75 ? '#3de8c8' : goal.progress >= 25 ? '#f5a623' : '#6b5f4d'}">
                            </div>
                        </div>
                        <p class="text-xs text-[#6b5f4d] mt-1.5 font-medium">{goal.progress}% complete</p>
                    </div>
                {/each}
            </div>

            <a href="/goals"
               class="mt-4 flex items-center justify-center gap-2 p-3 rounded-lg bg-[#0a0809]
                      hover:bg-[#171210] border border-[#221c18] hover:border-[#f5a623]/20
                      transition-all text-sm text-[#9a8f7a] hover:text-[#f5a623] min-h-[44px]
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
        <div class="bg-[#131010] border border-[#f5a623]/20 rounded-xl p-8 text-center">
            <div class="w-16 h-16 bg-[#f5a623]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                </svg>
            </div>
            <h3 class="text-lg font-semibold text-[#f0ece4] mb-2">Upload your first session</h3>
            <p class="text-sm text-[#9a8f7a] mb-6 max-w-sm mx-auto">
                Copy the JSON file from your AppGatePro SD card and upload it to start seeing your analytics.
            </p>
            <a href="/upload"
               class="inline-flex items-center gap-2 px-6 py-3 bg-[#f5a623] hover:bg-[#c97e0a]
                      text-[#0a0809] font-semibold rounded-lg transition-colors text-sm min-h-[44px]
                      focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[#0a0809]">
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
            <div class="bg-[#131010] border border-[#221c18] rounded-xl p-5">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-sm font-semibold text-[#f0ece4] uppercase tracking-wide">Recent Sessions</h3>
                    <a href="/sessions"
                       class="text-xs text-[#9a8f7a] hover:text-[#f5a623] transition-colors font-medium
                              focus:outline-none focus:ring-2 focus:ring-[#f5a623] rounded px-2 py-1">
                        View all →
                    </a>
                </div>

                {#if data.recentSessions.length === 0}
                    <p class="text-sm text-[#6b5f4d] text-center py-8">No sessions yet</p>
                {:else}
                    <div class="space-y-2">
                        {#each data.recentSessions as session}
                            <a href="/sessions/{session.id}"
                               class="flex items-center gap-4 p-3 rounded-lg bg-[#0a0809]
                                      hover:bg-[#171210] transition-colors group min-h-[44px]
                                      focus:outline-none focus:ring-2 focus:ring-[#f5a623]
                                      focus:ring-offset-2 focus:ring-offset-[#131010]">
                                <div class="w-10 text-center flex-shrink-0">
                                    <p class="text-sm font-bold text-[#f5a623]">{new Date(session.timestamp).getDate()}</p>
                                    <p class="text-xs text-[#6b5f4d]">{new Date(session.timestamp).toLocaleDateString('en-GB',{month:'short'})}</p>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-2 mb-0.5">
                                        <p class="text-sm font-medium text-[#f0ece4]">{session.run_count} runs</p>
                                        {#if session.reaction_cv !== null && session.reaction_cv < 2}
                                            <span class="text-xs px-1.5 py-0.5 rounded bg-[#3de8c8]/10 text-[#3de8c8] font-medium">Consistent</span>
                                        {/if}
                                    </div>
                                    <p class="text-xs text-[#6b5f4d]">
                                        Best: {fmtReaction(session.best_reaction_ms)}
                                        {#if session.has_valid_speed} · {fmtSpeed(session.best_peak_speed_ms)} km/h{/if}
                                    </p>
                                </div>
                                <svg class="w-4 h-4 text-[#6b5f4d] group-hover:text-[#f5a623] transition-colors flex-shrink-0"
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

                <div class="bg-[#131010] border border-[#221c18] rounded-xl p-5">
                    <h3 class="text-sm font-semibold text-[#f0ece4] mb-3 uppercase tracking-wide">Quick Actions</h3>
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
                                          : 'bg-[#0a0809] hover:bg-[#171210] border border-[#221c18] hover:border-[#f5a623]/20'}">
                                <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
                                            {action.amber ? 'bg-[#f5a623]/20 group-hover:bg-[#f5a623]/30' : 'bg-[#221c18]'}">
                                    <svg class="w-5 h-5 {action.amber ? 'text-[#f5a623]' : 'text-[#9a8f7a]'}"
                                         fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={action.icon}/>
                                    </svg>
                                </div>
                                <div class="flex-1">
                                    <p class="text-sm font-medium text-[#f0ece4]">{action.label}</p>
                                    <p class="text-xs text-[#9a8f7a]">{action.sub}</p>
                                </div>
                                <svg class="w-4 h-4 flex-shrink-0 transition-colors
                                            {action.amber ? 'text-[#f5a623]' : 'text-[#6b5f4d] group-hover:text-[#f5a623]'}"
                                     fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                                </svg>
                            </a>
                        {/each}
                    </div>
                </div>

                <!-- Personal bests -->
                {#if data.personalBests.reaction_ms}
                    <div class="bg-[#131010] border border-[#221c18] rounded-xl p-5">
                        <h3 class="text-sm font-semibold text-[#f0ece4] mb-3 uppercase tracking-wide">Personal Bests</h3>
                        <div class="space-y-2 text-sm">
                            <div class="flex items-center justify-between p-2 rounded bg-[#0a0809]">
                                <span class="text-[#9a8f7a]">Reaction</span>
                                <span class="font-bold text-[#f5a623]">{fmtReaction(data.personalBests.reaction_ms)}</span>
                            </div>
                            {#if data.personalBests.peak_speed_ms}
                                <div class="flex items-center justify-between p-2 rounded bg-[#0a0809]">
                                    <span class="text-[#9a8f7a]">Speed</span>
                                    <span class="font-bold text-[#f5a623]">{fmtSpeed(data.personalBests.peak_speed_ms)} km/h</span>
                                </div>
                            {/if}
                            {#if data.personalBests.max_g}
                                <div class="flex items-center justify-between p-2 rounded bg-[#0a0809]">
                                    <span class="text-[#9a8f7a]">Max G</span>
                                    <span class="font-bold text-[#f5a623]">{fmtG(data.personalBests.max_g)}</span>
                                </div>
                            {/if}
                        </div>
                    </div>
                {/if}

            </div>
        </div>
    {/if}

</div>

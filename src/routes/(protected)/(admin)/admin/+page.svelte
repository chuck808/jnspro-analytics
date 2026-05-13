<script lang="ts">
    import type { PageData } from './$types';
    let { data }: { data: PageData } = $props();

    function fmtDate(ts: string | null) {
        if (!ts) return '—';
        return new Date(ts).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    }
    function fmtDateTime(ts: string) {
        return new Date(ts).toLocaleString('en-GB', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    }
    
    let engagementRate = $derived(
        data.totalUsers > 0 
            ? ((data.activeUsers / data.totalUsers) * 100).toFixed(1) 
            : '0'
    );
</script>

<svelte:head>
    <title>Admin Dashboard — AppGatePro</title>
</svelte:head>

<div class="space-y-6">

    <!-- Header -->
    <div>
        <h2 class="text-lg font-bold themed-text-primary">Admin Dashboard</h2>
        <p class="text-sm themed-text-secondary mt-0.5">System overview and user management</p>
    </div>

    <!-- Quick Access to New Features -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a href="/admin/goals-intelligence" 
           class="block themed-card rounded-xl p-5 hover:border-[color:var(--accent)] transition-all hover:scale-[1.02] group">
            <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-lg themed-bg-accent flex items-center justify-center">
                    <span class="text-xl">🧠</span>
                </div>
                <div class="flex-1">
                    <h3 class="text-sm font-semibold themed-text-primary group-hover:text-[color:var(--accent)] transition-colors">
                        Goals Intelligence
                    </h3>
                    <p class="text-xs text-[color:var(--text-subtle)]">Phase 5 Features</p>
                </div>
                <svg class="w-5 h-5 text-[color:var(--text-subtle)] group-hover:text-[color:var(--accent)] transition-colors" 
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
            </div>
            <p class="text-xs themed-text-secondary">
                Monitor AI predictions, health alerts, and goal progress
            </p>
        </a>

        <a href="/admin/leaderboard-admin" 
           class="block themed-card rounded-xl p-5 hover:border-[#3de8c8] transition-all hover:scale-[1.02] group">
            <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-lg bg-[#3de8c8]/20 border border-[#3de8c8]/40 
                            flex items-center justify-center">
                    <span class="text-xl">🏆</span>
                </div>
                <div class="flex-1">
                    <h3 class="text-sm font-semibold themed-text-primary group-hover:text-[#3de8c8] transition-colors">
                        Leaderboard Admin
                    </h3>
                    <p class="text-xs text-[color:var(--text-subtle)]">Privacy & Compliance</p>
                </div>
                <svg class="w-5 h-5 text-[color:var(--text-subtle)] group-hover:text-[#3de8c8] transition-colors" 
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
            </div>
            <p class="text-xs themed-text-secondary">
                Track participation, privacy compliance, and moderation
            </p>
        </a>

        <a href="/admin/advanced-analytics" 
           class="block themed-card rounded-xl p-5 hover:border-[#ff6b3d] transition-all hover:scale-[1.02] group">
            <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-lg bg-[#ff6b3d]/20 border border-[#ff6b3d]/40 
                            flex items-center justify-center">
                    <span class="text-xl">📊</span>
                </div>
                <div class="flex-1">
                    <h3 class="text-sm font-semibold themed-text-primary group-hover:text-[#ff6b3d] transition-colors">
                        Advanced Analytics
                    </h3>
                    <p class="text-xs text-[color:var(--text-subtle)]">Platform Intelligence</p>
                </div>
                <svg class="w-5 h-5 text-[color:var(--text-subtle)] group-hover:text-[#ff6b3d] transition-colors" 
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
            </div>
            <p class="text-xs themed-text-secondary">
                User segmentation, benchmarks, and data quality
            </p>
        </a>
    </div>

    <!-- Primary Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {#each [
            { 
                label: 'Total Users', 
                value: data.totalUsers,
                sub: `${data.adminCount} admin${data.adminCount !== 1 ? 's' : ''}`,
                icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
                color: 'var(--accent)'
            },
            { 
                label: 'Active Users', 
                value: data.activeUsers,
                sub: `${engagementRate}% of total`,
                icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
                color: '#3de8c8'
            },
            { 
                label: 'Total Sessions', 
                value: data.totalSessions,
                sub: `${data.activeSessions} active`,
                icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
                color: '#ff6b3d'
            },
            { 
                label: 'Avg Sessions/User', 
                value: data.avgSessionsPerUser > 0 ? data.avgSessionsPerUser.toFixed(1) : '0',
                sub: `${data.usersWithNoSessions} with no sessions`,
                icon: 'M9 19v-6a2 2 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
                color: 'var(--text-secondary)'
            },
        ] as stat}
            <div class="themed-card rounded-xl p-5 hover:border-[color:var(--accent)]/20 transition-colors">
                <div class="flex items-start justify-between mb-2">
                    <p class="text-xs themed-text-secondary uppercase tracking-wider">{stat.label}</p>
                    <svg class="w-5 h-5 flex-shrink-0" style="color: {stat.color}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={stat.icon}/>
                    </svg>
                </div>
                <p class="text-2xl font-bold" style="color: {stat.color}">{stat.value}</p>
                <p class="text-xs text-[color:var(--text-subtle)] mt-1">{stat.sub}</p>
            </div>
        {/each}
    </div>

    <!-- Growth Stats -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="themed-card rounded-xl p-5">
            <h3 class="text-sm font-semibold themed-text-primary mb-4">User Growth</h3>
            <div class="space-y-3">
                <div class="flex items-center justify-between p-3 bg-[color:var(--background)] rounded-lg">
                    <div>
                        <p class="text-xs themed-text-secondary">Last 7 days</p>
                        <p class="text-xl font-bold themed-accent mt-0.5">{data.newUsersLast7Days}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-xs text-[color:var(--text-subtle)]">New signups</p>
                        <p class="text-xs themed-text-secondary mt-0.5">
                            {data.totalUsers > 0 ? ((data.newUsersLast7Days / data.totalUsers) * 100).toFixed(1) : '0'}% of total
                        </p>
                    </div>
                </div>
                <div class="flex items-center justify-between p-3 bg-[color:var(--background)] rounded-lg">
                    <div>
                        <p class="text-xs themed-text-secondary">Last 30 days</p>
                        <p class="text-xl font-bold themed-accent mt-0.5">{data.newUsersLast30Days}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-xs text-[color:var(--text-subtle)]">New signups</p>
                        <p class="text-xs themed-text-secondary mt-0.5">
                            {data.totalUsers > 0 ? ((data.newUsersLast30Days / data.totalUsers) * 100).toFixed(1) : '0'}% of total
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <div class="themed-card rounded-xl p-5">
            <h3 class="text-sm font-semibold themed-text-primary mb-4">Session Activity</h3>
            <div class="space-y-3">
                <div class="flex items-center justify-between p-3 bg-[color:var(--background)] rounded-lg">
                    <div>
                        <p class="text-xs themed-text-secondary">Last 7 days</p>
                        <p class="text-xl font-bold text-[#ff6b3d] mt-0.5">{data.sessionsLast7Days}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-xs text-[color:var(--text-subtle)]">Sessions uploaded</p>
                        <p class="text-xs themed-text-secondary mt-0.5">
                            {data.totalSessions > 0 ? ((data.sessionsLast7Days / data.totalSessions) * 100).toFixed(1) : '0'}% of total
                        </p>
                    </div>
                </div>
                <div class="flex items-center justify-between p-3 bg-[color:var(--background)] rounded-lg">
                    <div>
                        <p class="text-xs themed-text-secondary">Last 30 days</p>
                        <p class="text-xl font-bold text-[#ff6b3d] mt-0.5">{data.sessionsLast30Days}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-xs text-[color:var(--text-subtle)]">Sessions uploaded</p>
                        <p class="text-xs themed-text-secondary mt-0.5">
                            {data.totalSessions > 0 ? ((data.sessionsLast30Days / data.totalSessions) * 100).toFixed(1) : '0'}% of total
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Top Users & Recent Signups -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Most Active Users -->
        <div class="themed-card rounded-xl p-5">
            <h3 class="text-sm font-semibold themed-text-primary mb-4">Most Active Users</h3>
            {#if data.topUsers.length === 0}
                <p class="text-sm text-[color:var(--text-subtle)] text-center py-8">No active users yet</p>
            {:else}
                <div class="space-y-2">
                    {#each data.topUsers as user}
                        <a href="/admin/users/{user.id}"
                           class="flex items-center gap-3 p-3 rounded-lg bg-[color:var(--background)] hover:bg-[color:var(--border)] transition-colors group">
                            <div class="w-8 h-8 rounded-full themed-bg-accent
                                        flex items-center justify-center flex-shrink-0">
                                <span class="text-sm font-bold themed-accent">
                                    {user.name?.charAt(0).toUpperCase() ?? '?'}
                                </span>
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium themed-text-primary truncate">
                                    {user.name || user.email}
                                </p>
                                <p class="text-xs text-[color:var(--text-subtle)] truncate">{user.email}</p>
                            </div>
                            <div class="text-right flex-shrink-0">
                                <p class="text-lg font-bold themed-accent">{user.session_count}</p>
                                <p class="text-xs text-[color:var(--text-subtle)]">sessions</p>
                            </div>
                            <svg class="w-4 h-4 text-[color:var(--text-subtle)] group-hover:text-[color:var(--accent)] transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                            </svg>
                        </a>
                    {/each}
                </div>
            {/if}
        </div>

        <!-- Recent Signups -->
        <div class="themed-card rounded-xl p-5">
            <h3 class="text-sm font-semibold themed-text-primary mb-4">Recent Signups</h3>
            {#if data.recentSignups.length === 0}
                <p class="text-sm text-[color:var(--text-subtle)] text-center py-8">No users yet</p>
            {:else}
                <div class="space-y-2">
                    {#each data.recentSignups as user}
                        <a href="/admin/users/{user.id}"
                           class="flex items-center gap-3 p-3 rounded-lg bg-[color:var(--background)] hover:bg-[color:var(--border)] transition-colors group">
                            <div class="w-8 h-8 rounded-full bg-[#3de8c8]/20 border border-[#3de8c8]/30
                                        flex items-center justify-center flex-shrink-0">
                                <span class="text-sm font-bold text-[#3de8c8]">
                                    {user.name?.charAt(0).toUpperCase() ?? '?'}
                                </span>
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium themed-text-primary truncate">
                                    {user.name || user.email}
                                </p>
                                <p class="text-xs text-[color:var(--text-subtle)]">{fmtDate(user.created_at)}</p>
                            </div>
                            <div class="flex items-center gap-2 flex-shrink-0">
                                {#if user.session_count > 0}
                                    <span class="text-xs px-2 py-0.5 rounded bg-[#3de8c8]/10 text-[#3de8c8]">
                                        {user.session_count} sessions
                                    </span>
                                {:else}
                                    <span class="text-xs text-[color:var(--text-subtle)]">No sessions</span>
                                {/if}
                            </div>
                            <svg class="w-4 h-4 text-[color:var(--text-subtle)] group-hover:text-[color:var(--accent)] transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                            </svg>
                        </a>
                    {/each}
                </div>
            {/if}
        </div>
    </div>

    <!-- User List -->
    <div class="themed-card rounded-xl p-5">
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold themed-text-primary">All Users</h3>
            <a href="/admin/users"
               class="text-xs themed-accent hover:underline">Manage all →</a>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-sm min-w-[600px]">
                <thead>
                    <tr class="border-b border-[color:var(--border)]">
                        {#each ['Name', 'Email', 'Role', 'Sessions', 'Last active', ''] as h}
                            <th class="text-left pb-2 text-xs font-semibold themed-text-secondary
                                       uppercase tracking-wider pr-4">{h}</th>
                        {/each}
                    </tr>
                </thead>
                <tbody>
                    {#each data.users.slice(0, 10) as user}
                        <tr class="border-b border-[color:var(--border)]/50 hover:bg-[color:var(--border)] transition-colors">
                            <td class="py-2.5 pr-4 font-medium themed-text-primary">
                                {user.name || '—'}
                            </td>
                            <td class="py-2.5 pr-4 themed-text-secondary text-xs">{user.email}</td>
                            <td class="py-2.5 pr-4">
                                <span class="px-2 py-0.5 text-xs rounded
                                             {user.role === 'admin'
                                                 ? 'bg-red-900/20 text-red-400 border border-red-800/40'
                                                 : 'bg-[color:var(--border)] themed-text-secondary'}">
                                    {user.role}
                                </span>
                            </td>
                            <td class="py-2.5 pr-4">
                                {#if user.session_count > 0}
                                    <span class="themed-accent font-medium">{user.session_count}</span>
                                {:else}
                                    <span class="text-[color:var(--text-subtle)]">0</span>
                                {/if}
                            </td>
                            <td class="py-2.5 pr-4 text-[color:var(--text-subtle)] text-xs">
                                {fmtDate(user.last_session)}
                            </td>
                            <td class="py-2.5">
                                <a href="/admin/users/{user.id}"
                                   class="text-xs themed-accent hover:underline">View →</a>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
        {#if data.users.length > 10}
            <div class="mt-4 text-center">
                <a href="/admin/users"
                   class="inline-flex items-center gap-2 px-4 py-2 text-sm themed-accent hover:opacity-80 transition-opacity">
                    View all {data.users.length} users
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                </a>
            </div>
        {/if}
    </div>

    <!-- Recent audit log -->
    {#if data.recentAudit.length > 0}
        <div class="themed-card rounded-xl p-5">
            <h3 class="text-sm font-semibold themed-text-primary mb-4">Recent Role Changes</h3>
            <div class="space-y-2">
                {#each data.recentAudit as entry}
                    <div class="flex items-center gap-3 p-3 bg-[color:var(--background)] rounded-lg text-xs">
                        <span class="text-[color:var(--text-subtle)] flex-shrink-0">
                            {fmtDateTime(entry.changed_at)}
                        </span>
                        <span class="themed-text-secondary">
                            Role changed:
                            <span class="themed-text-primary">{entry.old_role ?? '—'}</span>
                            →
                            <span class="themed-accent">{entry.new_role}</span>
                        </span>
                        {#if entry.reason}
                            <span class="text-[color:var(--text-subtle)] ml-auto truncate max-w-xs">
                                {entry.reason}
                            </span>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>
    {/if}

</div>

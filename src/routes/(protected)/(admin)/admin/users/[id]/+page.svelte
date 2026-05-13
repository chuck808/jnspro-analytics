<script lang="ts">
    import type { PageData, ActionData } from './$types';
    let { data, form }: { data: PageData; form: ActionData } = $props();

    let roleSaving = $state(false);

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
</script>

<svelte:head>
    <title>{data.profile?.name ?? 'User'} — Admin — AppGatePro</title>
</svelte:head>

<div class="space-y-5">

    <!-- Back -->
    <a href="/admin/users"
       class="inline-flex items-center gap-1 text-sm themed-text-secondary hover:text-[color:var(--accent)] transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        All users
    </a>

    <!-- Profile header -->
    <div class="themed-card rounded-xl p-6">
        <div class="flex items-start justify-between gap-4 flex-wrap">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-full themed-bg-accent
                            flex items-center justify-center flex-shrink-0">
                    <span class="text-lg font-bold themed-accent">
                        {data.profile?.name?.charAt(0).toUpperCase() ?? '?'}
                    </span>
                </div>
                <div>
                    <h3 class="text-lg font-bold themed-text-primary">
                        {data.profile?.name || '—'}
                    </h3>
                    <p class="text-sm themed-text-secondary">{data.profile?.email}</p>
                    <div class="flex items-center gap-2 mt-1">
                        <span class="px-2 py-0.5 text-xs rounded
                                     {data.profile?.role === 'admin'
                                         ? 'bg-red-900/20 text-red-400 border border-red-800/40'
                                         : 'bg-[color:var(--border)] themed-text-secondary'}">
                            {data.profile?.role}
                        </span>
                        {#if data.profile?.club}
                            <span class="text-xs text-[color:var(--text-subtle)]">{data.profile.club}</span>
                        {/if}
                        {#if data.profile?.country}
                            <span class="text-xs text-[color:var(--text-subtle)]">{data.profile.country}</span>
                        {/if}
                    </div>
                </div>
            </div>

            <!-- Quick stats -->
            <div class="flex gap-6 text-center">
                <div>
                    <p class="text-xl font-bold themed-accent">{data.sessions.length}</p>
                    <p class="text-xs text-[color:var(--text-subtle)]">Sessions</p>
                </div>
                <div>
                    <p class="text-xl font-bold themed-text-primary">
                        {data.sessions.reduce((s, sess) => s + (sess.runs?.length ?? 0), 0)}
                    </p>
                    <p class="text-xs text-[color:var(--text-subtle)]">Runs</p>
                </div>
                <div>
                    <p class="text-sm font-medium themed-text-primary">
                        {fmtDate(data.sessions[0]?.timestamp ?? null)}
                    </p>
                    <p class="text-xs text-[#4a4038]">Last session</p>
                </div>
            </div>
        </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">

        <!-- Role management -->
        <div class="themed-card rounded-xl p-5">
            <h4 class="text-sm font-semibold themed-text-primary mb-1">Role Management</h4>
            <p class="text-xs themed-text-secondary mb-4">
                All role changes are logged in the audit trail.
            </p>

            {#if (form as any)?.roleSuccess}
                <div class="mb-4 p-3 bg-[#3de8c8]/10 border border-[#3de8c8]/30 rounded-lg text-[#3de8c8] text-sm">
                    Role updated successfully
                </div>
            {/if}
            {#if (form as any)?.roleError}
                <div class="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
                    {(form as any).roleError}
                </div>
            {/if}

            <form method="POST" action="?/setRole"
                  onsubmit={() => roleSaving = true}
                  class="space-y-3">

                <div>
                    <label for="role" class="block text-xs themed-text-secondary mb-1">New role</label>
                    <select id="role" name="role"
                            class="w-full px-3 py-2 bg-[color:var(--background)] border border-[color:var(--border)] rounded-lg
                                   themed-text-primary text-sm focus:outline-none focus:border-[color:var(--accent)]">
                        <option value="user"  selected={data.profile?.role === 'user'}>User</option>
                        <option value="admin" selected={data.profile?.role === 'admin'}>Admin</option>
                    </select>
                </div>

                <div>
                    <label for="reason" class="block text-xs themed-text-secondary mb-1">
                        Reason <span class="text-[color:var(--text-subtle)]">(optional — appears in audit log)</span>
                    </label>
                    <input id="reason" name="reason" type="text"
                           class="w-full px-3 py-2 bg-[color:var(--background)] border border-[color:var(--border)] rounded-lg
                                  themed-text-primary text-sm focus:outline-none focus:border-[color:var(--accent)]
                                  placeholder-[color:var(--text-subtle)]"
                           placeholder="e.g. Beta tester promotion" />
                </div>

                <button type="submit" disabled={roleSaving}
                        class="px-4 py-2 bg-[#f5a623] hover:bg-[#c97e0a] disabled:opacity-50
                               text-[#0a0809] font-semibold text-sm rounded-lg transition-colors">
                    {roleSaving ? 'Saving...' : 'Update role'}
                </button>
            </form>
        </div>

        <!-- Rider & bike summary -->
        <div class="themed-card rounded-xl p-5">
            <h4 class="text-sm font-semibold themed-text-primary mb-4">Rider & Bike</h4>
            <div class="grid grid-cols-2 gap-3 text-xs">
                {#each [
                    { label: 'Height',      value: data.rider?.height_cm ? `${data.rider.height_cm} cm` : '—' },
                    { label: 'Weight',      value: data.rider?.weight_kg ? `${data.rider.weight_kg} kg` : '—' },
                    { label: 'Level',       value: data.rider?.rider_level ?? '—' },
                    { label: 'DOB',         value: fmtDate(data.rider?.date_of_birth ?? null) },
                    { label: 'Bike',        value: data.bike?.name ?? '—' },
                    { label: 'Gear ratio',  value: data.bike ? `${(data.bike.chainring_teeth / data.bike.sprocket_teeth).toFixed(2)}:1` : '—' },
                    { label: 'Crank',       value: data.bike?.crank_length_mm ? `${data.bike.crank_length_mm}mm` : '—' },
                    { label: 'Bike weight', value: data.bike?.weight_kg ? `${data.bike.weight_kg}kg` : '—' },
                ] as stat}
                    <div class="bg-[color:var(--background)] rounded-lg p-2.5">
                        <p class="text-[color:var(--text-subtle)] mb-0.5">{stat.label}</p>
                        <p class="font-medium themed-text-primary">{stat.value}</p>
                    </div>
                {/each}
            </div>
        </div>
    </div>

    <!-- Session list -->
    <div class="themed-card rounded-xl p-5">
        <h4 class="text-sm font-semibold themed-text-primary mb-4">
            Sessions ({data.sessions.length})
        </h4>
        {#if data.sessions.length === 0}
            <p class="text-sm text-[color:var(--text-subtle)] py-4 text-center">No sessions uploaded</p>
        {:else}
            <div class="overflow-x-auto">
                <table class="w-full text-sm min-w-[400px]">
                    <thead>
                        <tr class="border-b border-[color:var(--border)]">
                            {#each ['Date', 'Type', 'Runs', 'Status'] as h}
                                <th class="text-left pb-2 text-xs font-semibold themed-text-secondary
                                           uppercase tracking-wider pr-4">{h}</th>
                            {/each}
                        </tr>
                    </thead>
                    <tbody>
                        {#each data.sessions as session}
                            <tr class="border-b border-[color:var(--border)]/50">
                                <td class="py-2.5 pr-4 themed-text-primary">
                                    {fmtDateTime(session.timestamp)}
                                </td>
                                <td class="py-2.5 pr-4">
                                    <span class="px-2 py-0.5 text-xs rounded
                                                 bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/20">
                                        {session.session_type}
                                    </span>
                                </td>
                                <td class="py-2.5 pr-4 themed-text-secondary">
                                    {session.runs?.length ?? 0}
                                </td>
                                <td class="py-2.5 text-xs
                                           {session.archived ? 'text-[#4a4038]' : 'text-[#3de8c8]'}">
                                    {session.archived ? 'Archived' : 'Active'}
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    </div>

    <!-- Audit log -->
    {#if data.auditLog.length > 0}
        <div class="themed-card rounded-xl p-5">
            <h4 class="text-sm font-semibold themed-text-primary mb-4">Role Change History</h4>
            <div class="space-y-2">
                {#each data.auditLog as entry}
                    <div class="flex items-center gap-3 p-3 bg-[color:var(--background)] rounded-lg text-xs">
                        <span class="text-[color:var(--text-subtle)] flex-shrink-0">
                            {fmtDateTime(entry.changed_at)}
                        </span>
                        <span class="themed-text-secondary">
                            {entry.old_role ?? '—'} → <span class="themed-accent">{entry.new_role}</span>
                        </span>
                        {#if entry.reason}
                            <span class="text-[color:var(--text-subtle)] ml-auto">{entry.reason}</span>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>
    {/if}

</div>

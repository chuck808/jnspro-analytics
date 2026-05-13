<script lang="ts">
    import type { PageData } from './$types';
    let { data }: { data: PageData } = $props();

    let search = $state('');

    let filtered = $derived(
        search.trim()
            ? data.users.filter(u =>
                u.name?.toLowerCase().includes(search.toLowerCase()) ||
                u.email.toLowerCase().includes(search.toLowerCase()) ||
                u.club?.toLowerCase().includes(search.toLowerCase())
              )
            : data.users
    );

    function fmtDate(ts: string | null) {
        if (!ts) return '—';
        return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
</script>

<svelte:head>
    <title>Users — Admin — AppGatePro</title>
</svelte:head>

<div class="space-y-5">

    <!-- Back -->
    <a href="/admin"
       class="inline-flex items-center gap-1 text-sm themed-text-secondary hover:text-[color:var(--accent)] transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        Admin Dashboard
    </a>

    <div class="flex items-center justify-between gap-4 flex-wrap">
        <div>
            <h3 class="text-base font-bold themed-text-primary">All Users</h3>
            <p class="text-xs themed-text-secondary mt-0.5">{data.users.length} registered</p>
        </div>
        <input
            type="search"
            bind:value={search}
            placeholder="Search name, email, club..."
            class="px-4 py-2 bg-[color:var(--background)] border border-[color:var(--border)] rounded-lg themed-text-primary
                   text-sm focus:outline-none focus:border-[color:var(--accent)] w-64 placeholder-[color:var(--text-subtle)]"
        />
    </div>

    <div class="themed-card rounded-xl overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-sm min-w-[700px]">
                <thead>
                    <tr class="border-b border-[color:var(--border)] bg-[color:var(--background)]">
                        {#each ['Name', 'Email', 'Club', 'Role', 'Sessions', 'Joined', 'Last active', ''] as h}
                            <th class="text-left px-4 py-3 text-xs font-semibold
                                       themed-text-secondary uppercase tracking-wider">{h}</th>
                        {/each}
                    </tr>
                </thead>
                <tbody>
                    {#each filtered as user}
                        <tr class="border-b border-[color:var(--border)]/50 hover:bg-[color:var(--border)] transition-colors">
                            <td class="px-4 py-3 font-medium themed-text-primary">
                                {user.name || '—'}
                            </td>
                            <td class="px-4 py-3 themed-text-secondary text-xs">{user.email}</td>
                            <td class="px-4 py-3 themed-text-secondary text-xs">{user.club || '—'}</td>
                            <td class="px-4 py-3">
                                <span class="px-2 py-0.5 text-xs rounded
                                             {user.role === 'admin'
                                                 ? 'bg-red-900/20 text-red-400 border border-red-800/40'
                                                 : 'bg-[color:var(--border)] themed-text-secondary'}">
                                    {user.role}
                                </span>
                            </td>
                            <td class="px-4 py-3 themed-text-secondary">{user.session_count}</td>
                            <td class="px-4 py-3 text-[color:var(--text-subtle)] text-xs">{fmtDate(user.created_at)}</td>
                            <td class="px-4 py-3 text-[color:var(--text-subtle)] text-xs">{fmtDate(user.last_session)}</td>
                            <td class="px-4 py-3">
                                <a href="/admin/users/{user.id}"
                                   class="text-xs themed-accent hover:underline whitespace-nowrap">
                                    View →
                                </a>
                            </td>
                        </tr>
                    {:else}
                        <tr>
                            <td colspan="8" class="px-4 py-8 text-center text-sm text-[color:var(--text-subtle)]">
                                No users match your search
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </div>

</div>

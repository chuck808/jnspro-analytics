<script lang="ts">
    import type { PageData } from './$types';
    import { goto } from '$app/navigation';
    import { enhance } from '$app/forms';
    import ExportButton from '$lib/components/ExportButton.svelte';
    import SessionFilter from '$lib/components/SessionFilter.svelte';
    import SortableHeader from '$lib/components/SortableHeader.svelte';

    let { data }: { data: PageData } = $props();
    
    let filteredSessions = $state<typeof data.sessions>([]);

    let dateFrom = $state('');
    let dateTo = $state('');
    let perPage = $state(10);
    let deletingSessionId = $state<string | null>(null);
    let confirmDeleteId = $state<string | null>(null);
    
    let currentSort = $state<{ field: string; direction: 'asc' | 'desc' }>({ 
        field: 'timestamp', 
        direction: 'desc'
    });

    // Sync state with URL params when data changes
    $effect(() => {
        dateFrom = data.dateFrom ?? '';
        dateTo = data.dateTo ?? '';
        perPage = data.perPage;
        currentSort = { 
            field: data.sortBy || 'timestamp', 
            direction: (data.sortDir || 'desc') as 'asc' | 'desc' 
        };
        filteredSessions = data.sessions;
    });

    function formatDate(timestamp: string) {
        return new Date(timestamp).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    }

    function formatTime(timestamp: string) {
        return new Date(timestamp).toLocaleTimeString('en-GB', {
            hour: '2-digit', minute: '2-digit'
        });
    }

    function formatReaction(ms: number | null) {
        if (ms === null) return '—';
        return (ms / 1000).toFixed(3) + 's';
    }

    function formatSpeed(ms: number | null) {
        if (ms === null) return '—';
        return (ms * 3.6).toFixed(1) + ' km/h';
    }

    function formatG(g: number | null) {
        if (g === null) return '—';
        return g.toFixed(2) + 'G';
    }

    function sessionTypeLabel(type: string) {
        const labels: Record<string, string> = {
            gate:           'Gate',
            sprint:         'Sprint',
            quickCadence:   'Quick Cadence',
            pyramidCadence: 'Pyramid Cadence',
        };
        return labels[type] ?? type;
    }

    function applyFilters() {
        const params = new URLSearchParams();
        if (dateFrom) params.set('dateFrom', dateFrom);
        if (dateTo) params.set('dateTo', dateTo);
        params.set('perPage', String(perPage));
        params.set('page', '1'); // Reset to page 1 when filtering
        goto(`/sessions?${params.toString()}`);
    }

    function clearFilters() {
        dateFrom = '';
        dateTo = '';
        goto('/sessions');
    }

    function changePage(newPage: number) {
        const params = new URLSearchParams();
        if (dateFrom) params.set('dateFrom', dateFrom);
        if (dateTo) params.set('dateTo', dateTo);
        params.set('perPage', String(perPage));
        params.set('page', String(newPage));
        if (currentSort.field) params.set('sortBy', currentSort.field);
        if (currentSort.direction) params.set('sortDir', currentSort.direction);
        goto(`/sessions?${params.toString()}`);
    }
    
    function handleSort(field: string, direction: 'asc' | 'desc') {
        const params = new URLSearchParams();
        if (dateFrom) params.set('dateFrom', dateFrom);
        if (dateTo) params.set('dateTo', dateTo);
        params.set('perPage', String(perPage));
        params.set('page', '1'); // Reset to page 1 when sorting
        params.set('sortBy', field);
        params.set('sortDir', direction);
        goto(`/sessions?${params.toString()}`);
    }

    let totalPages = $derived(Math.ceil(data.totalCount / data.perPage));
    let hasFilters = $derived(Boolean(dateFrom || dateTo));
</script>

<svelte:head>
    <title>Sessions — AppGatePro</title>
</svelte:head>

<div class="space-y-6">

    <!-- Header -->
    <div class="flex items-center justify-between gap-3 flex-wrap">
        <div>
            <h2 class="text-lg font-bold text-[#f0ece4]">Training Sessions</h2>
            <p class="text-sm text-[#9a8f7a] mt-0.5">
                {data.totalCount} total · Showing {data.sessions.length} on page {data.page}
            </p>
        </div>
        <div class="flex items-center gap-2">
            <ExportButton sessions={data.sessions} variant="secondary" />
            <a href="/upload"
               class="flex items-center gap-2 px-4 py-2.5 bg-[#f5a623] hover:bg-[#c97e0a]
                      text-[#0a0809] font-semibold text-sm rounded-lg transition-colors
                      min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#f5a623]
                      focus:ring-offset-2 focus:ring-offset-[#0a0809]">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                </svg>
                Upload
            </a>
        </div>
    </div>

    <!-- SessionFilter Component -->
    {#if data.totalCount > 0}
        <SessionFilter 
            sessions={data.sessions} 
            onFilter={(filtered) => filteredSessions = filtered}
        />
        
        <!-- Old manual filters (keeping for pagination/perPage) -->
        <div class="bg-[#131010] border border-[#221c18] rounded-xl p-5">
            <h3 class="text-sm font-semibold text-[#f0ece4] mb-4">Display Options</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                    <label for="dateFrom" class="block text-xs text-[#9a8f7a] mb-1">From Date</label>
                    <input
                        type="date"
                        id="dateFrom"
                        bind:value={dateFrom}
                        class="w-full px-3 py-2 bg-[#0a0809] border border-[#221c18] rounded-lg
                               text-[#f0ece4] text-sm min-h-[44px]
                               focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:border-[#f5a623]"
                    />
                </div>
                <div>
                    <label for="dateTo" class="block text-xs text-[#9a8f7a] mb-1">To Date</label>
                    <input
                        type="date"
                        id="dateTo"
                        bind:value={dateTo}
                        class="w-full px-3 py-2 bg-[#0a0809] border border-[#221c18] rounded-lg
                               text-[#f0ece4] text-sm min-h-[44px]
                               focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:border-[#f5a623]"
                    />
                </div>
                <div>
                    <label for="perPage" class="block text-xs text-[#9a8f7a] mb-1">Per Page</label>
                    <select
                        id="perPage"
                        bind:value={perPage}
                        class="w-full px-3 py-2 bg-[#0a0809] border border-[#221c18] rounded-lg
                               text-[#f0ece4] text-sm min-h-[44px]
                               focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:border-[#f5a623]"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>
                <div class="flex items-end gap-2">
                    <button
                        type="button"
                        onclick={applyFilters}
                        class="flex-1 px-4 py-2 bg-[#f5a623] hover:bg-[#c97e0a] text-[#0a0809]
                               font-semibold text-sm rounded-lg transition-colors min-h-[44px]
                               focus:outline-none focus:ring-2 focus:ring-[#f5a623]"
                    >
                        Apply
                    </button>
                    {#if hasFilters}
                        <button
                            type="button"
                            onclick={clearFilters}
                            class="px-4 py-2 bg-[#221c18] hover:bg-[#2a2220] text-[#9a8f7a]
                                   font-semibold text-sm rounded-lg transition-colors min-h-[44px]
                                   focus:outline-none focus:ring-2 focus:ring-[#f5a623]"
                        >
                            Clear
                        </button>
                    {/if}
                </div>
            </div>
        </div>
    {/if}

    {#if data.sessions.length === 0 && data.totalCount === 0}
        <!-- Empty state -->
        <div class="bg-[#131010] border border-[#f5a623]/20 rounded-xl p-12 text-center">
            <div class="w-16 h-16 bg-[#f5a623]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
            </div>
            <h3 class="text-lg font-semibold text-[#f0ece4] mb-2">No sessions yet</h3>
            <p class="text-sm text-[#9a8f7a] mb-6 max-w-sm mx-auto">
                Upload your first session from the AppGatePro SD card to see your analytics here.
            </p>
            <a href="/upload"
               class="inline-flex items-center gap-2 px-6 py-3 bg-[#f5a623] hover:bg-[#c97e0a]
                      text-[#0a0809] font-semibold rounded-lg transition-colors text-sm
                      min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#f5a623]
                      focus:ring-offset-2 focus:ring-offset-[#0a0809]">
                Upload first session
            </a>
        </div>

    {:else}
        <!-- Sort Controls -->
        <div class="bg-[#131010] border border-[#221c18] rounded-xl p-4">
            <div class="flex items-center gap-6 flex-wrap">
                <span class="text-xs text-[#9a8f7a] font-semibold uppercase">Sort by:</span>
                <SortableHeader 
                    label="Date" 
                    field="timestamp" 
                    bind:currentSort 
                    onSort={handleSort} 
                />
                <SortableHeader 
                    label="Runs" 
                    field="run_count" 
                    bind:currentSort 
                    onSort={handleSort} 
                />
                <SortableHeader 
                    label="Best Reaction" 
                    field="best_reaction_ms" 
                    bind:currentSort 
                    onSort={handleSort} 
                />
                <SortableHeader 
                    label="Peak Speed" 
                    field="best_peak_speed_ms" 
                    bind:currentSort 
                    onSort={handleSort} 
                />
                <SortableHeader 
                    label="Max G" 
                    field="best_max_g" 
                    bind:currentSort 
                    onSort={handleSort} 
                />
            </div>
        </div>

        <!-- Sessions list -->
        <div class="space-y-3">
            {#each data.sessions as session}
                <div class="relative bg-[#131010] border border-[#221c18] rounded-xl p-5 hover:border-[#f5a623]/30 hover:bg-[#171210] transition-colors group">
                    <a
                        href="/sessions/{session.id}"
                        class="block focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[#131010] rounded"
                    >
                        <div class="flex items-start justify-between gap-4">

                        <!-- Left: date + type -->
                        <div class="flex items-start gap-4">
                            <!-- Date block -->
                            <div class="text-center flex-shrink-0 w-12">
                                <p class="text-lg font-bold text-[#f5a623] leading-none">
                                    {new Date(session.timestamp).getDate()}
                                </p>
                                <p class="text-xs text-[#9a8f7a] mt-0.5">
                                    {new Date(session.timestamp).toLocaleDateString('en-GB', { month: 'short' })}
                                </p>
                                <p class="text-xs text-[#6b5f4d]">
                                    {new Date(session.timestamp).getFullYear()}
                                </p>
                            </div>

                            <!-- Session info -->
                            <div>
                                <div class="flex items-center gap-2 mb-1 flex-wrap">
                                    <span class="px-2 py-0.5 text-xs font-semibold rounded
                                                 bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/20">
                                        {sessionTypeLabel(session.session_type)}
                                    </span>
                                    <span class="text-xs text-[#6b5f4d]">
                                        {formatTime(session.timestamp)}
                                    </span>
                                    {#if session.bike_name}
                                        <span class="text-xs text-[#6b5f4d]">· {session.bike_name}</span>
                                    {/if}
                                </div>
                                <p class="text-sm font-medium text-[#f0ece4]">
                                    {session.run_count} run{session.run_count !== 1 ? 's' : ''}
                                </p>
                                {#if session.notes}
                                    <p class="text-xs text-[#9a8f7a] mt-0.5 truncate max-w-xs">
                                        {session.notes}
                                    </p>
                                {/if}
                            </div>
                        </div>

                        <!-- Right: key stats -->
                        <div class="flex items-center gap-4 sm:gap-6 flex-shrink-0">
                            <div class="hidden sm:block text-right">
                                <p class="text-xs text-[#6b5f4d] mb-0.5">Best reaction</p>
                                <p class="text-sm font-bold text-[#f0ece4]">
                                    {formatReaction(session.best_reaction_ms)}
                                </p>
                            </div>
                            <div class="hidden md:block text-right">
                                <p class="text-xs text-[#6b5f4d] mb-0.5">Peak speed</p>
                                <p class="text-sm font-bold
                                          {session.has_valid_speed ? 'text-[#ff6b3d]' : 'text-[#6b5f4d]'}">
                                    {formatSpeed(session.best_peak_speed_ms)}
                                </p>
                            </div>
                            <div class="hidden md:block text-right">
                                <p class="text-xs text-[#6b5f4d] mb-0.5">Max G</p>
                                <p class="text-sm font-bold text-[#f0ece4]">
                                    {formatG(session.best_max_g)}
                                </p>
                            </div>

                            <!-- Arrow -->
                            <svg class="w-5 h-5 text-[#6b5f4d] group-hover:text-[#f5a623] transition-colors flex-shrink-0"
                                 fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                 aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 5l7 7-7 7"/>
                            </svg>
                        </div>
                    </div>
                    </a>

                    <!-- Delete button -->
                    <div class="absolute top-5 right-5 z-10">
                        {#if confirmDeleteId === session.id}
                            <div class="flex items-center gap-2 bg-[#0a0809] border border-[#ff4444] rounded-lg p-2">
                                <span class="text-xs text-[#ff4444] whitespace-nowrap">Delete session + all data?</span>
                                <form method="POST" action="?/deleteSession" use:enhance={() => {
                                    deletingSessionId = session.id;
                                    return async ({ result, update }) => {
                                        await update();
                                        deletingSessionId = null;
                                        confirmDeleteId = null;
                                        if (result.type === 'success') {
                                            // Reload to show updated list
                                            window.location.reload();
                                        }
                                    };
                                }}>
                                    <input type="hidden" name="sessionId" value={session.id} />
                                    <button
                                        type="submit"
                                        disabled={deletingSessionId === session.id}
                                        class="px-2 py-1 bg-[#ff4444] hover:bg-[#cc0000] text-white text-xs
                                               font-semibold rounded transition-colors min-h-[32px]
                                               disabled:opacity-50 disabled:cursor-not-allowed
                                               focus:outline-none focus:ring-2 focus:ring-[#ff4444]"
                                        onclick={(e) => e.stopPropagation()}
                                    >
                                        {deletingSessionId === session.id ? 'Deleting...' : 'Yes'}
                                    </button>
                                </form>
                                <button
                                    type="button"
                                    onclick={(e) => { e.stopPropagation(); confirmDeleteId = null; }}
                                    class="px-2 py-1 bg-[#221c18] hover:bg-[#2a2220] text-[#f0ece4] text-xs
                                           font-semibold rounded transition-colors min-h-[32px]
                                           focus:outline-none focus:ring-2 focus:ring-[#f5a623]"
                                >
                                    No
                                </button>
                            </div>
                        {:else}
                            <button
                                type="button"
                                onclick={(e) => { e.stopPropagation(); confirmDeleteId = session.id; }}
                                class="p-2 bg-[#221c18] hover:bg-[#ff4444]/20 text-[#9a8f7a] hover:text-[#ff4444]
                                       rounded-lg transition-colors opacity-0 group-hover:opacity-100
                                       focus:outline-none focus:ring-2 focus:ring-[#ff4444] focus:opacity-100"
                                aria-label="Delete session"
                                title="Delete session"
                            >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                </svg>
                            </button>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>

        <!-- Pagination -->
        {#if totalPages > 1}
            <div class="flex items-center justify-between gap-4 flex-wrap bg-[#131010] border border-[#221c18] rounded-xl p-4">
                <p class="text-sm text-[#9a8f7a]">
                    Page {data.page} of {totalPages}
                </p>
                <div class="flex items-center gap-2">
                    <button
                        type="button"
                        onclick={() => changePage(1)}
                        disabled={data.page === 1}
                        class="px-3 py-2 bg-[#221c18] hover:bg-[#2a2220] text-[#f0ece4]
                               font-semibold text-sm rounded-lg transition-colors min-h-[44px]
                               disabled:opacity-50 disabled:cursor-not-allowed
                               focus:outline-none focus:ring-2 focus:ring-[#f5a623]"
                        aria-label="First page"
                    >
                        ««
                    </button>
                    <button
                        type="button"
                        onclick={() => changePage(data.page - 1)}
                        disabled={data.page === 1}
                        class="px-3 py-2 bg-[#221c18] hover:bg-[#2a2220] text-[#f0ece4]
                               font-semibold text-sm rounded-lg transition-colors min-h-[44px]
                               disabled:opacity-50 disabled:cursor-not-allowed
                               focus:outline-none focus:ring-2 focus:ring-[#f5a623]"
                        aria-label="Previous page"
                    >
                        «
                    </button>
                    
                    {#each Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const start = Math.max(1, Math.min(data.page - 2, totalPages - 4));
                        return start + i;
                    }).filter(p => p <= totalPages) as pageNum}
                        <button
                            type="button"
                            onclick={() => changePage(pageNum)}
                            class="px-3 py-2 {pageNum === data.page 
                                ? 'bg-[#f5a623] text-[#0a0809]' 
                                : 'bg-[#221c18] hover:bg-[#2a2220] text-[#f0ece4]'}
                                   font-semibold text-sm rounded-lg transition-colors min-h-[44px]
                                   focus:outline-none focus:ring-2 focus:ring-[#f5a623]"
                            aria-label="Page {pageNum}"
                            aria-current={pageNum === data.page ? 'page' : undefined}
                        >
                            {pageNum}
                        </button>
                    {/each}

                    <button
                        type="button"
                        onclick={() => changePage(data.page + 1)}
                        disabled={data.page === totalPages}
                        class="px-3 py-2 bg-[#221c18] hover:bg-[#2a2220] text-[#f0ece4]
                               font-semibold text-sm rounded-lg transition-colors min-h-[44px]
                               disabled:opacity-50 disabled:cursor-not-allowed
                               focus:outline-none focus:ring-2 focus:ring-[#f5a623]"
                        aria-label="Next page"
                    >
                        »
                    </button>
                    <button
                        type="button"
                        onclick={() => changePage(totalPages)}
                        disabled={data.page === totalPages}
                        class="px-3 py-2 bg-[#221c18] hover:bg-[#2a2220] text-[#f0ece4]
                               font-semibold text-sm rounded-lg transition-colors min-h-[44px]
                               disabled:opacity-50 disabled:cursor-not-allowed
                               focus:outline-none focus:ring-2 focus:ring-[#f5a623]"
                        aria-label="Last page"
                    >
                        »»
                    </button>
                </div>
            </div>
        {/if}
    {/if}

</div>

<script lang="ts">
    import BottomSheet from './BottomSheet.svelte';
    
    let {
        sessions,
        onFilter
    }: {
        sessions: any[];
        onFilter: (filtered: any[]) => void;
    } = $props();
    
    let searchTerm = $state('');
    let dateFrom = $state('');
    let dateTo = $state('');
    let minReaction = $state('');
    let maxReaction = $state('');
    let hasValidSpeed = $state<boolean | null>(null);
    let showFilters = $state(false);
    
    let filtered = $derived.by(() => {
        let result = sessions;
        
        // Search term (session type, bike name, etc)
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(s => 
                s.session_type?.toLowerCase().includes(term) ||
                s.bikes?.name?.toLowerCase().includes(term)
            );
        }
        
        // Date range
        if (dateFrom) {
            result = result.filter(s => new Date(s.timestamp) >= new Date(dateFrom));
        }
        if (dateTo) {
            result = result.filter(s => new Date(s.timestamp) <= new Date(dateTo));
        }
        
        // Reaction time range
        if (minReaction) {
            result = result.filter(s => s.best_reaction_ms >= parseFloat(minReaction));
        }
        if (maxReaction) {
            result = result.filter(s => s.best_reaction_ms <= parseFloat(maxReaction));
        }
        
        // Speed analytics availability
        if (hasValidSpeed !== null) {
            result = result.filter(s => s.has_valid_speed === hasValidSpeed);
        }
        
        return result;
    });
    
    $effect(() => {
        onFilter(filtered);
    });
    
    function clearFilters() {
        searchTerm = '';
        dateFrom = '';
        dateTo = '';
        minReaction = '';
        maxReaction = '';
        hasValidSpeed = null;
    }
</script>

<div class="themed-card rounded-xl p-4">
    <!-- Search Bar -->
    <div class="flex gap-3 mb-4">
        <div class="flex-1">
            <input
                type="search"
                bind:value={searchTerm}
                placeholder="Search sessions..."
                class="w-full px-4 py-2 bg-[color:var(--background)] border border-[color:var(--border)] rounded-lg
                       themed-text-primary placeholder:text-[color:var(--text-subtle)]
                       focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
                aria-label="Search sessions"
            />
        </div>
        <button
            onclick={() => showFilters = !showFilters}
            class="px-4 py-2 bg-[#0a0809] border border-[#221c18] rounded-lg
                   text-[#9a8f7a] hover:text-[#f5a623] hover:border-[#f5a623]/40
                   transition-colors focus:outline-none focus:ring-2 focus:ring-[#f5a623]"
            aria-expanded={showFilters}
            aria-label="Toggle filters"
        >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
            </svg>
        </button>
    </div>
    
    <!-- Advanced Filters -->
    {#if showFilters}
        <div class="space-y-3 pb-3 border-b border-[#221c18] mb-3">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <!-- Date Range -->
                <div>
                    <label for="date-from" class="block text-xs text-[#9a8f7a] mb-1">From Date</label>
                    <input
                        id="date-from"
                        type="date"
                        bind:value={dateFrom}
                        class="w-full px-3 py-2 bg-[#0a0809] border border-[#221c18] rounded-lg
                               text-[#f0ece4] focus:outline-none focus:ring-2 focus:ring-[#f5a623]"
                    />
                </div>
                <div>
                    <label for="date-to" class="block text-xs text-[#9a8f7a] mb-1">To Date</label>
                    <input
                        id="date-to"
                        type="date"
                        bind:value={dateTo}
                        class="w-full px-3 py-2 bg-[#0a0809] border border-[#221c18] rounded-lg
                               text-[#f0ece4] focus:outline-none focus:ring-2 focus:ring-[#f5a623]"
                    />
                </div>
                
                <!-- Reaction Time Range -->
                <div>
                    <label for="min-reaction" class="block text-xs text-[#9a8f7a] mb-1">Min Reaction (ms)</label>
                    <input
                        id="min-reaction"
                        type="number"
                        bind:value={minReaction}
                        placeholder="e.g. 200"
                        class="w-full px-3 py-2 bg-[#0a0809] border border-[#221c18] rounded-lg
                               text-[#f0ece4] focus:outline-none focus:ring-2 focus:ring-[#f5a623]"
                    />
                </div>
                <div>
                    <label for="max-reaction" class="block text-xs text-[#9a8f7a] mb-1">Max Reaction (ms)</label>
                    <input
                        id="max-reaction"
                        type="number"
                        bind:value={maxReaction}
                        placeholder="e.g. 500"
                        class="w-full px-3 py-2 bg-[#0a0809] border border-[#221c18] rounded-lg
                               text-[#f0ece4] focus:outline-none focus:ring-2 focus:ring-[#f5a623]"
                    />
                </div>
            </div>
            
            <!-- Speed Analytics Filter -->
            <fieldset>
                <legend class="block text-xs text-[#9a8f7a] mb-2">Speed Analytics</legend>
                <div class="flex gap-3">
                    {#each [
                        { label: 'All', value: null },
                        { label: 'With Speed', value: true },
                        { label: 'Without Speed', value: false }
                    ] as option}
                        <button
                            onclick={() => hasValidSpeed = option.value}
                            class="px-3 py-1.5 rounded-lg text-xs transition-colors
                                   focus:outline-none focus:ring-2 focus:ring-[#f5a623]
                                   {hasValidSpeed === option.value
                                       ? 'bg-[#f5a623] text-[#0a0809] font-semibold'
                                       : 'bg-[#0a0809] text-[#9a8f7a] hover:bg-[#171210]'}"
                        >
                            {option.label}
                        </button>
                    {/each}
                </div>
            </fieldset>
            
            <button
                onclick={clearFilters}
                class="text-xs text-[#9a8f7a] hover:text-[#f5a623] transition-colors"
            >
                Clear all filters
            </button>
        </div>
    {/if}
    
    <!-- Results Summary -->
    <p class="text-xs text-[#9a8f7a]">
        Showing {filtered.length} of {sessions.length} sessions
    </p>
</div>

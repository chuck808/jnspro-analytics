<script lang="ts">
    let {
        label,
        field,
        currentSort = $bindable({ field: '', direction: 'asc' as 'asc' | 'desc' }),
        onSort
    }: {
        label: string;
        field: string;
        currentSort?: { field: string; direction: 'asc' | 'desc' };
        onSort: (field: string, direction: 'asc' | 'desc') => void;
    } = $props();
    
    function handleClick() {
        if (currentSort.field === field) {
            const newDirection = currentSort.direction === 'asc' ? 'desc' : 'asc';
            currentSort = { field, direction: newDirection };
            onSort(field, newDirection);
        } else {
            currentSort = { field, direction: 'asc' };
            onSort(field, 'asc');
        }
    }
    
    let isActive = $derived(currentSort.field === field);
</script>

<button
    onclick={handleClick}
    class="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider
           transition-colors
           focus:outline-none focus:ring-2 focus:ring-[#f5a623] rounded
           {isActive ? 'text-[#f5a623]' : 'text-[#9a8f7a] hover:text-[#f0ece4]'}"
    aria-label="Sort by {label} {isActive ? (currentSort.direction === 'asc' ? 'ascending' : 'descending') : ''}"
>
    {label}
    {#if isActive}
        <svg class="w-3 h-3 transition-transform {currentSort.direction === 'desc' ? 'rotate-180' : ''}" 
             fill="none" stroke="currentColor" viewBox="0 0 24 24"
             aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
        </svg>
    {/if}
</button>

<script lang="ts">
    let {
        runs,
        selectedIdx = $bindable(0),
        onSelect,
        children
    }: {
        runs: any[];
        selectedIdx?: number;
        onSelect: (idx: number) => void;
        children?: any;
    } = $props();
    
    let containerEl: HTMLDivElement | null = $state(null);
    let touchStartX = 0;
    let touchEndX = 0;
    
    function handleTouchStart(e: TouchEvent) {
        touchStartX = e.touches[0].clientX;
    }
    
    function handleTouchEnd(e: TouchEvent) {
        touchEndX = e.changedTouches[0].clientX;
        handleSwipe();
    }
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) < swipeThreshold) return;
        
        if (diff > 0 && selectedIdx < runs.length - 1) {
            // Swipe left - next run
            selectedIdx++;
            onSelect(selectedIdx);
        } else if (diff < 0 && selectedIdx > 0) {
            // Swipe right - previous run
            selectedIdx--;
            onSelect(selectedIdx);
        }
    }
</script>

<div 
    bind:this={containerEl}
    ontouchstart={handleTouchStart}
    ontouchend={handleTouchEnd}
    class="relative overflow-hidden md:hidden"
    role="region"
    aria-label="Swipeable run selector"
>
    <!-- Swipe indicator -->
    <div class="flex items-center justify-between mb-2 text-xs text-[#6b5f4d]">
        <span class="flex items-center gap-1">
            {#if selectedIdx > 0}
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
            {/if}
            Swipe to navigate
        </span>
        <span>
            Run {selectedIdx + 1} of {runs.length}
        </span>
        <span class="flex items-center gap-1">
            {#if selectedIdx < runs.length - 1}
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
            {/if}
        </span>
    </div>
    
    <!-- Run content -->
    {@render children?.()}
    
    <!-- Pagination dots -->
    <div class="flex justify-center gap-1 mt-4">
        {#each runs as _, i}
            <button
                onclick={() => { selectedIdx = i; onSelect(i); }}
                class="min-w-[44px] min-h-[44px] flex items-center justify-center
                    focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[#0a0809] rounded"
                aria-label="Go to run {i + 1}"
                aria-current={i === selectedIdx ? 'true' : undefined}
            >
                <span class="block rounded-full transition-all
                            {i === selectedIdx ? 'bg-[#f5a623] w-6 h-2' : 'bg-[#221c18] w-2 h-2'}">
                </span>
            </button>
        {/each}
    </div>
</div>

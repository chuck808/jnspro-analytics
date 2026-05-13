<script lang="ts">
    let {
        open = $bindable(false),
        title,
        onClose,
        children
    }: {
        open?: boolean;
        title: string;
        onClose?: () => void;
        children?: any;
    } = $props();
    
    function close() {
        open = false;
        onClose?.();
    }
    
    function handleBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) close();
    }
</script>

{#if open}
    <!-- Backdrop -->
    <div 
        class="fixed inset-0 bg-black/60 z-40 animate-fade-in md:hidden"
        onclick={handleBackdropClick}
        onkeydown={(e) => e.key === 'Escape' && close()}
        role="button"
        tabindex="-1"
        aria-label="Close sheet"
    ></div>
    
    <!-- Sheet -->
    <div 
        class="fixed bottom-0 left-0 right-0 themed-card rounded-t-2xl z-50
               max-h-[85vh] overflow-y-auto animate-slide-up md:hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
    >
        <!-- Handle bar -->
        <div class="flex justify-center py-3">
            <div class="w-12 h-1 bg-[color:var(--border)] rounded-full"></div>
        </div>
        
        <!-- Header -->
        <div class="flex items-center justify-between px-4 pb-3 border-b border-[color:var(--border)]">
            <h3 id="sheet-title" class="text-lg font-semibold themed-text-primary">
                {title}
            </h3>
            <button
                onclick={close}
                class="p-2 themed-text-secondary hover:text-[color:var(--text-primary)] transition-colors
                       focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] rounded-lg"
                aria-label="Close"
            >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        </div>
        
        <!-- Content -->
        <div class="p-4">
            {@render children?.()}
        </div>
    </div>
{/if}

<style>
    @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes slide-up {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
    }
    
    .animate-fade-in {
        animation: fade-in 0.2s ease-out;
    }
    
    .animate-slide-up {
        animation: slide-up 0.3s ease-out;
    }
</style>

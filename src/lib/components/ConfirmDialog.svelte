<script lang="ts">
    import { fade, scale } from 'svelte/transition';
    
    let {
        open = $bindable(false),
        title,
        message,
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        variant = 'danger',
        onConfirm,
        onCancel
    }: {
        open?: boolean;
        title: string;
        message: string;
        confirmText?: string;
        cancelText?: string;
        variant?: 'danger' | 'warning' | 'info';
        onConfirm?: () => void;
        onCancel?: () => void;
    } = $props();
    
    const variants = {
        danger: { bg: 'bg-[#ff4444]', hover: 'hover:bg-[#cc3636]', ring: 'focus:ring-[#ff4444]' },
        warning: { bg: 'bg-[#f5a623]', hover: 'hover:bg-[#c97e0a]', ring: 'focus:ring-[#f5a623]' },
        info: { bg: 'bg-[#3de8c8]', hover: 'hover:bg-[#2bb9a3]', ring: 'focus:ring-[#3de8c8]' }
    };
    
    let style = $derived(variants[variant]);
    
    function handleConfirm() {
        open = false;
        onConfirm?.();
    }
    
    function handleCancel() {
        open = false;
        onCancel?.();
    }
    
    function handleBackdrop(e: MouseEvent) {
        if (e.target === e.currentTarget) handleCancel();
    }
    
    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Escape') handleCancel();
    }
</script>

{#if open}
    <!-- Backdrop -->
    <div 
        transition:fade={{ duration: 200 }}
        class="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
        onclick={handleBackdrop}
        onkeydown={handleKeydown}
        role="presentation"
    >
        <!-- Dialog -->
        <div 
            transition:scale={{ duration: 200, start: 0.95 }}
            class="bg-[#131010] rounded-xl border border-[#221c18] shadow-2xl 
                   max-w-md w-full p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            aria-describedby="dialog-description"
        >
            <h3 id="dialog-title" class="text-lg font-semibold text-[#f0ece4] mb-2">
                {title}
            </h3>
            <p id="dialog-description" class="text-sm text-[#9a8f7a] mb-6">
                {message}
            </p>
            
            <div class="flex gap-3 justify-end">
                <button
                    onclick={handleCancel}
                    class="px-4 py-2 text-sm bg-[#0a0809] text-[#9a8f7a] rounded-lg
                           hover:bg-[#171210] hover:text-[#f0ece4] transition-colors
                           focus:outline-none focus:ring-2 focus:ring-[#9a8f7a]
                           focus:ring-offset-2 focus:ring-offset-[#131010]"
                >
                    {cancelText}
                </button>
                <button
                    onclick={handleConfirm}
                    class="px-4 py-2 text-sm text-[#0a0809] font-semibold rounded-lg
                           transition-colors focus:outline-none focus:ring-2 
                           focus:ring-offset-2 focus:ring-offset-[#131010]
                           {style.bg} {style.hover} {style.ring}"
                >
                    {confirmText}
                </button>
            </div>
        </div>
    </div>
{/if}

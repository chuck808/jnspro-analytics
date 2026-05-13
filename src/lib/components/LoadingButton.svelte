<script lang="ts">
    import LoadingSpinner from './LoadingSpinner.svelte';
    
    let {
        loading = false,
        disabled = false,
        onclick,
        children,
        type = 'button',
        variant = 'primary'
    }: {
        loading?: boolean;
        disabled?: boolean;
        onclick?: (e: MouseEvent) => void;
        children: any;
        type?: 'button' | 'submit';
        variant?: 'primary' | 'secondary' | 'danger';
    } = $props();
    
    const variants = {
        primary: 'bg-[color:var(--accent)] text-[color:var(--card)] hover:bg-[color:var(--accent-hover)]',
        secondary: 'bg-[color:var(--border)] themed-text-primary hover:bg-[color:var(--border-hover)]',
        danger: 'bg-[#ff4444] text-[color:var(--card)] hover:bg-[#cc3636]'
    };
</script>

<button
    {type}
    onclick={onclick}
    disabled={loading || disabled}
    class="relative px-6 py-2 font-semibold rounded-lg min-h-[44px]
           disabled:opacity-50 disabled:cursor-not-allowed
           transition-colors focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] 
           focus:ring-offset-2 focus:ring-offset-[color:var(--card)]
           {variants[variant]}"
>
    {#if loading}
        <span class="flex items-center justify-center gap-2">
            <LoadingSpinner size="sm" color="white" />
            <span>Processing...</span>
        </span>
    {:else}
        {@render children()}
    {/if}
</button>

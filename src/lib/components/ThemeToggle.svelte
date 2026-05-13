<script lang="ts">
    import { theme } from '$lib/stores/theme';

    function toggleTheme() {
        theme.toggle();
    }
</script>

<button
    onclick={toggleTheme}
    class="theme-toggle"
    aria-label={$theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    title={$theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
>
    {#if $theme === 'light'}
        <!-- Moon icon for dark mode -->
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
        </svg>
    {:else}
        <!-- Sun icon for light mode -->
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
        </svg>
    {/if}
</button>

<style>
    .theme-toggle {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        background: var(--theme-surface);
        border: 1px solid var(--theme-border);
        border-radius: 8px;
        color: var(--theme-text-secondary);
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .theme-toggle:hover {
        background: var(--theme-surface-hover);
        color: var(--color-jns-amber);
        border-color: rgba(245, 166, 35, 0.4);
    }

    .theme-toggle:focus {
        outline: 2px solid var(--color-jns-amber);
        outline-offset: 2px;
    }
</style>

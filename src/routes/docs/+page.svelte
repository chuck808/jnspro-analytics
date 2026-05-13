<script lang="ts">
    import { chapters } from '$lib/docs/contents';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    let searchQuery = $state('');
    let searchResults = $state<typeof chapters>([]);

    function search(query: string) {
        if (query.trim().length < 2) {
            searchResults = [];
            return;
        }
        const words = query.toLowerCase().split(/\s+/);
        searchResults = chapters
            .map(ch => {
                const titleScore = words.filter(w => ch.title.toLowerCase().includes(w)).length * 3;
                const textScore  = words.filter(w => ch.plain.toLowerCase().includes(w)).length;
                return { ch, score: titleScore + textScore };
            })
            .filter(r => r.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(r => r.ch);
    }

    function getExcerpt(plain: string, query: string): string {
        const word = query.toLowerCase().split(/\s+/)[0];
        const idx  = plain.toLowerCase().indexOf(word);
        const start = Math.max(0, idx - 50);
        return (start > 0 ? '…' : '') + plain.slice(start, start + 160) + '…';
    }

    $effect(() => { search(searchQuery); });
</script>

<svelte:head>
    <title>Documentation — AppGatePro Analytics</title>
    <meta name="description" content="Complete documentation for AppGatePro Analytics — session analysis, goal tracking, performance trends, leaderboards, and more.">
</svelte:head>

<div class="docs-container">
    <div class="docs-header">
        <h1>Documentation</h1>
        <p>Everything you need to understand your session data, set goals, track progress, and get the most from the system.</p>
    </div>

    <!-- Search -->
    <div class="search-wrap">
        <div class="search-box">
            <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
                type="search"
                placeholder="Search documentation…"
                bind:value={searchQuery}
                autocomplete="off"
                spellcheck="false"
                aria-label="Search documentation"
            >
        </div>
    </div>

    <!-- Search results -->
    {#if searchQuery.trim().length >= 2}
        {#if searchResults.length > 0}
            <div class="search-results">
                <p class="results-label">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"</p>
                <div class="results-list">
                    {#each searchResults as ch}
                        <a href="/docs/{ch.slug}" class="result-item">
                            <div class="result-header">
                                <span class="result-icon">{ch.icon}</span>
                                <span class="result-title">{ch.title}</span>
                            </div>
                            <p class="result-excerpt">{getExcerpt(ch.plain, searchQuery)}</p>
                        </a>
                    {/each}
                </div>
            </div>
        {:else}
            <div class="search-empty">
                <p>No results for "<strong>{searchQuery}</strong>"</p>
                <p>Try a different term or browse the chapters below.</p>
            </div>
        {/if}
    {:else}
        <!-- Chapter grid -->
        <div class="chapters-grid">
            {#each chapters as ch}
                <a href="/docs/{ch.slug}" class="chapter-card">
                    <div class="chapter-icon">{ch.icon}</div>
                    <h3 class="chapter-title">{ch.title}</h3>
                    <p class="chapter-desc">{ch.desc}</p>
                </a>
            {/each}
        </div>
    {/if}
</div>

<style>
    /* ── Container ─────────────────────────────────────── */
    .docs-container {
        max-width: 1280px;
        margin: 0 auto;
        padding: 2rem 1rem;
    }

    /* ── Header ────────────────────────────────────────── */
    .docs-header {
        margin-bottom: 3rem;
        max-width: 760px;
    }

    .docs-header h1 {
        font-family: 'Fraunces', serif;
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--theme-text-primary);
        margin-bottom: 1rem;
    }

    .docs-header p {
        font-size: 1.125rem;
        color: var(--theme-text-secondary);
        line-height: 1.6;
    }

    /* ── Search ────────────────────────────────────────── */
    .search-wrap {
        margin-bottom: 2rem;
    }

    .search-box {
        position: relative;
        max-width: 480px;
    }

    .search-icon {
        position: absolute;
        left: 0.85rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--theme-text-subtle);
        pointer-events: none;
    }

    .search-box input {
        width: 100%;
        background: var(--theme-surface);
        border: 1px solid var(--theme-border);
        border-radius: 10px;
        padding: 0.7rem 1rem 0.7rem 2.6rem;
        color: var(--theme-text-primary);
        font-size: 0.9rem;
        outline: none;
        transition: border-color 0.15s;
        font-family: inherit;
    }

    .search-box input:focus {
        border-color: var(--color-jns-amber);
    }

    .search-box input::placeholder {
        color: var(--theme-text-subtle);
    }

    /* ── Search results ────────────────────────────────── */
    .results-label {
        font-size: 0.78rem;
        color: var(--theme-text-subtle);
        margin-bottom: 0.75rem;
    }

    .results-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .result-item {
        display: block;
        background: var(--theme-surface);
        border: 1px solid var(--theme-border);
        border-radius: 10px;
        padding: 1rem 1.25rem;
        text-decoration: none;
        transition: border-color 0.15s;
    }

    .result-item:hover {
        border-color: var(--color-jns-amber);
    }

    .result-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.35rem;
    }

    .result-icon {
        font-size: 1rem;
    }

    .result-title {
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--color-jns-amber);
    }

    .result-excerpt {
        font-size: 0.8rem;
        color: var(--theme-text-secondary);
        line-height: 1.5;
        margin: 0;
    }

    .search-empty {
        padding: 2rem;
        text-align: center;
        color: var(--theme-text-subtle);
        font-size: 0.9rem;
        line-height: 1.6;
    }

    .search-empty strong {
        color: var(--theme-text-primary);
    }

    .search-empty p {
        margin: 0.5rem 0;
    }

    /* ── Chapters Grid ─────────────────────────────────── */
    .chapters-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
    }

    .chapter-card {
        background: var(--theme-surface);
        border: 1px solid var(--theme-border);
        border-radius: 10px;
        padding: 1.5rem;
        text-decoration: none;
        transition: border-color 0.15s, background-color 0.15s;
        display: flex;
        flex-direction: column;
    }

    .chapter-card:hover {
        border-color: var(--color-jns-amber);
        background-color: var(--theme-surface-hover);
    }

    .chapter-icon {
        font-size: 2.5rem;
        margin-bottom: 1rem;
    }

    .chapter-title {
        font-family: 'Fraunces', serif;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--theme-text-primary);
        margin: 0 0 0.5rem 0;
        transition: color 0.15s;
    }

    .chapter-card:hover .chapter-title {
        color: var(--color-jns-amber);
    }

    .chapter-desc {
        font-size: 0.9rem;
        color: var(--theme-text-secondary);
        line-height: 1.5;
        margin: 0;
    }

    @media (max-width: 768px) {
        .chapters-grid {
            grid-template-columns: 1fr;
        }

        .docs-header h1 {
            font-size: 2rem;
        }

        .docs-header p {
            font-size: 1rem;
        }
    }
</style>

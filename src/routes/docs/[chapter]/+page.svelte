<script lang="ts">
    import type { PageData } from './$types';
    import { chapterMap, chapters } from '$lib/docs/contents';
    import { onMount } from 'svelte';
    import { Heading, P, A } from 'flowbite-svelte';

    let { data }: { data: PageData } = $props();

    let chapter = $derived(chapterMap.get(data.chapter)!);

    // Find prev/next for navigation
    let chapterIdx = $derived(chapters.findIndex(c => c.slug === data.chapter));
    let prev = $derived(chapterIdx > 0 ? chapters[chapterIdx - 1] : null);
    let next = $derived(chapterIdx < chapters.length - 1 ? chapters[chapterIdx + 1] : null);

    // Back to top
    let showBackTop = $state(false);
    onMount(() => {
        const handler = () => { showBackTop = window.scrollY > 400; };
        window.addEventListener('scroll', handler, { passive: true });
        return () => window.removeEventListener('scroll', handler);
    });
</script>

<svelte:head>
    <title>{chapter.title} — AppGatePro Docs</title>
    <meta name="description" content={chapter.desc}>
</svelte:head>

<!-- Breadcrumb -->
<nav class="breadcrumb" aria-label="Breadcrumb">
    <A href="/docs">Documentation</A>
    <span class="sep" aria-hidden="true">›</span>
    <span aria-current="page">{chapter.title}</span>
</nav>

<!-- Chapter header -->
<header class="chapter-header">
    <P size="xs" class="chapter-eyebrow">AppGatePro Analytics</P>
    <Heading tag="h1" class="chapter-title">
        <span class="chapter-icon">{chapter.icon}</span>
        {chapter.title}
    </Heading>
</header>

<!-- Chapter content -->
<article class="prose">
    {@html chapter.html}
</article>

<!-- Prev / Next navigation -->
<nav class="chapter-nav" aria-label="Chapter navigation">
    {#if prev}
        <a href="/docs/{prev.slug}" class="chapter-nav-link chapter-nav-link--prev">
            <span class="chapter-nav-dir">← Previous</span>
            <span class="chapter-nav-title">{prev.icon} {prev.title}</span>
        </a>
    {:else}
        <div></div>
    {/if}
    {#if next}
        <a href="/docs/{next.slug}" class="chapter-nav-link chapter-nav-link--next">
            <span class="chapter-nav-dir">Next →</span>
            <span class="chapter-nav-title">{next.icon} {next.title}</span>
        </a>
    {/if}
</nav>

<!-- Back to top -->
{#if showBackTop}
    <button
        class="back-top"
        onclick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
    >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 15l-6-6-6 6"/>
        </svg>
    </button>
{/if}

<style>
    /* ── Breadcrumb ───────────────────────────────────── */
    .breadcrumb {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.78rem;
        color: var(--theme-text-subtle);
        margin-bottom: 2rem;
    }
    .breadcrumb :global(a) {
        color: var(--color-jns-amber);
        text-decoration: none;
    }
    .breadcrumb :global(a:hover) { text-decoration: underline; }
    .sep { color: var(--theme-border); }

    /* ── Chapter header ───────────────────────────────── */
    .chapter-header {
        margin-bottom: 2.5rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid var(--theme-border);
    }
    .chapter-header :global(.chapter-eyebrow) {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--color-jns-amber);
        font-weight: 600;
        margin-bottom: 0.5rem;
    }
    .chapter-header :global(.chapter-title) {
        font-family: 'Fraunces', serif;
        font-size: clamp(1.8rem, 4vw, 2.4rem);
        font-weight: 600;
        color: var(--theme-text-primary);
        line-height: 1.15;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
    }
    .chapter-icon { font-size: 1.8rem; }

    /* ── Prose ────────────────────────────────────────── */
    :global(.prose h2) {
        font-family: 'Fraunces', serif;
        font-size: 1.3rem;
        font-weight: 600;
        color: var(--theme-text-primary);
        margin: 2.5rem 0 0.75rem;
        padding-bottom: 0.4rem;
        border-bottom: 1px solid var(--theme-border);
        scroll-margin-top: 72px;
    }
    :global(.prose h3) {
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--color-jns-amber);
        margin: 1.75rem 0 0.5rem;
        scroll-margin-top: 72px;
    }
    :global(.prose h4) {
        font-size: 0.78rem;
        font-weight: 600;
        color: var(--theme-text-subtle);
        margin: 1.25rem 0 0.35rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
    }
    :global(.prose p) {
        margin-bottom: 1rem;
        color: var(--theme-text-secondary);
        line-height: 1.72;
    }
    :global(.prose > p:first-child) {
        font-size: 1.05rem;
        color: var(--theme-text-primary);
    }
    :global(.prose strong) {
        color: var(--theme-text-primary);
        font-weight: 600;
    }
    :global(.prose em) {
        font-style: italic;
        color: var(--theme-text-secondary);
    }
    :global(.prose a) {
        color: var(--color-jns-amber);
        text-decoration: none;
    }
    :global(.prose a:hover) { text-decoration: underline; }
    :global(.prose ul),
    :global(.prose ol) {
        margin: 0.75rem 0 1rem 1.5rem;
        color: var(--theme-text-secondary);
    }
    :global(.prose li) { margin-bottom: 0.4rem; line-height: 1.65; }
    :global(.prose li strong) { color: var(--theme-text-primary); }
    :global(.prose code) {
        font-family: 'DM Mono', monospace;
        font-size: 0.82em;
        background: var(--theme-border);
        color: var(--color-jns-amber);
        padding: 0.1em 0.4em;
        border-radius: 4px;
    }
    :global(.prose pre) {
        background: var(--theme-surface);
        border: 1px solid var(--theme-border);
        border-radius: 10px;
        padding: 1.25rem;
        overflow-x: auto;
        margin: 1.25rem 0;
        font-family: 'DM Mono', monospace;
        font-size: 0.82rem;
        line-height: 1.6;
        color: var(--theme-text-secondary);
    }
    :global(.prose pre code) {
        background: none;
        padding: 0;
        color: inherit;
        font-size: inherit;
    }
    :global(.prose hr) {
        border: none;
        border-top: 1px solid var(--theme-border);
        margin: 2rem 0;
    }
    :global(.prose blockquote) {
        border-left: 3px solid var(--color-jns-amber);
        padding-left: 1rem;
        margin: 1.25rem 0;
        color: var(--theme-text-secondary);
        font-style: italic;
    }
    :global(.prose table) {
        width: 100%;
        border-collapse: collapse;
        margin: 1.25rem 0;
        font-size: 0.875rem;
    }
    :global(.prose th) {
        background: var(--theme-surface);
        border: 1px solid var(--theme-border);
        padding: 0.5rem 0.75rem;
        text-align: left;
        color: var(--theme-text-primary);
        font-weight: 600;
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    :global(.prose td) {
        border: 1px solid var(--theme-border);
        padding: 0.5rem 0.75rem;
        color: var(--theme-text-secondary);
    }
    :global(.prose tr:hover td) {
        background: var(--theme-border);
    }

    /* ── Video & Image support ────────────────────────── */
    :global(.doc-video) {
        position: relative;
        padding-bottom: 56.25%;
        height: 0;
        margin: 1.5rem 0;
        border-radius: 10px;
        overflow: hidden;
        border: 1px solid var(--theme-border);
    }
    :global(.doc-video iframe) {
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        border: none;
    }
    :global(.prose img) {
        max-width: 100%;
        border-radius: 8px;
        border: 1px solid var(--theme-border);
        margin: 1.25rem 0;
    }

    /* ── Prev / Next nav ──────────────────────────────── */
    .chapter-nav {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        margin-top: 3.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--theme-border);
    }
    .chapter-nav-link {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        padding: 0.85rem 1.1rem;
        background: var(--theme-surface);
        border: 1px solid var(--theme-border);
        border-radius: 10px;
        text-decoration: none;
        transition: border-color 0.15s;
        max-width: 48%;
    }
    .chapter-nav-link:hover { border-color: var(--color-jns-amber); }
    .chapter-nav-link--next { text-align: right; margin-left: auto; }
    .chapter-nav-dir {
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--theme-text-subtle);
        font-weight: 600;
    }
    .chapter-nav-title {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--color-jns-amber);
    }

    /* ── Back to top ──────────────────────────────────── */
    .back-top {
        position: fixed;
        bottom: 1.5rem;
        right: 1.5rem;
        width: 40px; height: 40px;
        background: var(--theme-surface);
        border: 1px solid var(--theme-border);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: var(--theme-text-subtle);
        transition: border-color 0.15s, color 0.15s;
        z-index: 10;
    }
    .back-top:hover {
        border-color: var(--color-jns-amber);
        color: var(--color-jns-amber);
    }
</style>

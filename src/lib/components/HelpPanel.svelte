<script lang="ts">
    import { HELP_CONTENT, HELP_LEVELS, type HelpLevel } from '$lib/utils/helpContent';

    let {
        helpKey,
        open = $bindable(false),
    }: {
        helpKey: string;
        open?: boolean;
    } = $props();

    let level = $state<HelpLevel>('club');

    let content     = $derived(HELP_CONTENT[helpKey]);
    let levelData   = $derived(content?.levels[level]);

    function close() { open = false; }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Escape') close();
    }

    // Simple markdown-like renderer: **bold**, newlines → paragraphs
    function renderBody(text: string): string {
        return text
            .split('\n\n')
            .map(para => {
                const inner = para
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br>');
                return `<p>${inner}</p>`;
            })
            .join('');
    }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if content}
    <!-- Backdrop -->
    {#if open}
        <button
            class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onclick={close}
            aria-label="Close help panel"
            tabindex="-1"
        ></button>
    {/if}

    <!-- Panel -->
    <div
        role="complementary"
        aria-label="Contextual help: {content.title}"
        aria-hidden={!open}
        class="fixed top-0 right-0 z-50 h-full w-full max-w-sm
               bg-[#131010] border-l border-[#221c18] shadow-2xl
               flex flex-col transition-transform duration-300 ease-in-out
               {open ? 'translate-x-0' : 'translate-x-full'}"
    >
        <!-- Header -->
        <div class="flex items-start justify-between gap-4 p-5 border-b border-[#221c18]">
            <div>
                <p class="text-xs font-semibold text-[#f5a623] uppercase tracking-wider mb-0.5">
                    Understanding your data
                </p>
                <h2 class="text-base font-bold text-[#f0ece4]">{content.title}</h2>
                <p class="text-xs text-[#9a8f7a] mt-0.5">{content.description}</p>
            </div>
            <button
                onclick={close}
                class="flex-shrink-0 w-8 h-8 flex items-center justify-center
                       rounded-lg text-[#6b5f4d] hover:text-[#f0ece4] hover:bg-[#221c18]
                       transition-colors focus:outline-none focus:ring-2 focus:ring-[#f5a623]"
                aria-label="Close help panel"
            >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        </div>

        <!-- Level selector -->
        <div class="px-5 py-3 border-b border-[#221c18]">
            <p class="text-xs text-[#6b5f4d] mb-2">Reading level</p>
            <div class="flex gap-2">
                {#each HELP_LEVELS as l}
                    <button
                        onclick={() => level = l.id}
                        class="flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors
                               focus:outline-none focus:ring-2 focus:ring-[#f5a623]
                               {level === l.id
                                   ? 'bg-[#f5a623] text-[#0a0809]'
                                   : 'bg-[#221c18] text-[#9a8f7a] hover:text-[#f0ece4]'}"
                        aria-pressed={level === l.id}
                    >
                        {l.label}
                    </button>
                {/each}
            </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-5 space-y-4">
            {#if levelData}
                <h3 class="text-sm font-semibold text-[#f0ece4]">{levelData.heading}</h3>

                <div class="text-sm text-[#9a8f7a] space-y-3 leading-relaxed help-body">
                    {@html renderBody(levelData.body)}
                </div>

                <!-- Thresholds -->
                {#if levelData.thresholds && levelData.thresholds.length > 0}
                    <div class="bg-[#0a0809] rounded-xl p-4 border border-[#221c18]">
                        <p class="text-xs font-semibold text-[#6b5f4d] uppercase tracking-wider mb-3">
                            Reference values
                        </p>
                        <div class="space-y-2">
                            {#each levelData.thresholds as t}
                                <div class="flex items-center justify-between gap-3">
                                    <div class="flex items-center gap-2">
                                        <span class="w-2 h-2 rounded-full flex-shrink-0"
                                              style="background:{t.color}">
                                        </span>
                                        <span class="text-xs text-[#9a8f7a]">{t.label}</span>
                                    </div>
                                    <span class="text-xs font-bold text-[#f0ece4] flex-shrink-0">
                                        {t.value}
                                    </span>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}

                <!-- Callout -->
                {#if levelData.callout}
                    <div class="bg-[#f5a623]/8 border border-[#f5a623]/20 rounded-xl p-4">
                        <p class="text-xs text-[#f5a623] font-semibold mb-1">Worth knowing</p>
                        <p class="text-xs text-[#9a8f7a] leading-relaxed">{levelData.callout}</p>
                    </div>
                {/if}

            {:else}
                <p class="text-sm text-[#6b5f4d]">Help content not available for this section.</p>
            {/if}
        </div>

        <!-- Footer -->
        <div class="px-5 py-3 border-t border-[#221c18]">
            <p class="text-xs text-[#6b5f4d] text-center">
                AppGatePro Analytics · JNS Pro Systems
            </p>
        </div>
    </div>
{/if}

<style>
    :global(.help-body p) {
        margin-bottom: 0.75rem;
    }
    :global(.help-body p:last-child) {
        margin-bottom: 0;
    }
    :global(.help-body strong) {
        color: #f0ece4;
        font-weight: 600;
    }
</style>

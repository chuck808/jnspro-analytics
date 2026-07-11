<script lang="ts">
	import { HELP_CONTENT, HELP_LEVELS, type HelpLevel } from '$lib/utils/helpContent';

	let {
		helpKey,
		open = $bindable(false)
	}: {
		helpKey: string;
		open?: boolean;
	} = $props();

	let level = $state<HelpLevel>('club');

	let content = $derived(HELP_CONTENT[helpKey]);
	let levelData = $derived(content?.levels[level]);

	function close() {
		open = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}

	// Simple markdown-like renderer: **bold**, newlines → paragraphs
	function renderBody(text: string): string {
		return text
			.split('\n\n')
			.map((para) => {
				const inner = para.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
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
		class="fixed top-0 right-0 z-50 flex h-full w-full
               max-w-sm flex-col border-l border-[#221c18]
               bg-[#131010] shadow-2xl transition-transform duration-300 ease-in-out
               {open ? 'translate-x-0' : 'translate-x-full'}"
	>
		<!-- Header -->
		<div class="flex items-start justify-between gap-4 border-b border-[#221c18] p-5">
			<div>
				<p class="mb-0.5 text-xs font-semibold tracking-wider text-[#f5a623] uppercase">
					Understanding your data
				</p>
				<h2 class="text-base font-bold text-[#f0ece4]">{content.title}</h2>
				<p class="mt-0.5 text-xs text-[#9a8f7a]">{content.description}</p>
			</div>
			<button
				onclick={close}
				class="flex h-8 w-8 flex-shrink-0 items-center justify-center
                       rounded-lg text-[#6b5f4d] transition-colors hover:bg-[#221c18]
                       hover:text-[#f0ece4] focus:ring-2 focus:ring-[#f5a623] focus:outline-none"
				aria-label="Close help panel"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</div>

		<!-- Level selector -->
		<div class="border-b border-[#221c18] px-5 py-3">
			<p class="mb-2 text-xs text-[#6b5f4d]">Reading level</p>
			<div class="flex gap-2">
				{#each HELP_LEVELS as l}
					<button
						onclick={() => (level = l.id)}
						class="flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors
                               focus:ring-2 focus:ring-[#f5a623] focus:outline-none
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
		<div class="flex-1 space-y-4 overflow-y-auto p-5">
			{#if levelData}
				<h3 class="text-sm font-semibold text-[#f0ece4]">{levelData.heading}</h3>

				<div class="help-body space-y-3 text-sm leading-relaxed text-[#9a8f7a]">
					{@html renderBody(levelData.body)}
				</div>

				<!-- Thresholds -->
				{#if levelData.thresholds && levelData.thresholds.length > 0}
					<div class="rounded-xl border border-[#221c18] bg-[#0a0809] p-4">
						<p class="mb-3 text-xs font-semibold tracking-wider text-[#6b5f4d] uppercase">
							Reference values
						</p>
						<div class="space-y-2">
							{#each levelData.thresholds as t}
								<div class="flex items-center justify-between gap-3">
									<div class="flex items-center gap-2">
										<span class="h-2 w-2 flex-shrink-0 rounded-full" style="background:{t.color}">
										</span>
										<span class="text-xs text-[#9a8f7a]">{t.label}</span>
									</div>
									<span class="flex-shrink-0 text-xs font-bold text-[#f0ece4]">
										{t.value}
									</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Callout -->
				{#if levelData.callout}
					<div class="rounded-xl border border-[#f5a623]/20 bg-[#f5a623]/8 p-4">
						<p class="mb-1 text-xs font-semibold text-[#f5a623]">Worth knowing</p>
						<p class="text-xs leading-relaxed text-[#9a8f7a]">{levelData.callout}</p>
					</div>
				{/if}
			{:else}
				<p class="text-sm text-[#6b5f4d]">Help content not available for this section.</p>
			{/if}
		</div>

		<!-- Footer -->
		<div class="border-t border-[#221c18] px-5 py-3">
			<p class="text-center text-xs text-[#6b5f4d]">AppGatePro Analytics · JNS Pro Systems</p>
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

<script lang="ts">
	interface SessionSummary {
		id: string;
		timestamp: string;
		run_count: number;
		best_reaction_ms: number | null;
		best_peak_speed_ms: number | null;
		has_valid_speed: boolean;
	}

	interface Props {
		sessions: SessionSummary[];
	}

	let { sessions }: Props = $props();

	const ITEMS_PER_PAGE = 10;
	let currentPage = $state(1);

	// Sessions are already ordered newest first from the database
	let totalPages = $derived(Math.ceil(sessions.length / ITEMS_PER_PAGE));

	let paginatedSessions = $derived.by(() => {
		const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
		const endIndex = startIndex + ITEMS_PER_PAGE;
		return sessions.slice(startIndex, endIndex);
	});

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
		}
	}

	function nextPage() {
		if (currentPage < totalPages) {
			currentPage++;
		}
	}

	function prevPage() {
		if (currentPage > 1) {
			currentPage--;
		}
	}

	// Calculate page numbers to show (show max 5 page buttons)
	let visiblePages = $derived.by(() => {
		if (totalPages <= 5) {
			return Array.from({ length: totalPages }, (_, i) => i + 1);
		}

		if (currentPage <= 3) {
			return [1, 2, 3, 4, 5];
		}

		if (currentPage >= totalPages - 2) {
			return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
		}

		return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
	});

	function fmtDate(ts: string) {
		return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
	}

	function fmtReaction(ms: number | null) {
		return ms !== null ? (ms / 1000).toFixed(3) + 's' : '—';
	}

	function fmtSpeed(ms: number | null) {
		return ms !== null ? (ms * 3.6).toFixed(1) + ' km/h' : '—';
	}
</script>

<div class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
	<div class="mb-4 flex items-center justify-between">
		<h3 class="text-sm font-semibold text-[#f0ece4]">Session History</h3>
		{#if totalPages > 1}
			<span class="text-xs text-[#6b5f4d]">
				{sessions.length} sessions · Page {currentPage} of {totalPages}
			</span>
		{/if}
	</div>

	<div class="space-y-2">
		{#each paginatedSessions as session}
			<a
				href="/sessions/{session.id}"
				class="group flex min-h-[44px] items-center gap-4 rounded-lg bg-[#0a0809]
                      p-3 transition-colors hover:bg-[#171210]
                      focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2
                      focus:ring-offset-[#131010] focus:outline-none"
			>
				<div class="w-10 flex-shrink-0 text-center">
					<p class="text-sm font-bold text-[#f5a623]">{new Date(session.timestamp).getDate()}</p>
					<p class="text-xs text-[#6b5f4d]">
						{new Date(session.timestamp).toLocaleDateString('en-GB', { month: 'short' })}
					</p>
				</div>
				<div class="min-w-0 flex-1">
					<p class="text-sm font-medium text-[#f0ece4]">{session.run_count} runs</p>
					<p class="text-xs text-[#6b5f4d]">
						Best reaction: {fmtReaction(session.best_reaction_ms)}
						{#if session.has_valid_speed}· Peak speed: {fmtSpeed(session.best_peak_speed_ms)}{/if}
					</p>
				</div>
				<svg
					class="h-4 w-4 flex-shrink-0 text-[#6b5f4d] transition-colors group-hover:text-[#f5a623]"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</a>
		{/each}
	</div>

	{#if totalPages > 1}
		<div class="mt-4 flex items-center justify-between border-t border-[#221c18] pt-4">
			<!-- Previous button -->
			<button
				onclick={prevPage}
				disabled={currentPage === 1}
				class="flex min-h-[44px] items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors
                       {currentPage === 1
					? 'cursor-not-allowed text-[#6b5f4d]'
					: 'text-[#f0ece4] hover:bg-[#0a0809] focus:ring-2 focus:ring-[#f5a623] focus:outline-none'}"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
				<span class="hidden sm:inline">Previous</span>
			</button>

			<!-- Page numbers -->
			<div class="flex items-center gap-1">
				{#if currentPage > 3 && totalPages > 5}
					<button
						onclick={() => goToPage(1)}
						class="min-h-[44px] rounded-lg px-3 py-2 text-sm text-[#9a8f7a] transition-colors hover:bg-[#0a0809]
                               focus:ring-2 focus:ring-[#f5a623] focus:outline-none"
					>
						1
					</button>
					<span class="px-1 text-[#6b5f4d]">...</span>
				{/if}

				{#each visiblePages as page}
					<button
						onclick={() => goToPage(page)}
						class="min-h-[44px] min-w-[44px] rounded-lg px-3 py-2 text-sm transition-colors
                               focus:ring-2 focus:ring-[#f5a623] focus:outline-none
                               {currentPage === page
							? 'bg-[#f5a623] font-semibold text-[#0a0809]'
							: 'text-[#9a8f7a] hover:bg-[#0a0809]'}"
					>
						{page}
					</button>
				{/each}

				{#if currentPage < totalPages - 2 && totalPages > 5}
					<span class="px-1 text-[#6b5f4d]">...</span>
					<button
						onclick={() => goToPage(totalPages)}
						class="min-h-[44px] rounded-lg px-3 py-2 text-sm text-[#9a8f7a] transition-colors hover:bg-[#0a0809]
                               focus:ring-2 focus:ring-[#f5a623] focus:outline-none"
					>
						{totalPages}
					</button>
				{/if}
			</div>

			<!-- Next button -->
			<button
				onclick={nextPage}
				disabled={currentPage === totalPages}
				class="flex min-h-[44px] items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors
                       {currentPage === totalPages
					? 'cursor-not-allowed text-[#6b5f4d]'
					: 'text-[#f0ece4] hover:bg-[#0a0809] focus:ring-2 focus:ring-[#f5a623] focus:outline-none'}"
			>
				<span class="hidden sm:inline">Next</span>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</button>
		</div>
	{/if}
</div>

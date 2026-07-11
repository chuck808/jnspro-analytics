<script lang="ts">
	let {
		sessions,
		onFilter
	}: {
		sessions: any[];
		onFilter: (filtered: any[]) => void;
	} = $props();

	let searchTerm = $state('');
	let dateFrom = $state('');
	let dateTo = $state('');
	let minReaction = $state('');
	let maxReaction = $state('');
	let hasValidSpeed = $state<boolean | null>(null);
	let showFilters = $state(false);

	let filtered = $derived.by(() => {
		let result = sessions;

		// Search term (session type, bike name, etc)
		if (searchTerm) {
			const term = searchTerm.toLowerCase();
			result = result.filter(
				(s) =>
					s.session_type?.toLowerCase().includes(term) ||
					s.bikes?.name?.toLowerCase().includes(term)
			);
		}

		// Date range
		if (dateFrom) {
			result = result.filter((s) => new Date(s.timestamp) >= new Date(dateFrom));
		}
		if (dateTo) {
			result = result.filter((s) => new Date(s.timestamp) <= new Date(dateTo));
		}

		// Reaction time range
		if (minReaction) {
			result = result.filter((s) => s.best_reaction_ms >= parseFloat(minReaction));
		}
		if (maxReaction) {
			result = result.filter((s) => s.best_reaction_ms <= parseFloat(maxReaction));
		}

		// Speed analytics availability
		if (hasValidSpeed !== null) {
			result = result.filter((s) => s.has_valid_speed === hasValidSpeed);
		}

		return result;
	});

	$effect(() => {
		onFilter(filtered);
	});

	function clearFilters() {
		searchTerm = '';
		dateFrom = '';
		dateTo = '';
		minReaction = '';
		maxReaction = '';
		hasValidSpeed = null;
	}
</script>

<div class="themed-card rounded-xl p-4">
	<!-- Search Bar -->
	<div class="mb-4 flex gap-3">
		<div class="flex-1">
			<input
				type="search"
				bind:value={searchTerm}
				placeholder="Search sessions..."
				class="themed-text-primary w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-4
                       py-2 placeholder:text-[color:var(--text-subtle)]
                       focus:ring-2 focus:ring-[color:var(--accent)] focus:outline-none"
				aria-label="Search sessions"
			/>
		</div>
		<button
			onclick={() => (showFilters = !showFilters)}
			class="rounded-lg border border-[#221c18] bg-[#0a0809] px-4 py-2
                   text-[#9a8f7a] transition-colors hover:border-[#f5a623]/40
                   hover:text-[#f5a623] focus:ring-2 focus:ring-[#f5a623] focus:outline-none"
			aria-expanded={showFilters}
			aria-label="Toggle filters"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
				></path>
			</svg>
		</button>
	</div>

	<!-- Advanced Filters -->
	{#if showFilters}
		<div class="mb-3 space-y-3 border-b border-[#221c18] pb-3">
			<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
				<!-- Date Range -->
				<div>
					<label for="date-from" class="mb-1 block text-xs text-[#9a8f7a]">From Date</label>
					<input
						id="date-from"
						type="date"
						bind:value={dateFrom}
						class="w-full rounded-lg border border-[#221c18] bg-[#0a0809] px-3 py-2
                               text-[#f0ece4] focus:ring-2 focus:ring-[#f5a623] focus:outline-none"
					/>
				</div>
				<div>
					<label for="date-to" class="mb-1 block text-xs text-[#9a8f7a]">To Date</label>
					<input
						id="date-to"
						type="date"
						bind:value={dateTo}
						class="w-full rounded-lg border border-[#221c18] bg-[#0a0809] px-3 py-2
                               text-[#f0ece4] focus:ring-2 focus:ring-[#f5a623] focus:outline-none"
					/>
				</div>

				<!-- Reaction Time Range -->
				<div>
					<label for="min-reaction" class="mb-1 block text-xs text-[#9a8f7a]"
						>Min Reaction (ms)</label
					>
					<input
						id="min-reaction"
						type="number"
						bind:value={minReaction}
						placeholder="e.g. 200"
						class="w-full rounded-lg border border-[#221c18] bg-[#0a0809] px-3 py-2
                               text-[#f0ece4] focus:ring-2 focus:ring-[#f5a623] focus:outline-none"
					/>
				</div>
				<div>
					<label for="max-reaction" class="mb-1 block text-xs text-[#9a8f7a]"
						>Max Reaction (ms)</label
					>
					<input
						id="max-reaction"
						type="number"
						bind:value={maxReaction}
						placeholder="e.g. 500"
						class="w-full rounded-lg border border-[#221c18] bg-[#0a0809] px-3 py-2
                               text-[#f0ece4] focus:ring-2 focus:ring-[#f5a623] focus:outline-none"
					/>
				</div>
			</div>

			<!-- Speed Analytics Filter -->
			<fieldset>
				<legend class="mb-2 block text-xs text-[#9a8f7a]">Speed Analytics</legend>
				<div class="flex gap-3">
					{#each [{ label: 'All', value: null }, { label: 'With Speed', value: true }, { label: 'Without Speed', value: false }] as option}
						<button
							onclick={() => (hasValidSpeed = option.value)}
							class="rounded-lg px-3 py-1.5 text-xs transition-colors
                                   focus:ring-2 focus:ring-[#f5a623] focus:outline-none
                                   {hasValidSpeed === option.value
								? 'bg-[#f5a623] font-semibold text-[#0a0809]'
								: 'bg-[#0a0809] text-[#9a8f7a] hover:bg-[#171210]'}"
						>
							{option.label}
						</button>
					{/each}
				</div>
			</fieldset>

			<button
				onclick={clearFilters}
				class="text-xs text-[#9a8f7a] transition-colors hover:text-[#f5a623]"
			>
				Clear all filters
			</button>
		</div>
	{/if}

	<!-- Results Summary -->
	<p class="text-xs text-[#9a8f7a]">
		Showing {filtered.length} of {sessions.length} sessions
	</p>
</div>

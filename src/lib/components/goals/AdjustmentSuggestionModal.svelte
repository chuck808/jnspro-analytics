<script lang="ts">
	import type { GoalAdjustmentSuggestion } from '$lib/services/goalAdaptation';

	interface Props {
		suggestions: GoalAdjustmentSuggestion[];
		open: boolean;
		onClose: () => void;
		onApply: (suggestion: GoalAdjustmentSuggestion) => void;
	}

	let { suggestions, open = $bindable(), onClose, onApply }: Props = $props();

	// Get priority color
	function getPriorityColor(priority: GoalAdjustmentSuggestion['priority']): string {
		switch (priority) {
			case 'high':
				return '#ff6b3d';
			case 'medium':
				return '#f5a623';
			case 'low':
				return '#3de8c8';
		}
	}

	// Get priority badge style
	function getPriorityBadge(priority: GoalAdjustmentSuggestion['priority']): string {
		switch (priority) {
			case 'high':
				return 'bg-[#ff6b3d]/10 border-[#ff6b3d]/30 text-[#ff6b3d]';
			case 'medium':
				return 'bg-[#f5a623]/10 border-[#f5a623]/30 text-[#f5a623]';
			case 'low':
				return 'bg-[#3de8c8]/10 border-[#3de8c8]/30 text-[#3de8c8]';
		}
	}

	function focusOnMount(node: HTMLElement) {
		node.focus();
	}

	// Handle backdrop click
	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	// Handle keyboard events for backdrop
	function handleBackdropKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}

	// Format value for display
	function formatValue(value: any, type: GoalAdjustmentSuggestion['type']): string {
		if (type === 'extend_deadline' || type === 'shorten_deadline') {
			if (value instanceof Date) {
				return value.toLocaleDateString();
			}
		}
		if (typeof value === 'number') {
			return value.toFixed(2);
		}
		return String(value);
	}
</script>

<!-- Modal Backdrop -->
{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
		onclick={handleBackdropClick}
		onkeydown={handleBackdropKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
		use:focusOnMount
		tabindex="-1"
	>
		<!-- Modal Content -->
		<div
			class="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#221c18] bg-[#0a0809]"
		>
			<!-- Header -->
			<div class="border-b border-[#221c18] px-6 py-4">
				<div class="flex items-center justify-between">
					<div>
						<h2 id="modal-title" class="text-xl font-bold text-[#f0ece4]">
							Goal Adjustment Suggestions
						</h2>
						<p class="mt-1 text-sm text-[#9a8f7a]">
							{suggestions.length} recommendation{suggestions.length !== 1 ? 's' : ''} based on your progress
						</p>
					</div>
					<button
						onclick={onClose}
						class="rounded-lg p-2 text-[#9a8f7a] transition-colors
                               hover:text-[#f0ece4] focus:ring-2 focus:ring-[#f5a623] focus:outline-none"
						aria-label="Close modal"
					>
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
			</div>

			<!-- Suggestions List -->
			<div class="flex-1 space-y-4 overflow-y-auto p-6">
				{#each suggestions as suggestion}
					<div
						class="rounded-xl border border-[#221c18] bg-[#131010] p-5 transition-colors hover:border-[#f5a623]/30"
					>
						<!-- Suggestion Header -->
						<div class="mb-3 flex items-start justify-between">
							<div class="flex-1">
								<div class="mb-1 flex items-center gap-2">
									<h3 class="text-lg font-semibold text-[#f0ece4]">
										{suggestion.title}
									</h3>
									<span
										class="rounded-full border px-2 py-1 text-xs {getPriorityBadge(
											suggestion.priority
										)}"
									>
										{suggestion.priority}
									</span>
								</div>
								<p class="text-sm text-[#9a8f7a]">
									{suggestion.description}
								</p>
							</div>
						</div>

						<!-- Current vs Suggested -->
						<div
							class="mb-4 grid grid-cols-2 gap-4 rounded-lg border border-[#221c18] bg-[#0a0809] p-4"
						>
							<div>
								<p class="mb-1 text-xs tracking-wide text-[#6b5f4d] uppercase">Current</p>
								<p class="text-sm font-medium text-[#9a8f7a]">
									{formatValue(suggestion.currentValue, suggestion.type)}
								</p>
							</div>
							<div>
								<p class="mb-1 text-xs tracking-wide text-[#6b5f4d] uppercase">Suggested</p>
								<p
									class="text-sm font-semibold"
									style="color: {getPriorityColor(suggestion.priority)}"
								>
									{formatValue(suggestion.suggestedValue, suggestion.type)}
								</p>
							</div>
						</div>

						<!-- Rationale -->
						<div class="mb-4 rounded-lg border border-[#f5a623]/10 bg-[#f5a623]/5 p-3">
							<p class="mb-1 text-xs tracking-wide text-[#f5a623] uppercase">
								Why this suggestion?
							</p>
							<p class="text-sm leading-relaxed text-[#9a8f7a]">
								{suggestion.rationale}
							</p>
						</div>

						<!-- Confidence Badge -->
						<div class="mb-4 flex items-center gap-2">
							<span class="text-xs text-[#6b5f4d]">Confidence:</span>
							<div class="h-1.5 flex-1 overflow-hidden rounded-full bg-[#221c18]">
								<div
									class="h-full rounded-full bg-[#f5a623] transition-all"
									style="width: {suggestion.confidence * 100}%"
								></div>
							</div>
							<span class="text-xs font-medium text-[#f5a623]">
								{Math.round(suggestion.confidence * 100)}%
							</span>
						</div>

						<!-- Apply Button -->
						<button
							onclick={() => onApply(suggestion)}
							class="w-full rounded-lg px-4 py-3 font-medium transition-colors
                                   focus:ring-2 focus:ring-offset-2 focus:ring-offset-[color:var(--theme-surface)] focus:outline-none
                                   {suggestion.priority === 'high'
								? 'bg-[#ff6b3d] text-white hover:bg-[#ff6b3d]/80 focus:ring-[#ff6b3d]'
								: 'bg-[#f5a623] text-[#0a0809] hover:bg-[#f5a623]/80 focus:ring-[#f5a623]'}"
						>
							Apply This Suggestion
						</button>
					</div>
				{/each}
			</div>

			<!-- Footer -->
			<div class="border-t border-[#221c18] bg-[#0a0809] px-6 py-4">
				<div class="flex items-center justify-between">
					<p class="text-xs text-[#6b5f4d]">You can always adjust your goals manually later</p>
					<button
						onclick={onClose}
						class="rounded-lg px-4 py-2 text-sm font-medium text-[#9a8f7a] transition-colors
                               hover:text-[#f0ece4] focus:ring-2 focus:ring-[#f5a623] focus:outline-none"
					>
						Maybe Later
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

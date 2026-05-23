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
            case 'high': return '#ff6b3d';
            case 'medium': return '#f5a623';
            case 'low': return '#3de8c8';
        }
    }

    // Get priority badge style
    function getPriorityBadge(priority: GoalAdjustmentSuggestion['priority']): string {
        switch (priority) {
            case 'high': return 'bg-[#ff6b3d]/10 border-[#ff6b3d]/30 text-[#ff6b3d]';
            case 'medium': return 'bg-[#f5a623]/10 border-[#f5a623]/30 text-[#f5a623]';
            case 'low': return 'bg-[#3de8c8]/10 border-[#3de8c8]/30 text-[#3de8c8]';
        }
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
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onclick={handleBackdropClick}
        onkeydown={handleBackdropKeydown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabindex="-1"
    >
        <!-- Modal Content -->
        <div class="bg-[#0a0809] border border-[#221c18] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <!-- Header -->
            <div class="px-6 py-4 border-b border-[#221c18]">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 id="modal-title" class="text-xl font-bold text-[#f0ece4]">
                            Goal Adjustment Suggestions
                        </h2>
                        <p class="text-sm text-[#9a8f7a] mt-1">
                            {suggestions.length} recommendation{suggestions.length !== 1 ? 's' : ''} based on your progress
                        </p>
                    </div>
                    <button
                        onclick={onClose}
                        class="text-[#9a8f7a] hover:text-[#f0ece4] transition-colors p-2
                               focus:outline-none focus:ring-2 focus:ring-[#f5a623] rounded-lg"
                        aria-label="Close modal"
                    >
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Suggestions List -->
            <div class="flex-1 overflow-y-auto p-6 space-y-4">
                {#each suggestions as suggestion}
                    <div class="bg-[#131010] border border-[#221c18] rounded-xl p-5 hover:border-[#f5a623]/30 transition-colors">
                        <!-- Suggestion Header -->
                        <div class="flex items-start justify-between mb-3">
                            <div class="flex-1">
                                <div class="flex items-center gap-2 mb-1">
                                    <h3 class="text-lg font-semibold text-[#f0ece4]">
                                        {suggestion.title}
                                    </h3>
                                    <span class="text-xs px-2 py-1 rounded-full border {getPriorityBadge(suggestion.priority)}">
                                        {suggestion.priority}
                                    </span>
                                </div>
                                <p class="text-sm text-[#9a8f7a]">
                                    {suggestion.description}
                                </p>
                            </div>
                        </div>

                        <!-- Current vs Suggested -->
                        <div class="grid grid-cols-2 gap-4 mb-4 p-4 bg-[#0a0809] rounded-lg border border-[#221c18]">
                            <div>
                                <p class="text-xs uppercase tracking-wide text-[#6b5f4d] mb-1">Current</p>
                                <p class="text-sm font-medium text-[#9a8f7a]">
                                    {formatValue(suggestion.currentValue, suggestion.type)}
                                </p>
                            </div>
                            <div>
                                <p class="text-xs uppercase tracking-wide text-[#6b5f4d] mb-1">Suggested</p>
                                <p class="text-sm font-semibold" style="color: {getPriorityColor(suggestion.priority)}">
                                    {formatValue(suggestion.suggestedValue, suggestion.type)}
                                </p>
                            </div>
                        </div>

                        <!-- Rationale -->
                        <div class="mb-4 p-3 bg-[#f5a623]/5 rounded-lg border border-[#f5a623]/10">
                            <p class="text-xs uppercase tracking-wide text-[#f5a623] mb-1">Why this suggestion?</p>
                            <p class="text-sm text-[#9a8f7a] leading-relaxed">
                                {suggestion.rationale}
                            </p>
                        </div>

                        <!-- Confidence Badge -->
                        <div class="flex items-center gap-2 mb-4">
                            <span class="text-xs text-[#6b5f4d]">Confidence:</span>
                            <div class="flex-1 h-1.5 bg-[#221c18] rounded-full overflow-hidden">
                                <div 
                                    class="h-full bg-[#f5a623] rounded-full transition-all"
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
                            class="w-full py-3 px-4 rounded-lg font-medium transition-colors
                                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[color:var(--theme-surface)]
                                   {suggestion.priority === 'high' 
                                       ? 'bg-[#ff6b3d] hover:bg-[#ff6b3d]/80 text-white focus:ring-[#ff6b3d]' 
                                       : 'bg-[#f5a623] hover:bg-[#f5a623]/80 text-[#0a0809] focus:ring-[#f5a623]'}"
                        >
                            Apply This Suggestion
                        </button>
                    </div>
                {/each}
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 border-t border-[#221c18] bg-[#0a0809]">
                <div class="flex items-center justify-between">
                    <p class="text-xs text-[#6b5f4d]">
                        You can always adjust your goals manually later
                    </p>
                    <button
                        onclick={onClose}
                        class="px-4 py-2 text-sm font-medium text-[#9a8f7a] hover:text-[#f0ece4] transition-colors
                               focus:outline-none focus:ring-2 focus:ring-[#f5a623] rounded-lg"
                    >
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}
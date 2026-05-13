<script lang="ts">
    import type { SelectedModel, ConfidenceInterval } from '$lib/services/predictions';
    import type { ProgressStatus } from '$lib/services/goalAdaptation';
    import { getProgressStatusColor, getProgressStatusEmoji } from '$lib/services/goalAdaptation';

    interface Props {
        goalName: string;
        currentValue: number;
        targetValue: number;
        startValue: number;
        metric: string;
        prediction: SelectedModel | null;
        progressStatus?: ProgressStatus;
        percentComplete?: number;
        deadline?: Date;
    }

    let { 
        goalName, 
        currentValue, 
        targetValue, 
        startValue,
        metric,
        prediction,
        progressStatus,
        percentComplete = 0,
        deadline
    }: Props = $props();

    // Format values for display
    function formatValue(value: number): string {
        const lowerMetric = metric.toLowerCase();
        
        if (lowerMetric.includes('reaction') || lowerMetric.includes('time')) {
            return `${(value / 1000).toFixed(3)}s`;
        }
        if (lowerMetric.includes('speed')) {
            return `${(value * 3.6).toFixed(1)} km/h`;
        }
        if (lowerMetric.includes('power') || lowerMetric.includes('g')) {
            return `${value.toFixed(2)}g`;
        }
        return value.toFixed(2);
    }

    // Get status color
    const statusColor = $derived(progressStatus ? getProgressStatusColor(progressStatus) : '#f5a623');
    const statusEmoji = $derived(progressStatus ? getProgressStatusEmoji(progressStatus) : '');

    // Format confidence interval text
    function formatConfidenceInterval(ci: ConfidenceInterval | null): string {
        if (!ci) return '';
        if (ci.lower === ci.upper) return `${ci.median} session${ci.median !== 1 ? 's' : ''}`;
        return `${ci.lower}-${ci.upper} sessions`;
    }

    // Calculate days remaining
    function getDaysRemaining(): number | null {
        if (!deadline) return null;
        const now = new Date();
        const diff = deadline.getTime() - now.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    const daysRemaining = getDaysRemaining();
</script>

<div class="bg-[#131010] border border-[#221c18] rounded-xl p-5 hover:border-[#f5a623]/30 transition-colors">
    <!-- Header -->
    <div class="flex items-start justify-between mb-4">
        <div class="flex-1">
            <h3 class="text-lg font-semibold text-[#f0ece4]">{goalName}</h3>
            <p class="text-sm text-[#9a8f7a] mt-1">{metric}</p>
        </div>
        {#if progressStatus}
            <div class="flex items-center gap-2">
                <span class="text-2xl">{statusEmoji}</span>
                <div class="text-right">
                    <p class="text-xs uppercase tracking-wide font-medium" style="color: {statusColor}">
                        {progressStatus.replace('_', ' ')}
                    </p>
                    {#if percentComplete}
                        <p class="text-xs text-[#9a8f7a]">{percentComplete.toFixed(0)}% complete</p>
                    {/if}
                </div>
            </div>
        {/if}
    </div>

    <!-- Progress Bar -->
    <div class="mb-4">
        <div class="h-2 bg-[#221c18] rounded-full overflow-hidden">
            <div 
                class="h-full rounded-full transition-all duration-500"
                style="width: {Math.min(100, percentComplete)}%; background-color: {statusColor}"
            ></div>
        </div>
    </div>

    <!-- Values Grid -->
    <div class="grid grid-cols-3 gap-4 mb-4">
        <div>
            <p class="text-xs text-[#6b5f4d] mb-1">Start</p>
            <p class="text-sm font-medium text-[#9a8f7a]">{formatValue(startValue)}</p>
        </div>
        <div>
            <p class="text-xs text-[#6b5f4d] mb-1">Current</p>
            <p class="text-sm font-semibold text-[#f0ece4]">{formatValue(currentValue)}</p>
        </div>
        <div>
            <p class="text-xs text-[#6b5f4d] mb-1">Target</p>
            <p class="text-sm font-medium text-[#f5a623]">{formatValue(targetValue)}</p>
        </div>
    </div>

    <!-- Prediction Section -->
    {#if prediction}
        <div class="border-t border-[#221c18] pt-4">
            <div class="flex items-center justify-between mb-2">
                <p class="text-xs uppercase tracking-wide text-[#6b5f4d]">AI Prediction</p>
                <span class="text-xs px-2 py-1 rounded-full bg-[#f5a623]/10 text-[#f5a623]">
                    {prediction.type}
                </span>
            </div>

            {#if prediction.sessionsRemaining !== null}
                <div class="flex items-baseline gap-2 mb-2">
                    <p class="text-2xl font-bold text-[#f0ece4]">
                        {prediction.confidenceInterval?.median || prediction.sessionsRemaining}
                    </p>
                    <p class="text-sm text-[#9a8f7a]">sessions remaining</p>
                </div>

                {#if prediction.confidenceInterval}
                    <div class="flex items-center gap-2 mb-2">
                        <div class="flex-1 h-1 bg-[#221c18] rounded-full relative">
                            <div 
                                class="absolute h-full bg-[#f5a623]/30 rounded-full"
                                style="left: 0%; width: 100%"
                            ></div>
                            <div 
                                class="absolute h-full bg-[#f5a623] rounded-full"
                                style="left: 0%; width: 2px"
                            ></div>
                            <div 
                                class="absolute h-full bg-[#f5a623] rounded-full"
                                style="right: 0%; width: 2px"
                            ></div>
                        </div>
                    </div>
                    <p class="text-xs text-[#9a8f7a]">
                        Range: {formatConfidenceInterval(prediction.confidenceInterval)} 
                        ({Math.round(prediction.confidenceInterval.confidence * 100)}% confidence)
                    </p>
                {/if}

                <p class="text-xs text-[#6b5f4d] mt-2 italic">
                    {prediction.metadata.reason}
                </p>
            {:else}
                <p class="text-sm text-[#9a8f7a]">
                    Current trend suggests target may not be reachable. Consider adjusting your goal.
                </p>
            {/if}
        </div>
    {/if}

    <!-- Deadline Info -->
    {#if daysRemaining !== null}
        <div class="border-t border-[#221c18] pt-4 mt-4">
            <div class="flex items-center justify-between text-xs">
                <span class="text-[#6b5f4d]">Deadline</span>
                <span class="text-[#9a8f7a] font-medium">
                    {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Deadline passed'}
                </span>
            </div>
        </div>
    {/if}
</div>

<style>
    /* Add any additional styles here */
</style>

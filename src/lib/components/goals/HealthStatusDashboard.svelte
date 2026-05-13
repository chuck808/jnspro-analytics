<script lang="ts">
    import type { TrainingHealthCheck } from '$lib/services/anomalyDetection';
    import { getStatusMessage, getStatusColor } from '$lib/services/anomalyDetection';

    interface Props {
        healthCheck: TrainingHealthCheck;
        onViewDetails?: () => void;
    }

    let { healthCheck, onViewDetails }: Props = $props();

    // Get status styling - using $derived for reactivity
    const statusColor = $derived(getStatusColor(healthCheck));
    const statusMessage = $derived(getStatusMessage(healthCheck));

    // Get status icon
    function getStatusIcon(status: TrainingHealthCheck['overallStatus']): string {
        switch (status) {
            case 'healthy': return '✅';
            case 'monitor': return '👁️';
            case 'caution': return '⚠️';
            case 'critical': return '🚨';
        }
    }

    const statusIcon = $derived(getStatusIcon(healthCheck.overallStatus));

    // Get fatigue level text
    function getFatigueLevel(score: number): string {
        if (score < 20) return 'Well Rested';
        if (score < 40) return 'Minor Fatigue';
        if (score < 60) return 'Moderate Fatigue';
        if (score < 80) return 'High Fatigue';
        return 'Severe Fatigue';
    }

    // Get injury risk text
    function getRiskLevelText(level: string): string {
        return level.charAt(0).toUpperCase() + level.slice(1) + ' Risk';
    }
</script>

<div class="bg-[#131010] border rounded-xl overflow-hidden" style="border-color: {statusColor}20">
    <!-- Header -->
    <div class="px-5 py-4 border-b border-[#221c18]">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
                <span class="text-3xl">{statusIcon}</span>
                <div>
                    <h3 class="text-lg font-semibold text-[#f0ece4]">Training Health</h3>
                    <p class="text-sm text-[#9a8f7a] mt-0.5">{statusMessage}</p>
                </div>
            </div>
            {#if healthCheck.shouldRest}
                <div class="px-3 py-1.5 rounded-full bg-[#ff4444]/10 border border-[#ff4444]/30">
                    <p class="text-xs font-semibold text-[#ff4444]">REST RECOMMENDED</p>
                </div>
            {/if}
        </div>
    </div>

    <!-- Status Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#221c18]">
        <!-- Overall Status -->
        <div class="bg-[#131010] p-4">
            <div class="flex items-center justify-between mb-2">
                <p class="text-xs uppercase tracking-wide text-[#6b5f4d]">Status</p>
                <div 
                    class="w-3 h-3 rounded-full" 
                    style="background-color: {statusColor}"
                ></div>
            </div>
            <p class="text-lg font-semibold capitalize" style="color: {statusColor}">
                {healthCheck.overallStatus.replace('_', ' ')}
            </p>
        </div>

        <!-- Fatigue Score -->
        {#if healthCheck.fatigueAssessment}
            <div class="bg-[#131010] p-4">
                <p class="text-xs uppercase tracking-wide text-[#6b5f4d] mb-2">Fatigue</p>
                <div class="flex items-baseline gap-2 mb-1">
                    <p class="text-2xl font-bold text-[#f0ece4]">
                        {healthCheck.fatigueAssessment.fatigueScore}
                    </p>
                    <p class="text-sm text-[#9a8f7a]">/100</p>
                </div>
                <p class="text-xs text-[#9a8f7a]">
                    {getFatigueLevel(healthCheck.fatigueAssessment.fatigueScore)}
                </p>
            </div>
        {/if}

        <!-- Injury Risk -->
        {#if healthCheck.injuryRiskAssessment}
            <div class="bg-[#131010] p-4">
                <p class="text-xs uppercase tracking-wide text-[#6b5f4d] mb-2">Injury Risk</p>
                <p class="text-lg font-semibold capitalize" 
                   style="color: {healthCheck.injuryRiskAssessment.riskLevel === 'low' ? '#3de8c8' : 
                                  healthCheck.injuryRiskAssessment.riskLevel === 'moderate' ? '#f5a623' :
                                  healthCheck.injuryRiskAssessment.riskLevel === 'high' ? '#ff6b3d' : '#ff4444'}">
                    {getRiskLevelText(healthCheck.injuryRiskAssessment.riskLevel)}
                </p>
                <p class="text-xs text-[#9a8f7a] mt-1">
                    {healthCheck.injuryRiskAssessment.factors.length} factor{healthCheck.injuryRiskAssessment.factors.length !== 1 ? 's' : ''}
                </p>
            </div>
        {/if}
    </div>

    <!-- Alerts Summary -->
    {#if healthCheck.alerts.total > 0}
        <div class="px-5 py-4 border-t border-[#221c18]">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    {#if healthCheck.alerts.critical > 0}
                        <div class="flex items-center gap-1.5">
                            <div class="w-2 h-2 rounded-full bg-[#ff4444]"></div>
                            <span class="text-sm text-[#ff4444] font-medium">
                                {healthCheck.alerts.critical} Critical
                            </span>
                        </div>
                    {/if}
                    {#if healthCheck.alerts.warning > 0}
                        <div class="flex items-center gap-1.5">
                            <div class="w-2 h-2 rounded-full bg-[#f5a623]"></div>
                            <span class="text-sm text-[#f5a623] font-medium">
                                {healthCheck.alerts.warning} Warning{healthCheck.alerts.warning !== 1 ? 's' : ''}
                            </span>
                        </div>
                    {/if}
                    {#if healthCheck.alerts.info > 0}
                        <div class="flex items-center gap-1.5">
                            <div class="w-2 h-2 rounded-full bg-[#3de8c8]"></div>
                            <span class="text-sm text-[#3de8c8] font-medium">
                                {healthCheck.alerts.info} Info
                            </span>
                        </div>
                    {/if}
                </div>
                
                {#if onViewDetails}
                    <button
                        onclick={onViewDetails}
                        class="text-sm text-[#f5a623] hover:text-[#f0ece4] font-medium transition-colors
                               focus:outline-none focus:ring-2 focus:ring-[#f5a623] rounded px-2 py-1"
                    >
                        View Details →
                    </button>
                {/if}
            </div>
        </div>
    {/if}

    <!-- Recommendations (if should rest) -->
    {#if healthCheck.shouldRest}
        <div class="px-5 py-4 bg-[#ff4444]/5 border-t border-[#ff4444]/20">
            <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-[#ff4444] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <div class="flex-1">
                    <p class="text-sm font-semibold text-[#ff4444] mb-1">
                        Rest Required
                    </p>
                    <p class="text-xs text-[#9a8f7a]">
                        {#if healthCheck.injuryRiskAssessment?.immediateAction}
                            {healthCheck.injuryRiskAssessment.immediateAction}
                        {:else if healthCheck.fatigueAssessment}
                            Take {healthCheck.fatigueAssessment.daysUntilNextSession} day{healthCheck.fatigueAssessment.daysUntilNextSession !== 1 ? 's' : ''} of rest before your next session.
                        {:else}
                            Rest is recommended to prevent injury and maintain long-term progress.
                        {/if}
                    </p>
                </div>
            </div>
        </div>
    {/if}
</div>

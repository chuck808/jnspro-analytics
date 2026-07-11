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
			case 'healthy':
				return '✅';
			case 'monitor':
				return '👁️';
			case 'caution':
				return '⚠️';
			case 'critical':
				return '🚨';
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

<div class="overflow-hidden rounded-xl border bg-[#131010]" style="border-color: {statusColor}20">
	<!-- Header -->
	<div class="border-b border-[#221c18] px-5 py-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<span class="text-3xl">{statusIcon}</span>
				<div>
					<h3 class="text-lg font-semibold text-[#f0ece4]">Training Health</h3>
					<p class="mt-0.5 text-sm text-[#9a8f7a]">{statusMessage}</p>
				</div>
			</div>
			{#if healthCheck.shouldRest}
				<div class="rounded-full border border-[#ff4444]/30 bg-[#ff4444]/10 px-3 py-1.5">
					<p class="text-xs font-semibold text-[#ff4444]">REST RECOMMENDED</p>
				</div>
			{/if}
		</div>
	</div>

	<!-- Status Grid -->
	<div class="grid grid-cols-1 gap-px bg-[#221c18] md:grid-cols-3">
		<!-- Overall Status -->
		<div class="bg-[#131010] p-4">
			<div class="mb-2 flex items-center justify-between">
				<p class="text-xs tracking-wide text-[#6b5f4d] uppercase">Status</p>
				<div class="h-3 w-3 rounded-full" style="background-color: {statusColor}"></div>
			</div>
			<p class="text-lg font-semibold capitalize" style="color: {statusColor}">
				{healthCheck.overallStatus.replace('_', ' ')}
			</p>
		</div>

		<!-- Fatigue Score -->
		{#if healthCheck.fatigueAssessment}
			<div class="bg-[#131010] p-4">
				<p class="mb-2 text-xs tracking-wide text-[#6b5f4d] uppercase">Fatigue</p>
				<div class="mb-1 flex items-baseline gap-2">
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
				<p class="mb-2 text-xs tracking-wide text-[#6b5f4d] uppercase">Injury Risk</p>
				<p
					class="text-lg font-semibold capitalize"
					style="color: {healthCheck.injuryRiskAssessment.riskLevel === 'low'
						? '#3de8c8'
						: healthCheck.injuryRiskAssessment.riskLevel === 'moderate'
							? '#f5a623'
							: healthCheck.injuryRiskAssessment.riskLevel === 'high'
								? '#ff6b3d'
								: '#ff4444'}"
				>
					{getRiskLevelText(healthCheck.injuryRiskAssessment.riskLevel)}
				</p>
				<p class="mt-1 text-xs text-[#9a8f7a]">
					{healthCheck.injuryRiskAssessment.factors.length} factor{healthCheck.injuryRiskAssessment
						.factors.length !== 1
						? 's'
						: ''}
				</p>
			</div>
		{/if}
	</div>

	<!-- Alerts Summary -->
	{#if healthCheck.alerts.total > 0}
		<div class="border-t border-[#221c18] px-5 py-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-4">
					{#if healthCheck.alerts.critical > 0}
						<div class="flex items-center gap-1.5">
							<div class="h-2 w-2 rounded-full bg-[#ff4444]"></div>
							<span class="text-sm font-medium text-[#ff4444]">
								{healthCheck.alerts.critical} Critical
							</span>
						</div>
					{/if}
					{#if healthCheck.alerts.warning > 0}
						<div class="flex items-center gap-1.5">
							<div class="h-2 w-2 rounded-full bg-[#f5a623]"></div>
							<span class="text-sm font-medium text-[#f5a623]">
								{healthCheck.alerts.warning} Warning{healthCheck.alerts.warning !== 1 ? 's' : ''}
							</span>
						</div>
					{/if}
					{#if healthCheck.alerts.info > 0}
						<div class="flex items-center gap-1.5">
							<div class="h-2 w-2 rounded-full bg-[#3de8c8]"></div>
							<span class="text-sm font-medium text-[#3de8c8]">
								{healthCheck.alerts.info} Info
							</span>
						</div>
					{/if}
				</div>

				{#if onViewDetails}
					<button
						onclick={onViewDetails}
						class="rounded px-2 py-1 text-sm font-medium
                               text-[#f5a623] transition-colors hover:text-[#f0ece4] focus:ring-2 focus:ring-[#f5a623] focus:outline-none"
					>
						View Details →
					</button>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Recommendations (if should rest) -->
	{#if healthCheck.shouldRest}
		<div class="border-t border-[#ff4444]/20 bg-[#ff4444]/5 px-5 py-4">
			<div class="flex items-start gap-3">
				<svg
					class="mt-0.5 h-5 w-5 flex-shrink-0 text-[#ff4444]"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
				<div class="flex-1">
					<p class="mb-1 text-sm font-semibold text-[#ff4444]">Rest Required</p>
					<p class="text-xs text-[#9a8f7a]">
						{#if healthCheck.injuryRiskAssessment?.immediateAction}
							{healthCheck.injuryRiskAssessment.immediateAction}
						{:else if healthCheck.fatigueAssessment}
							Take {healthCheck.fatigueAssessment.daysUntilNextSession} day{healthCheck
								.fatigueAssessment.daysUntilNextSession !== 1
								? 's'
								: ''} of rest before your next session.
						{:else}
							Rest is recommended to prevent injury and maintain long-term progress.
						{/if}
					</p>
				</div>
			</div>
		</div>
	{/if}
</div>

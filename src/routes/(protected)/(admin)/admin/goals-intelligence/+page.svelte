<script lang="ts">
	import type { PageData } from './$types';
	import { exportToJSON, exportToCSV, generateHealthReport } from '$lib/utils/exportHelpers';

	let { data }: { data: PageData } = $props();

	function formatDate(dateString: string | null) {
		if (!dateString) return '—';
		return new Date(dateString).toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}


	function formatMetric(metric: string) {
		const labels: Record<string, string> = {
			reactionTime: 'Reaction Time',
			peakSpeed: 'Peak Speed',
			maxG: 'Max G-Force',
			elapsedTime: 'Elapsed Time',
			accelerationPhase: 'Acceleration'
		};
		return labels[metric] || metric;
	}

	function handleExportHealthReport() {
		const report = generateHealthReport({
			usersAtRisk: data.usersAtRisk,
			healthWarnings: data.healthWarnings,
			stats: data.stats
		});
		exportToJSON(report, 'health-report');
	}

	function handleExportGoalsCSV() {
		const goalsData = data.goals.map((goal: any) => ({
			user_email: goal.profiles?.email || 'Unknown',
			user_name: goal.profiles?.name || 'Unknown',
			metric: goal.metric,
			current_value: goal.current_value,
			target_value: goal.target_value,
			start_value: goal.start_value,
			completed: goal.completed,
			deadline: goal.deadline,
			created_at: formatDate(goal.created_at)
		}));
		exportToCSV(goalsData, 'goals-data');
	}
</script>

<svelte:head>
	<title>Goals Intelligence — Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-start justify-between gap-4">
		<div>
			<h2 class="text-lg font-bold text-[#f0ece4]">Goals & Training Intelligence</h2>
			<p class="mt-0.5 text-sm text-[#9a8f7a]">
				Monitor AI-powered goal tracking, health alerts, and prediction models
			</p>
		</div>
		<div class="flex flex-shrink-0 items-center gap-2">
			<button
				onclick={handleExportHealthReport}
				class="flex items-center gap-2 rounded-lg border border-[#f5a623]/30
				       bg-[#f5a623]/10 px-3 py-2 text-sm
				       text-[#f5a623] transition-colors hover:bg-[#f5a623]/20"
				title="Export health report as JSON"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					/>
				</svg>
				Health Report
			</button>
			<button
				onclick={handleExportGoalsCSV}
				class="flex items-center gap-2 rounded-lg border border-[#3de8c8]/30
				       bg-[#3de8c8]/10 px-3 py-2 text-sm
				       text-[#3de8c8] transition-colors hover:bg-[#3de8c8]/20"
				title="Export all goals as CSV"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					/>
				</svg>
				Export CSV
			</button>
		</div>
	</div>

	<!-- Key Stats -->
	<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
		{#each [{ label: 'Total Goals', value: data.stats.totalGoals, sub: `${data.stats.usersWithGoals} users`, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: '#f5a623' }, { label: 'Active Goals', value: data.stats.activeGoals, sub: `${data.stats.completionRate}% completion rate`, icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: '#3de8c8' }, { label: 'Health Warnings', value: data.healthWarnings.warning + data.healthWarnings.critical, sub: `${data.healthWarnings.critical} critical`, icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', color: data.healthWarnings.critical > 0 ? '#ff4444' : '#ff6b3d' }, { label: 'Avg Completion', value: data.stats.avgDaysToComplete > 0 ? `${data.stats.avgDaysToComplete}d` : '—', sub: 'days to complete', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: '#9a8f7a' }] as stat}
			<div class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
				<div class="mb-2 flex items-start justify-between">
					<p class="text-xs tracking-wider text-[#9a8f7a] uppercase">{stat.label}</p>
					<svg
						class="h-5 w-5 flex-shrink-0"
						style="color: {stat.color}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={stat.icon} />
					</svg>
				</div>
				<p class="text-3xl font-bold" style="color: {stat.color}">{stat.value}</p>
				<p class="mt-1 text-xs text-[#4a4038]">{stat.sub}</p>
			</div>
		{/each}
	</div>

	<!-- Prediction Model Stats -->
	<div class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
		<h3 class="mb-4 text-sm font-semibold text-[#f0ece4]">📊 Prediction Model Usage (Phase 5)</h3>
		{#if data.modelStats}
			{@const ms = data.modelStats as any}
			<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
				{#each [{ model: 'Linear', count: ms.linear, color: '#3de8c8', desc: 'Steady progress' }, { model: 'Polynomial', count: ms.polynomial, color: '#f5a623', desc: 'Non-linear patterns' }, { model: 'Exponential', count: ms.exponential, color: '#ff6b3d', desc: 'Breakthrough/plateau' }] as model}
					<div class="rounded-lg bg-[#0a0809] p-4">
						<div class="mb-2 flex items-center justify-between">
							<span class="text-sm font-medium text-[#f0ece4]">{model.model}</span>
							<span class="text-2xl font-bold" style="color: {model.color}">{model.count}</span>
						</div>
						<div class="mb-2 h-2 w-full rounded-full bg-[#221c18]">
							<div
								class="h-2 rounded-full transition-all"
								style="width: {(model.count / data.stats.activeGoals) *
									100}%; background-color: {model.color}"
							></div>
						</div>
						<p class="text-xs text-[#4a4038]">{model.desc}</p>
					</div>
				{/each}
			</div>
		{:else}
			<p class="text-sm text-[#4a4038]">
				Model usage tracking not yet implemented — data will appear here in a future update.
			</p>
		{/if}
	</div>

	<!-- Users At Risk & Recent Activity -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<!-- Users At Risk -->
		<div class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-sm font-semibold text-[#f0ece4]">⚠️ Users At Risk</h3>
				<span class="rounded bg-red-900/20 px-2 py-0.5 text-xs text-red-400">
					{data.usersAtRisk.length}
				</span>
			</div>

			{#if data.usersAtRisk.length === 0}
				<div class="py-8 text-center">
					<p class="text-sm text-[#3de8c8]">✓ All users training safely</p>
					<p class="mt-1 text-xs text-[#4a4038]">No health warnings detected</p>
				</div>
			{:else}
				<div class="space-y-2">
					{#each data.usersAtRisk as user}
						<div class="rounded-lg border border-red-900/20 bg-[#0a0809] p-3">
							<div class="mb-2 flex items-start justify-between">
								<div class="flex-1">
									<p class="text-sm font-medium text-[#f0ece4]">
										{user.user_name || user.user_email}
									</p>
									<p class="text-xs text-[#4a4038]">{user.user_email}</p>
								</div>
								<span class="ml-2 rounded bg-red-900/20 px-2 py-0.5 text-xs text-red-400">
									{user.risk_type}
								</span>
							</div>
							<div class="flex items-center gap-4 text-xs text-[#9a8f7a]">
								<span>{user.sessions_count} sessions (7d)</span>
								<span>•</span>
								<span>Goal: {formatMetric(user.goal_metric)}</span>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Recent Goal Activity -->
		<div class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
			<h3 class="mb-4 text-sm font-semibold text-[#f0ece4]">🎯 Recent Goal Activity</h3>
			{#if data.recentGoalActivity.length === 0}
				<p class="py-8 text-center text-sm text-[#4a4038]">No recent activity</p>
			{:else}
				<div class="max-h-[400px] space-y-2 overflow-y-auto">
					{#each data.recentGoalActivity as activity}
						<div class="rounded-lg bg-[#0a0809] p-3 transition-colors hover:bg-[#171210]">
							<div class="mb-1 flex items-center justify-between">
								<p class="text-sm font-medium text-[#f0ece4]">
									{activity.user_name || activity.user_email}
								</p>
								<span
									class="text-sm font-bold"
									style="color: {activity.progress >= 75
										? '#3de8c8'
										: activity.progress >= 50
											? '#f5a623'
											: '#9a8f7a'}"
								>
									{activity.progress}%
								</span>
							</div>
							<div class="mb-2 flex items-center gap-2 text-xs text-[#9a8f7a]">
								<span>{formatMetric(activity.metric)}</span>
								<span>•</span>
								<span>{activity.recent_sessions} sessions (30d)</span>
								{#if activity.deadline}
									<span>•</span>
									<span>Due {formatDate(activity.deadline)}</span>
								{/if}
							</div>
							<div class="h-1.5 w-full rounded-full bg-[#221c18]">
								<div
									class="h-1.5 rounded-full transition-all"
									style="width: {activity.progress}%; background-color: {activity.progress >= 75
										? '#3de8c8'
										: activity.progress >= 50
											? '#f5a623'
											: '#9a8f7a'}"
								></div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Information Panel -->
	<div class="rounded-xl border border-[#f5a623]/20 bg-[#131010] p-6">
		<div class="flex items-start gap-3">
			<svg
				class="mt-0.5 h-6 w-6 flex-shrink-0 text-[#f5a623]"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			<div class="flex-1">
				<h3 class="mb-2 text-sm font-semibold text-[#f0ece4]">Phase 5: AI Intelligence Layer</h3>
				<p class="mb-3 text-sm text-[#9a8f7a]">
					This dashboard monitors the advanced goals system with prediction models, anomaly
					detection, and adaptive suggestions.
				</p>
				<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
					<div class="rounded-lg bg-[#0a0809] p-3">
						<p class="mb-1 text-sm font-medium text-[#f0ece4]">✓ Advanced Predictions</p>
						<p class="text-xs text-[#9a8f7a]">
							Polynomial, exponential models with confidence intervals
						</p>
					</div>
					<div class="rounded-lg bg-[#0a0809] p-3">
						<p class="mb-1 text-sm font-medium text-[#f0ece4]">✓ Health Monitoring</p>
						<p class="text-xs text-[#9a8f7a]">Fatigue analysis and injury risk assessment</p>
					</div>
					<div class="rounded-lg bg-[#0a0809] p-3">
						<p class="mb-1 text-sm font-medium text-[#f0ece4]">✓ Adaptive Goals</p>
						<p class="text-xs text-[#9a8f7a]">Auto-suggestions based on progress patterns</p>
					</div>
					<div class="rounded-lg bg-[#0a0809] p-3">
						<p class="mb-1 text-sm font-medium text-[#f0ece4]">✓ Benchmarking</p>
						<p class="text-xs text-[#9a8f7a]">Peer comparison and leaderboards (when ready)</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

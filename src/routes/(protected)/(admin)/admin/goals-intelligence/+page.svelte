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

	function timeAgo(dateString: string) {
		const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
		if (seconds < 60) return `${seconds}s ago`;
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
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
			user_email: (goal.profiles as any)?.email || 'Unknown',
			user_name: (goal.profiles as any)?.name || 'Unknown',
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
			<p class="text-sm text-[#9a8f7a] mt-0.5">
				Monitor AI-powered goal tracking, health alerts, and prediction models
			</p>
		</div>
		<div class="flex items-center gap-2 flex-shrink-0">
			<button
				onclick={handleExportHealthReport}
				class="px-3 py-2 text-sm bg-[#f5a623]/10 border border-[#f5a623]/30 
				       text-[#f5a623] rounded-lg hover:bg-[#f5a623]/20 transition-colors
				       flex items-center gap-2"
				title="Export health report as JSON"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
					      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
				</svg>
				Health Report
			</button>
			<button
				onclick={handleExportGoalsCSV}
				class="px-3 py-2 text-sm bg-[#3de8c8]/10 border border-[#3de8c8]/30 
				       text-[#3de8c8] rounded-lg hover:bg-[#3de8c8]/20 transition-colors
				       flex items-center gap-2"
				title="Export all goals as CSV"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
					      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
				</svg>
				Export CSV
			</button>
		</div>
	</div>

	<!-- Key Stats -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
		{#each [
			{
				label: 'Total Goals',
				value: data.stats.totalGoals,
				sub: `${data.stats.usersWithGoals} users`,
				icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
				color: '#f5a623'
			},
			{
				label: 'Active Goals',
				value: data.stats.activeGoals,
				sub: `${data.stats.completionRate}% completion rate`,
				icon: 'M13 10V3L4 14h7v7l9-11h-7z',
				color: '#3de8c8'
			},
			{
				label: 'Health Warnings',
				value: data.healthWarnings.warning + data.healthWarnings.critical,
				sub: `${data.healthWarnings.critical} critical`,
				icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
				color: data.healthWarnings.critical > 0 ? '#ff4444' : '#ff6b3d'
			},
			{
				label: 'Avg Completion',
				value: data.stats.avgDaysToComplete > 0 ? `${data.stats.avgDaysToComplete}d` : '—',
				sub: 'days to complete',
				icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
				color: '#9a8f7a'
			}
		] as stat}
			<div class="bg-[#131010] border border-[#221c18] rounded-xl p-5">
				<div class="flex items-start justify-between mb-2">
					<p class="text-xs text-[#9a8f7a] uppercase tracking-wider">{stat.label}</p>
					<svg
						class="w-5 h-5 flex-shrink-0"
						style="color: {stat.color}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={stat.icon} />
					</svg>
				</div>
				<p class="text-3xl font-bold" style="color: {stat.color}">{stat.value}</p>
				<p class="text-xs text-[#4a4038] mt-1">{stat.sub}</p>
			</div>
		{/each}
	</div>

	<!-- Prediction Model Stats -->
	<div class="bg-[#131010] border border-[#221c18] rounded-xl p-5">
		<h3 class="text-sm font-semibold text-[#f0ece4] mb-4">
			📊 Prediction Model Usage (Phase 5)
		</h3>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			{#each [
				{ model: 'Linear', count: data.modelStats.linear, color: '#3de8c8', desc: 'Steady progress' },
				{
					model: 'Polynomial',
					count: data.modelStats.polynomial,
					color: '#f5a623',
					desc: 'Non-linear patterns'
				},
				{
					model: 'Exponential',
					count: data.modelStats.exponential,
					color: '#ff6b3d',
					desc: 'Breakthrough/plateau'
				}
			] as model}
				<div class="bg-[#0a0809] rounded-lg p-4">
					<div class="flex items-center justify-between mb-2">
						<span class="text-sm font-medium text-[#f0ece4]">{model.model}</span>
						<span class="text-2xl font-bold" style="color: {model.color}">{model.count}</span>
					</div>
					<div class="w-full bg-[#221c18] rounded-full h-2 mb-2">
						<div
							class="h-2 rounded-full transition-all"
							style="width: {(model.count / data.stats.activeGoals) * 100}%; background-color: {model.color}"
						></div>
					</div>
					<p class="text-xs text-[#4a4038]">{model.desc}</p>
				</div>
			{/each}
		</div>
	</div>

	<!-- Users At Risk & Recent Activity -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Users At Risk -->
		<div class="bg-[#131010] border border-[#221c18] rounded-xl p-5">
			<div class="flex items-center justify-between mb-4">
				<h3 class="text-sm font-semibold text-[#f0ece4]">⚠️ Users At Risk</h3>
				<span class="text-xs px-2 py-0.5 rounded bg-red-900/20 text-red-400">
					{data.usersAtRisk.length}
				</span>
			</div>

			{#if data.usersAtRisk.length === 0}
				<div class="text-center py-8">
					<p class="text-sm text-[#3de8c8]">✓ All users training safely</p>
					<p class="text-xs text-[#4a4038] mt-1">No health warnings detected</p>
				</div>
			{:else}
				<div class="space-y-2">
					{#each data.usersAtRisk as user}
						<div class="p-3 bg-[#0a0809] border border-red-900/20 rounded-lg">
							<div class="flex items-start justify-between mb-2">
								<div class="flex-1">
									<p class="text-sm font-medium text-[#f0ece4]">
										{user.user_name || user.user_email}
									</p>
									<p class="text-xs text-[#4a4038]">{user.user_email}</p>
								</div>
								<span class="text-xs px-2 py-0.5 rounded bg-red-900/20 text-red-400 ml-2">
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
		<div class="bg-[#131010] border border-[#221c18] rounded-xl p-5">
			<h3 class="text-sm font-semibold text-[#f0ece4] mb-4">🎯 Recent Goal Activity</h3>
			{#if data.recentGoalActivity.length === 0}
				<p class="text-sm text-[#4a4038] text-center py-8">No recent activity</p>
			{:else}
				<div class="space-y-2 max-h-[400px] overflow-y-auto">
					{#each data.recentGoalActivity as activity}
						<div class="p-3 bg-[#0a0809] rounded-lg hover:bg-[#171210] transition-colors">
							<div class="flex items-center justify-between mb-1">
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
							<div class="flex items-center gap-2 text-xs text-[#9a8f7a] mb-2">
								<span>{formatMetric(activity.metric)}</span>
								<span>•</span>
								<span>{activity.recent_sessions} sessions (30d)</span>
								{#if activity.deadline}
									<span>•</span>
									<span>Due {formatDate(activity.deadline)}</span>
								{/if}
							</div>
							<div class="w-full bg-[#221c18] rounded-full h-1.5">
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
	<div class="bg-[#131010] border border-[#f5a623]/20 rounded-xl p-6">
		<div class="flex items-start gap-3">
			<svg
				class="w-6 h-6 text-[#f5a623] flex-shrink-0 mt-0.5"
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
				<h3 class="text-sm font-semibold text-[#f0ece4] mb-2">Phase 5: AI Intelligence Layer</h3>
				<p class="text-sm text-[#9a8f7a] mb-3">
					This dashboard monitors the advanced goals system with prediction models, anomaly
					detection, and adaptive suggestions.
				</p>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
					<div class="p-3 bg-[#0a0809] rounded-lg">
						<p class="text-sm font-medium text-[#f0ece4] mb-1">✓ Advanced Predictions</p>
						<p class="text-xs text-[#9a8f7a]">
							Polynomial, exponential models with confidence intervals
						</p>
					</div>
					<div class="p-3 bg-[#0a0809] rounded-lg">
						<p class="text-sm font-medium text-[#f0ece4] mb-1">✓ Health Monitoring</p>
						<p class="text-xs text-[#9a8f7a]">Fatigue analysis and injury risk assessment</p>
					</div>
					<div class="p-3 bg-[#0a0809] rounded-lg">
						<p class="text-sm font-medium text-[#f0ece4] mb-1">✓ Adaptive Goals</p>
						<p class="text-xs text-[#9a8f7a]">Auto-suggestions based on progress patterns</p>
					</div>
					<div class="p-3 bg-[#0a0809] rounded-lg">
						<p class="text-sm font-medium text-[#f0ece4] mb-1">✓ Benchmarking</p>
						<p class="text-xs text-[#9a8f7a]">Peer comparison and leaderboards (when ready)</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

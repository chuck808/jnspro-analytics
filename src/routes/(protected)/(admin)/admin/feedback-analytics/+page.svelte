<script lang="ts">
	import type { PageData } from './$types';
	import { analyseFeedback } from '$lib/performance-feedback-analytics';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	// Transform insights to format expected by analyseFeedback
	const feedbackRecords = $derived(
		data.insights.map((i) => ({
			insightType: i.insightType,
			content: i.content,
			response: i.response,
			detailLevel: i.detailLevel || 'rider',
			createdAt: i.createdAt
		}))
	);

	const report = $derived(feedbackRecords.length > 0 ? analyseFeedback(feedbackRecords) : null);

	// Calculate advanced metrics
	const overallScore = $derived(report?.overall.usefulnessScore || 0);
	const confusionRate = $derived(
		report && report.overall.total > 0 ? (report.overall.confusing / report.overall.total) * 100 : 0
	);

	const healthStatus = $derived.by(() => {
		if (overallScore >= 75)
			return { label: 'Healthy', color: 'var(--color-jns-mint, #3de8c8)', icon: '✓' };
		if (overallScore >= 60)
			return { label: 'Needs Attention', color: 'var(--color-jns-amber, #f5a623)', icon: '⚠' };
		return { label: 'Critical', color: '#ff4444', icon: '✕' };
	});

	// Problem insights
	const problemInsights = $derived(
		report?.byInsightType
			.filter((item) => item.usefulnessScore < 60 || (item.confusing / item.total) * 100 > 30)
			.sort((a, b) => a.usefulnessScore - b.usefulnessScore) || []
	);

	// Top performers
	const topInsights = $derived(
		report?.byInsightType
			.filter((item) => item.total >= 3)
			.sort((a, b) => b.usefulnessScore - a.usefulnessScore)
			.slice(0, 5) || []
	);

	// Most confusing insights (actual content)
	const mostConfusing = $derived(
		data.insights
			.filter((i) => i.response === 'confusing')
			.reduce(
				(acc, i) => {
					const existing = acc.find((item) => item.content === i.content);
					if (existing) {
						existing.count++;
						if (i.comment) existing.comments.push(i.comment);
					} else {
						acc.push({
							content: i.content,
							insightType: i.insightType,
							count: 1,
							comments: i.comment ? [i.comment] : []
						});
					}
					return acc;
				},
				[] as Array<{ content: string; insightType: string; count: number; comments: string[] }>
			)
			.sort((a, b) => b.count - a.count)
			.slice(0, 10)
	);

	// Recent activity timeline
	const recentActivity = $derived(
		data.insights.slice(0, 20).map((i) => ({
			...i,
			user: data.userMap[i.riderId || '']
		}))
	);

	// Time range filter
	function changeTimeRange(days: number) {
		goto(`/admin/feedback-analytics?days=${days}`);
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatTimeAgo(dateString: string) {
		const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
		if (seconds < 60) return `${seconds}s ago`;
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	}

	const responseColors: Record<string, string> = {
		useful: 'var(--color-jns-mint, #3de8c8)',
		confusing: 'var(--color-jns-amber, #f5a623)',
		'not-useful': '#ff4444',
		ignored: '#808080'
	};

	const responseLabels: Record<string, string> = {
		useful: '👍 Helpful',
		confusing: '🤔 Confusing',
		'not-useful': '👎 Not helpful',
		ignored: '⊘ Ignored'
	};
</script>

<svelte:head>
	<title>Feedback Analytics — Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-wrap items-start justify-between gap-6">
		<div>
			<h2 class="text-lg font-bold text-[#f0ece4]">Insight Feedback Analytics</h2>
			<p class="mt-0.5 text-sm text-[#9a8f7a]">
				Track performance insight quality and user engagement
			</p>
		</div>

		<!-- Time Range Filter -->
		<div class="time-filter">
			<span class="filter-label">Time Range</span>
			<div class="filter-buttons">
				<button
					class="filter-btn"
					class:active={data.timeRange === 7}
					onclick={() => changeTimeRange(7)}
				>
					7 Days
				</button>
				<button
					class="filter-btn"
					class:active={data.timeRange === 30}
					onclick={() => changeTimeRange(30)}
				>
					30 Days
				</button>
				<button
					class="filter-btn"
					class:active={data.timeRange === 90}
					onclick={() => changeTimeRange(90)}
				>
					90 Days
				</button>
				<button
					class="filter-btn"
					class:active={data.timeRange === 365}
					onclick={() => changeTimeRange(365)}
				>
					1 Year
				</button>
			</div>
		</div>
	</div>

	{#if !report || report.overall.total === 0}
		<!-- No Data State -->
		<div class="empty-state">
			<div class="empty-icon">📊</div>
			<h2 class="empty-title">No Feedback Data Yet</h2>
			<p class="empty-text">
				Feedback will appear here once users start rating performance insights.
			</p>
			<p class="empty-hint">
				Make sure the <code>insight_feedback</code> table exists and users are seeing the feedback UI.
			</p>
		</div>
	{:else}
		<!-- Overview Cards -->
		<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
			<!-- Health Status Card -->
			<div class="overview-card status-card" style="--status-color: {healthStatus.color}">
				<div class="card-icon">{healthStatus.icon}</div>
				<div class="card-content">
					<div class="card-label">Overall Health</div>
					<div class="card-value" style="color: {healthStatus.color}">{healthStatus.label}</div>
					<div class="card-meta">{overallScore.toFixed(1)}% usefulness</div>
				</div>
			</div>

			<!-- Total Responses -->
			<div class="overview-card">
				<div class="card-icon">📝</div>
				<div class="card-content">
					<div class="card-label">Total Responses</div>
					<div class="card-value">{data.stats.total}</div>
					<div class="card-meta">{data.stats.recent} in last 7 days</div>
				</div>
			</div>

			<!-- Unique Users -->
			<div class="overview-card">
				<div class="card-icon">👥</div>
				<div class="card-content">
					<div class="card-label">Active Users</div>
					<div class="card-value">{data.stats.uniqueUsers}</div>
					<div class="card-meta">Providing feedback</div>
				</div>
			</div>

			<!-- Confusion Rate -->
			<div class="overview-card" class:warning={confusionRate > 20}>
				<div class="card-icon">🤔</div>
				<div class="card-content">
					<div class="card-label">Confusion Rate</div>
					<div class="card-value">{confusionRate.toFixed(1)}%</div>
					<div class="card-meta">
						{confusionRate > 20 ? 'Needs attention' : 'Within normal range'}
					</div>
				</div>
			</div>
		</div>

		<!-- Main Content Grid -->
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- Left Column -->
			<div class="space-y-6">
				<!-- Problem Insights -->
				{#if problemInsights.length > 0}
					<div class="panel">
						<div class="panel-header">
							<h2 class="panel-title">⚠️ Insights Needing Improvement</h2>
							<span class="panel-count">{problemInsights.length}</span>
						</div>
						<div class="panel-content">
							{#each problemInsights as insight}
								<div class="insight-item problem">
									<div class="insight-header">
										<span class="insight-type">{insight.insightType}</span>
										<span
											class="insight-score"
											style="color: {insight.usefulnessScore < 40
												? '#ff4444'
												: 'var(--color-jns-amber)'}"
										>
											{insight.usefulnessScore.toFixed(0)}%
										</span>
									</div>
									<div class="insight-stats">
										<span>{insight.total} responses</span>
										<span>•</span>
										<span class="stat-bad">{insight.confusing} confusing</span>
										<span>•</span>
										<span>{insight.useful} useful</span>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Top Performers -->
				{#if topInsights.length > 0}
					<div class="panel">
						<div class="panel-header">
							<h2 class="panel-title">✓ Top Performing Insights</h2>
							<span class="panel-count">{topInsights.length}</span>
						</div>
						<div class="panel-content">
							{#each topInsights as insight}
								<div class="insight-item success">
									<div class="insight-header">
										<span class="insight-type">{insight.insightType}</span>
										<span class="insight-score" style="color: var(--color-jns-mint)">
											{insight.usefulnessScore.toFixed(0)}%
										</span>
									</div>
									<div class="insight-stats">
										<span>{insight.total} responses</span>
										<span>•</span>
										<span class="stat-good">{insight.useful} useful</span>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Most Confusing Content -->
				{#if mostConfusing.length > 0}
					<div class="panel">
						<div class="panel-header">
							<h2 class="panel-title">🤔 Most Confusing Content</h2>
							<span class="panel-count">{mostConfusing.length}</span>
						</div>
						<div class="panel-content">
							{#each mostConfusing as item}
								<div class="confusing-item">
									<div class="confusing-header">
										<span class="confusing-type">{item.insightType}</span>
										<span class="confusing-count">{item.count}× confused</span>
									</div>
									<div class="confusing-content">"{item.content}"</div>
									{#if item.comments.length > 0}
										<div class="confusing-comments">
											<div class="comments-label">User comments:</div>
											{#each item.comments as comment}
												<div class="comment-item">"{comment}"</div>
											{/each}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<!-- Right Column -->
			<div class="space-y-6">
				<!-- By Insight Type -->
				<div class="panel">
					<div class="panel-header">
						<h2 class="panel-title">By Insight Type</h2>
					</div>
					<div class="panel-content">
						<div class="metrics-list">
							{#each report.byInsightType as item}
								<div class="metric-row">
									<div class="metric-info">
										<div class="metric-name">{item.insightType}</div>
										<div class="metric-stats">{item.total} responses</div>
									</div>
									<div class="metric-bars">
										<div class="bar-row">
											<span class="bar-label">Useful</span>
											<div class="bar-container">
												<div
													class="bar bar-useful"
													style="width: {(item.useful / item.total) * 100}%"
												></div>
											</div>
											<span class="bar-value">{item.useful}</span>
										</div>
										<div class="bar-row">
											<span class="bar-label">Confusing</span>
											<div class="bar-container">
												<div
													class="bar bar-confusing"
													style="width: {(item.confusing / item.total) * 100}%"
												></div>
											</div>
											<span class="bar-value">{item.confusing}</span>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>

				<!-- By Detail Level -->
				<div class="panel">
					<div class="panel-header">
						<h2 class="panel-title">By Detail Level</h2>
					</div>
					<div class="panel-content">
						<div class="level-grid">
							{#each Object.entries(report.byDetailLevel) as [level, item]}
								<div class="level-card">
									<div class="level-name">{level}</div>
									<div class="level-score">{item.usefulnessScore.toFixed(0)}%</div>
									<div class="level-stats">
										{item.total} responses
									</div>
									<div class="level-breakdown">
										<span class="level-useful">{item.useful} useful</span>
										<span class="level-confusing">{item.confusing} confusing</span>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Recent Activity - Full Width -->
		<div class="panel">
			<div class="panel-header">
				<h2 class="panel-title">Recent Activity</h2>
				<span class="panel-count">Last 20</span>
			</div>
			<div class="panel-content">
				<div class="activity-list">
					{#each recentActivity as activity}
						<div class="activity-item">
							<div
								class="activity-indicator"
								style="background: {responseColors[activity.response]}"
							></div>
							<div class="activity-content">
								<div class="activity-header">
									<span class="activity-response">{responseLabels[activity.response]}</span>
									<span class="activity-time">{formatTimeAgo(activity.timestamp)}</span>
								</div>
								<div class="activity-insight">{activity.content.substring(0, 80)}...</div>
								<div class="activity-meta">
									<span class="activity-type">{activity.insightType}</span>
									{#if activity.user}
										<span>•</span>
										<span class="activity-user">{activity.user.email}</span>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.time-filter {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.filter-label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--theme-text-subtle, rgba(255, 255, 255, 0.5));
		font-weight: 600;
	}

	.filter-buttons {
		display: flex;
		gap: 0.5rem;
		background: var(--theme-bg, rgba(255, 255, 255, 0.05));
		padding: 0.25rem;
		border-radius: 8px;
	}

	.filter-btn {
		background: transparent;
		border: none;
		color: var(--theme-text-secondary, rgba(255, 255, 255, 0.7));
		padding: 0.5rem 1rem;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.filter-btn:hover {
		background: var(--theme-surface-hover, rgba(255, 255, 255, 0.1));
		color: var(--theme-text-primary, #ffffff);
	}

	.filter-btn.active {
		background: var(--color-jns-mint, #3de8c8);
		color: #000;
		font-weight: 600;
	}

	.overview-card {
		background: var(--theme-surface, #131010);
		border: 1px solid var(--theme-border, rgba(255, 255, 255, 0.1));
		border-radius: 12px;
		padding: 1.5rem;
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.overview-card.warning {
		border-color: var(--color-jns-amber, #f5a623);
		background: rgba(245, 166, 35, 0.05);
	}

	.status-card {
		border-color: var(--status-color);
		background: color-mix(in srgb, var(--status-color) 10%, transparent);
	}

	.card-icon {
		font-size: 2rem;
		line-height: 1;
	}

	.card-content {
		flex: 1;
	}

	.card-label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--theme-text-subtle, rgba(255, 255, 255, 0.5));
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.card-value {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--theme-text-primary, #ffffff);
		margin-bottom: 0.25rem;
	}

	.card-meta {
		font-size: 0.8rem;
		color: var(--theme-text-subtle, rgba(255, 255, 255, 0.5));
	}

	/* Panel Styles */
	.panel {
		background: var(--theme-surface, #131010);
		border: 1px solid var(--theme-border, rgba(255, 255, 255, 0.1));
		border-radius: 12px;
		overflow: hidden;
	}

	.panel-header {
		padding: 1rem 1.5rem;
		border-bottom: 1px solid var(--theme-border, rgba(255, 255, 255, 0.1));
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.panel-title {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--theme-text-primary, #ffffff);
	}

	.panel-count {
		background: var(--theme-bg, rgba(255, 255, 255, 0.05));
		color: var(--theme-text-subtle, rgba(255, 255, 255, 0.5));
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.8rem;
		font-weight: 600;
	}

	.panel-content {
		padding: 1rem;
	}

	/* Insight Items */
	.insight-item {
		background: var(--theme-bg, rgba(255, 255, 255, 0.05));
		border-radius: 8px;
		padding: 0.75rem 1rem;
		margin-bottom: 0.5rem;
	}

	.insight-item:last-child {
		margin-bottom: 0;
	}

	.insight-item.problem {
		border-left: 3px solid var(--color-jns-amber, #f5a623);
	}

	.insight-item.success {
		border-left: 3px solid var(--color-jns-mint, #3de8c8);
	}

	.insight-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.insight-type {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--theme-text-primary, #ffffff);
		text-transform: capitalize;
	}

	.insight-score {
		font-size: 1rem;
		font-weight: 700;
	}

	.insight-stats {
		font-size: 0.75rem;
		color: var(--theme-text-subtle, rgba(255, 255, 255, 0.5));
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.stat-good {
		color: var(--color-jns-mint, #3de8c8);
	}

	.stat-bad {
		color: var(--color-jns-amber, #f5a623);
	}

	/* Confusing Items */
	.confusing-item {
		background: rgba(245, 166, 35, 0.05);
		border: 1px solid rgba(245, 166, 35, 0.2);
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 1rem;
	}

	.confusing-item:last-child {
		margin-bottom: 0;
	}

	.confusing-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.confusing-type {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-jns-amber, #f5a623);
		font-weight: 600;
	}

	.confusing-count {
		font-size: 0.875rem;
		color: var(--color-jns-amber, #f5a623);
		font-weight: 600;
	}

	.confusing-content {
		font-size: 0.9rem;
		color: var(--theme-text-primary, #ffffff);
		line-height: 1.5;
		margin-bottom: 0.75rem;
		font-style: italic;
	}

	.confusing-comments {
		background: var(--theme-bg, rgba(255, 255, 255, 0.05));
		border-radius: 6px;
		padding: 0.75rem;
	}

	.comments-label {
		font-size: 0.75rem;
		color: var(--theme-text-subtle, rgba(255, 255, 255, 0.5));
		margin-bottom: 0.5rem;
		font-weight: 600;
	}

	.comment-item {
		font-size: 0.85rem;
		color: var(--theme-text-secondary, rgba(255, 255, 255, 0.8));
		line-height: 1.4;
		margin-bottom: 0.5rem;
		padding-left: 0.75rem;
		border-left: 2px solid rgba(255, 255, 255, 0.1);
	}

	.comment-item:last-child {
		margin-bottom: 0;
	}

	/* Metrics List */
	.metrics-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.metric-row {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.metric-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.metric-name {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--theme-text-primary, #ffffff);
		text-transform: capitalize;
	}

	.metric-stats {
		font-size: 0.75rem;
		color: var(--theme-text-subtle, rgba(255, 255, 255, 0.5));
	}

	.metric-bars {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.bar-row {
		display: grid;
		grid-template-columns: 70px 1fr 40px;
		gap: 0.5rem;
		align-items: center;
		font-size: 0.75rem;
	}

	.bar-label {
		color: var(--theme-text-subtle, rgba(255, 255, 255, 0.5));
	}

	.bar-container {
		height: 6px;
		background: var(--theme-bg, rgba(255, 255, 255, 0.05));
		border-radius: 3px;
		overflow: hidden;
	}

	.bar {
		height: 100%;
		border-radius: 3px;
		transition: width 0.3s;
	}

	.bar-useful {
		background: var(--color-jns-mint, #3de8c8);
	}

	.bar-confusing {
		background: var(--color-jns-amber, #f5a623);
	}

	.bar-value {
		color: var(--theme-text-primary, #ffffff);
		font-weight: 600;
		text-align: right;
	}

	/* Level Grid */
	.level-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 1rem;
	}

	.level-card {
		background: var(--theme-bg, rgba(255, 255, 255, 0.05));
		border: 1px solid var(--theme-border, rgba(255, 255, 255, 0.1));
		border-radius: 8px;
		padding: 1rem;
		text-align: center;
	}

	.level-name {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--theme-text-subtle, rgba(255, 255, 255, 0.5));
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.level-score {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-jns-mint, #3de8c8);
		margin-bottom: 0.25rem;
	}

	.level-stats {
		font-size: 0.75rem;
		color: var(--theme-text-subtle, rgba(255, 255, 255, 0.5));
		margin-bottom: 0.75rem;
	}

	.level-breakdown {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.7rem;
	}

	.level-useful {
		color: var(--color-jns-mint, #3de8c8);
	}

	.level-confusing {
		color: var(--color-jns-amber, #f5a623);
	}

	/* Activity List */
	.activity-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.activity-item {
		display: flex;
		gap: 0.75rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--theme-border, rgba(255, 255, 255, 0.1));
	}

	.activity-item:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.activity-indicator {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		margin-top: 0.5rem;
		flex-shrink: 0;
	}

	.activity-content {
		flex: 1;
		min-width: 0;
	}

	.activity-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
		gap: 0.5rem;
	}

	.activity-response {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--theme-text-primary, #ffffff);
	}

	.activity-time {
		font-size: 0.75rem;
		color: var(--theme-text-subtle, rgba(255, 255, 255, 0.5));
		white-space: nowrap;
	}

	.activity-insight {
		font-size: 0.85rem;
		color: var(--theme-text-secondary, rgba(255, 255, 255, 0.8));
		margin-bottom: 0.5rem;
		line-height: 1.4;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.activity-meta {
		font-size: 0.75rem;
		color: var(--theme-text-subtle, rgba(255, 255, 255, 0.5));
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.activity-type {
		text-transform: capitalize;
	}

	.activity-user {
		color: var(--color-jns-mint, #3de8c8);
	}

	/* Empty State */
	.empty-state {
		background: var(--theme-surface, #131010);
		border: 1px solid var(--theme-border, rgba(255, 255, 255, 0.1));
		border-radius: 12px;
		padding: 4rem 2rem;
		text-align: center;
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.empty-title {
		margin: 0 0 1rem;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--theme-text-primary, #ffffff);
	}

	.empty-text {
		margin: 0 0 1rem;
		font-size: 1rem;
		color: var(--theme-text-secondary, rgba(255, 255, 255, 0.7));
	}

	.empty-hint {
		margin: 0;
		font-size: 0.875rem;
		color: var(--theme-text-subtle, rgba(255, 255, 255, 0.5));
	}

	code {
		background: var(--theme-bg, rgba(255, 255, 255, 0.1));
		padding: 0.125rem 0.375rem;
		border-radius: 4px;
		font-family: monospace;
		font-size: 0.9em;
	}
</style>

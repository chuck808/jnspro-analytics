<script lang="ts">
	import type { PageData } from './$types';
	import { FeedbackAnalyticsPanel } from '$lib/components/performance-insights';
	import { analyseFeedback } from '$lib/performance-feedback-analytics';

	let { data }: { data: PageData } = $props();

	// Transform feedback records into analytics report
	let feedbackReport = $derived(
		data.insightFeedback.length > 0 ? analyseFeedback(data.insightFeedback) : null
	);

	function formatDateTime(isoString: string) {
		return new Date(isoString).toLocaleString('en-GB', {
			day: 'numeric',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function timeAgo(isoString: string) {
		const seconds = Math.floor((new Date().getTime() - new Date(isoString).getTime()) / 1000);
		if (seconds < 60) return `${seconds}s ago`;
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	}
</script>

<svelte:head>
	<title>Analytics & Monitoring — AppGatePro Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-lg font-bold text-[#f0ece4]">Analytics & Monitoring</h2>
			<p class="mt-0.5 text-sm text-[#9a8f7a]">System performance and usage insights</p>
		</div>
		<p class="text-xs text-[#4a4038]">Last updated: {formatDateTime(data.lastUpdated)}</p>
	</div>

	<!-- Performance Metrics -->
	<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
		{#each [{ label: 'Avg Page Load', value: data.performanceMetrics.avgPageLoad != null ? `${data.performanceMetrics.avgPageLoad.toFixed(2)}s` : '—', sub: data.performanceMetrics.p95PageLoad != null ? `p95: ${data.performanceMetrics.p95PageLoad.toFixed(2)}s` : 'p95: —', icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: data.performanceMetrics.avgPageLoad != null && data.performanceMetrics.avgPageLoad < 2 ? '#3de8c8' : '#f5a623' }, { label: 'Requests (24h)', value: data.performanceMetrics.requestCount, sub: data.performanceMetrics.p50PageLoad != null ? `p50: ${data.performanceMetrics.p50PageLoad.toFixed(2)}s` : 'p50: —', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: '#f5a623' }, { label: 'Total Users', value: data.totalUsers, sub: 'registered', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', color: '#f5a623' }, { label: 'Logins (30d)', value: data.dailyLogins.length, sub: 'activity recorded', icon: 'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1', color: '#9a8f7a' }] as metric}
			<div class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
				<div class="mb-2 flex items-start justify-between">
					<p class="text-xs tracking-wider text-[#9a8f7a] uppercase">{metric.label}</p>
					<svg
						class="h-5 w-5 flex-shrink-0"
						style="color: {metric.color}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={metric.icon} />
					</svg>
				</div>
				<p class="text-3xl font-bold" style="color: {metric.color}">{metric.value}</p>
				<p class="mt-1 text-xs text-[#4a4038]">{metric.sub}</p>
			</div>
		{/each}
	</div>

	<!-- Page Views & Recent Errors -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<!-- Page Views -->
		<div class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
			<h3 class="mb-4 text-sm font-semibold text-[#f0ece4]">Page Views (Mock Data)</h3>
			<p class="mb-4 text-xs text-[#9a8f7a]">
				Note: Real analytics would require integration with Google Analytics, Plausible, or custom
				tracking
			</p>
			<div class="space-y-2">
				{#each data.pageViews as page}
					<div class="flex items-center justify-between rounded-lg bg-[#0a0809] p-3">
						<div class="flex-1">
							<p class="text-sm font-medium text-[#f0ece4]">{page.route}</p>
							<p class="text-xs text-[#4a4038]">Avg time: {page.avgTime}</p>
						</div>
						<div class="text-right">
							<p class="text-lg font-bold text-[#f5a623]">{page.views}</p>
							<p class="text-xs text-[#4a4038]">views</p>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Recent Errors -->
		<div class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
			<h3 class="mb-4 text-sm font-semibold text-[#f0ece4]">Recent Errors (Mock Data)</h3>
			<p class="mb-4 text-xs text-[#9a8f7a]">
				Note: Real error tracking would require Sentry, LogRocket, or similar service
			</p>
			<div class="space-y-2">
				{#each data.recentErrors as error}
					<div class="rounded-lg border border-red-900/20 bg-[#0a0809] p-3">
						<div class="mb-1 flex items-start justify-between">
							<p class="text-sm font-medium text-red-400">{error.message}</p>
							<span class="rounded bg-red-900/20 px-2 py-0.5 text-xs text-red-400">
								{error.count}x
							</span>
						</div>
						<p class="mb-1 text-xs text-[#4a4038]">{error.route}</p>
						<p class="text-xs text-[#6b5f4d]">Last seen: {timeAgo(error.lastSeen)}</p>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Activity Timeline -->
	<div class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
		<h3 class="mb-4 text-sm font-semibold text-[#f0ece4]">User Activity (Last 30 Days)</h3>
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
			<div>
				<p class="mb-2 text-xs text-[#9a8f7a]">New Registrations</p>
				<p class="mb-1 text-2xl font-bold text-[#3de8c8]">{data.dailyLogins.length}</p>
				<p class="text-xs text-[#4a4038]">users joined in the last 30 days</p>
			</div>
			<div>
				<p class="mb-2 text-xs text-[#9a8f7a]">Session Uploads</p>
				<p class="mb-1 text-2xl font-bold text-[#ff6b3d]">{data.dailyUploads.length}</p>
				<p class="text-xs text-[#4a4038]">sessions uploaded in the last 30 days</p>
			</div>
		</div>
	</div>

	<!-- Insight Feedback Analytics -->
	{#if feedbackReport}
		<FeedbackAnalyticsPanel report={feedbackReport} />
	{:else}
		<div class="rounded-xl border border-[#f5a623]/20 bg-[#131010] p-6">
			<div class="text-center">
				<p class="mb-2 text-sm font-semibold text-[#f0ece4]">📊 Insight Feedback Analytics</p>
				<p class="mb-3 text-xs text-[#9a8f7a]">
					Track which performance insights are useful, confusing, or need improvement
				</p>
				<p class="text-xs text-[#6b5f4d]">
					No feedback data yet. Create the <code class="rounded bg-[#0a0809] px-1 py-0.5"
						>insight_feedback</code
					> table to enable this feature.
				</p>
				<p class="mt-2 text-xs text-[#6b5f4d]">
					See <code class="rounded bg-[#0a0809] px-1 py-0.5">PERFORMANCE_ENGINE_V8.1_README.md</code
					> for database schema.
				</p>
			</div>
		</div>
	{/if}

	<!-- Integration Recommendations -->
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
				<h3 class="mb-2 text-sm font-semibold text-[#f0ece4]">Production Analytics Setup</h3>
				<p class="mb-4 text-sm text-[#9a8f7a]">
					For production-ready analytics and monitoring, integrate these services:
				</p>
				<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
					<div class="rounded-lg bg-[#0a0809] p-3">
						<p class="mb-1 text-sm font-medium text-[#f0ece4]">📊 Analytics</p>
						<p class="text-xs text-[#9a8f7a]">
							Plausible, Fathom, or Google Analytics for page views and user behavior
						</p>
					</div>
					<div class="rounded-lg bg-[#0a0809] p-3">
						<p class="mb-1 text-sm font-medium text-[#f0ece4]">🐛 Error Tracking</p>
						<p class="text-xs text-[#9a8f7a]">
							Sentry or LogRocket for real-time error monitoring and replay
						</p>
					</div>
					<div class="rounded-lg bg-[#0a0809] p-3">
						<p class="mb-1 text-sm font-medium text-[#f0ece4]">⚡ Performance</p>
						<p class="text-xs text-[#9a8f7a]">
							Lighthouse CI or WebPageTest for performance monitoring
						</p>
					</div>
					<div class="rounded-lg bg-[#0a0809] p-3">
						<p class="mb-1 text-sm font-medium text-[#f0ece4]">🔍 Uptime</p>
						<p class="text-xs text-[#9a8f7a]">UptimeRobot or Pingdom for availability monitoring</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

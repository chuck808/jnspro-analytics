<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Advanced Analytics — Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div>
		<h2 class="text-lg font-bold text-[#f0ece4]">Advanced Analytics Intelligence</h2>
		<p class="text-sm text-[#9a8f7a] mt-0.5">
			Platform-wide metrics, user segmentation, and performance benchmarks
		</p>
	</div>

	<!-- Key Stats -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
		{#each [
			{
				label: 'Total Sessions',
				value: data.stats.totalSessions,
				sub: `${data.stats.activeSessions} active`,
				icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
				color: '#f5a623'
			},
			{
				label: 'Avg Sessions/User',
				value: data.stats.avgSessionsPerUser,
				sub: 'platform average',
				icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
				color: '#3de8c8'
			},
			{
				label: 'Data Quality',
				value: `${data.stats.dataQualityScore}%`,
				sub: 'sessions with runs',
				icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
				color: data.stats.dataQualityScore >= 90 ? '#3de8c8' : '#f5a623'
			},
			{
				label: 'User Segments',
				value: 4,
				sub: 'analysis groups',
				icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
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

	<!-- User Segmentation & Performance Distribution -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- User Segmentation -->
		<div class="bg-[#131010] border border-[#221c18] rounded-xl p-5">
			<h3 class="text-sm font-semibold text-[#f0ece4] mb-4">👥 User Segmentation</h3>
			<div class="space-y-3">
				{#each [
					{ label: 'New Users', count: data.userSegments.new, desc: '< 7 days', color: '#3de8c8' },
					{
						label: 'Active Users',
						count: data.userSegments.active,
						desc: '7-30 days',
						color: '#f5a623'
					},
					{
						label: 'Established',
						count: data.userSegments.established,
						desc: '30-90 days',
						color: '#ff6b3d'
					},
					{
						label: 'Veterans',
						count: data.userSegments.veteran,
						desc: '> 90 days',
						color: '#9a8f7a'
					}
				] as segment}
					<div class="p-3 bg-[#0a0809] rounded-lg">
						<div class="flex items-center justify-between mb-2">
							<div>
								<p class="text-sm font-medium text-[#f0ece4]">{segment.label}</p>
								<p class="text-xs text-[#4a4038]">{segment.desc}</p>
							</div>
							<span class="text-2xl font-bold" style="color: {segment.color}">
								{segment.count}
							</span>
						</div>
						<div class="w-full bg-[#221c18] rounded-full h-2">
							<div
								class="h-2 rounded-full transition-all"
								style="width: {((segment.count / (data.userSegments.new + data.userSegments.active + data.userSegments.established + data.userSegments.veteran)) * 100) || 0}%; background-color: {segment.color}"
							></div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Performance Distribution -->
		<div class="bg-[#131010] border border-[#221c18] rounded-xl p-5">
			<h3 class="text-sm font-semibold text-[#f0ece4] mb-4">
				📊 Performance Distribution (Reaction Time)
			</h3>
			<div class="space-y-3">
				{#each [
					{ label: 'Top 10%', value: data.performanceDistribution.p10, color: '#3de8c8' },
					{ label: 'Top 25%', value: data.performanceDistribution.p25, color: '#f5a623' },
					{ label: 'Median', value: data.performanceDistribution.p50, color: '#ff6b3d' },
					{ label: 'Bottom 25%', value: data.performanceDistribution.p75, color: '#9a8f7a' },
					{ label: 'Bottom 10%', value: data.performanceDistribution.p90, color: '#4a4038' }
				] as perc}
					<div class="flex items-center justify-between p-3 bg-[#0a0809] rounded-lg">
						<span class="text-sm text-[#9a8f7a]">{perc.label}</span>
						<span class="text-lg font-bold" style="color: {perc.color}">{perc.value}ms</span>
					</div>
				{/each}
				<div class="mt-4 p-3 bg-[#f5a623]/10 border border-[#f5a623]/20 rounded-lg">
					<p class="text-xs text-[#f5a623] mb-1">💡 Benchmarking Insight</p>
					<p class="text-xs text-[#9a8f7a]">
						Use these percentiles to set realistic goal recommendations and identify elite performers
					</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Top Contributors -->
	<div class="bg-[#131010] border border-[#221c18] rounded-xl p-5">
		<h3 class="text-sm font-semibold text-[#f0ece4] mb-4">🌟 Top Contributors (By Sessions)</h3>
		{#if data.sessionsByUser.length === 0}
			<p class="text-sm text-[#4a4038] text-center py-8">No session data yet</p>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
				{#each data.sessionsByUser as user, i}
					<div class="p-4 bg-[#0a0809] rounded-lg border border-[#221c18]">
						<div class="flex items-center justify-between mb-2">
							<span
								class="text-xs font-semibold px-2 py-0.5 rounded"
								style="background-color: {i < 3 ? '#f5a623' : '#221c18'}40; color: {i < 3 ? '#f5a623' : '#9a8f7a'}"
							>
								#{i + 1}
							</span>
							<span class="text-2xl font-bold text-[#f5a623]">{user.count}</span>
						</div>
						<p class="text-xs text-[#4a4038]">sessions uploaded</p>
					</div>
				{/each}
			</div>
		{/if}
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
				<h3 class="text-sm font-semibold text-[#f0ece4] mb-2">Advanced Analytics Features</h3>
				<p class="text-sm text-[#9a8f7a] mb-3">
					These metrics help understand platform health, user engagement patterns, and performance benchmarks.
				</p>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
					<div class="p-3 bg-[#0a0809] rounded-lg">
						<p class="text-sm font-medium text-[#f0ece4] mb-1">✓ User Segmentation</p>
						<p class="text-xs text-[#9a8f7a]">Track cohorts by account age and activity</p>
					</div>
					<div class="p-3 bg-[#0a0809] rounded-lg">
						<p class="text-sm font-medium text-[#f0ece4] mb-1">✓ Performance Benchmarks</p>
						<p class="text-xs text-[#9a8f7a]">Percentile-based performance distribution</p>
					</div>
					<div class="p-3 bg-[#0a0809] rounded-lg">
						<p class="text-sm font-medium text-[#f0ece4] mb-1">✓ Data Quality</p>
						<p class="text-xs text-[#9a8f7a]">Monitor upload completeness and validity</p>
					</div>
					<div class="p-3 bg-[#0a0809] rounded-lg">
						<p class="text-sm font-medium text-[#f0ece4] mb-1">✓ Engagement Metrics</p>
						<p class="text-xs text-[#9a8f7a]">Sessions per user and contribution patterns</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

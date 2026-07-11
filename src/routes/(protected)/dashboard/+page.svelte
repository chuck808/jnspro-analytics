<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();

	function fmtReaction(ms: number | null) {
		return ms !== null ? (ms / 1000).toFixed(3) + 's' : '—';
	}
	function fmtSpeed(ms: number | null) {
		return ms !== null ? (ms * 3.6).toFixed(1) : '—';
	}
	function fmtG(g: number | null) {
		return g !== null ? g.toFixed(2) + 'G' : '—';
	}
	function fmtConsistency(cv: number | null | undefined) {
		if (cv === null || cv === undefined) return { value: '—', label: 'No data', color: '#6b5f4d' };
		if (cv < 2) return { value: cv.toFixed(1) + '%', label: 'Outstanding', color: '#3de8c8' };
		if (cv < 5) return { value: cv.toFixed(1) + '%', label: 'Good', color: '#f5a623' };
		return { value: cv.toFixed(1) + '%', label: 'Variable', color: '#ff4444' };
	}

	let consistencyData = $derived(fmtConsistency(data.consistency));
</script>

<svelte:head>
	<title>Dashboard — AppGatePro</title>
</svelte:head>

<div class="space-y-6">
	<!-- Welcome banner -->
	<div class="themed-card">
		<h2 class="themed-text-primary mb-1 text-xl font-bold">
			Welcome back, {data.profile?.name?.split(' ')[0] ?? 'Rider'} 👋
		</h2>
		<p class="themed-text-secondary text-sm">
			{#if data.sessionCount === 0}
				Upload your first session to start tracking your BMX performance.
			{:else if data.sessionCount === 1}
				You've uploaded {data.sessionCount} session with {data.totalRuns} run{data.totalRuns !== 1
					? 's'
					: ''}.
			{:else}
				You've uploaded {data.sessionCount} sessions with {data.totalRuns} total runs.
			{/if}
		</p>
	</div>

	<!-- Quick stats -->
	<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
		{#each [{ label: 'Total Sessions', value: data.sessionCount > 0 ? String(data.sessionCount) : '—', sub: data.sessionCount > 0 ? `${data.totalRuns} total runs` : 'Upload your first session', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' }, { label: 'Best Reaction', value: data.sessionCount > 0 ? fmtReaction(data.personalBests.reaction_ms) : '—', sub: data.sessionCount > 0 ? 'all time best' : 'No data yet', icon: 'M13 10V3L4 14h7v7l9-11h-7z' }, { label: 'Peak Speed', value: data.sessionCount > 0 ? fmtSpeed(data.personalBests.peak_speed_ms) : '—', sub: data.sessionCount > 0 ? 'km/h · estimated' : 'No data yet', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' }, { label: 'Consistency', value: consistencyData.value, sub: consistencyData.label, icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }] as stat}
			<div class="themed-card themed-card-hover">
				<div class="mb-2 flex items-start justify-between">
					<p class="themed-text-secondary text-xs tracking-wider uppercase">{stat.label}</p>
					<svg
						class="themed-text-subtle h-4 w-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={stat.icon} />
					</svg>
				</div>
				<p class="themed-accent text-3xl font-bold">{stat.value}</p>
				<p class="themed-text-subtle mt-1 text-xs">{stat.sub}</p>
			</div>
		{/each}
	</div>

	<!-- Active Goals -->
	{#if data.activeGoals && data.activeGoals.length > 0}
		<div class="themed-card">
			<div class="mb-4 flex items-center justify-between">
				<h3 class="themed-text-primary text-sm font-semibold">Active Goals</h3>
				<a
					href="/goals"
					class="themed-text-secondary hover:themed-accent rounded text-xs
                          transition-colors focus:ring-2 focus:ring-[#f5a623] focus:outline-none"
				>
					View all →
				</a>
			</div>

			<div class="space-y-3">
				{#each data.activeGoals as goal}
					<div class="themed-nested-card">
						<div class="mb-2 flex items-start justify-between">
							<div class="flex-1">
								<p class="themed-text-primary mb-1 text-sm font-medium">
									{goal.metric === 'reactionTime'
										? 'Reaction Time'
										: goal.metric === 'maxG'
											? 'Max G-Force'
											: goal.metric === 'peakSpeed'
												? 'Peak Speed'
												: goal.metric === 'consistency'
													? 'Consistency'
													: goal.metric === 'elapsedTime'
														? 'Elapsed Time'
														: goal.metric === 'accelerationPhase'
															? 'Acceleration Phase'
															: goal.metric === 'endurance'
																? 'Gates per Session'
																: goal.metric}
								</p>
								<p class="themed-text-secondary text-xs">
									Target: {goal.target_value?.toFixed(2) ?? '—'}
									{#if goal.current_value !== null}
										· Current: {goal.current_value.toFixed(2)}
									{/if}
								</p>
							</div>
							<div class="ml-3 flex-shrink-0 text-right">
								{#if goal.isOverdue}
									<span class="rounded bg-red-500/10 px-2 py-0.5 text-xs text-red-400">Overdue</span
									>
								{:else if goal.daysUntilDeadline <= 7}
									<span class="themed-accent rounded bg-[#f5a623]/10 px-2 py-0.5 text-xs"
										>{goal.daysUntilDeadline}d left</span
									>
								{:else}
									<span class="themed-text-subtle text-xs">{goal.daysUntilDeadline} days</span>
								{/if}
							</div>
						</div>

						<div class="themed-progress-track h-2 w-full overflow-hidden rounded-full">
							<div
								class="h-full rounded-full transition-all duration-500"
								style="width:{goal.progress}%; background:{goal.progress >= 75
									? '#3de8c8'
									: goal.progress >= 25
										? '#f5a623'
										: '#6b5f4d'}"
							></div>
						</div>
						<p class="themed-text-subtle mt-1 text-xs">{goal.progress}% complete</p>
					</div>
				{/each}
			</div>

			<a
				href="/goals"
				class="themed-nested-surface themed-border themed-text-secondary hover:themed-accent mt-4 flex min-h-[44px] items-center
                      justify-center gap-2 rounded-lg
                      p-3 text-sm transition-all hover:border-[#f5a623]/20 hover:bg-[var(--theme-surface-hover)]
                      focus:ring-2 focus:ring-[#f5a623] focus:outline-none"
			>
				<svg
					class="h-4 w-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				Create New Goal
			</a>
		</div>
	{/if}

	{#if data.sessionCount === 0}
		<!-- First time upload CTA -->
		<div class="themed-card border-[#f5a623]/20 text-center">
			<div
				class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f5a623]/10"
			>
				<svg class="themed-accent h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
					/>
				</svg>
			</div>
			<h3 class="themed-text-primary mb-2 text-lg font-semibold">Upload your first session</h3>
			<p class="themed-text-secondary mx-auto mb-6 max-w-sm text-sm">
				Copy the JSON file from your AppGatePro SD card and upload it to start seeing your
				analytics.
			</p>
			<a
				href="/upload"
				class="themed-bg-accent inline-flex min-h-[44px] items-center gap-2 rounded-lg px-6
                      py-3 text-sm font-semibold transition-colors hover:bg-[#c97e0a]
                      focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[var(--theme-bg)] focus:outline-none"
			>
				<svg
					class="h-4 w-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
					/>
				</svg>
				Upload Session
			</a>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- Recent sessions -->
			<div class="themed-card">
				<div class="mb-4 flex items-center justify-between">
					<h3 class="themed-text-primary text-sm font-semibold">Recent Sessions</h3>
					<a
						href="/sessions"
						class="themed-text-secondary hover:themed-accent rounded text-xs
                              transition-colors focus:ring-2 focus:ring-[#f5a623] focus:outline-none"
					>
						View all →
					</a>
				</div>

				{#if data.recentSessions.length === 0}
					<p class="themed-text-subtle py-8 text-center text-sm">No sessions yet</p>
				{:else}
					<div class="space-y-2">
						{#each data.recentSessions as session}
							<a
								href="/sessions/{session.id}"
								class="themed-nested-surface group flex min-h-[44px] items-center gap-4
                                      rounded-lg p-3 transition-colors hover:bg-[var(--theme-surface-hover)]
                                      focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2
                                      focus:ring-offset-[var(--theme-surface)] focus:outline-none"
							>
								<div class="w-10 flex-shrink-0 text-center">
									<p class="themed-accent text-sm font-bold">
										{new Date(session.timestamp).getDate()}
									</p>
									<p class="themed-text-subtle text-xs">
										{new Date(session.timestamp).toLocaleDateString('en-GB', { month: 'short' })}
									</p>
								</div>
								<div class="min-w-0 flex-1">
									<div class="mb-0.5 flex items-center gap-2">
										<p class="themed-text-primary text-sm font-medium">{session.run_count} runs</p>
										{#if session.reaction_cv !== null && session.reaction_cv < 2}
											<span class="rounded bg-[#3de8c8]/10 px-1.5 py-0.5 text-xs text-[#3de8c8]"
												>Consistent</span
											>
										{/if}
									</div>
									<p class="themed-text-subtle text-xs">
										Best: {fmtReaction(session.best_reaction_ms)}
										{#if session.has_valid_speed}
											· {fmtSpeed(session.best_peak_speed_ms)}{/if}
									</p>
								</div>
								<svg
									class="themed-text-subtle group-hover:themed-accent h-4 w-4 flex-shrink-0 transition-colors"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 5l7 7-7 7"
									/>
								</svg>
							</a>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Quick actions + personal bests -->
			<div class="space-y-4">
				<div class="themed-card">
					<h3 class="themed-text-primary mb-3 text-sm font-semibold">Quick Actions</h3>
					<div class="space-y-2">
						{#each [{ href: '/upload', label: 'Upload Session', sub: 'Add more training data', amber: true, icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' }, { href: '/analytics', label: 'View Analytics', sub: 'Trends, charts & insights', amber: false, icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }, { href: '/sessions', label: 'All Sessions', sub: `Browse all ${data.sessionCount} sessions`, amber: false, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' }] as action}
							<a
								href={action.href}
								class="group flex min-h-[44px] items-center gap-3 rounded-lg p-3 transition-all
                                      focus:ring-2 focus:ring-[#f5a623] focus:outline-none
                                      {action.amber
									? 'border border-[#f5a623]/20 bg-[#f5a623]/10 hover:border-[#f5a623]/40 hover:bg-[#f5a623]/20'
									: 'themed-nested-surface themed-border hover:border-[#f5a623]/20 hover:bg-[var(--theme-surface-hover)]'}"
							>
								<div
									class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg transition-colors
                                            {action.amber
										? 'bg-[#f5a623]/20 group-hover:bg-[#f5a623]/30'
										: 'themed-progress-track'}"
								>
									<svg
										class="h-5 w-5 {action.amber ? 'themed-accent' : 'themed-text-secondary'}"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										aria-hidden="true"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d={action.icon}
										/>
									</svg>
								</div>
								<div class="flex-1">
									<p class="themed-text-primary text-sm font-medium">{action.label}</p>
									<p class="themed-text-secondary text-xs">{action.sub}</p>
								</div>
								<svg
									class="h-4 w-4 flex-shrink-0 transition-colors
                                            {action.amber
										? 'themed-accent'
										: 'themed-text-subtle group-hover:themed-accent'}"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 5l7 7-7 7"
									/>
								</svg>
							</a>
						{/each}
					</div>
				</div>

				<!-- Personal bests -->
				{#if data.personalBests.reaction_ms}
					<div class="themed-card">
						<h3 class="themed-text-primary mb-3 text-sm font-semibold">Personal Bests</h3>
						<div class="space-y-2 text-sm">
							<div class="flex items-center justify-between">
								<span class="themed-text-secondary">Reaction</span>
								<span class="themed-accent font-bold"
									>{fmtReaction(data.personalBests.reaction_ms)}</span
								>
							</div>
							{#if data.personalBests.peak_speed_ms}
								<div class="flex items-center justify-between">
									<span class="themed-text-secondary">Speed</span>
									<span class="themed-accent font-bold"
										>{fmtSpeed(data.personalBests.peak_speed_ms)} km/h</span
									>
								</div>
							{/if}
							{#if data.personalBests.max_g}
								<div class="flex items-center justify-between">
									<span class="themed-text-secondary">Max G</span>
									<span class="themed-accent font-bold">{fmtG(data.personalBests.max_g)}</span>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	/* Themed utility classes using CSS variables */
	.themed-card {
		background: var(--theme-surface);
		border: 1px solid var(--theme-border);
		border-radius: 0.75rem;
		padding: 1.25rem;
	}

	.themed-card-hover:hover {
		border-color: rgba(245, 166, 35, 0.2);
		transition: border-color 0.2s;
	}

	.themed-nested-card {
		background: var(--theme-bg);
		border: 1px solid var(--theme-border);
		border-radius: 0.5rem;
		padding: 1rem;
		transition: border-color 0.2s;
	}

	.themed-nested-card:hover {
		border-color: rgba(245, 166, 35, 0.2);
	}

	.themed-nested-surface {
		background: var(--theme-bg);
	}

	.themed-border {
		border: 1px solid var(--theme-border);
	}

	.themed-text-primary {
		color: var(--theme-text-primary);
	}

	.themed-text-secondary {
		color: var(--theme-text-secondary);
	}

	.themed-text-subtle {
		color: var(--theme-text-subtle);
	}

	.themed-progress-track {
		background: var(--theme-border);
	}
</style>

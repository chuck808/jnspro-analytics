<script lang="ts">
	import type { PageData } from './$types';
	import {
		getMetricDisplayName,
		getTimePeriodDisplayName,
		formatLeaderboardValue,
		getRankMedal,
		isTopPercentage,
		type LeaderboardMetric,
		type TimePeriod,
		type LeaderboardResult
	} from '$lib/services/benchmarking/leaderboards';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { data }: { data: PageData } = $props();

	// $derived keeps pageData reactive when data updates (Svelte 5 runes requirement).
	// The cast works around SvelteKit merging parent layout types into PageData.
	const pageData = $derived(
		data as any as {
			leaderboards: Record<string, LeaderboardResult> | null;
			selectedMetric: LeaderboardMetric;
			selectedPeriod: TimePeriod;
			selectedAgeGroup?: string;
			selectedExperience?: string;
			userOptedIn: boolean;
			userDisplayName: string | null;
			profile: any;
		}
	);

	const selectedMetric = $derived(pageData.selectedMetric as LeaderboardMetric);
	const selectedPeriod = $derived(pageData.selectedPeriod as TimePeriod);
	const currentLeaderboard = $derived(pageData.leaderboards?.[selectedMetric]);

	function updateFilter(param: string, value: string | undefined) {
		const params = new URLSearchParams($page.url.searchParams);
		if (value) {
			params.set(param, value);
		} else {
			params.delete(param);
		}
		goto(`/leaderboard?${params.toString()}`);
	}
</script>

<svelte:head>
	<title>Leaderboard — AppGatePro</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold text-[#f0ece4]">Leaderboard</h1>
			<p class="mt-1 text-sm text-[#9a8f7a]">Compare your performance with riders worldwide</p>
		</div>
	</div>

	<!-- Beta notice — leaderboard rankings use live personal bests but cross-rider
         comparison data is not yet populated. Remove this block once real peer
         data is flowing and the generateLeaderboard mock is replaced with a DB query. -->
	<div
		class="flex items-start gap-3 rounded-xl border border-[#f5a623]/40 bg-[#f5a623]/8 px-5 py-4"
	>
		<svg
			class="mt-0.5 h-5 w-5 shrink-0 text-[#f5a623]"
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
		<div>
			<p class="text-sm font-semibold text-[#f5a623]">Leaderboard in early access</p>
			<p class="mt-0.5 text-sm text-[#9a8f7a]">
				Your own personal bests and session stats are accurate. Cross-rider rankings will populate
				as the wider release builds a real comparison pool. Numbers shown against other riders are
				placeholder data only.
			</p>
		</div>
	</div>

	<!-- Opt-in Banner (if not opted in) -->
	{#if !pageData.userOptedIn}
		<div
			class="rounded-xl border border-[#f5a623]/30 bg-gradient-to-r from-[#f5a623]/10 to-[#f5a623]/5 p-6"
		>
			<div class="flex items-start gap-4">
				<div
					class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#f5a623]/20"
				>
					<svg class="h-6 w-6 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 10V3L4 14h7v7l9-11h-7z"
						/>
					</svg>
				</div>
				<div class="flex-1">
					<h3 class="mb-2 text-lg font-semibold text-[#f0ece4]">Join the Leaderboard! 🏆</h3>
					<p class="mb-4 text-sm text-[#9a8f7a]">
						Want to see where you rank? Opt-in to share your best performances anonymously and
						compete with riders in your category. Your privacy is protected—you choose your display
						name, and personal data is never shared.
					</p>
					<div class="flex flex-wrap gap-3">
						<a
							href="/settings"
							class="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#f5a623] px-4
                                  py-2.5 text-sm font-semibold text-[#0a0809] transition-colors hover:bg-[#c97e0a]
                                  focus:ring-2 focus:ring-[#f5a623] focus:outline-none"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
								/>
							</svg>
							Enable in Settings
						</a>
						<a
							href="#privacy"
							class="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#221c18] px-4
                                  py-2.5 text-sm text-[#f0ece4] transition-colors hover:bg-[#2a221d]
                                  focus:ring-2 focus:ring-[#f5a623] focus:outline-none"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
								/>
							</svg>
							Privacy Policy
						</a>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Filters -->
	<div class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
		<h2 class="mb-4 text-sm font-semibold text-[#f0ece4]">Filters</h2>

		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<!-- Metric -->
			<div>
				<label for="metric" class="mb-1.5 block text-xs font-medium text-[#9a8f7a]"> Metric </label>
				<select
					id="metric"
					value={selectedMetric}
					onchange={(e) => updateFilter('metric', e.currentTarget.value)}
					class="input-field w-full"
				>
					<option value="reactionTime">Reaction Time</option>
					<option value="peakSpeed">Peak Speed</option>
					<option value="maxG">Max G-Force</option>
					<option value="consistency">Consistency</option>
				</select>
			</div>

			<!-- Time Period -->
			<div>
				<label for="period" class="mb-1.5 block text-xs font-medium text-[#9a8f7a]">
					Time Period
				</label>
				<select
					id="period"
					value={selectedPeriod}
					onchange={(e) => updateFilter('period', e.currentTarget.value)}
					class="input-field w-full"
				>
					<option value="all_time">All Time</option>
					<option value="month">This Month</option>
					<option value="week">This Week</option>
				</select>
			</div>

			<!-- Age Group -->
			<div>
				<label for="ageGroup" class="mb-1.5 block text-xs font-medium text-[#9a8f7a]">
					Age Group
				</label>
				<select
					id="ageGroup"
					value={pageData.selectedAgeGroup || ''}
					onchange={(e) => updateFilter('ageGroup', e.currentTarget.value || undefined)}
					class="input-field w-full"
				>
					<option value="">All Ages</option>
					<option value="13-17">13-17</option>
					<option value="18-25">18-25</option>
					<option value="26-35">26-35</option>
					<option value="36-45">36-45</option>
					<option value="46+">46+</option>
				</select>
			</div>

			<!-- Experience Level -->
			<div>
				<label for="experience" class="mb-1.5 block text-xs font-medium text-[#9a8f7a]">
					Experience Level
				</label>
				<select
					id="experience"
					value={pageData.selectedExperience || ''}
					onchange={(e) => updateFilter('experience', e.currentTarget.value || undefined)}
					class="input-field w-full"
				>
					<option value="">All Levels</option>
					<option value="beginner">Beginner</option>
					<option value="intermediate">Intermediate</option>
					<option value="advanced">Advanced</option>
					<option value="elite">Elite</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Leaderboard -->
	<div class="overflow-hidden rounded-xl border border-[#221c18] bg-[#131010]">
		<!-- Header -->
		<div class="border-b border-[#221c18] p-5">
			<div class="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h2 class="text-lg font-semibold text-[#f0ece4]">
						{getMetricDisplayName(selectedMetric)}
					</h2>
					<p class="mt-0.5 text-xs text-[#9a8f7a]">
						{getTimePeriodDisplayName(selectedPeriod)}
						{#if pageData.selectedAgeGroup}
							· Ages {pageData.selectedAgeGroup}{/if}
						{#if pageData.selectedExperience}
							· {pageData.selectedExperience.charAt(0).toUpperCase() +
								pageData.selectedExperience.slice(1)}{/if}
					</p>
				</div>
				{#if currentLeaderboard}
					<div class="text-right">
						<p class="text-lg font-bold text-[#f5a623]">
							{currentLeaderboard.totalEntries}
						</p>
						<p class="text-xs text-[#9a8f7a]">Total Riders</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Your Rank (if opted in and ranked) -->
		{#if pageData.userOptedIn && currentLeaderboard?.userEntry}
			<div class="border-b border-[#f5a623]/20 bg-[#f5a623]/5 p-4">
				<div class="flex items-center justify-between gap-4">
					<div class="flex items-center gap-4">
						<div class="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5a623]/20">
							<span class="text-sm font-bold text-[#f5a623]">YOU</span>
						</div>
						<div>
							<p class="text-sm font-semibold text-[#f0ece4]">Your Rank</p>
							<p class="text-xs text-[#9a8f7a]">{pageData.userDisplayName || 'Anonymous'}</p>
						</div>
					</div>
					<div class="flex items-center gap-6">
						<div class="text-right">
							<p class="text-lg font-bold text-[#f5a623]">
								{formatLeaderboardValue(currentLeaderboard.userEntry.value, selectedMetric)}
							</p>
							<p class="text-xs text-[#9a8f7a]">
								{#if isTopPercentage(currentLeaderboard.userRank!, currentLeaderboard.totalEntries, 10)}
									Top 10%! 🌟
								{:else if isTopPercentage(currentLeaderboard.userRank!, currentLeaderboard.totalEntries, 25)}
									Top 25%! 🎯
								{:else}
									Top {Math.round(
										(currentLeaderboard.userRank! / currentLeaderboard.totalEntries) * 100
									)}%
								{/if}
							</p>
						</div>
						<div class="w-12 text-center">
							<p class="text-2xl font-bold text-[#f0ece4]">
								#{currentLeaderboard.userRank}
							</p>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Table -->
		{#if currentLeaderboard && currentLeaderboard.entries.length > 0}
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="border-b border-[#221c18] bg-[#0a0809]">
						<tr>
							<th
								class="w-16 px-4 py-3 text-left text-xs font-medium tracking-wider text-[#6b5f4d] uppercase"
							>
								Rank
							</th>
							<th
								class="px-4 py-3 text-left text-xs font-medium tracking-wider text-[#6b5f4d] uppercase"
							>
								Rider
							</th>
							<th
								class="px-4 py-3 text-right text-xs font-medium tracking-wider text-[#6b5f4d] uppercase"
							>
								{getMetricDisplayName(selectedMetric)}
							</th>
							<th
								class="w-24 px-4 py-3 text-center text-xs font-medium tracking-wider text-[#6b5f4d] uppercase"
							>
								Sessions
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-[#221c18]">
						{#each currentLeaderboard.entries as entry}
							{@const medal = getRankMedal(entry.rank)}
							{@const isUser = entry.isCurrentUser}
							{@const isTopTen = entry.rank <= 10}

							<tr
								class="transition-colors hover:bg-[#221c18]/30
                                       {isUser ? 'bg-[#f5a623]/5' : ''}"
							>
								<!-- Rank -->
								<td class="px-4 py-3 whitespace-nowrap">
									<div class="flex items-center gap-1">
										{#if medal}
											<span class="text-xl">{medal}</span>
										{:else}
											<span
												class="text-sm font-semibold {isTopTen
													? 'text-[#f5a623]'
													: 'text-[#9a8f7a]'}"
											>
												#{entry.rank}
											</span>
										{/if}
									</div>
								</td>

								<!-- Rider -->
								<td class="px-4 py-3">
									<div class="flex items-center gap-2">
										<span
											class="text-sm font-medium {isUser ? 'text-[#f5a623]' : 'text-[#f0ece4]'}"
										>
											{entry.displayName}
										</span>
										{#if isUser}
											<span
												class="rounded bg-[#f5a623]/20 px-2 py-0.5 text-xs font-medium text-[#f5a623]"
											>
												You
											</span>
										{/if}
									</div>
									{#if entry.ageGroup || entry.experienceLevel}
										<div class="mt-0.5 flex items-center gap-2">
											{#if entry.ageGroup}
												<span class="text-xs text-[#6b5f4d]">{entry.ageGroup}</span>
											{/if}
											{#if entry.experienceLevel}
												<span class="text-xs text-[#6b5f4d]">·</span>
												<span class="text-xs text-[#6b5f4d] capitalize"
													>{entry.experienceLevel}</span
												>
											{/if}
										</div>
									{/if}
								</td>

								<!-- Value -->
								<td class="px-4 py-3 text-right whitespace-nowrap">
									<span
										class="text-sm font-bold {entry.rank <= 3
											? 'text-[#f5a623]'
											: 'text-[#f0ece4]'}"
									>
										{formatLeaderboardValue(entry.value, selectedMetric)}
									</span>
								</td>

								<!-- Sessions -->
								<td class="px-4 py-3 text-center whitespace-nowrap">
									<span class="text-xs text-[#9a8f7a]">
										{entry.sessionCount || '—'}
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="p-12 text-center">
				<div
					class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#221c18]"
				>
					<svg class="h-8 w-8 text-[#6b5f4d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
						/>
					</svg>
				</div>
				<h3 class="mb-2 text-lg font-semibold text-[#f0ece4]">No Data Available</h3>
				<p class="mx-auto max-w-sm text-sm text-[#9a8f7a]">
					There aren't enough riders in this category yet. Try different filters or check back later
					as more athletes join!
				</p>
			</div>
		{/if}
	</div>

	<!-- Privacy & FAQ -->
	<div id="privacy" class="rounded-xl border border-[#221c18] bg-[#131010] p-6">
		<h2 class="mb-4 text-lg font-semibold text-[#f0ece4]">Privacy & Leaderboard FAQ</h2>

		<div class="space-y-4">
			<div>
				<h3 class="mb-2 text-sm font-medium text-[#f5a623]">🔒 How is my privacy protected?</h3>
				<p class="text-sm leading-relaxed text-[#9a8f7a]">
					Your real name and personal information are never shared. You choose an anonymous display
					name (or we generate one for you), and only your performance statistics are included in
					rankings. You can opt out at any time from Settings.
				</p>
			</div>

			<div>
				<h3 class="mb-2 text-sm font-medium text-[#f5a623]">📊 What data is shown?</h3>
				<p class="text-sm leading-relaxed text-[#9a8f7a]">
					Only your best performances in each metric are displayed. We aggregate data by age group
					and experience level to ensure fair comparisons. Session counts show how many training
					sessions contributed to your ranking.
				</p>
			</div>

			<div>
				<h3 class="mb-2 text-sm font-medium text-[#f5a623]">🎯 How are rankings calculated?</h3>
				<p class="text-sm leading-relaxed text-[#9a8f7a]">
					Rankings are based on your best verified performance in each category. We use different
					time periods (all-time, monthly, weekly) so you can track recent improvements and
					long-term progress.
				</p>
			</div>

			<div>
				<h3 class="mb-2 text-sm font-medium text-[#f5a623]">⚙️ How do I opt in or out?</h3>
				<p class="text-sm leading-relaxed text-[#9a8f7a]">
					Visit the Settings page and toggle "Show on Leaderboard". You can change your display name
					and privacy settings at any time. Opting out removes you from all leaderboards
					immediately.
				</p>
			</div>
		</div>
	</div>
</div>

<style>
	:global(.input-field) {
		padding: 0.625rem 1rem;
		background: #0a0809;
		border: 1px solid #221c18;
		border-radius: 0.5rem;
		color: #f0ece4;
		font-size: 0.875rem;
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
	}
	:global(.input-field:focus) {
		outline: none;
		border-color: #f5a623;
		box-shadow: 0 0 0 1px #f5a623;
	}
</style>

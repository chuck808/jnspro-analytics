<script lang="ts">
	import type { PageData } from './$types';
	import {
		formatLeaderboardValue,
		getMetricDisplayName,
		getRankMedal,
		type LeaderboardMetric,
		type LeaderboardResult
	} from '$lib/services/benchmarking/leaderboards';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	type PeerBenchmarkData = {
		comparison: {
			userValue: number;
			userPercentile: number;
			ranking: string;
			sampleSize: number;
		};
		benchmark: {
			sampleSize: number;
			lastUpdated: string;
			cohort: { ageGroup: string; experienceLevel: string };
			percentile_10: number;
			percentile_25: number;
			percentile_50: number;
			percentile_75: number;
			percentile_90: number;
		};
		requestedCohort: { ageGroup: string; experienceLevel: string };
	};

	let { data }: { data: PageData } = $props();

	const pageData = $derived(
		data as any as {
			leaderboards: Record<string, LeaderboardResult> | null;
			peerBenchmark: PeerBenchmarkData | null;
			selectedMetric: LeaderboardMetric;
			selectedAgeGroup?: string;
			selectedAgeFilter: string;
			selectedExperience?: string;
			competitiveCohortSize: number;
			competitiveMinimum: number;
			userOptedIn: boolean;
			userDisplayName: string | null;
		}
	);

	const selectedMetric = $derived(pageData.selectedMetric);
	const currentLeaderboard = $derived(pageData.leaderboards?.[selectedMetric]);

	function updateFilter(param: string, value: string | undefined) {
		const params = new URLSearchParams($page.url.searchParams);
		params.delete('period');
		if (value) params.set(param, value);
		else params.delete(param);
		goto(`/leaderboard?${params.toString()}`);
	}

	function cohortLabel(cohort: { ageGroup: string; experienceLevel: string }) {
		const age =
			cohort.ageGroup === 'all'
				? 'all ages'
				: cohort.ageGroup === 'under-13'
					? 'under 13'
					: `ages ${cohort.ageGroup}`;
		const experience =
			cohort.experienceLevel === 'all' ? 'all experience levels' : cohort.experienceLevel;
		return `${age} · ${experience}`;
	}
</script>

<svelte:head>
	<title>Compare — AppGatePro</title>
</svelte:head>

<div class="space-y-6">
	<header>
		<h1 class="text-2xl font-bold text-[#f0ece4]">Compare</h1>
		<p class="mt-1 max-w-3xl text-sm text-[#9a8f7a]">
			First compare your best eligible evidence with a sufficiently populated rider baseline. The
			opt-in competitive leaderboard is a separate view below.
		</p>
	</header>

	<section class="rounded-xl border border-[#221c18] bg-[#131010] p-5 sm:p-6">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div>
				<p class="text-xs font-semibold tracking-[0.16em] text-[#f5a623] uppercase">Peer benchmark</p>
				<h2 class="mt-1 text-xl font-semibold text-[#f0ece4]">How does my best evidence compare?</h2>
				<p class="mt-1 max-w-2xl text-sm text-[#9a8f7a]">
					This percentile uses anonymised aggregate evidence and is only shown when the resolved
					comparison population has at least 30 riders.
				</p>
			</div>
			<div class="w-full sm:w-56">
				<label for="benchmark-metric" class="mb-1.5 block text-xs font-medium text-[#9a8f7a]">Metric</label>
				<select id="benchmark-metric" value={selectedMetric} onchange={(e) => updateFilter('metric', e.currentTarget.value)} class="input-field w-full">
					<option value="reactionTime">Reaction Time</option>
					<option value="peakSpeed">Peak Speed</option>
					<option value="maxG">Max G-Force</option>
					<option value="consistency">Consistency</option>
				</select>
			</div>
		</div>

		{#if pageData.peerBenchmark}
			{@const peer = pageData.peerBenchmark}
			<div class="mt-6 grid gap-4 md:grid-cols-3">
				<div class="rounded-lg border border-[#2a221d] bg-[#0a0809] p-4">
					<p class="text-xs text-[#9a8f7a]">Your best eligible evidence</p>
					<p class="mt-2 text-2xl font-bold text-[#f0ece4]">{formatLeaderboardValue(peer.comparison.userValue, selectedMetric)}</p>
				</div>
				<div class="rounded-lg border border-[#f5a623]/30 bg-[#f5a623]/5 p-4">
					<p class="text-xs text-[#9a8f7a]">Approximate percentile</p>
					<p class="mt-2 text-2xl font-bold text-[#f5a623]">{Math.round(peer.comparison.userPercentile)}th</p>
					<p class="mt-1 text-xs text-[#9a8f7a]">Higher percentile means stronger relative performance.</p>
				</div>
				<div class="rounded-lg border border-[#2a221d] bg-[#0a0809] p-4">
					<p class="text-xs text-[#9a8f7a]">Comparison population</p>
					<p class="mt-2 text-sm font-semibold text-[#f0ece4]">{cohortLabel(peer.benchmark.cohort)}</p>
					<p class="mt-1 text-xs text-[#9a8f7a]">{peer.benchmark.sampleSize} riders in the resolved baseline</p>
				</div>
			</div>

			<div class="mt-4 rounded-lg border border-[#221c18] bg-[#0a0809] p-4">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div>
						<p class="text-xs text-[#9a8f7a]">Baseline median</p>
						<p class="mt-1 text-lg font-semibold text-[#f0ece4]">{formatLeaderboardValue(peer.benchmark.percentile_50, selectedMetric)}</p>
					</div>
					<div class="max-w-xl text-xs leading-relaxed text-[#9a8f7a]">
						Requested cohort: {cohortLabel(peer.requestedCohort)}. If that group was too small, the benchmark service broadened the cohort until it found a defensible sample; the resolved population above is the one actually used.
					</div>
				</div>
			</div>
		{:else}
			<div class="mt-6 rounded-lg border border-[#221c18] bg-[#0a0809] p-5">
				<h3 class="text-sm font-semibold text-[#f0ece4]">No trustworthy peer percentile yet</h3>
				<p class="mt-1 max-w-2xl text-sm text-[#9a8f7a]">
					Either this metric has no eligible personal-best evidence yet, the rider profile does not
					contain enough age context, or every available aggregate population is below the minimum
					sample. Missing evidence stays missing rather than becoming a made-up percentile.
				</p>
			</div>
		{/if}
	</section>

	<section class="space-y-4">
		<div>
			<p class="text-xs font-semibold tracking-[0.16em] text-[#9a8f7a] uppercase">Optional competition</p>
			<h2 class="mt-1 text-xl font-semibold text-[#f0ece4]">Opt-in leaderboard</h2>
			<p class="mt-1 max-w-3xl text-sm text-[#9a8f7a]">This is an all-time rank among opted-in riders in the selected cohort. It is not the same thing as the population percentile above.</p>
		</div>

		{#if !pageData.userOptedIn}
			<div class="rounded-xl border border-[#f5a623]/30 bg-[#f5a623]/5 p-5">
				<h3 class="text-base font-semibold text-[#f0ece4]">Participation is optional</h3>
				<p class="mt-1 max-w-2xl text-sm text-[#9a8f7a]">Opt in from Settings if you want your best evidence included under an anonymous display name. Your peer benchmark above does not require public leaderboard participation.</p>
				<a href="/settings" class="mt-4 inline-flex min-h-[44px] items-center rounded-lg bg-[#f5a623] px-4 py-2.5 text-sm font-semibold text-[#0a0809] hover:bg-[#c97e0a]">Leaderboard settings</a>
			</div>
		{/if}

		<div class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<div>
					<label for="metric" class="mb-1.5 block text-xs font-medium text-[#9a8f7a]">Metric</label>
					<select id="metric" value={selectedMetric} onchange={(e) => updateFilter('metric', e.currentTarget.value)} class="input-field w-full">
						<option value="reactionTime">Reaction Time</option>
						<option value="peakSpeed">Peak Speed</option>
						<option value="maxG">Max G-Force</option>
						<option value="consistency">Consistency</option>
					</select>
				</div>
				<div>
					<label for="ageGroup" class="mb-1.5 block text-xs font-medium text-[#9a8f7a]">Age group</label>
					<select id="ageGroup" value={pageData.selectedAgeFilter} onchange={(e) => updateFilter('ageGroup', e.currentTarget.value || undefined)} class="input-field w-full">
						<option value="">Use rider age</option>
						<option value="all">All ages</option>
						<option value="under-13">Under 13</option>
						<option value="13-17">13–17</option>
						<option value="18-25">18–25</option>
						<option value="26-35">26–35</option>
						<option value="36-45">36–45</option>
						<option value="46+">46+</option>
					</select>
				</div>
				<div>
					<label for="experience" class="mb-1.5 block text-xs font-medium text-[#9a8f7a]">Experience filter</label>
					<select id="experience" value={pageData.selectedExperience || ''} onchange={(e) => updateFilter('experience', e.currentTarget.value || undefined)} class="input-field w-full">
						<option value="">All experience levels</option>
						<option value="beginner">Beginner</option>
						<option value="intermediate">Intermediate</option>
						<option value="advanced">Advanced</option>
						<option value="elite">Elite</option>
					</select>
				</div>
			</div>
			<p class="mt-3 text-xs text-[#6b5f4d]">Experience is currently a system-derived training-history classification, not a race licence or UCI category. Age is therefore the default cohort filter; experience is optional.</p>
		</div>

		<div class="overflow-hidden rounded-xl border border-[#221c18] bg-[#131010]">
			<div class="border-b border-[#221c18] p-5">
				<div class="flex flex-wrap items-center justify-between gap-4">
					<div>
						<h3 class="text-lg font-semibold text-[#f0ece4]">{getMetricDisplayName(selectedMetric)}</h3>
						<p class="mt-0.5 text-xs text-[#9a8f7a]">All-time bests{#if pageData.selectedAgeGroup} · {pageData.selectedAgeGroup === 'under-13' ? 'under 13' : `ages ${pageData.selectedAgeGroup}`}{/if}{#if pageData.selectedExperience} · {pageData.selectedExperience}{/if}</p>
					</div>
					<div class="text-right">
						<p class="text-lg font-bold text-[#f5a623]">{pageData.competitiveCohortSize}</p>
						<p class="text-xs text-[#9a8f7a]">Eligible opted-in riders</p>
					</div>
				</div>
			</div>

			{#if pageData.userOptedIn && currentLeaderboard?.userEntry}
				<div class="border-b border-[#f5a623]/20 bg-[#f5a623]/5 p-4">
					<div class="flex flex-wrap items-center justify-between gap-4">
						<div>
							<p class="text-sm font-semibold text-[#f0ece4]">Your competitive rank</p>
							<p class="text-xs text-[#9a8f7a]">{pageData.userDisplayName || 'Anonymous'}</p>
						</div>
						<div class="text-right">
							<p class="text-xl font-bold text-[#f5a623]">#{currentLeaderboard.userRank} of {currentLeaderboard.totalEntries}</p>
							<p class="text-sm text-[#f0ece4]">{formatLeaderboardValue(currentLeaderboard.userEntry.value, selectedMetric)}</p>
						</div>
					</div>
				</div>
			{/if}

			{#if currentLeaderboard && currentLeaderboard.entries.length > 0}
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="border-b border-[#221c18] bg-[#0a0809]">
							<tr>
								<th class="w-16 px-4 py-3 text-left text-xs font-medium tracking-wider text-[#6b5f4d] uppercase">Rank</th>
								<th class="px-4 py-3 text-left text-xs font-medium tracking-wider text-[#6b5f4d] uppercase">Rider</th>
								<th class="px-4 py-3 text-right text-xs font-medium tracking-wider text-[#6b5f4d] uppercase">{getMetricDisplayName(selectedMetric)}</th>
								<th class="w-24 px-4 py-3 text-center text-xs font-medium tracking-wider text-[#6b5f4d] uppercase">Sessions</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-[#221c18]">
							{#each currentLeaderboard.entries as entry}
								{@const medal = getRankMedal(entry.rank)}
								<tr class={entry.isCurrentUser ? 'bg-[#f5a623]/5' : ''}>
									<td class="px-4 py-3 text-sm font-semibold text-[#9a8f7a]">{medal || `#${entry.rank}`}</td>
									<td class="px-4 py-3">
										<p class={entry.isCurrentUser ? 'text-sm font-semibold text-[#f5a623]' : 'text-sm font-medium text-[#f0ece4]'}>{entry.displayName}{entry.isCurrentUser ? ' · You' : ''}</p>
										<p class="text-xs text-[#6b5f4d]">{entry.ageGroup === 'under-13' ? 'under 13' : entry.ageGroup || 'age not set'}{entry.experienceLevel ? ` · ${entry.experienceLevel}` : ''}</p>
									</td>
									<td class="px-4 py-3 text-right text-sm font-bold text-[#f0ece4]">{formatLeaderboardValue(entry.value, selectedMetric)}</td>
									<td class="px-4 py-3 text-center text-xs text-[#9a8f7a]">{entry.sessionCount || '—'}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="p-8 text-center sm:p-12">
					<h3 class="text-base font-semibold text-[#f0ece4]">Competitive ranking not shown</h3>
					<p class="mx-auto mt-2 max-w-lg text-sm text-[#9a8f7a]">This selected cohort has {pageData.competitiveCohortSize} opted-in riders with usable evidence. A competitive rank is only surfaced from {pageData.competitiveMinimum} riders.</p>
				</div>
			{/if}
		</div>
	</section>

	<section id="privacy" class="rounded-xl border border-[#221c18] bg-[#131010] p-6">
		<h2 class="text-lg font-semibold text-[#f0ece4]">How comparison data is used</h2>
		<div class="mt-4 grid gap-4 md:grid-cols-2">
			<div>
				<h3 class="text-sm font-medium text-[#f5a623]">Peer benchmark</h3>
				<p class="mt-1 text-sm leading-relaxed text-[#9a8f7a]">Uses aggregate percentile distributions. Individual riders are not listed, and the system broadens an undersized cohort rather than pretending a tiny sample is meaningful.</p>
			</div>
			<div>
				<h3 class="text-sm font-medium text-[#f5a623]">Competitive leaderboard</h3>
				<p class="mt-1 text-sm leading-relaxed text-[#9a8f7a]">Only riders who explicitly opt in are listed. Rankings use all-time best eligible evidence; weekly and monthly rankings are not currently calculated.</p>
			</div>
		</div>
	</section>
</div>

<style>
	:global(.input-field) {
		padding: 0.625rem 1rem;
		background: #0a0809;
		border: 1px solid #221c18;
		border-radius: 0.5rem;
		color: #f0ece4;
		font-size: 0.875rem;
		transition: border-color 0.15s, box-shadow 0.15s;
	}
	:global(.input-field:focus) {
		outline: none;
		border-color: #f5a623;
		box-shadow: 0 0 0 1px #f5a623;
	}
</style>

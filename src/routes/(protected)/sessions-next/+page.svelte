<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import ExportButton from '$lib/components/ExportButton.svelte';

	let { data }: { data: PageData } = $props();

	let dateFrom = $state('');
	let dateTo = $state('');
	let perPage = $state(10);
	let sortDir = $state<'asc' | 'desc'>('desc');
	let deletingSessionId = $state<string | null>(null);
	let confirmDeleteId = $state<string | null>(null);

	$effect(() => {
		dateFrom = data.dateFrom ?? '';
		dateTo = data.dateTo ?? '';
		perPage = data.perPage;
		sortDir = data.sortDir;
	});

	function formatDate(timestamp: string) {
		return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(timestamp));
	}
	function formatTime(timestamp: string) {
		return new Date(timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
	}
	function formatReaction(ms: number | null) {
		return ms === null ? '—' : `${(ms / 1000).toFixed(3)}s`;
	}
	function formatSpeed(ms: number | null) {
		return ms === null ? '—' : `${(ms * 3.6).toFixed(1)} km/h`;
	}
	function sessionTypeLabel(type: string) {
		const labels: Record<string, string> = {
			gate: 'Gate',
			sprint: 'Sprint',
			quickCadence: 'Quick Cadence',
			pyramidCadence: 'Pyramid Cadence'
		};
		return labels[type] ?? type;
	}

	function queryFor(page = 1) {
		const params = new URLSearchParams();
		if (dateFrom) params.set('dateFrom', dateFrom);
		if (dateTo) params.set('dateTo', dateTo);
		params.set('perPage', String(perPage));
		params.set('page', String(page));
		params.set('sortDir', sortDir);
		return params;
	}
	function applyFilters() {
		goto(`/sessions-next?${queryFor(1).toString()}`);
	}
	function clearFilters() {
		dateFrom = '';
		dateTo = '';
		goto(`/sessions-next?perPage=${perPage}&sortDir=${sortDir}`);
	}
	function changePage(page: number) {
		goto(`/sessions-next?${queryFor(page).toString()}`);
	}

	let totalPages = $derived(Math.max(1, Math.ceil(data.totalCount / data.perPage)));
	let hasFilters = $derived(Boolean(dateFrom || dateTo));
	let showListControls = $derived(hasFilters || data.totalCount > 2);
	let visibleEligibleRuns = $derived(data.sessions.reduce((total, session) => total + session.run_count, 0));
	let visibleExcludedRuns = $derived(data.sessions.reduce((total, session) => total + session.excludedCount, 0));
</script>

<svelte:head>
	<title>Sessions Preview — AppGatePro</title>
</svelte:head>

<div class="mx-auto max-w-7xl space-y-5">
	<header class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
		<div>
			<div class="flex flex-wrap items-center gap-2">
				<h1 class="section-title text-3xl font-bold text-[var(--theme-text-primary)] md:text-4xl">Sessions</h1>
				<span class="rounded-full bg-[#f5a623] px-2.5 py-1 text-[10px] font-bold tracking-wider text-[#0a0809] uppercase">New</span>
			</div>
			<p class="mt-2 text-sm text-[var(--theme-text-secondary)]">Your gate sessions, ordered {sortDir === 'desc' ? 'newest' : 'oldest'} first.</p>
		</div>
		<div class="flex flex-wrap items-center gap-2">
			<ExportButton sessions={data.sessions} variant="secondary" />
			<a href="/upload" class="inline-flex min-h-11 items-center rounded-lg bg-[#f5a623] px-4 py-2 text-sm font-bold text-[#0a0809] transition-colors hover:bg-[#c97e0a] focus:ring-2 focus:ring-[#f5a623] focus:outline-none">Upload session</a>
		</div>
	</header>

	<section class="overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)]">
		{#if showListControls}
			<div class="border-b border-[var(--theme-border)] p-4 md:p-5">
				<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(150px,1fr)_minmax(150px,1fr)_150px_170px_auto] lg:items-end">
					<div>
						<label for="dateFrom" class="mb-1.5 block text-[10px] font-semibold tracking-wider text-[var(--theme-text-subtle)] uppercase">From</label>
						<input id="dateFrom" type="date" bind:value={dateFrom} class="min-h-11 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] px-3 py-2 text-sm text-[var(--theme-text-primary)] focus:border-[#f5a623] focus:ring-2 focus:ring-[#f5a623] focus:outline-none" />
					</div>
					<div>
						<label for="dateTo" class="mb-1.5 block text-[10px] font-semibold tracking-wider text-[var(--theme-text-subtle)] uppercase">To</label>
						<input id="dateTo" type="date" bind:value={dateTo} class="min-h-11 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] px-3 py-2 text-sm text-[var(--theme-text-primary)] focus:border-[#f5a623] focus:ring-2 focus:ring-[#f5a623] focus:outline-none" />
					</div>
					<div>
						<label for="perPage" class="mb-1.5 block text-[10px] font-semibold tracking-wider text-[var(--theme-text-subtle)] uppercase">Per page</label>
						<select id="perPage" bind:value={perPage} class="min-h-11 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] px-3 py-2 text-sm text-[var(--theme-text-primary)] focus:border-[#f5a623] focus:ring-2 focus:ring-[#f5a623] focus:outline-none">
							<option value={5}>5</option><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
						</select>
					</div>
					<div>
						<label for="sortDir" class="mb-1.5 block text-[10px] font-semibold tracking-wider text-[var(--theme-text-subtle)] uppercase">Order</label>
						<select id="sortDir" bind:value={sortDir} class="min-h-11 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] px-3 py-2 text-sm text-[var(--theme-text-primary)] focus:border-[#f5a623] focus:ring-2 focus:ring-[#f5a623] focus:outline-none">
							<option value="desc">Newest first</option><option value="asc">Oldest first</option>
						</select>
					</div>
					<div class="flex gap-2">
						<button type="button" onclick={applyFilters} class="min-h-11 rounded-lg bg-[#f5a623] px-4 py-2 text-sm font-bold text-[#0a0809] hover:bg-[#c97e0a] focus:ring-2 focus:ring-[#f5a623] focus:outline-none">Apply</button>
						{#if hasFilters}<button type="button" onclick={clearFilters} class="min-h-11 rounded-lg border border-[var(--theme-border)] px-4 py-2 text-sm font-semibold text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]">Clear</button>{/if}
					</div>
				</div>
			</div>
		{/if}

		{#if data.sessions.length === 0}
			<div class="px-5 py-14 text-center md:px-8">
				<div class="mx-auto max-w-lg">
					{#if hasFilters}
						<p class="text-xs font-semibold tracking-[0.16em] text-[#f5a623] uppercase">No match</p>
						<h2 class="section-title mt-2 text-3xl font-bold text-[var(--theme-text-primary)]">No sessions in that date range</h2>
						<p class="mt-3 text-sm text-[var(--theme-text-secondary)]">Try widening the dates or clear the filter.</p>
						<button type="button" onclick={clearFilters} class="mt-6 inline-flex min-h-11 items-center rounded-lg border border-[var(--theme-border)] px-5 py-2.5 text-sm font-semibold text-[var(--theme-text-primary)] hover:border-[#f5a623]/30">Clear date filter</button>
					{:else}
						<div class="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#f5a623]/10 text-[#f5a623]">＋</div>
						<h2 class="section-title mt-4 text-3xl font-bold text-[var(--theme-text-primary)]">No gate sessions yet</h2>
						<p class="mt-3 text-sm leading-relaxed text-[var(--theme-text-secondary)]">Your first upload creates the evidence used by Session Overview, Analysis and Progress.</p>
						<a href="/upload" class="mt-6 inline-flex min-h-11 items-center rounded-lg bg-[#f5a623] px-5 py-2.5 text-sm font-bold text-[#0a0809]">Upload a session</a>
						<div class="mt-8 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg)]/45 p-5 text-left">
							<p class="text-xs font-semibold tracking-[0.14em] text-[var(--theme-text-subtle)] uppercase">Next steps</p>
							<ol class="mt-4 space-y-3 text-sm text-[var(--theme-text-secondary)]">
								<li class="flex gap-3"><span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f5a623]/10 text-xs font-bold text-[#f5a623]">1</span><span>Upload or receive your first gate session.</span></li>
								<li class="flex gap-3"><span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f5a623]/10 text-xs font-bold text-[#f5a623]">2</span><span>Review context and classify warmup or test runs.</span></li>
								<li class="flex gap-3"><span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f5a623]/10 text-xs font-bold text-[#f5a623]">3</span><span>Open Analysis when you want to investigate a run.</span></li>
							</ol>
						</div>
					{/if}
				</div>
			</div>
		{:else}
			<div class="flex flex-col gap-2 border-b border-[var(--theme-border)] px-4 py-3 text-xs text-[var(--theme-text-secondary)] sm:flex-row sm:items-center sm:justify-between md:px-5">
				<p><strong class="text-[var(--theme-text-primary)]">{data.totalCount}</strong> session{data.totalCount === 1 ? '' : 's'}{hasFilters ? ' in this date range' : ''} · <strong class="text-[var(--theme-text-primary)]">{visibleEligibleRuns}</strong> eligible run{visibleEligibleRuns === 1 ? '' : 's'} on this page{visibleExcludedRuns > 0 ? ` · ${visibleExcludedRuns} excluded` : ''}</p>
				{#if showListControls}<p>Page {data.page} of {totalPages}</p>{/if}
			</div>

			<div class="divide-y divide-[var(--theme-border)]">
				{#each data.sessions as session}
					<article class="group relative transition-colors hover:bg-[#f5a623]/[0.025]">
						<a href={`/sessions/${session.id}`} class="block px-4 py-5 pr-14 focus:ring-2 focus:ring-[#f5a623] focus:ring-inset focus:outline-none md:px-5 md:py-5">
							<div class="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_repeat(3,minmax(110px,0.42fr))_32px] lg:items-center">
								<div class="min-w-0">
									<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
										<p class="text-xs text-[var(--theme-text-subtle)]">{formatDate(session.timestamp)} · {formatTime(session.timestamp)}</p>
										<span class="rounded-full bg-[#f5a623]/10 px-2 py-0.5 text-[10px] font-semibold text-[#f5a623]">{sessionTypeLabel(session.session_type)}</span>
									</div>
									<h2 class="mt-1 text-base font-bold text-[var(--theme-text-primary)] group-hover:text-[#f5a623]">{session.bike_name ?? 'Gate session'}</h2>
									<p class="mt-1.5 text-sm {session.contextLine ? 'text-[var(--theme-text-secondary)]' : 'text-[var(--theme-text-faint)] italic'}">{session.contextLine ?? 'Context incomplete'}</p>
									{#if session.notes}<p class="mt-2 max-w-2xl truncate text-xs text-[var(--theme-text-subtle)]">{session.notes}</p>{/if}
								</div>

								<div class="grid grid-cols-3 gap-3 lg:contents">
									<div>
										<p class="text-[10px] font-semibold tracking-wide text-[var(--theme-text-subtle)] uppercase">Eligible runs</p>
										<p class="mt-1 text-xl font-bold text-[var(--theme-text-primary)]">{session.run_count}</p>
										{#if session.recorded_run_count !== session.run_count}<p class="mt-1 text-[10px] text-[var(--theme-text-subtle)]">{session.recorded_run_count} recorded</p>{/if}
										{#if session.excludedCount > 0}<p class="mt-1 text-[10px] text-[var(--theme-text-subtle)]">{session.excludedCount} excluded: {session.excludedReasons.join(', ')}</p>{/if}
									</div>
									<div>
										<p class="text-[10px] font-semibold tracking-wide text-[var(--theme-text-subtle)] uppercase">Best reaction</p>
										<p class="mt-1 text-xl font-bold text-[var(--theme-text-primary)]">{formatReaction(session.best_reaction_ms)}</p>
									</div>
									<div>
										<p class="text-[10px] font-semibold tracking-wide text-[var(--theme-text-subtle)] uppercase">Peak speed</p>
										{#if session.has_valid_speed}<p class="mt-1 text-xl font-bold text-[var(--theme-text-primary)]">{formatSpeed(session.best_peak_speed_ms)}</p>{:else}<p class="mt-1 text-sm font-semibold text-[var(--theme-text-faint)]">Unavailable</p>{/if}
									</div>
								</div>

								<div class="hidden text-right text-[#f5a623] lg:block">→</div>
							</div>
						</a>

						<div class="absolute top-4 right-4 z-10">
							{#if confirmDeleteId === session.id}
								<div class="flex items-center gap-2 rounded-lg border border-[#ff4444]/50 bg-[var(--theme-bg)] p-2 shadow-lg">
									<span class="text-xs whitespace-nowrap text-[#ff6666]">Delete this session?</span>
									<form method="POST" action="?/deleteSession" use:enhance={() => {
										deletingSessionId = session.id;
										return async ({ result, update }) => {
											await update();
											deletingSessionId = null;
											confirmDeleteId = null;
											if (result.type === 'success') window.location.reload();
										};
									}}>
										<input type="hidden" name="sessionId" value={session.id} />
										<button type="submit" disabled={deletingSessionId === session.id} class="rounded bg-[#ff4444] px-2 py-1 text-xs font-semibold text-white disabled:opacity-50">{deletingSessionId === session.id ? 'Deleting…' : 'Delete'}</button>
									</form>
									<button type="button" onclick={() => (confirmDeleteId = null)} class="rounded px-2 py-1 text-xs font-semibold text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]">Cancel</button>
								</div>
							{:else}
								<button type="button" onclick={() => (confirmDeleteId = session.id)} class="rounded-lg p-2 text-[var(--theme-text-subtle)] opacity-0 transition-all group-hover:opacity-100 hover:bg-[#ff4444]/10 hover:text-[#ff6666] focus:opacity-100 focus:ring-2 focus:ring-[#ff4444] focus:outline-none" aria-label="Delete session" title="Delete session">
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
								</button>
							{/if}
						</div>
					</article>
				{/each}
			</div>
		{/if}
	</section>

	{#if data.sessions.length > 0 && data.totalCount <= 2 && !hasFilters}
		<section class="rounded-xl border border-[#3de8c8]/20 bg-[#3de8c8]/5 p-5">
			<p class="text-sm font-bold text-[var(--theme-text-primary)]">Keep building your data.</p>
			<p class="mt-1 text-xs leading-relaxed text-[var(--theme-text-secondary)]">A session is useful immediately, but repeatability and longitudinal findings need more supported observations before they become meaningful.</p>
			<div class="mt-4 grid gap-2 text-sm text-[var(--theme-text-secondary)] sm:grid-cols-3"><span>1. Add another session</span><span>2. Keep context consistent</span><span>3. Review Progress for evidence</span></div>
		</section>
	{/if}

	{#if showListControls && totalPages > 1}
		<nav aria-label="Session pages" class="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4">
			<p class="text-sm text-[var(--theme-text-secondary)]">Page {data.page} of {totalPages}</p>
			<div class="flex items-center gap-2">
				<button type="button" onclick={() => changePage(data.page - 1)} disabled={data.page === 1} class="min-h-11 rounded-lg border border-[var(--theme-border)] px-4 py-2 text-sm font-semibold text-[var(--theme-text-primary)] disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
				{#each Array.from({ length: Math.min(5, totalPages) }, (_, index) => { const start = Math.max(1, Math.min(data.page - 2, totalPages - 4)); return start + index; }).filter((pageNumber) => pageNumber <= totalPages) as pageNumber}
					<button type="button" onclick={() => changePage(pageNumber)} class="min-h-11 min-w-11 rounded-lg px-3 py-2 text-sm font-semibold {pageNumber === data.page ? 'bg-[#f5a623] text-[#0a0809]' : 'border border-[var(--theme-border)] text-[var(--theme-text-primary)] hover:border-[#f5a623]/30'}" aria-current={pageNumber === data.page ? 'page' : undefined}>{pageNumber}</button>
				{/each}
				<button type="button" onclick={() => changePage(data.page + 1)} disabled={data.page === totalPages} class="min-h-11 rounded-lg border border-[var(--theme-border)] px-4 py-2 text-sm font-semibold text-[var(--theme-text-primary)] disabled:cursor-not-allowed disabled:opacity-40">Next</button>
			</div>
		</nav>
	{/if}

	<div class="rounded-xl border border-[#f5a623]/20 bg-[#f5a623]/5 px-4 py-3 text-xs text-[var(--theme-text-secondary)]">
		<strong class="text-[#f5a623]">Parallel preview:</strong> the current Sessions page is unchanged. This page only surfaces controls and metrics supported by the existing Sessions data contract; mock-up-only search/setup/focus filters remain out until they have real query contracts.
	</div>
</div>

<style>
	.section-title { font-family: 'Barlow Condensed', 'Barlow', system-ui, sans-serif; }
</style>
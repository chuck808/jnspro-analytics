<script lang="ts">
	import type { GeneratedReport } from '$lib/report-engine/types';
	import ReportSectionPreview from './ReportSectionPreview.svelte';
	import { getConfidenceLabel } from '$lib/report-engine/reportLanguage';

	let {
		report,
		onClose,
		onExport
	}: {
		report: GeneratedReport;
		onClose?: () => void;
		onExport?: (format: 'print' | 'json') => void;
	} = $props();

	function handlePrint() {
		window.print();
		onExport?.('print');
	}

	function handleExportJson() {
		const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${report.type}-${report.subject.sessionId ?? 'report'}.json`;
		a.click();
		URL.revokeObjectURL(url);
		onExport?.('json');
	}

	// Preserve section order — already ordered correctly by builder
	let sections = $derived(report.sections);

	let confidenceLabel = $derived(getConfidenceLabel(report.summary.confidence));

	let typeLabel = $derived(
		report.type === 'coach-session'
			? 'Session Report'
			: report.type === 'progress'
				? 'Progress Report'
				: report.type === 'diagnostic'
					? 'Diagnostic Report'
					: report.type === 'rider-parent'
						? 'Rider Report'
						: 'Report'
	);

	let detailLabel = $derived(
		report.detailLevel === 'simple'
			? 'Rider / Parent'
			: report.detailLevel === 'standard'
				? 'Club'
				: report.detailLevel === 'coach'
					? 'Coach'
					: report.detailLevel === 'technical'
						? 'Technical'
						: ''
	);

	let generatedDate = $derived(
		new Date(report.generatedAt).toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		})
	);
</script>

<!-- ── Screen toolbar (hidden when printing) ── -->
<div
	class="no-print sticky top-0 z-10 flex flex-wrap
            items-center justify-between gap-4 border-b border-[#221c18] bg-[#0a0809] px-5 py-3"
>
	<div class="flex items-center gap-3">
		<div class="h-6 w-0.5 bg-[#f5a623]"></div>
		<div>
			<p class="text-[10px] tracking-widest text-[#6b5f4d] uppercase">{typeLabel}</p>
			<p class="text-sm font-semibold text-[#f0ece4]">{detailLabel} view</p>
		</div>
	</div>
	<div class="flex items-center gap-2">
		<button
			onclick={handlePrint}
			class="flex items-center gap-1.5 rounded bg-[#f5a623] px-3 py-1.5 text-xs
                   font-semibold text-[#0a0809] transition-colors hover:bg-[#c97e0a]
                   focus:ring-2 focus:ring-[#f5a623] focus:outline-none"
		>
			<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
				/>
			</svg>
			Print / Save PDF
		</button>
		<button
			onclick={handleExportJson}
			class="rounded bg-[#221c18] px-3 py-1.5 text-xs font-medium text-[#9a8f7a]
                   transition-colors hover:text-[#f0ece4] focus:ring-2 focus:ring-[#f5a623] focus:outline-none"
		>
			Export JSON
		</button>
		{#if onClose}
			<button
				onclick={onClose}
				class="flex h-7 w-7 items-center justify-center rounded text-[#6b5f4d]
                       transition-colors hover:bg-[#221c18] hover:text-[#f0ece4]
                       focus:ring-2 focus:ring-[#f5a623] focus:outline-none"
				aria-label="Close report"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		{/if}
	</div>
</div>

<!-- ── Report document (light background, print-ready) ── -->
<div class="report-document mx-auto max-w-3xl bg-white text-[#1a1410]">
	<!-- Document header -->
	<header class="report-header border-b-2 border-[#f5a623] px-10 pt-10 pb-8">
		<!-- Branding row -->
		<div class="mb-8 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<!-- Amber mark -->
				<div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-[#f5a623]">
					<svg viewBox="0 0 24 24" class="h-5 w-5 text-[#0a0809]" fill="currentColor">
						<path d="M13 10V3L4 14h7v7l9-11h-7z" />
					</svg>
				</div>
				<div>
					<p class="text-[10px] font-bold tracking-[0.2em] text-[#9a8f7a] uppercase">
						AppGatePro Analytics
					</p>
					<p class="text-[10px] tracking-wider text-[#c8bfaf]">JNS Pro Systems</p>
				</div>
			</div>
			<div class="text-right">
				<p class="text-[10px] font-semibold tracking-widest text-[#9a8f7a] uppercase">
					{typeLabel}
				</p>
				<p class="text-[10px] text-[#c8bfaf]">{detailLabel} · {generatedDate}</p>
			</div>
		</div>

		<!-- Rider + session -->
		<div class="flex items-end justify-between gap-6">
			<div>
				{#if report.subject.riderName}
					<p class="mb-1 text-[10px] tracking-[0.15em] text-[#9a8f7a] uppercase">Rider</p>
					<h1 class="text-3xl leading-none font-black tracking-tight text-[#1a1410]">
						{report.subject.riderName}
					</h1>
				{/if}
				{#if report.subtitle}
					<p class="mt-2 text-sm text-[#6b5f4d]">{report.subtitle}</p>
				{/if}
			</div>
			<!-- Confidence pill -->
			{#if report.summary.confidence}
				<div
					class="flex flex-shrink-0 items-center gap-2 rounded-full border border-[#f5a623]/40
                            bg-[#f5a623]/8 px-3 py-1.5"
				>
					<span class="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#f5a623]"></span>
					<span class="text-[10px] font-semibold tracking-wider text-[#c97e0a] uppercase">
						{confidenceLabel}
					</span>
				</div>
			{/if}
		</div>

		<!-- Headline -->
		<div class="mt-6 border-t border-[#ede8e0] pt-6">
			<p class="text-xl leading-snug font-bold text-[#1a1410]">
				{report.summary.headline}
			</p>
			{#if report.summary.body.length > 0}
				<div class="mt-3 space-y-1.5">
					{#each report.summary.body as line}
						<p class="text-sm leading-relaxed text-[#6b5f4d]">{line}</p>
					{/each}
				</div>
			{/if}
		</div>
	</header>

	<!-- Document body -->
	<main class="space-y-0 px-10 py-8">
		{#each sections as section (section.id)}
			<ReportSectionPreview {section} detailLevel={report.detailLevel} />
		{/each}

		<!-- Recommendations -->
		{#if report.recommendations.length > 0 && !report.sections.find((s) => s.type === 'recommendations')}
			<section class="report-section border-b border-[#ede8e0] py-7">
				<h2 class="section-label">Recommended Focus</h2>
				<div class="mt-4 space-y-3">
					{#each report.recommendations as rec (rec.id)}
						{@const isHigh = rec.priority === 'high'}
						<div class="flex gap-4 {isHigh ? 'items-start' : 'items-start opacity-90'}">
							<!-- Priority indicator -->
							<div
								class="mt-0.5 w-1 flex-shrink-0 self-stretch rounded-full
                                        {isHigh ? 'bg-[#f5a623]' : 'bg-[#ede8e0]'}"
							></div>
							<div class="min-w-0 flex-1">
								<p class="text-sm leading-snug font-semibold text-[#1a1410]">
									{rec.title}
								</p>
								{#if rec.body && rec.body !== rec.title}
									<p class="mt-1 text-sm leading-relaxed text-[#6b5f4d]">
										{rec.body}
									</p>
								{/if}
								{#if rec.watchFor}
									<p class="mt-1.5 text-xs text-[#9a8f7a] italic">
										Watch for: {rec.watchFor}
									</p>
								{/if}
							</div>
							{#if isHigh}
								<span
									class="mt-0.5 flex-shrink-0 rounded bg-[#f5a623]/12 px-2
                                             py-0.5 text-[9px] font-bold tracking-widest text-[#c97e0a] uppercase"
								>
									Priority
								</span>
							{/if}
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Appendix -->
		{#if report.appendices?.length && (report.detailLevel === 'coach' || report.detailLevel === 'technical')}
			{#each report.appendices as appendix}
				<section class="report-section border-b border-[#ede8e0] py-7">
					<h2 class="section-label">{appendix.title}</h2>
					<div class="mt-4 space-y-1 rounded bg-[#f9f7f4] p-4 font-mono text-[11px] text-[#9a8f7a]">
						{#each appendix.content as line}
							<p>{line}</p>
						{/each}
					</div>
				</section>
			{/each}
		{/if}
	</main>

	<!-- Document footer -->
	<footer class="border-t-2 border-[#f5a623] bg-[#faf8f5] px-10 py-6">
		<div class="flex items-center justify-between gap-4">
			<p class="text-[10px] text-[#9a8f7a]">
				AppGatePro Analytics · JNS Pro Systems · {generatedDate}
			</p>
			<p class="max-w-xs text-right text-[10px] text-[#c8bfaf]">
				Speed and power values are IMU estimates. Reaction time and G-force are direct measurements.
			</p>
		</div>
	</footer>
</div>

<style>
	/* ── Print styles ──────────────────────────────────────────────────────── */
	@media print {
		.no-print {
			display: none !important;
		}

		.report-document {
			max-width: none !important;
			margin: 0 !important;
			box-shadow: none !important;
		}

		@page {
			size: A4;
			margin: 15mm 18mm 18mm 18mm;
		}

		.report-section {
			page-break-inside: avoid;
		}
	}

	/* ── Screen styles ─────────────────────────────────────────────────────── */
	.report-document {
		box-shadow:
			0 0 0 1px rgba(0, 0, 0, 0.06),
			0 4px 6px -1px rgba(0, 0, 0, 0.08),
			0 20px 40px -4px rgba(0, 0, 0, 0.15);
	}

	:global(.section-label) {
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: #9a8f7a;
	}
</style>

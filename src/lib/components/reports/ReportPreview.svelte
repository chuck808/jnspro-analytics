<script lang="ts">
    import type { GeneratedReport } from '$lib/report-engine/types';
    import ReportSectionPreview from './ReportSectionPreview.svelte';
    import ReportMetricGrid from './ReportMetricGrid.svelte';
    import { getConfidenceLabel } from '$lib/report-engine/reportLanguage';

    let {
        report,
        onClose,
        onExport,
    }: {
        report:    GeneratedReport;
        onClose?:  () => void;
        onExport?: (format: 'print' | 'json') => void;
    } = $props();

    function handlePrint() {
        window.print();
        onExport?.('print');
    }

    function handleExportJson() {
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `${report.type}-${report.subject.sessionId ?? 'report'}.json`;
        a.click();
        URL.revokeObjectURL(url);
        onExport?.('json');
    }

    // Preserve section order — already ordered correctly by builder
    let sections = $derived(report.sections);

    let confidenceLabel = $derived(getConfidenceLabel(report.summary.confidence));

    let typeLabel = $derived(
        report.type === 'coach-session' ? 'Session Report' :
        report.type === 'progress'      ? 'Progress Report' :
        report.type === 'diagnostic'    ? 'Diagnostic Report' :
        report.type === 'rider-parent'  ? 'Rider Report' :
        'Report'
    );

    let detailLabel = $derived(
        report.detailLevel === 'simple'    ? 'Rider / Parent' :
        report.detailLevel === 'standard'  ? 'Club' :
        report.detailLevel === 'coach'     ? 'Coach' :
        report.detailLevel === 'technical' ? 'Technical' :
        ''
    );

    let generatedDate = $derived(new Date(report.generatedAt).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric'
    }));
</script>

<!-- ── Screen toolbar (hidden when printing) ── -->
<div class="no-print bg-[#0a0809] border-b border-[#221c18] px-5 py-3
            flex items-center justify-between gap-4 flex-wrap sticky top-0 z-10">
    <div class="flex items-center gap-3">
        <div class="w-0.5 h-6 bg-[#f5a623]"></div>
        <div>
            <p class="text-[10px] text-[#6b5f4d] uppercase tracking-widest">{typeLabel}</p>
            <p class="text-sm font-semibold text-[#f0ece4]">{detailLabel} view</p>
        </div>
    </div>
    <div class="flex items-center gap-2">
        <button
            onclick={handlePrint}
            class="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold
                   bg-[#f5a623] text-[#0a0809] hover:bg-[#c97e0a] transition-colors
                   focus:outline-none focus:ring-2 focus:ring-[#f5a623]"
        >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
            </svg>
            Print / Save PDF
        </button>
        <button
            onclick={handleExportJson}
            class="px-3 py-1.5 rounded text-xs font-medium bg-[#221c18] text-[#9a8f7a]
                   hover:text-[#f0ece4] transition-colors focus:outline-none focus:ring-2 focus:ring-[#f5a623]"
        >
            Export JSON
        </button>
        {#if onClose}
            <button
                onclick={onClose}
                class="w-7 h-7 flex items-center justify-center rounded text-[#6b5f4d]
                       hover:text-[#f0ece4] hover:bg-[#221c18] transition-colors
                       focus:outline-none focus:ring-2 focus:ring-[#f5a623]"
                aria-label="Close report"
            >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        {/if}
    </div>
</div>

<!-- ── Report document (light background, print-ready) ── -->
<div class="report-document bg-white text-[#1a1410] max-w-3xl mx-auto">

    <!-- Document header -->
    <header class="report-header px-10 pt-10 pb-8 border-b-2 border-[#f5a623]">

        <!-- Branding row -->
        <div class="flex items-center justify-between mb-8">
            <div class="flex items-center gap-3">
                <!-- Amber mark -->
                <div class="w-8 h-8 bg-[#f5a623] rounded flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 24 24" class="w-5 h-5 text-[#0a0809]" fill="currentColor">
                        <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                </div>
                <div>
                    <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9a8f7a]">AppGatePro Analytics</p>
                    <p class="text-[10px] text-[#c8bfaf] tracking-wider">JNS Pro Systems</p>
                </div>
            </div>
            <div class="text-right">
                <p class="text-[10px] uppercase tracking-widest text-[#9a8f7a] font-semibold">{typeLabel}</p>
                <p class="text-[10px] text-[#c8bfaf]">{detailLabel} · {generatedDate}</p>
            </div>
        </div>

        <!-- Rider + session -->
        <div class="flex items-end justify-between gap-6">
            <div>
                {#if report.subject.riderName}
                    <p class="text-[10px] uppercase tracking-[0.15em] text-[#9a8f7a] mb-1">Rider</p>
                    <h1 class="text-3xl font-black text-[#1a1410] tracking-tight leading-none">
                        {report.subject.riderName}
                    </h1>
                {/if}
                {#if report.subtitle}
                    <p class="text-sm text-[#6b5f4d] mt-2">{report.subtitle}</p>
                {/if}
            </div>
            <!-- Confidence pill -->
            {#if report.summary.confidence}
                <div class="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full
                            border border-[#f5a623]/40 bg-[#f5a623]/8">
                    <span class="w-1.5 h-1.5 rounded-full bg-[#f5a623] flex-shrink-0"></span>
                    <span class="text-[10px] font-semibold uppercase tracking-wider text-[#c97e0a]">
                        {confidenceLabel}
                    </span>
                </div>
            {/if}
        </div>

        <!-- Headline -->
        <div class="mt-6 pt-6 border-t border-[#ede8e0]">
            <p class="text-xl font-bold text-[#1a1410] leading-snug">
                {report.summary.headline}
            </p>
            {#if report.summary.body.length > 0}
                <div class="mt-3 space-y-1.5">
                    {#each report.summary.body as line}
                        <p class="text-sm text-[#6b5f4d] leading-relaxed">{line}</p>
                    {/each}
                </div>
            {/if}
        </div>
    </header>

    <!-- Document body -->
    <main class="px-10 py-8 space-y-0">

        {#each sections as section (section.id)}
            <ReportSectionPreview {section} detailLevel={report.detailLevel} />
        {/each}

        <!-- Recommendations -->
        {#if report.recommendations.length > 0 && !report.sections.find(s => s.type === 'recommendations')}
            <section class="report-section py-7 border-b border-[#ede8e0]">
                <h2 class="section-label">Recommended Focus</h2>
                <div class="mt-4 space-y-3">
                    {#each report.recommendations as rec (rec.id)}
                        {@const isHigh = rec.priority === 'high'}
                        <div class="flex gap-4 {isHigh ? 'items-start' : 'items-start opacity-90'}">
                            <!-- Priority indicator -->
                            <div class="flex-shrink-0 w-1 self-stretch rounded-full mt-0.5
                                        {isHigh ? 'bg-[#f5a623]' : 'bg-[#ede8e0]'}">
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-semibold text-[#1a1410] leading-snug">
                                    {rec.title}
                                </p>
                                {#if rec.body && rec.body !== rec.title}
                                    <p class="text-sm text-[#6b5f4d] mt-1 leading-relaxed">
                                        {rec.body}
                                    </p>
                                {/if}
                                {#if rec.watchFor}
                                    <p class="text-xs text-[#9a8f7a] mt-1.5 italic">
                                        Watch for: {rec.watchFor}
                                    </p>
                                {/if}
                            </div>
                            {#if isHigh}
                                <span class="flex-shrink-0 text-[9px] font-bold uppercase tracking-widest
                                             text-[#c97e0a] bg-[#f5a623]/12 px-2 py-0.5 rounded mt-0.5">
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
                <section class="report-section py-7 border-b border-[#ede8e0]">
                    <h2 class="section-label">{appendix.title}</h2>
                    <div class="mt-4 font-mono text-[11px] text-[#9a8f7a] space-y-1 bg-[#f9f7f4] rounded p-4">
                        {#each appendix.content as line}
                            <p>{line}</p>
                        {/each}
                    </div>
                </section>
            {/each}
        {/if}

    </main>

    <!-- Document footer -->
    <footer class="px-10 py-6 border-t-2 border-[#f5a623] bg-[#faf8f5]">
        <div class="flex items-center justify-between gap-4">
            <p class="text-[10px] text-[#9a8f7a]">
                AppGatePro Analytics · JNS Pro Systems · {generatedDate}
            </p>
            <p class="text-[10px] text-[#c8bfaf] text-right max-w-xs">
                Speed and power values are IMU estimates. Reaction time and G-force are direct measurements.
            </p>
        </div>
    </footer>

</div>

<style>
    /* ── Print styles ──────────────────────────────────────────────────────── */
    @media print {
        .no-print { display: none !important; }

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
            0 0 0 1px rgba(0,0,0,0.06),
            0 4px 6px -1px rgba(0,0,0,0.08),
            0 20px 40px -4px rgba(0,0,0,0.15);
    }

    :global(.section-label) {
        font-size: 0.6rem;
        font-weight: 700;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: #9a8f7a;
    }
</style>

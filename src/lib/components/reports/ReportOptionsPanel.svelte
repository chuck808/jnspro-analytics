<script lang="ts">
    import type { ReportDetailLevel, ReportType } from '$lib/report-engine/types';

    let {
        reportType    = $bindable('coach-session'),
        detailLevel   = $bindable('coach'),
        includeCharts = $bindable(true),
        includeDiag   = $bindable(true),
        includeAppendix = $bindable(false),
        includeGoals  = $bindable(false),
        hasActiveGoals = false,
        onGenerate,
        generating = false,
    }: {
        reportType:      ReportType;
        detailLevel:     ReportDetailLevel;
        includeCharts:   boolean;
        includeDiag:     boolean;
        includeAppendix: boolean;
        includeGoals:    boolean;
        hasActiveGoals?: boolean;
        onGenerate:      () => void;
        generating?:     boolean;
    } = $props();

    // Auto-adjust defaults when audience changes
    $effect(() => {
        if (detailLevel === 'simple') {
            includeDiag     = false;
            includeAppendix = false;
        } else if (detailLevel === 'technical') {
            includeDiag     = true;
            includeAppendix = true;
        } else if (detailLevel === 'coach') {
            includeDiag     = true;
            includeAppendix = false;
        }
        // standard: leave as-is, user decides
    });

    const reportTypes: { value: ReportType; label: string; description: string }[] = [
        { value: 'coach-session', label: 'Session Report',  description: 'What happened in this session?' },
        { value: 'progress',      label: 'Progress Report', description: 'How is the rider progressing?' },
        { value: 'diagnostic',    label: 'Diagnostic',      description: 'Can we trust this data?' },
        { value: 'rider-parent',  label: 'Rider / Parent',  description: 'Plain language summary' },
    ];

    const detailLevels: { value: ReportDetailLevel; label: string; description: string }[] = [
        { value: 'simple',    label: 'Simple',    description: 'Rider or parent — plain language' },
        { value: 'standard',  label: 'Standard',  description: 'Club rider — some context' },
        { value: 'coach',     label: 'Coach',     description: 'Full coaching detail' },
        { value: 'technical', label: 'Technical', description: 'All metrics and diagnostics' },
    ];
</script>

<div class="bg-[#131010] border border-[#221c18] rounded-xl overflow-hidden">

    <!-- Header -->
    <div class="px-5 py-4 border-b border-[#221c18] flex items-center gap-3">
        <div class="w-1 h-6 rounded-full bg-[#f5a623]"></div>
        <h3 class="text-sm font-semibold text-[#f0ece4]">Report Options</h3>
    </div>

    <div class="p-5 space-y-5">

        <!-- Report type -->
        <fieldset>
            <legend class="text-xs font-semibold text-[#6b5f4d] uppercase tracking-wider mb-2">Report Type</legend>
            <div class="space-y-1.5">
                {#each reportTypes as rt}
                    <label class="flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-colors
                                  {reportType === rt.value ? 'bg-[#f5a623]/10 border border-[#f5a623]/30' : 'bg-[#0a0809] border border-[#221c18] hover:border-[#f5a623]/20'}">
                        <input type="radio" bind:group={reportType} value={rt.value}
                               class="mt-0.5 accent-[#f5a623]" />
                        <div>
                            <p class="text-sm font-medium {reportType === rt.value ? 'text-[#f5a623]' : 'text-[#f0ece4]'}">{rt.label}</p>
                            <p class="text-xs text-[#6b5f4d]">{rt.description}</p>
                        </div>
                    </label>
                {/each}
            </div>
        </fieldset>

        <!-- Detail level -->
        <fieldset>
            <legend class="text-xs font-semibold text-[#6b5f4d] uppercase tracking-wider mb-2">Audience</legend>
            <div class="space-y-1.5">
                {#each detailLevels as dl}
                    <label class="flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-colors
                                  {detailLevel === dl.value ? 'bg-[#f5a623]/10 border border-[#f5a623]/30' : 'bg-[#0a0809] border border-[#221c18] hover:border-[#f5a623]/20'}">
                        <input type="radio" bind:group={detailLevel} value={dl.value}
                               class="mt-0.5 accent-[#f5a623]" />
                        <div>
                            <p class="text-sm font-medium {detailLevel === dl.value ? 'text-[#f5a623]' : 'text-[#f0ece4]'}">{dl.label}</p>
                            <p class="text-xs text-[#6b5f4d]">{dl.description}</p>
                        </div>
                    </label>
                {/each}
            </div>
        </fieldset>

        <!-- Options -->
        <fieldset>
            <legend class="text-xs font-semibold text-[#6b5f4d] uppercase tracking-wider mb-2">Include</legend>
            <div class="space-y-2">
                <!-- Charts -->
                <label class="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" bind:checked={includeCharts} class="accent-[#f5a623]" />
                    <div>
                        <p class="text-sm text-[#f0ece4] group-hover:text-[#f5a623] transition-colors">Charts</p>
                        <p class="text-xs text-[#6b5f4d]">Visual evidence sections</p>
                    </div>
                </label>

                <!-- Data quality notes -->
                <label class="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" bind:checked={includeDiag} class="accent-[#f5a623]" />
                    <div>
                        <p class="text-sm text-[#f0ece4] group-hover:text-[#f5a623] transition-colors">Data quality notes</p>
                        <p class="text-xs text-[#6b5f4d]">Sensor and calibration detail</p>
                    </div>
                </label>

                <!-- Goal progress (conditional) -->
                {#if hasActiveGoals}
                    <label class="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" bind:checked={includeGoals} class="accent-[#f5a623]" />
                        <div>
                            <p class="text-sm text-[#f0ece4] group-hover:text-[#f5a623] transition-colors">Goal progress</p>
                            <p class="text-xs text-[#6b5f4d]">Session impact on active training goals</p>
                        </div>
                    </label>
                {/if}

                <!-- Technical appendix -->
                <label class="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" bind:checked={includeAppendix} class="accent-[#f5a623]" />
                    <div>
                        <p class="text-sm text-[#f0ece4] group-hover:text-[#f5a623] transition-colors">Technical appendix</p>
                        <p class="text-xs text-[#6b5f4d]">Raw metrics and debug values</p>
                    </div>
                </label>
            </div>
        </fieldset>

        <!-- Generate button -->
        <button
            onclick={onGenerate}
            disabled={generating}
            class="w-full py-3 rounded-xl text-sm font-bold transition-all
                   bg-[#f5a623] text-[#0a0809] hover:bg-[#c97e0a]
                   disabled:opacity-50 disabled:cursor-not-allowed
                   focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[color:var(--theme-surface)]"
        >
            {generating ? 'Generating…' : 'Generate Report'}
        </button>

    </div>
</div>
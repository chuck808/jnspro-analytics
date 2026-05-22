<script lang="ts">
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    let fromDate    = $state('');
    let toDate      = $state('');
    let downloading = $state<'session' | 'run' | null>(null);

    async function download(level: 'session' | 'run') {
        downloading = level;
        const params = new URLSearchParams({ level });
        if (fromDate) params.set('from', fromDate);
        if (toDate)   params.set('to',   toDate);

        try {
            const res = await fetch(`/api/admin/research-export?${params}`);
            if (!res.ok) {
                const text = await res.text();
                alert(`Export failed: ${text}`);
                return;
            }
            const blob     = await res.blob();
            const filename = res.headers.get('Content-Disposition')
                ?.match(/filename="(.+)"/)?.[1]
                ?? `research_${level}_${Date.now()}.csv`;
            const url  = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            URL.revokeObjectURL(url);
        } finally {
            downloading = null;
        }
    }

    const PARTICIPATION_LABELS: Record<string, string> = {
        training_only:   'Training only',
        club_racing:     'Club racing',
        regional:        'Regional',
        national:        'National',
        international:   'International',
        not_set:         'Not set',
    };

    function pct(n: number, total: number) {
        if (!total) return '0%';
        return `${Math.round((n / total) * 100)}%`;
    }
</script>

<svelte:head>
    <title>Research Data — AppGatePro Admin</title>
</svelte:head>

<div class="space-y-6">

    <!-- Header -->
    <div>
        <h2 class="text-lg font-bold text-[#f0ece4]">Research Data Export</h2>
        <p class="text-sm text-[#9a8f7a] mt-0.5">
            Anonymised session and run data for consented riders only.
            No names, emails, or contact details are included in any export.
        </p>
    </div>

    <!-- Consent population summary -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {#each [
            { label: 'Consented riders',  value: data.consentedCount,  sub: `of ${data.totalRiders} total` },
            { label: 'Consent rate',      value: pct(data.consentedCount, data.totalRiders), sub: 'opted in to research' },
            { label: 'Gate sessions',     value: data.totalSessions,   sub: 'across all riders' },
            { label: 'Dataset active',    value: data.earliestConsent ? new Date(data.earliestConsent).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '—', sub: 'first consent date' },
        ] as stat}
            <div class="bg-[#131010] border border-[#221c18] rounded-xl p-4">
                <p class="text-2xl font-bold text-[#f5a623]">{stat.value}</p>
                <p class="text-xs font-medium text-[#f0ece4] mt-0.5">{stat.label}</p>
                <p class="text-xs text-[#4a4038]">{stat.sub}</p>
            </div>
        {/each}
    </div>

    <!-- Field completeness -->
    <div class="bg-[#131010] border border-[#221c18] rounded-xl p-5">
        <h3 class="text-sm font-semibold text-[#f0ece4] mb-4">
            Profile completeness — consented riders (n={data.consentedCount})
        </h3>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {#each [
                { label: 'Sex',              n: data.fieldCompleteness.sex },
                { label: 'Height',           n: data.fieldCompleteness.height },
                { label: 'Weight',           n: data.fieldCompleteness.weight },
                { label: 'Date of birth',    n: data.fieldCompleteness.dob },
                { label: 'Years racing',     n: data.fieldCompleteness.yearsRacing },
                { label: 'Dominant leg',     n: data.fieldCompleteness.dominantLeg },
                { label: 'Participation',    n: data.fieldCompleteness.participation },
                { label: 'Country',          n: data.fieldCompleteness.country },
            ] as field}
                <div class="space-y-1.5">
                    <div class="flex justify-between text-xs">
                        <span class="text-[#9a8f7a]">{field.label}</span>
                        <span class="text-[#f0ece4]">{field.n}/{data.consentedCount}</span>
                    </div>
                    <div class="h-1.5 bg-[#221c18] rounded-full overflow-hidden">
                        <div class="h-full rounded-full transition-all"
                             class:bg-green-500={field.n === data.consentedCount}
                             class:bg-amber-500={field.n > 0 && field.n < data.consentedCount}
                             class:bg-red-800={field.n === 0}
                             style="width: {data.consentedCount ? (field.n / data.consentedCount * 100) : 0}%">
                        </div>
                    </div>
                </div>
            {/each}
        </div>
        <p class="text-xs text-[#4a4038] mt-4">
            Missing fields are blank in the CSV — not excluded. Researchers can filter by completeness.
        </p>
    </div>

    <!-- Participation and country breakdowns -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <div class="bg-[#131010] border border-[#221c18] rounded-xl p-5">
            <h3 class="text-sm font-semibold text-[#f0ece4] mb-3">Participation level</h3>
            <div class="space-y-2">
                {#each Object.entries(data.participationBreakdown).sort((a, b) => b[1] - a[1]) as [level, count]}
                    <div class="flex justify-between text-xs">
                        <span class="text-[#9a8f7a]">{PARTICIPATION_LABELS[level] ?? level}</span>
                        <span class="text-[#f0ece4]">{count} <span class="text-[#4a4038]">({pct(count, data.consentedCount)})</span></span>
                    </div>
                {:else}
                    <p class="text-xs text-[#4a4038]">No consented riders yet</p>
                {/each}
            </div>
        </div>

        <div class="bg-[#131010] border border-[#221c18] rounded-xl p-5">
            <h3 class="text-sm font-semibold text-[#f0ece4] mb-3">Country</h3>
            <div class="space-y-2">
                {#each Object.entries(data.countryBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 10) as [country, count]}
                    <div class="flex justify-between text-xs">
                        <span class="text-[#9a8f7a]">{country === 'not_set' ? 'Not set' : country}</span>
                        <span class="text-[#f0ece4]">{count}</span>
                    </div>
                {:else}
                    <p class="text-xs text-[#4a4038]">No consented riders yet</p>
                {/each}
            </div>
        </div>

    </div>

    <!-- Export controls -->
    <div class="bg-[#131010] border border-[#221c18] rounded-xl p-5 space-y-5">
        <h3 class="text-sm font-semibold text-[#f0ece4]">Export dataset</h3>

        <!-- Date range filter -->
        <div class="flex gap-4 flex-wrap">
            <div>
                <label for="from-date" class="block text-xs text-[#9a8f7a] mb-1">From date (optional)</label>
                <input id="from-date" type="date" bind:value={fromDate}
                       class="px-3 py-1.5 bg-[#0a0809] border border-[#221c18] rounded-lg text-sm
                              text-[#f0ece4] focus:outline-none focus:border-[#f5a623] focus:ring-1
                              focus:ring-[#f5a623]" />
            </div>
            <div>
                <label for="to-date" class="block text-xs text-[#9a8f7a] mb-1">To date (optional)</label>
                <input id="to-date" type="date" bind:value={toDate}
                       class="px-3 py-1.5 bg-[#0a0809] border border-[#221c18] rounded-lg text-sm
                              text-[#f0ece4] focus:outline-none focus:border-[#f5a623] focus:ring-1
                              focus:ring-[#f5a623]" />
            </div>
        </div>

        <!-- Export buttons -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div class="border border-[#221c18] rounded-lg p-4 space-y-2">
                <h4 class="text-sm font-semibold text-[#f0ece4]">Session-level CSV</h4>
                <p class="text-xs text-[#9a8f7a]">
                    One row per session. Rider context, bike setup, session conditions,
                    and aggregate metrics (best reaction, avg G, CV%, etc).
                    Best for population-level analysis.
                </p>
                <p class="text-xs text-[#4a4038]">
                    Columns: rider_id, uci_category, age_at_session, sex, height_cm,
                    weight_kg, years_racing, dominant_leg, participation_type, country,
                    session_date, track_surface, weather, focus, ride_feel,
                    crank_mm, chainring, sprocket, gear_ratio, wheel_diameter,
                    run_count, eligible_runs, best_reaction_ms, avg_reaction_ms,
                    reaction_cv_pct, best_max_g, avg_max_g, best_peak_speed_ms
                </p>
                <button onclick={() => download('session')} disabled={downloading !== null}
                    class="w-full py-2 bg-[#f5a623] hover:bg-[#c97e0a] disabled:opacity-50
                           text-[#0a0809] font-semibold text-sm rounded-lg transition-colors">
                    {downloading === 'session' ? 'Preparing…' : 'Download session CSV'}
                </button>
            </div>

            <div class="border border-[#221c18] rounded-lg p-4 space-y-2">
                <h4 class="text-sm font-semibold text-[#f0ece4]">Run-level CSV</h4>
                <p class="text-xs text-[#9a8f7a]">
                    One row per individual run. Full gate_runs metrics including pitch,
                    wheelie detection, bias correction, and analytics validity flag.
                    Best for biomechanics analysis. Larger file.
                </p>
                <p class="text-xs text-[#4a4038]">
                    Columns: all session fields plus run_number, is_stats_eligible,
                    elapsed_time_ms, distance_m, reaction_time_ms, max_g, avg_g,
                    speed_ms, peak_speed_ms, time_to_peak_speed_ms, bias_correction_ms2,
                    analytics_valid, max_pitch_deg, avg_pitch_deg, pitch_at_peak_g_deg,
                    wheelie metrics, front_wheel_lifted
                </p>
                <button onclick={() => download('run')} disabled={downloading !== null}
                    class="w-full py-2 bg-[#221c18] hover:bg-[#2a221d] disabled:opacity-50
                           border border-[#3a2e24] hover:border-[#f5a623]/40
                           text-[#f0ece4] font-semibold text-sm rounded-lg transition-colors">
                    {downloading === 'run' ? 'Preparing…' : 'Download run-level CSV'}
                </button>
            </div>

        </div>

        <p class="text-xs text-[#4a4038]">
            Only riders who have explicitly opted in to research data sharing are included.
            rider_id is the internal UUID — no personally identifiable information is exported.
            Consent can be withdrawn by the rider at any time via their profile page.
        </p>
    </div>

</div>
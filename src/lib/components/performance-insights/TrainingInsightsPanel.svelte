<script lang="ts">
  import SessionIntelligencePanel from './SessionIntelligencePanel.svelte';
  import CrossSessionProgressPanel from './CrossSessionProgressPanel.svelte';
  import TechniqueAnalysisPanel from './TechniqueAnalysisPanel.svelte';

  /**
   * Combined product-facing layout.
   *
   * This intentionally separates session-level and cross-session analysis.
   *
   * Session Analysis:
   * - this-session intelligence
   * - repeatability
   * - fatigue/drop-off
   * - optimal set length
   * - best vs average
   *
   * Progress Over Time:
   * - cross-session progress
   * - trend messaging
   * - recommendations
   * - feedback
   * 
   * Technique Layer:
   * - wheelie analysis
   * - data quality
   * - phase consistency
   * - technique → outcome links
   */

  interface Props {
    sessionReport: any;
    crossSessionReport?: any | null;
    runs?: any[];
    detailLevel?: 'grom' | 'rider' | 'elite' | 'coach';
    showSessionSection?: boolean;
    showProgressSection?: boolean;
    showTechniqueSection?: boolean;
    showCoachDetail?: boolean;
    sessionTitle?: string;
    progressTitle?: string;
  }

  let {
    sessionReport,
    crossSessionReport = null,
    runs = [],
    detailLevel = 'rider',
    showSessionSection = true,
    showProgressSection = true,
    showTechniqueSection = true,
    showCoachDetail = true,
    sessionTitle = "Today's Session",
    progressTitle = "Progress Over Time"
  }: Props = $props();

  let hasProgress = $derived(Boolean(crossSessionReport));
  let hasTechniqueData = $derived(runs.length > 0);
  let isAdvanced = $derived(detailLevel === 'elite' || detailLevel === 'coach');
</script>

<section class="space-y-4">
  <header class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
    <p class="text-xs uppercase tracking-wide text-[#f5a623]">Training Insights</p>
    <h2 class="mt-1 text-lg font-bold text-[#f0ece4]">Performance Coach</h2>

    {#if detailLevel === 'grom'}
      <p class="mt-2 text-sm text-[#9a8f7a]">
        A simple view of how today went and what to focus on next.
      </p>
    {:else if detailLevel === 'coach'}
      <p class="mt-2 text-sm text-[#9a8f7a]">
        Session decisions, progress trends, and coaching evidence in one place.
      </p>
    {:else}
      <p class="mt-2 text-sm text-[#9a8f7a]">
        Session quality and longer-term progress, without mixing the two systems.
      </p>
    {/if}
  </header>

  {#if showSessionSection && sessionReport}
    <section class="space-y-3">
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-xs uppercase tracking-wide text-[#f5a623]">Session Analysis</p>
          <h3 class="text-lg font-semibold text-[#f0ece4]">{sessionTitle}</h3>
        </div>
        <span class="rounded-full bg-[#221c18] border border-[#221c18] px-3 py-1 text-xs text-[#9a8f7a]">
          single session
        </span>
      </div>

      <SessionIntelligencePanel report={sessionReport} />
    </section>
  {/if}

  {#if showTechniqueSection && hasTechniqueData}
    <section class="space-y-3">
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-xs uppercase tracking-wide text-[#f5a623]">Technique Layer</p>
          <h3 class="text-lg font-semibold text-[#f0ece4]">Launch & Control Analysis</h3>
        </div>
        <span class="rounded-full bg-[#221c18] border border-[#221c18] px-3 py-1 text-xs text-[#9a8f7a]">
          technique → outcome
        </span>
      </div>

      <TechniqueAnalysisPanel {runs} {detailLevel} />
    </section>
  {/if}

  {#if showProgressSection}
    <section class="space-y-3">
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-xs uppercase tracking-wide text-[#3de8c8]">v8.1</p>
          <h3 class="text-lg font-semibold text-[#f0ece4]">{progressTitle}</h3>
        </div>
        <span class="rounded-full bg-[#221c18] border border-[#221c18] px-3 py-1 text-xs text-[#9a8f7a]">
          cross-session
        </span>
      </div>

      {#if hasProgress}
        <CrossSessionProgressPanel report={crossSessionReport} {detailLevel} />
      {:else}
        <div class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
          <h4 class="font-semibold text-[#f0ece4]">Progress trends not ready yet</h4>
          <p class="mt-1 text-sm text-[#9a8f7a]">
            Keep logging sessions. Cross-session intelligence appears once enough session summaries are available.
          </p>
        </div>
      {/if}
    </section>
  {/if}

  {#if showCoachDetail && isAdvanced}
    <section class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
      <p class="text-xs uppercase tracking-wide text-[#f5a623]">Coach framing</p>
      <h3 class="mt-1 text-lg font-semibold text-[#f0ece4]">How to read this page</h3>

      <div class="mt-3 grid gap-3 md:grid-cols-2">
        <div class="rounded-xl bg-[#0a0809] border border-[#221c18] p-3">
          <h4 class="font-semibold text-[#f5a623]">This Session</h4>
          <p class="mt-1 text-sm text-[#9a8f7a]">
            Use this to decide whether today's set length, repeatability, fatigue, and execution were useful.
          </p>
        </div>

        <div class="rounded-xl bg-[#0a0809] border border-[#221c18] p-3">
          <h4 class="font-semibold text-[#3de8c8]">Progress Over Time</h4>
          <p class="mt-1 text-sm text-[#9a8f7a]">
            Use this to decide whether recent training is moving the rider in the right direction.
          </p>
        </div>
      </div>
    </section>
  {/if}
</section>

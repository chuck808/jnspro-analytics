<script lang="ts">
  let { label, value }: { label: string; value?: number | null } = $props();

  const display = $derived(typeof value === 'number' ? `${Math.round(value)}/100` : '—');
  const tone = $derived(typeof value !== 'number' ? 'unknown' : value >= 80 ? 'strong' : value >= 65 ? 'good' : value >= 50 ? 'developing' : 'needs-work');
</script>

<div class="rounded-xl border border-white/10 bg-white/5 p-4">
  <p class="text-xs uppercase tracking-wide text-white/45">{label}</p>
  <p class="mt-2 text-2xl font-bold {tone === 'strong' ? 'text-[#3de8c8]' : tone === 'needs-work' ? 'text-[#f5a623]' : 'text-white'}">{display}</p>
  <p class="mt-1 text-xs text-white/40">{tone}</p>
</div>

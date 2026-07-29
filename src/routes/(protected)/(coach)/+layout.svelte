<script lang="ts">
	let { children } = $props();
</script>

<!-- Coach section wrapper — inherits protected layout (sidebar + navbar) -->
<div class="mb-4 space-y-1">
	<div class="flex items-center gap-2 px-1">
		<span
			class="rounded border border-[#f5a623]/40 bg-[#f5a623]/10 px-2
                     py-0.5 text-xs font-semibold text-[#f5a623]"
		>
			Coach
		</span>
		<span class="text-xs text-[#4a4038]">Your linked riders</span>
	</div>
</div>

{@render children()}

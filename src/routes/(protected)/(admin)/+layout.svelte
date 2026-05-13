<script lang="ts">
    let { children } = $props();
</script>

<!-- Admin section wrapper — inherits protected layout (sidebar + navbar) -->
<!-- Just adds a subtle admin context indicator -->
<div class="space-y-1 mb-4">
    <div class="flex items-center gap-2 px-1">
        <span class="px-2 py-0.5 text-xs font-semibold rounded
                     bg-red-900/20 text-red-400 border border-red-800/40">
            Admin
        </span>
        <span class="text-xs text-[#4a4038]">System management</span>
    </div>
</div>

{@render children()}

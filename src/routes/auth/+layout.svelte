<script lang="ts">
    let { children } = $props();
</script>

<div class="min-h-screen bg-[#0a0809] flex flex-col items-center justify-center px-4 py-12">

    <!-- Logo / Brand -->
    <div class="mb-8 text-center">
        <a href="/" class="inline-flex items-center gap-3">
            <img src="/logo-icon-dark.svg" alt="JNS Pro Systems" class="w-12 h-12" />
            <span class="text-xl font-bold text-[#f5a623]">AppGatePro</span>
        </a>
        <p class="mt-2 text-sm text-[#9a8f7a]">Analytics Platform</p>
    </div>

    <!-- Card -->
    <div class="w-full max-w-md bg-[#131010] border border-[#221c18] rounded-xl shadow-2xl p-8">
        {@render children()}
    </div>

    <!-- Footer -->
    <p class="mt-8 text-xs text-[#4a4038]">
        &copy; {new Date().getFullYear()} JNS Pro Systems. All rights reserved.
    </p>

</div>

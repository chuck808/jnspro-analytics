<script lang="ts">
    let { data } = $props();
    
    // Format dates nicely
    function formatDate(dateString: string) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-GB', {
            dateStyle: 'full',
            timeStyle: 'short'
        }).format(date);
    }
</script>

<svelte:head>
    <title>Scheduled Maintenance — AppGatePro</title>
</svelte:head>

<div class="min-h-screen bg-[#0a0809] flex items-center justify-center p-4">
    <div class="max-w-2xl w-full">
        <!-- Logo -->
        <div class="flex justify-center mb-8">
            <img src="/logo-header-dark.svg" alt="AppGatePro" class="h-16 w-auto" />
        </div>

        <!-- Maintenance Icon -->
        <div class="w-24 h-24 bg-[#f5a623]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg class="w-12 h-12 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
        </div>

        <!-- Content -->
        <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-[#f0ece4] mb-3">{data.maintenance?.title || 'Scheduled Maintenance'}</h1>
            <p class="text-lg text-[#9a8f7a] mb-6">
                {data.maintenance?.description || 'We\'re performing scheduled maintenance to improve your experience.'}
            </p>

            {#if data.maintenance}
                <div class="bg-[#131010] border border-[#221c18] rounded-xl p-6 max-w-md mx-auto">
                    <div class="space-y-3">
                        <div>
                            <p class="text-xs text-[#4a4038] uppercase tracking-wider mb-1">Started</p>
                            <p class="text-sm text-[#f0ece4]">{formatDate(data.maintenance.start_time)}</p>
                        </div>
                        <div class="border-t border-[#221c18] pt-3">
                            <p class="text-xs text-[#4a4038] uppercase tracking-wider mb-1">Expected to End</p>
                            <p class="text-sm text-[#f0ece4]">{formatDate(data.maintenance.end_time)}</p>
                        </div>
                    </div>
                </div>
            {/if}
        </div>

        <!-- Status Updates -->
        <div class="bg-[#131010] border border-[#221c18] rounded-xl p-6 mb-6">
            <h2 class="text-sm font-semibold text-[#f0ece4] mb-4 flex items-center gap-2">
                <svg class="w-4 h-4 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                What to Expect
            </h2>
            <ul class="space-y-2 text-sm text-[#9a8f7a]">
                <li class="flex items-start gap-2">
                    <svg class="w-5 h-5 text-[#f5a623] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    <span>All your data is safe and secure</span>
                </li>
                <li class="flex items-start gap-2">
                    <svg class="w-5 h-5 text-[#f5a623] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    <span>We're upgrading our systems for better performance</span>
                </li>
                <li class="flex items-start gap-2">
                    <svg class="w-5 h-5 text-[#f5a623] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    <span>We'll be back online shortly</span>
                </li>
            </ul>
        </div>

        <!-- Auto-refresh notice -->
        <div class="text-center">
            <p class="text-xs text-[#4a4038] mb-4">
                This page will automatically refresh when maintenance is complete.
            </p>
            <button
                onclick={() => window.location.reload()}
                class="px-6 py-2.5 bg-[#f5a623] hover:bg-[#c97e0a] text-[#0a0809] font-semibold rounded-lg transition-colors text-sm"
            >
                Check Status
            </button>
        </div>

        <!-- Footer -->
        <div class="mt-12 pt-6 border-t border-[#221c18] text-center">
            <p class="text-xs text-[#4a4038]">
                © {new Date().getFullYear()} JNS Pro Systems. All rights reserved.
            </p>
        </div>
    </div>
</div>

<style>
    /* Auto-refresh every 30 seconds */
    :global(body) {
        animation: autoRefresh 30s infinite;
    }
    
    @keyframes autoRefresh {
        99% { opacity: 1; }
        100% { opacity: 1; }
    }
</style>

<svelte:window onload={() => setTimeout(() => window.location.reload(), 30000)} />

<script lang="ts">
    import type { PageData } from './$types';
    let { data }: { data: PageData } = $props();
</script>

<svelte:head>
    <title>Email Verified — AppGatePro Analytics</title>
</svelte:head>

<div class="text-center py-4">
    {#if data.isAuthenticated}
        <div class="w-16 h-16 bg-[#3de8c8]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-[#3de8c8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
        </div>
        <h2 class="text-xl font-bold text-[#f0ece4] mb-2">Email verified!</h2>
        <p class="text-sm text-[#9a8f7a] mb-6">
            Your account is active. Let's get your profile set up.
        </p>
        <a
            href="/profile"
            class="inline-block py-2.5 px-6 bg-[#f5a623] hover:bg-[#c97e0a] text-[#0a0809]
                   font-semibold rounded-lg transition-colors text-sm"
        >
            Set up profile
        </a>
    {:else}
        <div class="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
        </div>
        <h2 class="text-xl font-bold text-[#f0ece4] mb-2">Verification failed</h2>
        <p class="text-sm text-[#9a8f7a] mb-6">
            The link may have expired. Request a new one.
        </p>
        <a href="/auth/sign-in" class="text-sm text-[#f5a623] hover:text-[#c97e0a] transition-colors">
            Back to sign in
        </a>
    {/if}
</div>

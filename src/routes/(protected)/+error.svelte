<script lang="ts">
    import { page } from '$app/stores';
</script>

<svelte:head>
    <title>Error {$page.status} — AppGatePro Analytics</title>
</svelte:head>

<div class="min-h-screen bg-[#0a0809] text-[#f0ece4] flex items-center justify-center px-6">
    <div class="max-w-md w-full text-center">
        
        <!-- Error Icon -->
        <div class="mb-8">
            <div class="w-20 h-20 mx-auto bg-[#ff4444]/10 border border-[#ff4444]/20 rounded-full flex items-center justify-center">
                <svg class="w-10 h-10 text-[#ff6b3d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
            </div>
        </div>

        <!-- Error Code -->
        <h1 class="text-6xl font-bold text-[#f5a623] mb-4">
            {$page.status}
        </h1>

        <!-- Error Message -->
        <h2 class="text-2xl font-semibold text-[#f0ece4] mb-3">
            {#if $page.status === 401}
                Authentication Required
            {:else if $page.status === 403}
                Access Denied
            {:else if $page.status === 404}
                Page Not Found
            {:else if $page.status === 500}
                Server Error
            {:else}
                Something Went Wrong
            {/if}
        </h2>

        <p class="text-[#9a8f7a] mb-8 leading-relaxed">
            {#if $page.error?.message}
                {$page.error.message}
            {:else if $page.status === 401}
                You need to sign in to access this page.
            {:else if $page.status === 403}
                You don't have permission to access this resource.
            {:else if $page.status === 404}
                The page you're looking for doesn't exist.
            {:else if $page.status === 500}
                We're experiencing technical difficulties. Please try again later.
            {:else}
                An unexpected error occurred while loading this page.
            {/if}
        </p>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
            {#if $page.status === 401}
                <a href="/auth/sign-in" 
                   class="px-6 py-3 bg-[#f5a623] hover:bg-[#c97e0a] text-[#0a0809] font-semibold rounded-lg transition-colors">
                    Sign In
                </a>
            {/if}
            <a href="/sessions" 
               class="px-6 py-3 bg-[#131010] hover:bg-[#171210] border border-[#221c18] text-[#f0ece4] font-semibold rounded-lg transition-colors">
                Go to Sessions
            </a>
            <a href="/" 
               class="px-6 py-3 bg-[#131010] hover:bg-[#171210] border border-[#221c18] text-[#f0ece4] font-semibold rounded-lg transition-colors">
                Go Home
            </a>
        </div>

        <!-- Support Link -->
        {#if $page.status >= 500}
            <p class="text-sm text-[#6b5f4d] mt-8">
                If this problem persists, please <a href="/contact" class="text-[#f5a623] hover:underline">contact support</a>.
            </p>
        {/if}

    </div>
</div>

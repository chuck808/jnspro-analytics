<script lang="ts">
    import type { ActionData } from './$types';

    let { form }: { form: ActionData } = $props();
    let loading = $state(false);
</script>

<svelte:head>
    <title>Forgot Password — AppGatePro Analytics</title>
</svelte:head>

{#if form?.success}
    <div class="text-center py-4">
        <div class="w-16 h-16 bg-[#f5a623]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
        </div>
        <h2 class="text-xl font-bold text-[#f0ece4] mb-2">Check your email</h2>
        <p class="text-sm text-[#9a8f7a] mb-6">
            If an account exists for <span class="text-[#f5a623]">{form.email}</span>,
            you'll receive a password reset link shortly.
        </p>
        <a href="/auth/sign-in" class="text-sm text-[#f5a623] hover:text-[#c97e0a] transition-colors">
            Back to sign in
        </a>
    </div>
{:else}
    <h1 class="text-2xl font-bold text-[#f0ece4] mb-1">Reset your password</h1>
    <p class="text-sm text-[#9a8f7a] mb-8">
        Enter your email and we'll send you a reset link
    </p>

    {#if form?.error}
        <div class="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
            {form.error}
        </div>
    {/if}

    <form method="POST" onsubmit={() => loading = true} class="space-y-5">
        <div>
            <label for="email" class="block text-sm font-medium text-[#9a8f7a] mb-1.5">
                Email address
            </label>
            <input
                id="email"
                name="email"
                type="email"
                autocomplete="email"
                required
                class="w-full px-4 py-2.5 bg-[#0a0809] border border-[#221c18] rounded-lg text-[#f0ece4]
                       placeholder-[#4a4038] focus:outline-none focus:border-[#f5a623] focus:ring-1
                       focus:ring-[#f5a623] transition-colors text-sm"
                placeholder="you@example.com"
            />
        </div>

        <button
            type="submit"
            disabled={loading}
            class="w-full py-2.5 px-4 bg-[#f5a623] hover:bg-[#c97e0a] disabled:opacity-50
                   disabled:cursor-not-allowed text-[#0a0809] font-semibold rounded-lg
                   transition-colors text-sm"
        >
            {loading ? 'Sending...' : 'Send reset link'}
        </button>
    </form>

    <p class="mt-6 text-center text-sm text-[#9a8f7a]">
        Remember your password?
        <a href="/auth/sign-in" class="text-[#f5a623] hover:text-[#c97e0a] font-medium transition-colors ml-1">
            Sign in
        </a>
    </p>
{/if}

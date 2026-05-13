<script lang="ts">
    import type { ActionData } from './$types';

    let { form }: { form?: ActionData } = $props();
    let loading = $state(false);
    let showPassword = $state(false);
</script>

<svelte:head>
    <title>Reset Password — AppGatePro Analytics</title>
</svelte:head>

<h1 class="text-2xl font-bold text-[#f0ece4] mb-1">Set new password</h1>
<p class="text-sm text-[#9a8f7a] mb-8">Choose a strong password for your account</p>

{#if form?.error}
    <div class="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
        {form.error}
    </div>
{/if}

<form method="POST" onsubmit={() => loading = true} class="space-y-5">
    <div>
        <label for="password" class="block text-sm font-medium text-[#9a8f7a] mb-1.5">
            New password
        </label>
        <div class="relative">
            <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autocomplete="new-password"
                required
                minlength="8"
                class="w-full px-4 py-2.5 bg-[#0a0809] border border-[#221c18] rounded-lg text-[#f0ece4]
                       placeholder-[#4a4038] focus:outline-none focus:border-[#f5a623] focus:ring-1
                       focus:ring-[#f5a623] transition-colors text-sm pr-10"
                placeholder="Min. 8 characters"
            />
            <button
                type="button"
                onclick={() => showPassword = !showPassword}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                class="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a4038] hover:text-[#9a8f7a] transition-colors"
            >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
            </button>
        </div>
    </div>

    <div>
        <label for="confirmPassword" class="block text-sm font-medium text-[#9a8f7a] mb-1.5">
            Confirm new password
        </label>
        <input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            autocomplete="new-password"
            required
            class="w-full px-4 py-2.5 bg-[#0a0809] border border-[#221c18] rounded-lg text-[#f0ece4]
                   placeholder-[#4a4038] focus:outline-none focus:border-[#f5a623] focus:ring-1
                   focus:ring-[#f5a623] transition-colors text-sm"
            placeholder="••••••••"
        />
    </div>

    <button
        type="submit"
        disabled={loading}
        class="w-full py-2.5 px-4 bg-[#f5a623] hover:bg-[#c97e0a] disabled:opacity-50
               disabled:cursor-not-allowed text-[#0a0809] font-semibold rounded-lg
               transition-colors text-sm"
    >
        {loading ? 'Updating...' : 'Update password'}
    </button>
</form>

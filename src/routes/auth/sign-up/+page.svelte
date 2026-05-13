<script lang="ts">
    import type { ActionData } from './$types';

    let { form }: { form: ActionData } = $props();

    let loading = $state(false);
    let showPassword = $state(false);
</script>

<svelte:head>
    <title>Create Account — AppGatePro Analytics</title>
</svelte:head>

{#if form?.success}
    <!-- Success state -->
    <div class="text-center py-4">
        <div class="w-16 h-16 bg-[#3de8c8]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-[#3de8c8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
        </div>
        <h2 class="text-xl font-bold text-[#f0ece4] mb-2">Check your email</h2>
        <p class="text-sm text-[#9a8f7a] mb-1">We've sent a verification link to</p>
        <p class="text-sm font-medium text-[#f5a623] mb-6">{form.email}</p>
        <p class="text-xs text-[#4a4038]">
            Click the link in the email to activate your account.
            Check your spam folder if you don't see it.
        </p>
    </div>
{:else}
    <h1 class="text-2xl font-bold text-[#f0ece4] mb-1">Create your account</h1>
    <p class="text-sm text-[#9a8f7a] mb-8">Start tracking your BMX performance</p>

    {#if form?.error}
        <div class="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
            {form.error}
        </div>
    {/if}

    <form method="POST" onsubmit={() => loading = true} class="space-y-5">

        <!-- Name -->
        <div>
            <label for="name" class="block text-sm font-medium text-[#9a8f7a] mb-1.5">
                Full name
            </label>
            <input
                id="name"
                name="name"
                type="text"
                autocomplete="name"
                required
                class="w-full px-4 py-2.5 bg-[#0a0809] border border-[#221c18] rounded-lg text-[#f0ece4]
                       placeholder-[#4a4038] focus:outline-none focus:border-[#f5a623] focus:ring-1
                       focus:ring-[#f5a623] transition-colors text-sm"
                placeholder="Jamie Norris-Still"
            />
        </div>

        <!-- Email -->
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

        <!-- Password -->
        <div>
            <label for="password" class="block text-sm font-medium text-[#9a8f7a] mb-1.5">
                Password
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
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a4038] hover:text-[#9a8f7a] transition-colors"
                >
                    {#if showPassword}
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21"/>
                        </svg>
                    {:else}
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                    {/if}
                </button>
            </div>
        </div>

        <!-- Confirm Password -->
        <div>
            <label for="confirmPassword" class="block text-sm font-medium text-[#9a8f7a] mb-1.5">
                Confirm password
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

        <!-- Submit -->
        <button
            type="submit"
            disabled={loading}
            class="w-full py-2.5 px-4 bg-[#f5a623] hover:bg-[#c97e0a] disabled:opacity-50
                   disabled:cursor-not-allowed text-[#0a0809] font-semibold rounded-lg
                   transition-colors text-sm mt-2"
        >
            {#if loading}
                <span class="flex items-center justify-center gap-2">
                    <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Creating account...
                </span>
            {:else}
                Create account
            {/if}
        </button>

        <p class="text-xs text-center text-[#4a4038] mt-2">
            By creating an account you agree to our
            <a href="/terms" class="text-[#9a8f7a] hover:text-[#f5a623] transition-colors">Terms of Service</a>
        </p>
    </form>

    <p class="mt-6 text-center text-sm text-[#9a8f7a]">
        Already have an account?
        <a href="/auth/sign-in" class="text-[#f5a623] hover:text-[#c97e0a] font-medium transition-colors ml-1">
            Sign in
        </a>
    </p>
{/if}

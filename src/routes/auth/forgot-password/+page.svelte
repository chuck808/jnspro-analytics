<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let loading = $state(false);
</script>

<svelte:head>
	<title>Forgot Password — AppGatePro Analytics</title>
</svelte:head>

{#if form?.success}
	<div class="py-4 text-center">
		<div
			class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f5a623]/10"
		>
			<svg class="h-8 w-8 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
				/>
			</svg>
		</div>
		<h2 class="mb-2 text-xl font-bold text-[#f0ece4]">Check your email</h2>
		<p class="mb-6 text-sm text-[#9a8f7a]">
			If an account exists for <span class="text-[#f5a623]">{form.email}</span>, you'll receive a
			password reset link shortly.
		</p>
		<a href="/auth/sign-in" class="text-sm text-[#f5a623] transition-colors hover:text-[#c97e0a]">
			Back to sign in
		</a>
	</div>
{:else}
	<h1 class="mb-1 text-2xl font-bold text-[#f0ece4]">Reset your password</h1>
	<p class="mb-8 text-sm text-[#9a8f7a]">Enter your email and we'll send you a reset link</p>

	{#if form?.error}
		<div class="mb-6 rounded-lg border border-red-800 bg-red-900/20 p-4 text-sm text-red-400">
			{form.error}
		</div>
	{/if}

	<form method="POST" onsubmit={() => (loading = true)} class="space-y-5">
		<div>
			<label for="email" class="mb-1.5 block text-sm font-medium text-[#9a8f7a]">
				Email address
			</label>
			<input
				id="email"
				name="email"
				type="email"
				autocomplete="email"
				required
				class="w-full rounded-lg border border-[#221c18] bg-[#0a0809] px-4 py-2.5 text-sm
                       text-[#f0ece4] placeholder-[#4a4038] transition-colors focus:border-[#f5a623]
                       focus:ring-1 focus:ring-[#f5a623] focus:outline-none"
				placeholder="you@example.com"
			/>
		</div>

		<button
			type="submit"
			disabled={loading}
			class="w-full rounded-lg bg-[#f5a623] px-4 py-2.5 text-sm
                   font-semibold text-[#0a0809] transition-colors hover:bg-[#c97e0a]
                   disabled:cursor-not-allowed disabled:opacity-50"
		>
			{loading ? 'Sending...' : 'Send reset link'}
		</button>
	</form>

	<p class="mt-6 text-center text-sm text-[#9a8f7a]">
		Remember your password?
		<a
			href="/auth/sign-in"
			class="ml-1 font-medium text-[#f5a623] transition-colors hover:text-[#c97e0a]"
		>
			Sign in
		</a>
	</p>
{/if}

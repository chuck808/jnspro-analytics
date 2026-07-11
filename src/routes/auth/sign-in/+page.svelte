<script lang="ts">
	import { goto } from '$app/navigation';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let loading = $state(false);
	let showPassword = $state(false);

	$effect(() => {
		if (form && 'success' in form && form.success && 'redirectTo' in form) {
			goto((form.redirectTo as string) ?? '/dashboard');
		}
	});
</script>

<svelte:head>
	<title>Sign In — AppGatePro Analytics</title>
</svelte:head>

<div>
	<h1 class="mb-1 text-2xl font-bold text-[#f0ece4]">Welcome back</h1>
	<p class="mb-8 text-sm text-[#9a8f7a]">Sign in to your AppGatePro account</p>

	{#if form?.error}
		<div class="mb-6 rounded-lg border border-red-800 bg-red-900/20 p-4 text-sm text-red-400">
			{form.error}
		</div>
	{/if}

	<form method="POST" onsubmit={() => (loading = true)} class="space-y-5">
		<input type="hidden" name="redirectTo" value={data.redirectTo} />

		<!-- Email -->
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

		<!-- Password -->
		<div>
			<div class="mb-1.5 flex items-center justify-between">
				<label for="password" class="block text-sm font-medium text-[#9a8f7a]"> Password </label>
				<a
					href="/auth/forgot-password"
					class="text-xs text-[#f5a623] transition-colors hover:text-[#c97e0a]"
				>
					Forgot password?
				</a>
			</div>
			<div class="relative">
				<input
					id="password"
					name="password"
					type={showPassword ? 'text' : 'password'}
					autocomplete="current-password"
					required
					class="w-full rounded-lg border border-[#221c18] bg-[#0a0809] px-4 py-2.5 pr-10
                           text-sm text-[#f0ece4] placeholder-[#4a4038] transition-colors
                           focus:border-[#f5a623] focus:ring-1 focus:ring-[#f5a623] focus:outline-none"
					placeholder="••••••••"
				/>
				<button
					type="button"
					onclick={() => (showPassword = !showPassword)}
					class="absolute top-1/2 right-3 -translate-y-1/2 text-[#4a4038] transition-colors hover:text-[#9a8f7a]"
				>
					{#if showPassword}
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21"
							/>
						</svg>
					{:else}
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
							/>
						</svg>
					{/if}
				</button>
			</div>
		</div>

		<!-- Submit -->
		<button
			type="submit"
			disabled={loading}
			class="mt-2 w-full rounded-lg bg-[#f5a623] px-4 py-2.5
                   text-sm font-semibold text-[#0a0809] transition-colors
                   hover:bg-[#c97e0a] disabled:cursor-not-allowed disabled:opacity-50"
		>
			{#if loading}
				<span class="flex items-center justify-center gap-2">
					<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
						<circle
							class="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-width="4"
						/>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
						/>
					</svg>
					Signing in...
				</span>
			{:else}
				Sign in
			{/if}
		</button>
	</form>

	<p class="mt-6 text-center text-sm text-[#9a8f7a]">
		Don't have an account?
		<a
			href="/auth/sign-up"
			class="ml-1 font-medium text-[#f5a623] transition-colors hover:text-[#c97e0a]"
		>
			Create one
		</a>
	</p>
</div>

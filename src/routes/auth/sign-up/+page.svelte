<script lang="ts">
	import type { ActionData } from './$types';
	import { MINOR_CONSENT_AGE_THRESHOLD, calculateAge } from '$lib/consent';

	let { form }: { form: ActionData } = $props();

	let loading = $state(false);
	let showPassword = $state(false);
	let dateOfBirth = $state('');

	let isMinor = $derived(
		dateOfBirth ? calculateAge(dateOfBirth) < MINOR_CONSENT_AGE_THRESHOLD : false
	);

	// Reasonable bounds for the date input: no future dates, nothing older than 120 years.
	let maxDob = new Date().toISOString().slice(0, 10);
	let minDob = new Date(new Date().getFullYear() - 120, 0, 1).toISOString().slice(0, 10);
</script>

<svelte:head>
	<title>Create Account — AppGatePro Analytics</title>
</svelte:head>

{#if form?.success}
	<!-- Success state -->
	<div class="py-4 text-center">
		<div
			class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#3de8c8]/10"
		>
			<svg class="h-8 w-8 text-[#3de8c8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
			</svg>
		</div>
		<h2 class="mb-2 text-xl font-bold text-[#f0ece4]">Check your email</h2>
		<p class="mb-1 text-sm text-[#9a8f7a]">We've sent a verification link to</p>
		<p class="mb-6 text-sm font-medium text-[#f5a623]">{form.email}</p>
		<p class="text-xs text-[#4a4038]">
			Click the link in the email to activate your account. Check your spam folder if you don't see
			it.
		</p>
		{#if form.isMinor}
			<p class="mt-4 rounded-lg border border-[#f5a623]/20 bg-[#131010] p-3 text-xs text-[#9a8f7a]">
				We've also sent a consent request to the parent/guardian email you provided. The account
				stays inactive until they confirm.
			</p>
		{/if}
	</div>
{:else}
	<h1 class="mb-1 text-2xl font-bold text-[#f0ece4]">Create your account</h1>
	<p class="mb-8 text-sm text-[#9a8f7a]">Start tracking your BMX performance</p>

	{#if form?.error}
		<div class="mb-6 rounded-lg border border-red-800 bg-red-900/20 p-4 text-sm text-red-400">
			{form.error}
		</div>
	{/if}

	<form method="POST" onsubmit={() => (loading = true)} class="space-y-5">
		<!-- Name -->
		<div>
			<label for="name" class="mb-1.5 block text-sm font-medium text-[#9a8f7a]"> Full name </label>
			<input
				id="name"
				name="name"
				type="text"
				autocomplete="name"
				required
				class="w-full rounded-lg border border-[#221c18] bg-[#0a0809] px-4 py-2.5 text-sm
                       text-[#f0ece4] placeholder-[#4a4038] transition-colors focus:border-[#f5a623]
                       focus:ring-1 focus:ring-[#f5a623] focus:outline-none"
				placeholder="Jamie Norris-Still"
			/>
		</div>

		<!-- Date of birth -->
		<div>
			<label for="dateOfBirth" class="mb-1.5 block text-sm font-medium text-[#9a8f7a]">
				Date of birth
			</label>
			<input
				id="dateOfBirth"
				name="dateOfBirth"
				type="date"
				autocomplete="bday"
				required
				min={minDob}
				max={maxDob}
				bind:value={dateOfBirth}
				class="w-full rounded-lg border border-[#221c18] bg-[#0a0809] px-4 py-2.5 text-sm
                       text-[#f0ece4] transition-colors focus:border-[#f5a623]
                       focus:ring-1 focus:ring-[#f5a623] focus:outline-none"
			/>
		</div>

		{#if isMinor}
			<div>
				<label for="parentEmail" class="mb-1.5 block text-sm font-medium text-[#9a8f7a]">
					Parent or guardian's email
				</label>
				<input
					id="parentEmail"
					name="parentEmail"
					type="email"
					required
					class="w-full rounded-lg border border-[#221c18] bg-[#0a0809] px-4 py-2.5 text-sm
                           text-[#f0ece4] placeholder-[#4a4038] transition-colors focus:border-[#f5a623]
                           focus:ring-1 focus:ring-[#f5a623] focus:outline-none"
					placeholder="parent@example.com"
				/>
				<p class="mt-1.5 text-xs text-[#4a4038]">
					Riders under {MINOR_CONSENT_AGE_THRESHOLD} need a parent or guardian to confirm consent before
					the account can be used.
				</p>
			</div>
		{/if}

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
			<label for="password" class="mb-1.5 block text-sm font-medium text-[#9a8f7a]">
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
					class="w-full rounded-lg border border-[#221c18] bg-[#0a0809] px-4 py-2.5 pr-10
                           text-sm text-[#f0ece4] placeholder-[#4a4038] transition-colors
                           focus:border-[#f5a623] focus:ring-1 focus:ring-[#f5a623] focus:outline-none"
					placeholder="Min. 8 characters"
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

		<!-- Confirm Password -->
		<div>
			<label for="confirmPassword" class="mb-1.5 block text-sm font-medium text-[#9a8f7a]">
				Confirm password
			</label>
			<input
				id="confirmPassword"
				name="confirmPassword"
				type={showPassword ? 'text' : 'password'}
				autocomplete="new-password"
				required
				class="w-full rounded-lg border border-[#221c18] bg-[#0a0809] px-4 py-2.5 text-sm
                       text-[#f0ece4] placeholder-[#4a4038] transition-colors focus:border-[#f5a623]
                       focus:ring-1 focus:ring-[#f5a623] focus:outline-none"
				placeholder="••••••••"
			/>
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
					Creating account...
				</span>
			{:else}
				Create account
			{/if}
		</button>

		<p class="mt-2 text-center text-xs text-[#4a4038]">
			By creating an account you agree to our
			<a href="/terms" class="text-[#9a8f7a] transition-colors hover:text-[#f5a623]"
				>Terms of Service</a
			>
		</p>
	</form>

	<p class="mt-6 text-center text-sm text-[#9a8f7a]">
		Already have an account?
		<a
			href="/auth/sign-in"
			class="ml-1 font-medium text-[#f5a623] transition-colors hover:text-[#c97e0a]"
		>
			Sign in
		</a>
	</p>
{/if}

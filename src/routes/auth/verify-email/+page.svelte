<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Email Verified — AppGatePro Analytics</title>
</svelte:head>

<div class="py-4 text-center">
	{#if data.isAuthenticated}
		<div
			class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#3de8c8]/10"
		>
			<svg class="h-8 w-8 text-[#3de8c8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
			</svg>
		</div>
		<h2 class="mb-2 text-xl font-bold text-[#f0ece4]">Email verified!</h2>
		<p class="mb-6 text-sm text-[#9a8f7a]">
			Your account is active. Let's get your profile set up.
		</p>
		<a
			href="/profile"
			class="inline-block rounded-lg bg-[#f5a623] px-6 py-2.5 text-sm
                   font-semibold text-[#0a0809] transition-colors hover:bg-[#c97e0a]"
		>
			Set up profile
		</a>
	{:else}
		<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-900/20">
			<svg class="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M6 18L18 6M6 6l12 12"
				/>
			</svg>
		</div>
		<h2 class="mb-2 text-xl font-bold text-[#f0ece4]">Verification failed</h2>
		<p class="mb-6 text-sm text-[#9a8f7a]">The link may have expired. Request a new one.</p>
		<a href="/auth/sign-in" class="text-sm text-[#f5a623] transition-colors hover:text-[#c97e0a]">
			Back to sign in
		</a>
	{/if}
</div>

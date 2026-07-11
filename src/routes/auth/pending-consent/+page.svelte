<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Awaiting Consent — AppGatePro Analytics</title>
</svelte:head>

<div class="py-4 text-center">
	<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f5a623]/10">
		<svg class="h-8 w-8 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
	</div>

	{#if data.status === 'denied'}
		<h1 class="mb-2 text-xl font-bold text-[#f0ece4]">Consent was declined</h1>
		<p class="text-sm text-[#9a8f7a]">
			Your parent or guardian did not confirm consent, so this account can't be used. If you think
			this is a mistake, contact <a href="/contact" class="text-[#f5a623] hover:underline"
				>support</a
			>.
		</p>
	{:else}
		<h1 class="mb-2 text-xl font-bold text-[#f0ece4]">Waiting on parental consent</h1>
		<p class="mb-1 text-sm text-[#9a8f7a]">
			We've sent a consent request to your parent or guardian's email
			{#if data.parentEmail}
				<span class="font-medium text-[#f5a623]">({data.parentEmail})</span>
			{/if}.
		</p>
		<p class="text-sm text-[#9a8f7a]">
			Your account will unlock automatically once they confirm. Ask them to check their spam folder
			if it doesn't arrive.
		</p>
	{/if}
</div>

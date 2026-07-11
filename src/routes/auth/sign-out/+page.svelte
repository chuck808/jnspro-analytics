<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';

	let formEl: HTMLFormElement;
	let loading = $state(false);

	onMount(() => {
		// Auto-submit the form when the page loads
		if (formEl) {
			formEl.requestSubmit();
		}
	});

	const handleSignOut = () => {
		loading = true;
		return async ({ update }: { update: () => Promise<void> }) => {
			await update();
		};
	};
</script>

<svelte:head>
	<title>Signing out...</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-[#0a0809] p-4">
	<div class="text-center">
		<div
			class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full border border-[#f5a623]/20 bg-[#f5a623]/10"
		>
			<svg
				class="h-8 w-8 animate-spin text-[#f5a623]"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
				></path>
			</svg>
		</div>
		<h1 class="mb-2 text-xl font-semibold text-[#f0ece4]">Signing out...</h1>
		<p class="text-sm text-[#9a8f7a]">Please wait while we sign you out</p>

		<!-- Hidden form that auto-submits -->
		<form method="POST" bind:this={formEl} use:enhance={handleSignOut} class="hidden">
			<button type="submit">Sign out</button>
		</form>
	</div>
</div>

<script lang="ts">
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let submitting = $state(false);
</script>

<svelte:head>
	<title>Parental Consent — AppGatePro Analytics</title>
</svelte:head>

{#if form?.success}
	<div class="py-4 text-center">
		<div
			class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#3de8c8]/10"
		>
			<svg class="h-8 w-8 text-[#3de8c8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
			</svg>
		</div>
		<h2 class="mb-2 text-xl font-bold text-[#f0ece4]">
			{form.decision === 'approved' ? 'Thank you' : 'Response recorded'}
		</h2>
		<p class="text-sm text-[#9a8f7a]">
			{#if form.decision === 'approved'}
				You've confirmed consent — the rider's account is now active.
			{:else}
				You've declined consent — the rider's account will remain inactive.
			{/if}
		</p>
	</div>
{:else if !data.valid}
	<div class="py-4 text-center">
		<h1 class="mb-2 text-xl font-bold text-[#f0ece4]">Link invalid or expired</h1>
		<p class="text-sm text-[#9a8f7a]">
			This consent link is no longer valid. If you're a parent or guardian expecting this email,
			please contact <a href="/contact" class="text-[#f5a623] hover:underline">support</a> for help.
		</p>
	</div>
{:else if data.status !== 'pending'}
	<div class="py-4 text-center">
		<h1 class="mb-2 text-xl font-bold text-[#f0ece4]">Already responded</h1>
		<p class="text-sm text-[#9a8f7a]">
			A response has already been recorded for this rider's account.
		</p>
	</div>
{:else}
	<h1 class="mb-1 text-2xl font-bold text-[#f0ece4]">Parental consent request</h1>
	<p class="mb-6 text-sm text-[#9a8f7a]">
		<span class="font-medium text-[#f5a623]">{data.riderName}</span> has created an AppGatePro account
		and listed you as their parent or guardian.
	</p>

	<div class="mb-6 rounded-lg border border-[#221c18] bg-[#131010] p-4 text-sm text-[#9a8f7a]">
		<p class="mb-2">
			AppGatePro collects BMX gate-start sensor data (reaction time, speed, G-force) and basic
			profile details for performance analytics. Because {data.riderName} is under 16, we require a parent
			or guardian's confirmation before their account can be used.
		</p>
		<p>
			You can read our full <a href="/privacy" class="text-[#f5a623] hover:underline"
				>Privacy Policy</a
			> before deciding.
		</p>
	</div>

	{#if form?.error}
		<div class="mb-6 rounded-lg border border-red-800 bg-red-900/20 p-4 text-sm text-red-400">
			{form.error}
		</div>
	{/if}

	<div class="flex gap-3">
		<form method="POST" action="?/approve" onsubmit={() => (submitting = true)} class="flex-1">
			<button
				type="submit"
				disabled={submitting}
				class="w-full rounded-lg bg-[#f5a623] px-4 py-2.5 text-sm font-semibold text-[#0a0809]
                       transition-colors hover:bg-[#c97e0a] disabled:cursor-not-allowed disabled:opacity-50"
			>
				I consent
			</button>
		</form>
		<form method="POST" action="?/deny" onsubmit={() => (submitting = true)} class="flex-1">
			<button
				type="submit"
				disabled={submitting}
				class="w-full rounded-lg border border-[#221c18] px-4 py-2.5 text-sm font-semibold
                       text-[#9a8f7a] transition-colors hover:text-[#f0ece4] disabled:cursor-not-allowed disabled:opacity-50"
			>
				I do not consent
			</button>
		</form>
	</div>
{/if}

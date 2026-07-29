<script lang="ts">
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let submitting = $state(false);
</script>

<svelte:head>
	<title>Coach Consent — AppGatePro Analytics</title>
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
				You've approved this coaching relationship — the coach now has access to your child's
				training profile, goals, and shared updates.
			{:else}
				You've declined — this coach will not be given any access.
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
{:else if data.status !== 'pending_parent'}
	<div class="py-4 text-center">
		<h1 class="mb-2 text-xl font-bold text-[#f0ece4]">Already responded</h1>
		<p class="text-sm text-[#9a8f7a]">A response has already been recorded for this request.</p>
	</div>
{:else}
	<h1 class="mb-1 text-2xl font-bold text-[#f0ece4]">Coach access request</h1>
	<p class="mb-6 text-sm text-[#9a8f7a]">
		<span class="font-medium text-[#f5a623]">{data.coachName ?? 'A coach'}</span> would like to be added
		as a coach for
		<span class="font-medium text-[#f5a623]">{data.riderName ?? 'your child'}</span>. Because they're
		under 16, we require a parent or guardian's confirmation first.
	</p>

	<div class="mb-6 rounded-lg border border-[#221c18] bg-[#131010] p-4 text-sm text-[#9a8f7a]">
		<p class="mb-2">
			If you approve, this coach will be able to view {data.riderName ?? 'your child'}'s onboarding
			profile and training goals, exchange messages in a shared coaching thread, and receive
			training reports {data.riderName ?? 'your child'} chooses to send them. They cannot edit any
			profile data directly, and cannot see private notes.
		</p>
		<p>
			You can read our full <a href="/privacy" class="text-[#f5a623] hover:underline"
				>Privacy Policy</a
			> before deciding, and this can be revoked at any time from Settings.
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
				I approve
			</button>
		</form>
		<form method="POST" action="?/deny" onsubmit={() => (submitting = true)} class="flex-1">
			<button
				type="submit"
				disabled={submitting}
				class="w-full rounded-lg border border-[#221c18] px-4 py-2.5 text-sm font-semibold
                       text-[#9a8f7a] transition-colors hover:text-[#f0ece4] disabled:cursor-not-allowed disabled:opacity-50"
			>
				I do not approve
			</button>
		</form>
	</div>
{/if}

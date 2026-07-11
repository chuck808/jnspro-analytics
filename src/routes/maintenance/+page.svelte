<script lang="ts">
	let { data } = $props();

	// Format dates nicely
	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return new Intl.DateTimeFormat('en-GB', {
			dateStyle: 'full',
			timeStyle: 'short'
		}).format(date);
	}
</script>

<svelte:head>
	<title>Scheduled Maintenance — AppGatePro</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-[#0a0809] p-4">
	<div class="w-full max-w-2xl">
		<!-- Logo -->
		<div class="mb-8 flex justify-center">
			<img src="/logo-header-dark.svg" alt="AppGatePro" class="h-16 w-auto" />
		</div>

		<!-- Maintenance Icon -->
		<div
			class="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#f5a623]/10"
		>
			<svg class="h-12 w-12 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
				/>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
				/>
			</svg>
		</div>

		<!-- Content -->
		<div class="mb-8 text-center">
			<h1 class="mb-3 text-3xl font-bold text-[#f0ece4]">
				{data.maintenance?.title || 'Scheduled Maintenance'}
			</h1>
			<p class="mb-6 text-lg text-[#9a8f7a]">
				{data.maintenance?.description ||
					"We're performing scheduled maintenance to improve your experience."}
			</p>

			{#if data.maintenance}
				<div class="mx-auto max-w-md rounded-xl border border-[#221c18] bg-[#131010] p-6">
					<div class="space-y-3">
						<div>
							<p class="mb-1 text-xs tracking-wider text-[#4a4038] uppercase">Started</p>
							<p class="text-sm text-[#f0ece4]">{formatDate(data.maintenance.start_time)}</p>
						</div>
						<div class="border-t border-[#221c18] pt-3">
							<p class="mb-1 text-xs tracking-wider text-[#4a4038] uppercase">Expected to End</p>
							<p class="text-sm text-[#f0ece4]">{formatDate(data.maintenance.end_time)}</p>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Status Updates -->
		<div class="mb-6 rounded-xl border border-[#221c18] bg-[#131010] p-6">
			<h2 class="mb-4 flex items-center gap-2 text-sm font-semibold text-[#f0ece4]">
				<svg class="h-4 w-4 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				What to Expect
			</h2>
			<ul class="space-y-2 text-sm text-[#9a8f7a]">
				<li class="flex items-start gap-2">
					<svg
						class="mt-0.5 h-5 w-5 flex-shrink-0 text-[#f5a623]"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						/>
					</svg>
					<span>All your data is safe and secure</span>
				</li>
				<li class="flex items-start gap-2">
					<svg
						class="mt-0.5 h-5 w-5 flex-shrink-0 text-[#f5a623]"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						/>
					</svg>
					<span>We're upgrading our systems for better performance</span>
				</li>
				<li class="flex items-start gap-2">
					<svg
						class="mt-0.5 h-5 w-5 flex-shrink-0 text-[#f5a623]"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						/>
					</svg>
					<span>We'll be back online shortly</span>
				</li>
			</ul>
		</div>

		<!-- Auto-refresh notice -->
		<div class="text-center">
			<p class="mb-4 text-xs text-[#4a4038]">
				This page will automatically refresh when maintenance is complete.
			</p>
			<button
				onclick={() => window.location.reload()}
				class="rounded-lg bg-[#f5a623] px-6 py-2.5 text-sm font-semibold text-[#0a0809] transition-colors hover:bg-[#c97e0a]"
			>
				Check Status
			</button>
		</div>

		<!-- Footer -->
		<div class="mt-12 border-t border-[#221c18] pt-6 text-center">
			<p class="text-xs text-[#4a4038]">
				© {new Date().getFullYear()} JNS Pro Systems. All rights reserved.
			</p>
		</div>
	</div>
</div>

<svelte:window onload={() => setTimeout(() => window.location.reload(), 30000)} />

<style>
	/* Auto-refresh every 30 seconds */
	:global(body) {
		animation: autoRefresh 30s infinite;
	}

	@keyframes autoRefresh {
		99% {
			opacity: 1;
		}
		100% {
			opacity: 1;
		}
	}
</style>

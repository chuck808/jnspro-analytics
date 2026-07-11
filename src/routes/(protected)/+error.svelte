<script lang="ts">
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>Error {$page.status} — AppGatePro Analytics</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-[#0a0809] px-6 text-[#f0ece4]">
	<div class="w-full max-w-md text-center">
		<!-- Error Icon -->
		<div class="mb-8">
			<div
				class="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#ff4444]/20 bg-[#ff4444]/10"
			>
				<svg class="h-10 w-10 text-[#ff6b3d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
					/>
				</svg>
			</div>
		</div>

		<!-- Error Code -->
		<h1 class="mb-4 text-6xl font-bold text-[#f5a623]">
			{$page.status}
		</h1>

		<!-- Error Message -->
		<h2 class="mb-3 text-2xl font-semibold text-[#f0ece4]">
			{#if $page.status === 401}
				Authentication Required
			{:else if $page.status === 403}
				Access Denied
			{:else if $page.status === 404}
				Page Not Found
			{:else if $page.status === 500}
				Server Error
			{:else}
				Something Went Wrong
			{/if}
		</h2>

		<p class="mb-8 leading-relaxed text-[#9a8f7a]">
			{#if $page.error?.message}
				{$page.error.message}
			{:else if $page.status === 401}
				You need to sign in to access this page.
			{:else if $page.status === 403}
				You don't have permission to access this resource.
			{:else if $page.status === 404}
				The page you're looking for doesn't exist.
			{:else if $page.status === 500}
				We're experiencing technical difficulties. Please try again later.
			{:else}
				An unexpected error occurred while loading this page.
			{/if}
		</p>

		<!-- Action Buttons -->
		<div class="flex flex-col justify-center gap-3 sm:flex-row">
			{#if $page.status === 401}
				<a
					href="/auth/sign-in"
					class="rounded-lg bg-[#f5a623] px-6 py-3 font-semibold text-[#0a0809] transition-colors hover:bg-[#c97e0a]"
				>
					Sign In
				</a>
			{/if}
			<a
				href="/sessions"
				class="rounded-lg border border-[#221c18] bg-[#131010] px-6 py-3 font-semibold text-[#f0ece4] transition-colors hover:bg-[#171210]"
			>
				Go to Sessions
			</a>
			<a
				href="/"
				class="rounded-lg border border-[#221c18] bg-[#131010] px-6 py-3 font-semibold text-[#f0ece4] transition-colors hover:bg-[#171210]"
			>
				Go Home
			</a>
		</div>

		<!-- Support Link -->
		{#if $page.status >= 500}
			<p class="mt-8 text-sm text-[#6b5f4d]">
				If this problem persists, please <a href="/contact" class="text-[#f5a623] hover:underline"
					>contact support</a
				>.
			</p>
		{/if}
	</div>
</div>

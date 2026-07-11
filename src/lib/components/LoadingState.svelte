<script lang="ts">
	interface Props {
		size?: 'sm' | 'md' | 'lg';
		message?: string;
		fullScreen?: boolean;
	}

	let { size = 'md', message, fullScreen = false }: Props = $props();

	let sizeClasses = $derived(() => {
		switch (size) {
			case 'sm':
				return 'w-6 h-6';
			case 'lg':
				return 'w-16 h-16';
			default:
				return 'w-10 h-10';
		}
	});
</script>

{#if fullScreen}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0809]/80 backdrop-blur-sm">
		<div class="text-center">
			<div
				class="inline-block {sizeClasses()} animate-spin rounded-full border-4 border-[#221c18] border-t-[#f5a623]"
			></div>
			{#if message}
				<p class="mt-4 text-sm text-[#9a8f7a]">{message}</p>
			{/if}
		</div>
	</div>
{:else}
	<div class="flex items-center justify-center py-12">
		<div class="text-center">
			<div
				class="inline-block {sizeClasses()} animate-spin rounded-full border-4 border-[#221c18] border-t-[#f5a623]"
			></div>
			{#if message}
				<p class="mt-4 text-sm text-[#9a8f7a]">{message}</p>
			{/if}
		</div>
	</div>
{/if}

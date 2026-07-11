<script lang="ts">
	import { fly } from 'svelte/transition';
	import type { ToastType } from '$lib/stores/toast';

	let {
		message,
		type = 'info',
		duration = 5000,
		onDismiss
	}: {
		message: string;
		type?: ToastType;
		duration?: number;
		onDismiss?: () => void;
	} = $props();

	let visible = $state(true);

	const colors = {
		success: {
			bg: 'bg-[#3de8c8]/10',
			border: 'border-[#3de8c8]/40',
			text: 'text-[#3de8c8]',
			icon: '✓'
		},
		error: {
			bg: 'bg-[#ff4444]/10',
			border: 'border-[#ff4444]/40',
			text: 'text-[#ff4444]',
			icon: '✕'
		},
		warning: {
			bg: 'bg-[#f5a623]/10',
			border: 'border-[#f5a623]/40',
			text: 'text-[#f5a623]',
			icon: '⚠'
		},
		info: {
			bg: 'bg-[#9a8f7a]/10',
			border: 'border-[#9a8f7a]/40',
			text: 'text-[#9a8f7a]',
			icon: 'ℹ'
		}
	};

	let style = $derived(colors[type]);

	$effect(() => {
		if (duration > 0) {
			const timer = setTimeout(() => {
				visible = false;
				setTimeout(() => onDismiss?.(), 300);
			}, duration);

			return () => clearTimeout(timer);
		}
	});

	function dismiss() {
		visible = false;
		setTimeout(() => onDismiss?.(), 300);
	}
</script>

{#if visible}
	<div
		transition:fly={{ y: -20, duration: 300 }}
		class="flex items-start gap-3 rounded-lg border px-4 py-3 {style.bg} {style.border}
               max-w-md shadow-lg"
		role="alert"
		aria-live="assertive"
	>
		<span class="text-lg {style.text} flex-shrink-0">{style.icon}</span>
		<p class="flex-1 text-sm text-[#f0ece4]">{message}</p>
		<button
			onclick={dismiss}
			class="flex-shrink-0 rounded text-[#9a8f7a] transition-colors
                   hover:text-[#f0ece4] focus:ring-2 focus:ring-[#f5a623] focus:outline-none"
			aria-label="Dismiss"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M6 18L18 6M6 6l12 12"
				></path>
			</svg>
		</button>
	</div>
{/if}

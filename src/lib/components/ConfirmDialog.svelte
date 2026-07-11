<script lang="ts">
	import { fade, scale } from 'svelte/transition';

	let {
		open = $bindable(false),
		title,
		message,
		confirmText = 'Confirm',
		cancelText = 'Cancel',
		variant = 'danger',
		onConfirm,
		onCancel
	}: {
		open?: boolean;
		title: string;
		message: string;
		confirmText?: string;
		cancelText?: string;
		variant?: 'danger' | 'warning' | 'info';
		onConfirm?: () => void;
		onCancel?: () => void;
	} = $props();

	const variants = {
		danger: { bg: 'bg-[#ff4444]', hover: 'hover:bg-[#cc3636]', ring: 'focus:ring-[#ff4444]' },
		warning: { bg: 'bg-[#f5a623]', hover: 'hover:bg-[#c97e0a]', ring: 'focus:ring-[#f5a623]' },
		info: { bg: 'bg-[#3de8c8]', hover: 'hover:bg-[#2bb9a3]', ring: 'focus:ring-[#3de8c8]' }
	};

	let style = $derived(variants[variant]);

	function handleConfirm() {
		open = false;
		onConfirm?.();
	}

	function handleCancel() {
		open = false;
		onCancel?.();
	}

	function handleBackdrop(e: MouseEvent) {
		if (e.target === e.currentTarget) handleCancel();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') handleCancel();
	}
</script>

{#if open}
	<!-- Backdrop -->
	<div
		transition:fade={{ duration: 200 }}
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
		onclick={handleBackdrop}
		onkeydown={handleKeydown}
		role="presentation"
	>
		<!-- Dialog -->
		<div
			transition:scale={{ duration: 200, start: 0.95 }}
			class="w-full max-w-md rounded-xl border border-[#221c18]
                   bg-[#131010] p-6 shadow-2xl"
			role="dialog"
			aria-modal="true"
			aria-labelledby="dialog-title"
			aria-describedby="dialog-description"
		>
			<h3 id="dialog-title" class="mb-2 text-lg font-semibold text-[#f0ece4]">
				{title}
			</h3>
			<p id="dialog-description" class="mb-6 text-sm text-[#9a8f7a]">
				{message}
			</p>

			<div class="flex justify-end gap-3">
				<button
					onclick={handleCancel}
					class="rounded-lg bg-[#0a0809] px-4 py-2 text-sm text-[#9a8f7a]
                           transition-colors hover:bg-[#171210] hover:text-[#f0ece4]
                           focus:ring-2 focus:ring-[#9a8f7a] focus:ring-offset-2
                           focus:ring-offset-[color:var(--theme-surface)] focus:outline-none"
				>
					{cancelText}
				</button>
				<button
					onclick={handleConfirm}
					class="rounded-lg px-4 py-2 text-sm font-semibold text-[#0a0809]
                           transition-colors focus:ring-2 focus:ring-offset-2
                           focus:ring-offset-[color:var(--theme-surface)] focus:outline-none
                           {style.bg} {style.hover} {style.ring}"
				>
					{confirmText}
				</button>
			</div>
		</div>
	</div>
{/if}

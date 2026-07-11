<script lang="ts">
	let {
		open = $bindable(false),
		title,
		onClose,
		children
	}: {
		open?: boolean;
		title: string;
		onClose?: () => void;
		children?: any;
	} = $props();

	function close() {
		open = false;
		onClose?.();
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) close();
	}
</script>

{#if open}
	<!-- Backdrop -->
	<div
		class="animate-fade-in fixed inset-0 z-40 bg-black/60 md:hidden"
		onclick={handleBackdropClick}
		onkeydown={(e) => e.key === 'Escape' && close()}
		role="button"
		tabindex="-1"
		aria-label="Close sheet"
	></div>

	<!-- Sheet -->
	<div
		class="themed-card animate-slide-up fixed right-0 bottom-0 left-0 z-50
               max-h-[85vh] overflow-y-auto rounded-t-2xl md:hidden"
		role="dialog"
		aria-modal="true"
		aria-labelledby="sheet-title"
	>
		<!-- Handle bar -->
		<div class="flex justify-center py-3">
			<div class="h-1 w-12 rounded-full bg-[color:var(--border)]"></div>
		</div>

		<!-- Header -->
		<div class="flex items-center justify-between border-b border-[color:var(--border)] px-4 pb-3">
			<h3 id="sheet-title" class="themed-text-primary text-lg font-semibold">
				{title}
			</h3>
			<button
				onclick={close}
				class="themed-text-secondary rounded-lg p-2 transition-colors
                       hover:text-[color:var(--text-primary)] focus:ring-2 focus:ring-[color:var(--accent)] focus:outline-none"
				aria-label="Close"
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</div>

		<!-- Content -->
		<div class="p-4">
			{@render children?.()}
		</div>
	</div>
{/if}

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slide-up {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}

	.animate-fade-in {
		animation: fade-in 0.2s ease-out;
	}

	.animate-slide-up {
		animation: slide-up 0.3s ease-out;
	}
</style>

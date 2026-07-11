<script lang="ts">
	import ConfirmDialog from './ConfirmDialog.svelte';
	import { toast } from '$lib/stores/toast';

	let {
		selectedIds = $bindable([]),
		onArchive,
		onDelete
	}: {
		selectedIds?: string[];
		onArchive: (ids: string[]) => Promise<void>;
		onDelete: (ids: string[]) => Promise<void>;
	} = $props();

	let showArchiveConfirm = $state(false);
	let showDeleteConfirm = $state(false);
	let processing = $state(false);

	async function handleArchive() {
		processing = true;
		try {
			await onArchive(selectedIds);
			toast.success(`${selectedIds.length} session(s) archived`);
			selectedIds = [];
		} catch (error) {
			console.error('Archive failed:', error);
			toast.error('Failed to archive sessions');
		} finally {
			processing = false;
		}
	}

	async function handleDelete() {
		processing = true;
		try {
			await onDelete(selectedIds);
			toast.success(`${selectedIds.length} session(s) deleted`);
			selectedIds = [];
		} catch (error) {
			console.error('Delete failed:', error);
			toast.error('Failed to delete sessions');
		} finally {
			processing = false;
		}
	}
</script>

{#if selectedIds.length > 0}
	<div
		class="fixed bottom-4 left-1/2 z-40 flex
                -translate-x-1/2 items-center gap-4 rounded-xl border border-[#221c18]
                bg-[#131010] p-4 shadow-2xl"
		role="status"
		aria-live="polite"
	>
		<p class="text-sm text-[#f0ece4]">
			{selectedIds.length} selected
		</p>

		<div class="flex gap-2">
			<button
				onclick={() => (showArchiveConfirm = true)}
				disabled={processing}
				class="rounded-lg border border-[#221c18] bg-[#0a0809] px-3 py-1.5
                       text-sm text-[#9a8f7a] transition-colors hover:border-[#f5a623]/40
                       hover:text-[#f5a623] focus:ring-2 focus:ring-[#f5a623]
                       focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
			>
				Archive
			</button>

			<button
				onclick={() => (showDeleteConfirm = true)}
				disabled={processing}
				class="rounded-lg border border-[#221c18] bg-[#0a0809] px-3 py-1.5
                       text-sm text-[#ff4444] transition-colors hover:border-[#ff4444]/40
                       hover:bg-[#ff4444]/10 focus:ring-2 focus:ring-[#ff4444]
                       focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
			>
				Delete
			</button>

			<button
				onclick={() => (selectedIds = [])}
				disabled={processing}
				class="rounded px-3 py-1.5 text-sm text-[#6b5f4d]
                       transition-colors hover:text-[#f0ece4] focus:ring-2
                       focus:ring-[#9a8f7a] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
			>
				Cancel
			</button>
		</div>
	</div>
{/if}

<ConfirmDialog
	bind:open={showArchiveConfirm}
	title="Archive Sessions"
	message="Archive {selectedIds.length} session(s)? You can restore them later from archived sessions."
	confirmText="Archive"
	variant="warning"
	onConfirm={handleArchive}
/>

<ConfirmDialog
	bind:open={showDeleteConfirm}
	title="Delete Sessions"
	message="Permanently delete {selectedIds.length} session(s) and all related data (runs, analytics, charts)? This cannot be undone."
	confirmText="Delete"
	variant="danger"
	onConfirm={handleDelete}
/>

<script lang="ts">
	import type { RunTag, RunTagMeta } from '$lib/types/runs';
	import { RUN_TAG_OPTIONS, getTagMeta } from '$lib/types/runs';
	import { enhance } from '$app/forms';

	let {
		runId,
		runNumber,
		currentTags = [],
		sessionId,
		compact = false,
		onDraftChange
	}: {
		runId: string;
		runNumber: number;
		currentTags?: RunTag[];
		sessionId: string;
		compact?: boolean;
		onDraftChange?: (runId: string, tags: RunTag[]) => void;
	} = $props();

	let isOpen = $state(false);
	let selectedTags = $state<RunTag[]>([]);
	let saving = $state(false);

	// Sync selectedTags when currentTags changes
	$effect(() => {
		if (!isOpen) {
			selectedTags = [...currentTags];
		}
	});

	function toggleTag(tag: RunTag) {
		if (selectedTags.includes(tag)) {
			selectedTags = selectedTags.filter((t) => t !== tag);
		} else {
			selectedTags = [...selectedTags, tag];
		}
		onDraftChange?.(runId, selectedTags);
	}

	function close() {
		isOpen = false;
		selectedTags = [...currentTags]; // Reset on cancel
	}

	const hasChanges = $derived(
		JSON.stringify(selectedTags.sort()) !== JSON.stringify(currentTags.sort())
	);

	const displayTags = $derived(
		currentTags
			.map((tag) => getTagMeta(tag))
			.filter((meta): meta is RunTagMeta => meta !== undefined)
	);
</script>

<div class="tag-selector-container">
	<!-- Display current tags -->
	{#if displayTags.length > 0}
		<div class="current-tags">
			{#each displayTags as tagMeta}
				<span
					class="tag-badge"
					style="border-color: {tagMeta.color}20; color: {tagMeta.color}"
					title={tagMeta.description}
				>
					<span class="tag-icon">{tagMeta.icon}</span>
					{#if !compact}
						<span class="tag-label">{tagMeta.label}</span>
					{/if}
				</span>
			{/each}
		</div>
	{/if}

	<!-- Tag button -->
	<button
		type="button"
		onclick={() => (isOpen = !isOpen)}
		class="tag-button"
		aria-label="Tag run {runNumber}"
		aria-expanded={isOpen}
	>
		<span class="tag-icon">🏷️</span>
		{#if !compact}
			<span>Tag</span>
		{/if}
	</button>

	<!-- Dropdown menu -->
	{#if isOpen}
		<div class="dropdown-menu">
			<div class="dropdown-header">
				<h4>Tag Run {runNumber}</h4>
				<button type="button" onclick={close} class="close-button" aria-label="Close"> ✕ </button>
			</div>

			<form
				method="POST"
				action="?/updateRunTags"
				use:enhance={() => {
					saving = true;
					return async ({ result, update }) => {
						await update();
						saving = false;
						if (result.type === 'success') {
							isOpen = false;
							// Tags will be updated via page data reload
						}
					};
				}}
			>
				<input type="hidden" name="runId" value={runId} />
				<input type="hidden" name="sessionId" value={sessionId} />
				<input type="hidden" name="tags" value={JSON.stringify(selectedTags)} />

				<div class="tag-options">
					{#each RUN_TAG_OPTIONS as option}
						{@const isSelected = selectedTags.includes(option.value)}
						<label class="tag-option">
							<input
								type="checkbox"
								checked={isSelected}
								onchange={() => toggleTag(option.value)}
							/>
							<span class="tag-content">
								<span class="tag-icon">{option.icon}</span>
								<span class="tag-info">
									<span class="tag-name">{option.label}</span>
									<span class="tag-desc">{option.description}</span>
								</span>
							</span>
						</label>
					{/each}
				</div>

				<div class="dropdown-footer">
					<button type="button" onclick={close} class="cancel-button" disabled={saving}>
						Cancel
					</button>
					<button type="submit" class="save-button" disabled={!hasChanges || saving}>
						{saving ? 'Saving...' : 'Save Tags'}
					</button>
				</div>
			</form>
		</div>

		<!-- Backdrop -->
		<button type="button" class="dropdown-backdrop" onclick={close} aria-label="Close menu"
		></button>
	{/if}
</div>

<style>
	.tag-selector-container {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.current-tags {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
	}

	.tag-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
		border: 1px solid;
		font-size: 0.7rem;
		font-weight: 600;
	}

	.tag-button {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		background: #221c18;
		border: 1px solid #221c18;
		border-radius: 6px;
		color: #9a8f7a;
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.tag-button:hover {
		background: #2a2420;
		border-color: #f5a623;
		color: #f5a623;
	}

	.tag-icon {
		font-size: 0.875em;
	}

	.dropdown-menu {
		position: absolute;
		top: calc(100% + 0.5rem);
		right: 0;
		z-index: 50;
		width: 320px;
		background: #131010;
		border: 1px solid #221c18;
		border-radius: 12px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
	}

	.dropdown-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid #221c18;
	}

	.dropdown-header h4 {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: #f0ece4;
	}

	.close-button {
		background: none;
		border: none;
		color: #6b5f4d;
		font-size: 1.25rem;
		cursor: pointer;
		padding: 0;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		transition: all 0.2s;
	}

	.close-button:hover {
		background: #221c18;
		color: #f0ece4;
	}

	.tag-options {
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 400px;
		overflow-y: auto;
	}

	.tag-option {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.75rem;
		background: #0a0809;
		border: 1px solid #221c18;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.tag-option:hover {
		background: #171210;
		border-color: #f5a623;
	}

	.tag-option input[type='checkbox'] {
		margin-top: 0.125rem;
		cursor: pointer;
	}

	.tag-content {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		flex: 1;
	}

	.tag-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.tag-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: #f0ece4;
	}

	.tag-desc {
		font-size: 0.75rem;
		color: #6b5f4d;
	}

	.dropdown-footer {
		display: flex;
		gap: 0.5rem;
		padding: 1rem;
		border-top: 1px solid #221c18;
	}

	.cancel-button,
	.save-button {
		flex: 1;
		padding: 0.5rem 1rem;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.cancel-button {
		background: #221c18;
		border: 1px solid #221c18;
		color: #9a8f7a;
	}

	.cancel-button:hover:not(:disabled) {
		background: #2a2420;
		color: #f0ece4;
	}

	.save-button {
		background: #f5a623;
		border: 1px solid #f5a623;
		color: #0a0809;
	}

	.save-button:hover:not(:disabled) {
		background: #c97e0a;
		border-color: #c97e0a;
	}

	.save-button:disabled,
	.cancel-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.dropdown-backdrop {
		position: fixed;
		inset: 0;
		z-index: 40;
		background: transparent;
		border: none;
		cursor: default;
	}

	@media (max-width: 640px) {
		.dropdown-menu {
			position: fixed;
			top: 50%;
			left: 50%;
			right: auto;
			transform: translate(-50%, -50%);
			width: calc(100% - 2rem);
			max-width: 400px;
		}
	}
</style>

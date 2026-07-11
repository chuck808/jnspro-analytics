<script lang="ts">
	import { onMount } from 'svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import Toast from '$lib/components/Toast.svelte';

	let chapters = $state<any[]>([]);
	let loading = $state(true);
	let selectedChapter = $state<any>(null);
	let editMode = $state(false);
	let markdown = $state('');
	let saving = $state(false);
	let toast = $state({ show: false, message: '', type: 'success' as 'success' | 'error' });

	onMount(async () => {
		await loadChapters();
	});

	async function loadChapters() {
		loading = true;
		try {
			const response = await fetch('/api/admin/docs/chapters');
			if (response.ok) {
				chapters = await response.json();
			} else {
				showToast('Failed to load chapters', 'error');
			}
		} catch (error) {
			console.error('Error loading chapters:', error);
			showToast('Error loading chapters', 'error');
		} finally {
			loading = false;
		}
	}

	async function selectChapter(chapter: any) {
		selectedChapter = chapter;
		editMode = false;

		// Load the markdown content
		try {
			const response = await fetch(`/api/admin/docs/chapters/${chapter.slug}`);
			if (response.ok) {
				const data = await response.json();
				markdown = data.markdown || '';
			}
		} catch (error) {
			console.error('Error loading chapter content:', error);
			showToast('Error loading chapter content', 'error');
		}
	}

	function startEdit() {
		editMode = true;
	}

	function cancelEdit() {
		editMode = false;
		if (selectedChapter) {
			selectChapter(selectedChapter);
		}
	}

	async function saveChapter() {
		if (!selectedChapter) return;

		saving = true;
		try {
			const response = await fetch(`/api/admin/docs/chapters/${selectedChapter.slug}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ markdown })
			});

			if (response.ok) {
				showToast('Chapter saved successfully', 'success');
				editMode = false;
				await loadChapters();
			} else {
				showToast('Failed to save chapter', 'error');
			}
		} catch (error) {
			console.error('Error saving chapter:', error);
			showToast('Error saving chapter', 'error');
		} finally {
			saving = false;
		}
	}

	async function regenerateDocs() {
		saving = true;
		try {
			const response = await fetch('/api/admin/docs/regenerate', {
				method: 'POST'
			});

			if (response.ok) {
				showToast('Documentation regenerated successfully', 'success');
				await loadChapters();
			} else {
				showToast('Failed to regenerate documentation', 'error');
			}
		} catch (error) {
			console.error('Error regenerating docs:', error);
			showToast('Error regenerating documentation', 'error');
		} finally {
			saving = false;
		}
	}

	function showToast(message: string, type: 'success' | 'error') {
		toast = { show: true, message, type };
		setTimeout(() => {
			toast = { ...toast, show: false };
		}, 3000);
	}
</script>

<svelte:head>
	<title>Documentation Manager - Admin</title>
</svelte:head>

<div class="mx-auto max-w-7xl p-6">
	<!-- Header -->
	<div class="mb-6">
		<h1 class="mb-2 text-2xl font-bold text-[#f0ece4]">Documentation Manager</h1>
		<p class="text-[#9a8f7a]">Manage and edit documentation chapters</p>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<LoadingSpinner />
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<!-- Chapter List -->
			<div class="themed-card">
				<div class="mb-4 flex items-center justify-between border-b border-[#221c18] pb-4">
					<h2 class="text-lg font-semibold text-[#f0ece4]">Chapters</h2>
					<button
						onclick={regenerateDocs}
						disabled={saving}
						class="rounded-lg bg-[#f5a623] px-3 py-1.5 text-xs font-medium text-[#0a0809]
                               transition-colors hover:bg-[#c97e0a] disabled:cursor-not-allowed disabled:opacity-50"
					>
						{saving ? 'Regenerating...' : 'Regenerate All'}
					</button>
				</div>

				<div class="space-y-2">
					{#each chapters as chapter}
						<button
							onclick={() => selectChapter(chapter)}
							class="w-full rounded-lg p-3 text-left transition-colors
                                   {selectedChapter?.slug === chapter.slug
								? 'border border-[#f5a623]/20 bg-[#f5a623]/10'
								: 'hover:bg-[#221c18]'}"
						>
							<div class="flex items-center gap-2">
								<span class="text-xl">{chapter.icon}</span>
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-medium text-[#f0ece4]">
										{chapter.title}
									</p>
									<p class="truncate text-xs text-[#6b5f4d]">{chapter.slug}</p>
								</div>
							</div>
						</button>
					{/each}
				</div>

				{#if chapters.length === 0}
					<p class="py-8 text-center text-[#6b5f4d]">No chapters found</p>
				{/if}
			</div>

			<!-- Chapter Editor -->
			<div class="themed-card lg:col-span-2">
				{#if selectedChapter}
					<div class="mb-4 border-b border-[#221c18] pb-4">
						<div class="flex items-start justify-between">
							<div>
								<h2 class="flex items-center gap-2 text-xl font-semibold text-[#f0ece4]">
									<span>{selectedChapter.icon}</span>
									{selectedChapter.title}
								</h2>
								<p class="mt-1 text-sm text-[#9a8f7a]">{selectedChapter.desc}</p>
							</div>

							<div class="flex gap-2">
								{#if !editMode}
									<button
										onclick={startEdit}
										class="rounded-lg bg-[#f5a623] px-4 py-2 text-sm font-medium text-[#0a0809]
                                               transition-colors hover:bg-[#c97e0a]"
									>
										Edit
									</button>
								{:else}
									<button
										onclick={cancelEdit}
										disabled={saving}
										class="rounded-lg border border-[#221c18] px-4 py-2 text-sm font-medium
                                               text-[#9a8f7a] transition-colors hover:bg-[#221c18]
                                               disabled:cursor-not-allowed disabled:opacity-50"
									>
										Cancel
									</button>
									<button
										onclick={saveChapter}
										disabled={saving}
										class="rounded-lg bg-[#f5a623] px-4 py-2 text-sm font-medium text-[#0a0809]
                                               transition-colors hover:bg-[#c97e0a]
                                               disabled:cursor-not-allowed disabled:opacity-50"
									>
										{saving ? 'Saving...' : 'Save'}
									</button>
								{/if}
							</div>
						</div>
					</div>

					{#if editMode}
						<div>
							<label for="markdown-editor" class="mb-2 block text-sm font-medium text-[#9a8f7a]">
								Markdown Content
							</label>
							<textarea
								id="markdown-editor"
								bind:value={markdown}
								class="h-[600px] w-full resize-none rounded-lg border border-[#221c18] bg-[#0a0809] px-4
                                       py-3 font-mono text-sm leading-relaxed
                                       text-[#f0ece4] focus:border-transparent focus:ring-2 focus:ring-[#f5a623]
                                       focus:outline-none"
								placeholder="Enter markdown content here..."
							></textarea>

							<div class="mt-4 rounded-lg border border-[#221c18] bg-[#0a0809] p-4">
								<h3 class="mb-2 text-sm font-semibold text-[#f0ece4]">Markdown Tips:</h3>
								<ul class="space-y-1 text-xs text-[#9a8f7a]">
									<li>
										• Use <code class="rounded bg-[#221c18] px-1 text-[#f5a623]">## Heading</code> for
										section headers
									</li>
									<li>
										• Embed videos: <code class="rounded bg-[#221c18] px-1 text-[#f5a623]"
											>&lt;div class="doc-video"&gt;&lt;iframe
											src="..."&gt;&lt;/iframe&gt;&lt;/div&gt;</code
										>
									</li>
									<li>
										• Add images: <code class="rounded bg-[#221c18] px-1 text-[#f5a623]"
											>![Alt text](/path/to/image.png)</code
										>
									</li>
									<li>
										• Use <code class="rounded bg-[#221c18] px-1 text-[#f5a623]">**bold**</code> and
										<code class="rounded bg-[#221c18] px-1 text-[#f5a623]">*italic*</code> for emphasis
									</li>
								</ul>
							</div>
						</div>
					{:else}
						<div class="prose-preview">
							<pre
								class="max-h-[600px] overflow-x-auto rounded-lg border border-[#221c18] bg-[#0a0809] p-4 font-mono text-sm whitespace-pre-wrap text-[#9a8f7a]">{markdown}</pre>
						</div>
					{/if}
				{:else}
					<div class="flex h-96 items-center justify-center">
						<div class="text-center">
							<svg
								class="mx-auto mb-4 h-16 w-16 text-[#6b5f4d]"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
							<p class="text-[#6b5f4d]">Select a chapter to view or edit</p>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

{#if toast.show}
	<Toast message={toast.message} type={toast.type} />
{/if}

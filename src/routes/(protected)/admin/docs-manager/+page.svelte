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
                    'Content-Type': 'application/json',
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

<div class="p-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
        <h1 class="text-2xl font-bold text-[#f0ece4] mb-2">Documentation Manager</h1>
        <p class="text-[#9a8f7a]">Manage and edit documentation chapters</p>
    </div>

    {#if loading}
        <div class="flex items-center justify-center py-12">
            <LoadingSpinner />
        </div>
    {:else}
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Chapter List -->
            <div class="themed-card">
                <div class="flex items-center justify-between mb-4 pb-4 border-b border-[#221c18]">
                    <h2 class="text-lg font-semibold text-[#f0ece4]">Chapters</h2>
                    <button
                        onclick={regenerateDocs}
                        disabled={saving}
                        class="px-3 py-1.5 text-xs font-medium bg-[#f5a623] text-[#0a0809] rounded-lg
                               hover:bg-[#c97e0a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Regenerating...' : 'Regenerate All'}
                    </button>
                </div>

                <div class="space-y-2">
                    {#each chapters as chapter}
                        <button
                            onclick={() => selectChapter(chapter)}
                            class="w-full text-left p-3 rounded-lg transition-colors
                                   {selectedChapter?.slug === chapter.slug
                                       ? 'bg-[#f5a623]/10 border border-[#f5a623]/20'
                                       : 'hover:bg-[#221c18]'}"
                        >
                            <div class="flex items-center gap-2">
                                <span class="text-xl">{chapter.icon}</span>
                                <div class="flex-1 min-w-0">
                                    <p class="text-sm font-medium text-[#f0ece4] truncate">
                                        {chapter.title}
                                    </p>
                                    <p class="text-xs text-[#6b5f4d] truncate">{chapter.slug}</p>
                                </div>
                            </div>
                        </button>
                    {/each}
                </div>

                {#if chapters.length === 0}
                    <p class="text-center text-[#6b5f4d] py-8">No chapters found</p>
                {/if}
            </div>

            <!-- Chapter Editor -->
            <div class="lg:col-span-2 themed-card">
                {#if selectedChapter}
                    <div class="mb-4 pb-4 border-b border-[#221c18]">
                        <div class="flex items-start justify-between">
                            <div>
                                <h2 class="text-xl font-semibold text-[#f0ece4] flex items-center gap-2">
                                    <span>{selectedChapter.icon}</span>
                                    {selectedChapter.title}
                                </h2>
                                <p class="text-sm text-[#9a8f7a] mt-1">{selectedChapter.desc}</p>
                            </div>

                            <div class="flex gap-2">
                                {#if !editMode}
                                    <button
                                        onclick={startEdit}
                                        class="px-4 py-2 text-sm font-medium bg-[#f5a623] text-[#0a0809] rounded-lg
                                               hover:bg-[#c97e0a] transition-colors"
                                    >
                                        Edit
                                    </button>
                                {:else}
                                    <button
                                        onclick={cancelEdit}
                                        disabled={saving}
                                        class="px-4 py-2 text-sm font-medium border border-[#221c18] text-[#9a8f7a]
                                               rounded-lg hover:bg-[#221c18] transition-colors
                                               disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onclick={saveChapter}
                                        disabled={saving}
                                        class="px-4 py-2 text-sm font-medium bg-[#f5a623] text-[#0a0809] rounded-lg
                                               hover:bg-[#c97e0a] transition-colors
                                               disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {saving ? 'Saving...' : 'Save'}
                                    </button>
                                {/if}
                            </div>
                        </div>
                    </div>

                    {#if editMode}
                        <div>
                            <label for="markdown-editor" class="block text-sm font-medium text-[#9a8f7a] mb-2">
                                Markdown Content
                            </label>
                            <textarea
                                id="markdown-editor"
                                bind:value={markdown}
                                class="w-full h-[600px] px-4 py-3 bg-[#0a0809] border border-[#221c18] rounded-lg
                                       text-[#f0ece4] font-mono text-sm leading-relaxed
                                       focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:border-transparent
                                       resize-none"
                                placeholder="Enter markdown content here..."
                            ></textarea>
                            
                            <div class="mt-4 p-4 bg-[#0a0809] border border-[#221c18] rounded-lg">
                                <h3 class="text-sm font-semibold text-[#f0ece4] mb-2">Markdown Tips:</h3>
                                <ul class="text-xs text-[#9a8f7a] space-y-1">
                                    <li>• Use <code class="text-[#f5a623] bg-[#221c18] px-1 rounded">## Heading</code> for section headers</li>
                                    <li>• Embed videos: <code class="text-[#f5a623] bg-[#221c18] px-1 rounded">&lt;div class="doc-video"&gt;&lt;iframe src="..."&gt;&lt;/iframe&gt;&lt;/div&gt;</code></li>
                                    <li>• Add images: <code class="text-[#f5a623] bg-[#221c18] px-1 rounded">![Alt text](/path/to/image.png)</code></li>
                                    <li>• Use <code class="text-[#f5a623] bg-[#221c18] px-1 rounded">**bold**</code> and <code class="text-[#f5a623] bg-[#221c18] px-1 rounded">*italic*</code> for emphasis</li>
                                </ul>
                            </div>
                        </div>
                    {:else}
                        <div class="prose-preview">
                            <pre class="whitespace-pre-wrap font-mono text-sm text-[#9a8f7a] bg-[#0a0809] p-4 rounded-lg border border-[#221c18] overflow-x-auto max-h-[600px]">{markdown}</pre>
                        </div>
                    {/if}
                {:else}
                    <div class="flex items-center justify-center h-96">
                        <div class="text-center">
                            <svg class="w-16 h-16 mx-auto text-[#6b5f4d] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
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

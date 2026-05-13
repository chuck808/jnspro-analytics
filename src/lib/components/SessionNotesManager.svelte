<script lang="ts">
    import { enhance } from '$app/forms';
    import RichTextEditor from './RichTextEditor.svelte';
    import type { SessionNote, NoteType, AuthorRole } from '$lib/types/notes';
    import { NOTE_TYPE_CONFIG } from '$lib/types/notes';

    interface Props {
        sessionId: string;
        notes: SessionNote[];
        currentUserRole?: AuthorRole;
    }

    let { 
        sessionId,
        notes = [],
        currentUserRole = 'rider'
    }: Props = $props();

    // Group notes by type
    let notesByType = $derived.by(() => {
        const grouped: Record<NoteType, SessionNote[]> = {
            pre: [],
            during: [],
            post: [],
            coach: [],
        };

        notes.forEach(note => {
            if (note.note_type in grouped) {
                grouped[note.note_type].push(note);
            }
        });

        // Sort by created_at DESC (newest first)
        Object.keys(grouped).forEach(type => {
            grouped[type as NoteType].sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
        });

        return grouped;
    });

    let activeTab = $state<NoteType>('post');
    let isAdding = $state(false);
    let editingNoteId = $state<string | null>(null);
    let newNoteContent = $state('');
    let editNoteContent = $state('');

    function startAdd() {
        isAdding = true;
        editingNoteId = null;
        newNoteContent = '';
    }

    function cancelAdd() {
        isAdding = false;
        newNoteContent = '';
    }

    function startEdit(note: SessionNote) {
        editingNoteId = note.id;
        editNoteContent = note.content;
        isAdding = false;
    }

    function cancelEdit() {
        editingNoteId = null;
        editNoteContent = '';
    }

    function formatDate(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        });
    }

    function getRoleIcon(role: AuthorRole | null): string {
        switch (role) {
            case 'coach': return '🏆';
            case 'parent': return '👨‍👩‍👦';
            case 'rider': return '🚴';
            default: return '📝';
        }
    }
</script>

<div class="bg-[#131010] border border-[#221c18] rounded-xl overflow-hidden">
    <!-- Header -->
    <div class="px-5 py-4 border-b border-[#221c18]">
        <div class="flex items-center justify-between gap-4">
            <div>
                <h3 class="text-sm font-semibold text-[#f0ece4]">Session Notes</h3>
                <p class="text-xs text-[#6b5f4d] mt-0.5">
                    Collaborative notes for pre-session goals, observations, and reflections
                </p>
            </div>
            {#if !isAdding && !editingNoteId}
                <button
                    onclick={startAdd}
                    class="flex items-center gap-2 px-3 py-1.5 bg-[#f5a623] hover:bg-[#c97e0a]
                           text-[#0a0809] text-xs font-semibold rounded-lg transition-colors
                           focus:outline-none focus:ring-2 focus:ring-[#f5a623]">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                    Add Note
                </button>
            {/if}
        </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 px-5 py-3 bg-[#0a0809] border-b border-[#221c18] overflow-x-auto">
        {#each Object.entries(NOTE_TYPE_CONFIG) as [type, config]}
            {@const noteType = type as NoteType}
            {@const count = notesByType[noteType].length}
            <button
                onclick={() => activeTab = noteType}
                class="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium
                       whitespace-nowrap transition-colors
                       focus:outline-none focus:ring-2 focus:ring-[#f5a623]
                       {activeTab === noteType
                           ? 'bg-[#131010] text-[#f0ece4] border border-[#221c18]'
                           : 'text-[#9a8f7a] hover:text-[#f0ece4] hover:bg-[#131010]/50'}">
                <span>{config.icon}</span>
                <span>{config.label}</span>
                {#if count > 0}
                    <span class="px-1.5 py-0.5 bg-[#221c18] rounded text-[10px]">{count}</span>
                {/if}
            </button>
        {/each}
    </div>

    <!-- Content -->
    <div class="p-5">
        <!-- Add note form -->
        {#if isAdding}
            <form method="POST" action="?/addNote" use:enhance={() => {
                return async ({ result, update }) => {
                    if (result.type === 'success') {
                        cancelAdd();
                    }
                    await update();
                };
            }} class="mb-5">
                <input type="hidden" name="session_id" value={sessionId} />
                <input type="hidden" name="note_type" value={activeTab} />
                <input type="hidden" name="author_role" value={currentUserRole} />
                <input type="hidden" name="content" bind:value={newNoteContent} />

                <div class="bg-[#0a0809] border border-[#221c18] rounded-xl p-4">
                    <div class="flex items-center gap-2 mb-3">
                        <span class="text-xl">{NOTE_TYPE_CONFIG[activeTab].icon}</span>
                        <div class="flex-1">
                            <p class="text-sm font-semibold" style="color: {NOTE_TYPE_CONFIG[activeTab].color}">
                                New {NOTE_TYPE_CONFIG[activeTab].label} Note
                            </p>
                            <p class="text-xs text-[#6b5f4d]">{NOTE_TYPE_CONFIG[activeTab].description}</p>
                        </div>
                    </div>

                    <RichTextEditor
                        initialContent=""
                        placeholder={NOTE_TYPE_CONFIG[activeTab].placeholder}
                        onChange={(html) => newNoteContent = html}
                    />

                    <div class="flex items-center gap-2 mt-3">
                        <button
                            type="submit"
                            disabled={!newNoteContent || newNoteContent.length < 10}
                            class="px-4 py-2 bg-[#f5a623] hover:bg-[#c97e0a] disabled:bg-[#6b5f4d] disabled:cursor-not-allowed
                                   text-[#0a0809] text-sm font-semibold rounded-lg transition-colors
                                   focus:outline-none focus:ring-2 focus:ring-[#f5a623]">
                            Save Note
                        </button>
                        <button
                            type="button"
                            onclick={cancelAdd}
                            class="px-4 py-2 text-sm text-[#9a8f7a] hover:text-[#f0ece4] transition-colors
                                   focus:outline-none focus:ring-2 focus:ring-[#f5a623] rounded">
                            Cancel
                        </button>
                    </div>
                </div>
            </form>
        {/if}

        <!-- Notes list for active tab -->
        <div class="space-y-3">
            {#each notesByType[activeTab] as note}
                {#if editingNoteId === note.id}
                    <!-- Edit form -->
                    <form method="POST" action="?/updateNote" use:enhance={() => {
                        return async ({ result, update }) => {
                            if (result.type === 'success') {
                                cancelEdit();
                            }
                            await update();
                        };
                    }}>
                        <input type="hidden" name="note_id" value={note.id} />
                        <input type="hidden" name="content" bind:value={editNoteContent} />

                        <div class="bg-[#0a0809] border border-[#f5a623]/30 rounded-xl p-4">
                            <RichTextEditor
                                initialContent={note.content}
                                onChange={(html) => editNoteContent = html}
                            />

                            <div class="flex items-center gap-2 mt-3">
                                <button
                                    type="submit"
                                    class="px-4 py-2 bg-[#f5a623] hover:bg-[#c97e0a]
                                           text-[#0a0809] text-sm font-semibold rounded-lg transition-colors
                                           focus:outline-none focus:ring-2 focus:ring-[#f5a623]">
                                    Update
                                </button>
                                <button
                                    type="button"
                                    onclick={cancelEdit}
                                    class="px-4 py-2 text-sm text-[#9a8f7a] hover:text-[#f0ece4] transition-colors
                                           focus:outline-none focus:ring-2 focus:ring-[#f5a623] rounded">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </form>
                {:else}
                    <!-- Display note -->
                    <div class="bg-[#0a0809] border border-[#221c18] rounded-xl p-4 hover:border-[#221c18]/80 transition-colors">
                        <div class="flex items-start justify-between gap-3 mb-3">
                            <div class="flex items-center gap-2">
                                <span class="text-lg">{getRoleIcon(note.author_role)}</span>
                                <div>
                                    <p class="text-xs font-medium text-[#f0ece4]">
                                        {note.author_name ?? note.author_email ?? 'Unknown'}
                                    </p>
                                    <p class="text-[10px] text-[#6b5f4d]">
                                        {formatDate(note.created_at)}
                                        {#if note.updated_at !== note.created_at}
                                            · edited
                                        {/if}
                                    </p>
                                </div>
                            </div>

                            <div class="flex items-center gap-1">
                                <button
                                    onclick={() => startEdit(note)}
                                    class="p-1.5 rounded text-[#9a8f7a] hover:text-[#f0ece4] hover:bg-[#131010]
                                           transition-colors focus:outline-none focus:ring-2 focus:ring-[#f5a623]"
                                    title="Edit note">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                    </svg>
                                </button>
                                <form method="POST" action="?/deleteNote" use:enhance>
                                    <input type="hidden" name="note_id" value={note.id} />
                                    <button
                                        type="submit"
                                        onclick={(e) => {
                                            if (!confirm('Delete this note?')) {
                                                e.preventDefault();
                                            }
                                        }}
                                        class="p-1.5 rounded text-[#9a8f7a] hover:text-[#ff4444] hover:bg-[#131010]
                                               transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff4444]"
                                        title="Delete note">
                                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                        </svg>
                                    </button>
                                </form>
                            </div>
                        </div>

                        <div class="prose prose-sm max-w-none tiptap-content">
                            {@html note.content}
                        </div>
                    </div>
                {/if}
            {/each}

            <!-- Empty state -->
            {#if notesByType[activeTab].length === 0 && !isAdding}
                <div class="text-center py-8">
                    <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-[#221c18] flex items-center justify-center">
                        <span class="text-2xl">{NOTE_TYPE_CONFIG[activeTab].icon}</span>
                    </div>
                    <p class="text-sm font-medium text-[#9a8f7a] mb-1">No {NOTE_TYPE_CONFIG[activeTab].label} notes yet</p>
                    <p class="text-xs text-[#6b5f4d] mb-3">{NOTE_TYPE_CONFIG[activeTab].description}</p>
                    <button
                        onclick={startAdd}
                        class="inline-flex items-center gap-2 px-3 py-2 bg-[#f5a623]/10 hover:bg-[#f5a623]/20
                               text-[#f5a623] text-xs font-semibold rounded-lg transition-colors
                               focus:outline-none focus:ring-2 focus:ring-[#f5a623] border border-[#f5a623]/20">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                        </svg>
                        Add First Note
                    </button>
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    :global(.tiptap-content p) {
        margin-bottom: 0.5rem;
        color: #9a8f7a;
        line-height: 1.6;
    }

    :global(.tiptap-content ul),
    :global(.tiptap-content ol) {
        padding-left: 1.5rem;
        margin-bottom: 0.5rem;
        color: #9a8f7a;
    }

    :global(.tiptap-content li) {
        margin-bottom: 0.25rem;
    }

    :global(.tiptap-content strong) {
        font-weight: 600;
        color: #f0ece4;
    }

    :global(.tiptap-content h2) {
        font-size: 1.125rem;
        font-weight: 600;
        margin-top: 0.75rem;
        margin-bottom: 0.375rem;
        color: #f0ece4;
    }

    :global(.tiptap-content h3) {
        font-size: 1rem;
        font-weight: 600;
        margin-top: 0.5rem;
        margin-bottom: 0.25rem;
        color: #f0ece4;
    }
</style>

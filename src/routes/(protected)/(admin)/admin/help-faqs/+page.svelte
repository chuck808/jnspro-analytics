<script lang="ts">
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    type FAQ = {
        id: string;
        question: string;
        answer: string;
        category: string;
        display_order: number;
        is_published: boolean;
        created_at: string;
        updated_at: string;
    };

    let showModal = $state(false);
    let editingFaq = $state<FAQ | null>(null);
    let isSubmitting = $state(false);

    let formData = $state({
        question: '',
        answer: '',
        category: 'general',
        display_order: 0,
        is_published: true
    });

    const categories = [
        { value: 'general', label: 'General Questions' },
        { value: 'analytics', label: 'Analytics & Insights' },
        { value: 'sessions', label: 'Training Sessions' },
        { value: 'upload', label: 'Data Upload' },
        { value: 'goals', label: 'Goals & Targets' },
        { value: 'technical', label: 'Technical Support' }
    ];

    function openCreateModal() {
        editingFaq = null;
        formData = {
            question: '',
            answer: '',
            category: 'general',
            display_order: 0,
            is_published: true
        };
        showModal = true;
    }

    function openEditModal(faq: FAQ) {
        editingFaq = faq;
        formData = {
            question: faq.question,
            answer: faq.answer,
            category: faq.category,
            display_order: faq.display_order,
            is_published: faq.is_published
        };
        showModal = true;
    }

    function closeModal() {
        showModal = false;
        editingFaq = null;
    }

    async function handleSubmit() {
        isSubmitting = true;

        try {
            const url = editingFaq 
                ? '/api/help-faqs/update' 
                : '/api/help-faqs/create';

            const body = editingFaq
                ? { id: editingFaq.id, ...formData }
                : formData;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                window.location.reload();
            } else {
                const error = await response.json();
                alert(`Error: ${error.message || 'Failed to save FAQ'}`);
            }
        } catch (error) {
            alert('Error saving FAQ');
            console.error(error);
        } finally {
            isSubmitting = false;
        }
    }

    async function deleteFaq(id: string) {
        if (!confirm('Are you sure you want to delete this FAQ?')) return;

        try {
            const response = await fetch('/api/help-faqs/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });

            if (response.ok) {
                window.location.reload();
            } else {
                alert('Failed to delete FAQ');
            }
        } catch (error) {
            alert('Error deleting FAQ');
            console.error(error);
        }
    }

    // Group FAQs by category
    const faqsByCategory = $derived.by(() => {
        const grouped: Record<string, FAQ[]> = {
            general: [],
            analytics: [],
            sessions: [],
            upload: [],
            goals: [],
            technical: []
        };

        data.faqs.forEach((faq: any) => {
            if (grouped[faq.category]) {
                grouped[faq.category].push(faq as FAQ);
            }
        });

        return grouped;
    });
</script>

<div class="space-y-6">
    <div class="flex items-center justify-between">
        <div>
            <h2 class="text-lg font-bold text-[#f0ece4]">Help FAQs Management</h2>
            <p class="text-sm text-[#9a8f7a] mt-0.5">Manage frequently asked questions for the help center</p>
        </div>
        <button onclick={openCreateModal} class="btn-primary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Add FAQ
        </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="stat-card">
            <div class="stat-label">Total FAQs</div>
            <div class="stat-value">{data.faqs.length}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Published</div>
            <div class="stat-value text-[#4ade80]">
                {data.faqs.filter((f: any) => f.is_published).length}
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Draft</div>
            <div class="stat-value text-[#f5a623]">
                {data.faqs.filter((f: any) => !f.is_published).length}
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Categories</div>
            <div class="stat-value">
                {Object.values(faqsByCategory).filter(arr => arr.length > 0).length}
            </div>
        </div>
    </div>

    <!-- FAQs by Category -->
    {#each categories as category}
        {@const faqs = faqsByCategory[category.value]}
        {#if faqs.length > 0}
            <div class="category-section">
                <h3 class="category-title">{category.label} ({faqs.length})</h3>
                <div class="faq-list">
                    {#each faqs as faq}
                        <div class="faq-card">
                            <div class="faq-header">
                                <div class="flex-1">
                                    <h4 class="faq-question">{faq.question}</h4>
                                    <p class="faq-answer">{faq.answer}</p>
                                </div>
                                <div class="faq-meta">
                                    <span class="order-badge">Order: {faq.display_order}</span>
                                    <span class="status-badge {faq.is_published ? 'published' : 'draft'}">
                                        {faq.is_published ? 'Published' : 'Draft'}
                                    </span>
                                </div>
                            </div>
                            <div class="faq-actions">
                                <button onclick={() => openEditModal(faq)} class="btn-edit">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                    </svg>
                                    Edit
                                </button>
                                <button onclick={() => deleteFaq(faq.id)} class="btn-delete">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                    </svg>
                                    Delete
                                </button>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    {/each}

    {#if data.faqs.length === 0}
        <div class="empty-state">
            <p>No FAQs created yet. Click "Add FAQ" to get started.</p>
        </div>
    {/if}
</div>

<!-- Modal -->
{#if showModal}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-backdrop" onclick={(e) => e.target === e.currentTarget && closeModal()} onkeydown={(e) => e.key === 'Escape' && closeModal()}>
        <div class="modal-content">
            <div class="modal-header">
                <h3>{editingFaq ? 'Edit FAQ' : 'Create New FAQ'}</h3>
                <button onclick={closeModal} class="close-btn" aria-label="Close modal">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="modal-body">
                <div class="form-group">
                    <label for="question">Question *</label>
                    <input
                        id="question"
                        type="text"
                        bind:value={formData.question}
                        required
                        class="form-input"
                        placeholder="Enter the question"
                    />
                </div>

                <div class="form-group">
                    <label for="answer">Answer *</label>
                    <textarea
                        id="answer"
                        bind:value={formData.answer}
                        required
                        rows="5"
                        class="form-input"
                        placeholder="Enter the answer"
                    ></textarea>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="form-group">
                        <label for="category">Category *</label>
                        <select id="category" bind:value={formData.category} class="form-input">
                            {#each categories as cat}
                                <option value={cat.value}>{cat.label}</option>
                            {/each}
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="order">Display Order</label>
                        <input
                            id="order"
                            type="number"
                            bind:value={formData.display_order}
                            class="form-input"
                            min="0"
                        />
                    </div>
                </div>

                <div class="form-group">
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            bind:checked={formData.is_published}
                            class="form-checkbox"
                        />
                        <span class="text-sm text-[#f0ece4]">Published (visible to users)</span>
                    </label>
                </div>

                <div class="modal-footer">
                    <button type="button" onclick={closeModal} class="btn-secondary" disabled={isSubmitting}>
                        Cancel
                    </button>
                    <button type="submit" class="btn-primary" disabled={isSubmitting}>
                        {#if isSubmitting}
                            Saving...
                        {:else}
                            {editingFaq ? 'Update FAQ' : 'Create FAQ'}
                        {/if}
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}

<style>
    .stat-card {
        background: var(--theme-surface);
        border: 1px solid rgba(245,166,35,0.15);
        border-radius: 12px;
        padding: 1.25rem;
    }

    .stat-label {
        font-size: 0.75rem;
        color: var(--theme-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.5rem;
    }

    .stat-value {
        font-size: 1.875rem;
        font-weight: 700;
        color: var(--theme-text-primary);
    }

    .category-section {
        background: var(--theme-surface);
        border: 1px solid rgba(245,166,35,0.15);
        border-radius: 12px;
        padding: 1.5rem;
    }

    .category-title {
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 700;
        font-size: 1.125rem;
        color: var(--theme-text-primary);
        margin-bottom: 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid rgba(245,166,35,0.1);
    }

    .faq-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .faq-card {
        background: var(--theme-bg);
        border: 1px solid rgba(245,166,35,0.1);
        border-radius: 8px;
        padding: 1.25rem;
    }

    .faq-header {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .faq-question {
        font-weight: 600;
        color: var(--theme-text-primary);
        margin-bottom: 0.5rem;
    }

    .faq-answer {
        font-size: 0.875rem;
        color: var(--theme-text-secondary);
        line-height: 1.6;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .faq-meta {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        align-items: flex-end;
    }

    .order-badge,
    .status-badge {
        font-size: 0.75rem;
        padding: 0.25rem 0.75rem;
        border-radius: 100px;
        font-weight: 600;
        white-space: nowrap;
    }

    .order-badge {
        background: rgba(245,166,35,0.1);
        color: #f5a623;
    }

    .status-badge.published {
        background: rgba(74,222,128,0.1);
        color: #4ade80;
    }

    .status-badge.draft {
        background: rgba(156,163,175,0.1);
        color: #9ca3af;
    }

    .faq-actions {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
    }

    .btn-primary,
    .btn-secondary,
    .btn-edit,
    .btn-delete {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 700;
        font-size: 0.875rem;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        border: none;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-primary {
        background: #f5a623;
        color: #0a0809;
    }

    .btn-primary:hover:not(:disabled) {
        background: #c97e0a;
    }

    .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .btn-secondary {
        background: transparent;
        border: 1px solid rgba(245,166,35,0.2);
        color: #f0ece4;
    }

    .btn-secondary:hover:not(:disabled) {
        border-color: #f5a623;
    }

    .btn-edit {
        padding: 0.5rem 1rem;
        background: rgba(61,232,200,0.1);
        color: #3de8c8;
    }

    .btn-edit:hover {
        background: rgba(61,232,200,0.2);
    }

    .btn-delete {
        padding: 0.5rem 1rem;
        background: rgba(239,68,68,0.1);
        color: #ef4444;
    }

    .btn-delete:hover {
        background: rgba(239,68,68,0.2);
    }

    .empty-state {
        text-align: center;
        padding: 3rem;
        color: var(--theme-text-secondary);
        background: var(--theme-surface);
        border: 1px solid rgba(245,166,35,0.15);
        border-radius: 12px;
    }

    .modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 100;
        background: rgba(10,8,9,0.9);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
    }

    .modal-content {
        background: var(--theme-surface);
        border: 1px solid rgba(245,166,35,0.2);
        border-radius: 16px;
        width: 100%;
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
    }

    .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 2rem 2rem 1.5rem;
        border-bottom: 1px solid rgba(245,166,35,0.1);
    }

    .modal-header h3 {
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 800;
        font-size: 1.5rem;
        color: var(--theme-text-primary);
        margin: 0;
    }

    .close-btn {
        background: none;
        border: none;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        border-radius: 6px;
        transition: background 0.2s;
        color: var(--theme-text-secondary);
    }

    .close-btn:hover {
        background: rgba(245,166,35,0.1);
    }

    .modal-body {
        padding: 2rem;
    }

    .modal-footer {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
        margin-top: 2rem;
    }

    .form-group {
        margin-bottom: 1.5rem;
    }

    .form-group label {
        display: block;
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 700;
        font-size: 0.875rem;
        color: var(--theme-text-primary);
        margin-bottom: 0.5rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .form-input {
        width: 100%;
        background: var(--theme-bg);
        border: 1px solid rgba(245,166,35,0.2);
        border-radius: 8px;
        padding: 0.75rem 1rem;
        font-family: 'Barlow', sans-serif;
        font-size: 0.875rem;
        color: var(--theme-text-primary);
    }

    .form-input:focus {
        outline: none;
        border-color: var(--color-jns-amber);
        box-shadow: 0 0 0 1px var(--color-jns-amber);
    }

    textarea.form-input {
        resize: vertical;
        min-height: 100px;
    }

    .form-checkbox {
        width: 1.25rem;
        height: 1.25rem;
        accent-color: #f5a623;
    }

    @media (max-width: 768px) {
        .modal-header,
        .modal-body {
            padding: 1.5rem;
        }

        .modal-footer {
            flex-direction: column;
        }

        .btn-primary,
        .btn-secondary {
            width: 100%;
            justify-content: center;
        }

        .faq-header {
            flex-direction: column;
        }

        .faq-meta {
            align-items: flex-start;
            flex-direction: row;
        }
    }
</style>

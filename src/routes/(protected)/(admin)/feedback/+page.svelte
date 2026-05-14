<script lang="ts">
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    type FeedbackItem = {
        id: string;
        type: string;
        subject: string;
        description: string;
        email: string | null;
        status: string | null;
        admin_notes: string | null;
        created_at: string | null;
        updated_at: string | null;
        user_id: string | null;
        profiles?: { full_name: string; email: string };
    };

    let selectedFeedback: FeedbackItem | null = $state(null);
    let filterType = $state<string>('all');
    let filterStatus = $state<string>('all');
    let isUpdating = $state(false);
    let updateData = $state({
        status: '',
        admin_notes: ''
    });

    const typeIconPaths: Record<string, string> = {
        bug: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
        feature: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
        feedback: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
        question: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    };

    const statusColors: Record<string, string> = {
        new: '#f5a623',
        in_progress: '#3de8c8',
        resolved: '#4ade80',
        closed: '#6a5f4f'
    };

    const filteredFeedback = $derived.by(() => {
        let items = data.feedback as FeedbackItem[];
        
        if (filterType !== 'all') {
            items = items.filter(f => f.type === filterType);
        }
        
        if (filterStatus !== 'all') {
            items = items.filter(f => f.status === filterStatus);
        }
        
        return items;
    });

    function formatDate(dateString: string | null) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    function openDetail(feedback: FeedbackItem) {
        selectedFeedback = feedback;
        updateData = {
            status: feedback.status ?? 'new',
            admin_notes: feedback.admin_notes || ''
        };
    }

    function closeDetail() {
        selectedFeedback = null;
    }

    async function updateFeedback() {
        if (!selectedFeedback) return;
        
        isUpdating = true;
        
        try {
            const response = await fetch('/api/feedback/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedFeedback.id,
                    status: updateData.status,
                    admin_notes: updateData.admin_notes
                })
            });

            if (response.ok) {
                // Refresh the page to get updated data
                window.location.reload();
            } else {
                alert('Failed to update feedback');
            }
        } catch (error) {
            alert('Error updating feedback');
        } finally {
            isUpdating = false;
        }
    }

    const stats = $derived.by(() => {
        const total = data.feedback.length;
        const byStatus = (data.feedback as FeedbackItem[]).reduce((acc, f) => {
            const status = f.status ?? 'new';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        return {
            total,
            new: byStatus.new || 0,
            in_progress: byStatus.in_progress || 0,
            resolved: byStatus.resolved || 0,
            closed: byStatus.closed || 0
        };
    });

    function handleBackdropClick(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            closeDetail();
        }
    }

    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'Escape' || event.key === 'Enter') {
            closeDetail();
        }
    }
</script>

<div class="space-y-6">
    <!-- Back -->
    <a href="/admin"
       class="inline-flex items-center gap-1 text-sm themed-text-secondary hover:text-[color:var(--accent)] transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        Admin Dashboard
    </a>

    <div class="flex items-center justify-between">
        <div>
            <h2 class="text-lg font-bold themed-text-primary">Feedback Management</h2>
            <p class="text-sm themed-text-secondary mt-0.5">Review and manage user feedback and bug reports</p>
        </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="themed-card rounded-xl p-5">
            <div class="text-xs themed-text-secondary uppercase tracking-wider mb-1">Total</div>
            <div class="text-3xl font-bold themed-text-primary">{stats.total}</div>
        </div>
        <div class="themed-card rounded-xl p-5">
            <div class="text-xs themed-text-secondary uppercase tracking-wider mb-1">New</div>
            <div class="text-3xl font-bold" style="color: {statusColors.new}">{stats.new}</div>
        </div>
        <div class="themed-card rounded-xl p-5">
            <div class="text-xs themed-text-secondary uppercase tracking-wider mb-1">In Progress</div>
            <div class="text-3xl font-bold" style="color: {statusColors.in_progress}">{stats.in_progress}</div>
        </div>
        <div class="themed-card rounded-xl p-5">
            <div class="text-xs themed-text-secondary uppercase tracking-wider mb-1">Resolved</div>
            <div class="text-3xl font-bold" style="color: {statusColors.resolved}">{stats.resolved}</div>
        </div>
    </div>

    <!-- Filters -->
    <div class="filters flex gap-4">
        <div class="flex-1 max-w-xs">
            <label for="type-filter" class="block text-sm font-medium themed-text-secondary mb-1.5">Type</label>
            <select id="type-filter" bind:value={filterType} 
                    class="w-full px-4 py-2.5 bg-[color:var(--background)] border border-[color:var(--border)] rounded-lg themed-text-primary
                           focus:outline-none focus:border-[color:var(--accent)] focus:ring-1 focus:ring-[color:var(--accent)] transition-colors text-sm">
                <option value="all">All Types</option>
                <option value="bug">🐛 Bug Reports</option>
                <option value="feature">💡 Feature Requests</option>
                <option value="feedback">💬 Feedback</option>
                <option value="question">❓ Questions</option>
            </select>
        </div>
        <div class="flex-1 max-w-xs">
            <label for="status-filter" class="block text-sm font-medium text-[#9a8f7a] mb-1.5">Status</label>
            <select id="status-filter" bind:value={filterStatus}
                    class="w-full px-4 py-2.5 bg-[#0a0809] border border-[#221c18] rounded-lg text-[#f0ece4]
                           focus:outline-none focus:border-[#f5a623] focus:ring-1 focus:ring-[#f5a623] transition-colors text-sm">
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
            </select>
        </div>
    </div>

    <!-- Feedback List -->
    <div class="feedback-list">
        {#each filteredFeedback as feedback (feedback.id)}
            <button class="feedback-item" onclick={() => openDetail(feedback)}>
                <div class="fi-header">
                    <div class="fi-type">
                        <svg class="w-6 h-6 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={typeIconPaths[feedback.type]}/>
                        </svg>
                    </div>
                    <div class="fi-meta">
                        <h3>{feedback.subject}</h3>
                        <p class="fi-user">
                            {#if feedback.profiles}
                                {feedback.profiles.full_name} • {feedback.profiles.email}
                            {:else if feedback.email}
                                {feedback.email} • Anonymous
                            {:else}
                                Anonymous
                            {/if}
                        </p>
                    </div>
                    <div class="fi-status" style="background: {statusColors[feedback.status ?? 'new']}20; color: {statusColors[feedback.status ?? 'new']}">
                        {(feedback.status ?? 'new').replace('_', ' ')}
                    </div>
                </div>
                <p class="fi-desc">{feedback.description}</p>
                <div class="fi-footer">
                    <span class="fi-date">{formatDate(feedback.created_at)}</span>
                    {#if feedback.admin_notes}
                        <span class="fi-note-indicator">📝 Has notes</span>
                    {/if}
                </div>
            </button>
        {:else}
            <div class="empty-state">
                <p>No feedback found matching the filters</p>
            </div>
        {/each}
    </div>
</div>

<!-- Detail Modal -->
{#if selectedFeedback}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-backdrop" onclick={handleBackdropClick} onkeydown={handleKeyDown} role="button" tabindex="-1">
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="modal-content detail-modal" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabindex="0">
            <div class="modal-header">
                <div>
                    <div class="detail-type flex items-center gap-2">
                        <svg class="w-4 h-4 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={typeIconPaths[selectedFeedback.type]}/>
                        </svg>
                        <span>{selectedFeedback.type}</span>
                    </div>
                    <h2>{selectedFeedback.subject}</h2>
                </div>
                <button class="close-btn" onclick={closeDetail} aria-label="Close modal">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <div class="modal-body">
                <div class="detail-section">
                    <h4>Submitted by</h4>
                    <p class="detail-text">
                        {#if selectedFeedback.profiles}
                            <strong>{selectedFeedback.profiles.full_name}</strong><br/>
                            {selectedFeedback.profiles.email}
                        {:else if selectedFeedback.email}
                            <strong>Anonymous User</strong><br/>
                            {selectedFeedback.email}
                        {:else}
                            <strong>Anonymous User</strong><br/>
                            No contact provided
                        {/if}
                    </p>
                </div>

                <div class="detail-section">
                    <h4>Description</h4>
                    <p class="detail-text">{selectedFeedback.description}</p>
                </div>

                <div class="detail-section">
                    <h4>Timestamps</h4>
                    <p class="detail-text">
                        <strong>Created:</strong> {formatDate(selectedFeedback.created_at)}<br/>
                        <strong>Updated:</strong> {formatDate(selectedFeedback.updated_at)}
                    </p>
                </div>

                <div class="detail-section">
                    <label for="status-update">Status</label>
                    <select id="status-update" bind:value={updateData.status}>
                        <option value="new">New</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                    </select>
                </div>

                <div class="detail-section">
                    <label for="admin-notes">Admin Notes</label>
                    <textarea 
                        id="admin-notes" 
                        rows="4"
                        placeholder="Add notes for internal tracking..."
                        bind:value={updateData.admin_notes}
                    ></textarea>
                </div>
            </div>

            <div class="modal-footer">
                <button type="button" class="btn-secondary" onclick={closeDetail} disabled={isUpdating}>
                    Close
                </button>
                <button type="button" class="btn-primary" onclick={updateFeedback} disabled={isUpdating}>
                    {#if isUpdating}
                        <span class="spinner"></span>
                        Updating...
                    {:else}
                        Update Feedback
                    {/if}
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .feedback-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .feedback-item {
        background: var(--theme-surface);
        border: 1px solid rgba(245,166,35,0.15);
        border-radius: 12px;
        padding: 1.5rem;
        text-align: left;
        cursor: pointer;
        transition: all 0.2s ease;
        width: 100%;
    }

    .feedback-item:hover {
        border-color: rgba(245,166,35,0.3);
        transform: translateY(-2px);
    }

    .fi-header {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 0.75rem;
    }

    .fi-type {
        font-size: 1.5rem;
        flex-shrink: 0;
    }

    .fi-meta {
        flex: 1;
    }

    .fi-meta h3 {
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 700;
        font-size: 1.1rem;
        color: var(--theme-text-primary);
        margin: 0 0 0.25rem;
    }

    .fi-user {
        font-size: 0.875rem;
        color: var(--theme-text-secondary);
        margin: 0;
    }

    .fi-status {
        padding: 0.35rem 0.75rem;
        border-radius: 100px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: capitalize;
        white-space: nowrap;
    }

    .fi-desc {
        color: var(--theme-text-secondary);
        margin: 0 0 0.75rem;
        line-height: 1.6;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .fi-footer {
        display: flex;
        align-items: center;
        gap: 1rem;
        font-size: 0.75rem;
        color: var(--theme-text-subtle);
    }

    .fi-note-indicator {
        color: var(--color-jns-amber);
    }

    .empty-state {
        text-align: center;
        padding: 3rem;
        color: var(--theme-text-secondary);
    }

    /* Detail Modal */
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
        animation: fadeIn 0.2s ease;
    }

    .detail-modal {
        max-width: 700px;
    }

    .modal-content {
        background: var(--theme-surface);
        border: 1px solid rgba(245,166,35,0.2);
        border-radius: 16px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        animation: slideUp 0.3s ease;
    }

    .modal-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        padding: 2rem 2rem 1.5rem;
        border-bottom: 1px solid rgba(245,166,35,0.1);
    }

    .detail-type {
        font-size: 0.875rem;
        color: var(--theme-text-secondary);
        text-transform: capitalize;
        margin-bottom: 0.5rem;
    }

    .modal-header h2 {
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
        flex-shrink: 0;
    }

    .close-btn svg {
        width: 20px;
        height: 20px;
        color: var(--theme-text-secondary);
    }

    .close-btn:hover {
        background: rgba(245,166,35,0.1);
    }

    .modal-body {
        padding: 2rem;
    }

    .detail-section {
        margin-bottom: 1.5rem;
    }

    .detail-section h4 {
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 700;
        font-size: 0.875rem;
        color: var(--theme-text-primary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin: 0 0 0.5rem;
    }

    .detail-text {
        color: var(--theme-text-secondary);
        line-height: 1.6;
        margin: 0;
    }

    .detail-section label {
        display: block;
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 700;
        font-size: 0.875rem;
        color: var(--theme-text-primary);
        margin-bottom: 0.5rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .detail-section select,
    .detail-section textarea {
        width: 100%;
        background: var(--theme-bg);
        border: 1px solid rgba(245,166,35,0.2);
        border-radius: 8px;
        padding: 0.75rem 1rem;
        font-family: 'Barlow', sans-serif;
        font-size: 0.875rem;
        color: var(--theme-text-primary);
    }

    .detail-section textarea {
        resize: vertical;
        min-height: 100px;
    }

    .modal-footer {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
        padding: 1.5rem 2rem 2rem;
        border-top: 1px solid rgba(245,166,35,0.1);
    }

    .btn-primary,
    .btn-secondary {
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
        transition: all 0.2s ease;
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

    .spinner {
        width: 14px;
        height: 14px;
        border: 2px solid rgba(10,8,9,0.3);
        border-top-color: #0a0809;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 768px) {
        .filters {
            flex-direction: column;
        }

        .fi-header {
            flex-wrap: wrap;
        }

        .modal-header,
        .modal-body,
        .modal-footer {
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
    }
</style>

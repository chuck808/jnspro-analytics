<script lang="ts">
    import { invalidate } from '$app/navigation';
    import type { PageData } from './$types';
    
    let { data }: { data: PageData } = $props();
    
    let showCreateForm = $state(false);
    let isSubmitting = $state(false);
    
    // Form state
    let formData = $state({
        title: '',
        description: '',
        start_time: '',
        end_time: ''
    });
    
    function formatDateTime(dateString: string) {
        return new Date(dateString).toLocaleString('en-GB', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    }
    
    function isActive(schedule: any) {
        const now = new Date();
        const start = new Date(schedule.start_time);
        const end = new Date(schedule.end_time);
        return now >= start && now <= end && schedule.is_active;
    }
    
    function isPast(schedule: any) {
        return new Date(schedule.end_time) < new Date();
    }
    
    async function handleSubmit(e: Event) {
        e.preventDefault();
        isSubmitting = true;
        
        const response = await fetch('/api/admin/maintenance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showCreateForm = false;
            formData = { title: '', description: '', start_time: '', end_time: '' };
            await invalidate('admin:maintenance');
        }
        
        isSubmitting = false;
    }
    
    async function toggleSchedule(id: string, currentStatus: boolean) {
        await fetch('/api/admin/maintenance', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, is_active: !currentStatus })
        });
        await invalidate('admin:maintenance');
    }
    
    async function deleteSchedule(id: string) {
        if (!confirm('Are you sure you want to delete this maintenance schedule?')) return;
        
        await fetch('/api/admin/maintenance', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        await invalidate('admin:maintenance');
    }
</script>

<svelte:head>
    <title>Maintenance Scheduling — AppGatePro Admin</title>
</svelte:head>

<div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
        <div>
            <h2 class="text-lg font-bold text-[#f0ece4]">Maintenance Scheduling</h2>
            <p class="text-sm text-[#9a8f7a] mt-0.5">Schedule and manage maintenance windows</p>
        </div>
        <button
            onclick={() => showCreateForm = !showCreateForm}
            class="px-4 py-2 bg-[#f5a623] hover:bg-[#c97e0a] text-[#0a0809] font-semibold rounded-lg transition-colors text-sm"
        >
            {showCreateForm ? 'Cancel' : '+ Schedule Maintenance'}
        </button>
    </div>

    <!-- Create Form -->
    {#if showCreateForm}
        <div class="bg-[#131010] border border-[#221c18] rounded-xl p-6">
            <h3 class="text-sm font-semibold text-[#f0ece4] mb-4">Schedule New Maintenance</h3>
            <form onsubmit={handleSubmit} class="space-y-4">
                <div>
                    <label for="title" class="block text-sm font-medium text-[#9a8f7a] mb-1.5">
                        Title <span class="text-[#ff4444]">*</span>
                    </label>
                    <input
                        type="text"
                        id="title"
                        bind:value={formData.title}
                        required
                        class="w-full px-4 py-2.5 bg-[#0a0809] border border-[#221c18] rounded-lg text-[#f0ece4]
                               placeholder-[#4a4038] focus:outline-none focus:border-[#f5a623] focus:ring-1
                               focus:ring-[#f5a623] transition-colors text-sm"
                        placeholder="e.g., Database Upgrade"
                    />
                </div>

                <div>
                    <label for="description" class="block text-sm font-medium text-[#9a8f7a] mb-1.5">
                        Description
                    </label>
                    <textarea
                        id="description"
                        bind:value={formData.description}
                        rows="3"
                        class="w-full px-4 py-2.5 bg-[#0a0809] border border-[#221c18] rounded-lg text-[#f0ece4]
                               placeholder-[#4a4038] focus:outline-none focus:border-[#f5a623] focus:ring-1
                               focus:ring-[#f5a623] transition-colors text-sm"
                        placeholder="Brief description of the maintenance work..."
                    ></textarea>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label for="start_time" class="block text-sm font-medium text-[#9a8f7a] mb-1.5">
                            Start Time <span class="text-[#ff4444]">*</span>
                        </label>
                        <input
                            type="datetime-local"
                            id="start_time"
                            bind:value={formData.start_time}
                            required
                            class="w-full px-4 py-2.5 bg-[#0a0809] border border-[#221c18] rounded-lg text-[#f0ece4]
                                   focus:outline-none focus:border-[#f5a623] focus:ring-1
                                   focus:ring-[#f5a623] transition-colors text-sm"
                        />
                    </div>

                    <div>
                        <label for="end_time" class="block text-sm font-medium text-[#9a8f7a] mb-1.5">
                            End Time <span class="text-[#ff4444]">*</span>
                        </label>
                        <input
                            type="datetime-local"
                            id="end_time"
                            bind:value={formData.end_time}
                            required
                            class="w-full px-4 py-2.5 bg-[#0a0809] border border-[#221c18] rounded-lg text-[#f0ece4]
                                   focus:outline-none focus:border-[#f5a623] focus:ring-1
                                   focus:ring-[#f5a623] transition-colors text-sm"
                        />
                    </div>
                </div>

                <div class="flex gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        class="px-6 py-2.5 bg-[#f5a623] hover:bg-[#c97e0a] disabled:opacity-50
                               text-[#0a0809] font-semibold rounded-lg transition-colors text-sm"
                    >
                        {isSubmitting ? 'Scheduling...' : 'Schedule Maintenance'}
                    </button>
                    <button
                        type="button"
                        onclick={() => showCreateForm = false}
                        class="px-6 py-2.5 bg-[#131010] hover:bg-[#171210] border border-[#221c18]
                               text-[#f0ece4] rounded-lg transition-colors text-sm"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    {/if}

    <!-- Maintenance List -->
    <div class="space-y-4">
        {#if data.schedules && data.schedules.length > 0}
            {#each data.schedules as schedule}
                {@const active = isActive(schedule)}
                {@const past = isPast(schedule)}
                
                <div class="bg-[#131010] border border-[#221c18] rounded-xl p-5
                           {active ? 'ring-2 ring-[#f5a623]/20' : ''}">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-1">
                                <h3 class="text-base font-semibold text-[#f0ece4]">{schedule.title}</h3>
                                {#if active}
                                    <span class="px-2 py-0.5 bg-[#f5a623] text-[#0a0809] text-xs font-bold rounded">
                                        ACTIVE NOW
                                    </span>
                                {:else if past}
                                    <span class="px-2 py-0.5 bg-[#221c18] text-[#4a4038] text-xs font-medium rounded">
                                        Completed
                                    </span>
                                {:else if schedule.is_active}
                                    <span class="px-2 py-0.5 bg-[#3de8c8]/10 text-[#3de8c8] text-xs font-medium rounded border border-[#3de8c8]/20">
                                        Scheduled
                                    </span>
                                {:else}
                                    <span class="px-2 py-0.5 bg-[#ff4444]/10 text-[#ff4444] text-xs font-medium rounded border border-[#ff4444]/20">
                                        Disabled
                                    </span>
                                {/if}
                            </div>
                            {#if schedule.description}
                                <p class="text-sm text-[#9a8f7a]">{schedule.description}</p>
                            {/if}
                        </div>
                        
                        <div class="flex gap-2">
                            <button
                                onclick={() => toggleSchedule(schedule.id, schedule.is_active)}
                                class="px-3 py-1.5 text-xs bg-[#0a0809] hover:bg-[#131010] border border-[#221c18]
                                       text-[#f0ece4] rounded-lg transition-colors"
                                title={schedule.is_active ? 'Disable' : 'Enable'}
                            >
                                {schedule.is_active ? 'Disable' : 'Enable'}
                            </button>
                            <button
                                onclick={() => deleteSchedule(schedule.id)}
                                class="px-3 py-1.5 text-xs bg-[#ff4444]/10 hover:bg-[#ff4444]/20 border border-[#ff4444]/20
                                       text-[#ff4444] rounded-lg transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="text-[#4a4038] block text-xs uppercase tracking-wider mb-1">Start Time</span>
                            <span class="text-[#f0ece4]">{formatDateTime(schedule.start_time)}</span>
                        </div>
                        <div>
                            <span class="text-[#4a4038] block text-xs uppercase tracking-wider mb-1">End Time</span>
                            <span class="text-[#f0ece4]">{formatDateTime(schedule.end_time)}</span>
                        </div>
                    </div>
                </div>
            {/each}
        {:else}
            <div class="bg-[#131010] border border-[#221c18] rounded-xl p-12 text-center">
                <svg class="w-12 h-12 text-[#4a4038] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p class="text-[#9a8f7a]">No maintenance schedules yet</p>
                <p class="text-xs text-[#4a4038] mt-1">Click "Schedule Maintenance" to create one</p>
            </div>
        {/if}
    </div>

    <!-- Preview Link -->
    <div class="bg-[#131010] border border-[#f5a623]/20 rounded-xl p-5">
        <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-[#f5a623] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div class="flex-1">
                <p class="text-sm text-[#f0ece4] font-medium mb-1">Test Maintenance Page</p>
                <p class="text-xs text-[#9a8f7a] mb-3">
                    Preview what users will see during maintenance
                </p>
                <a
                    href="/maintenance"
                    target="_blank"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-[#0a0809] hover:bg-[#131010] border border-[#221c18]
                           text-[#f0ece4] text-sm rounded-lg transition-colors"
                >
                    Preview Maintenance Page
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                    </svg>
                </a>
            </div>
        </div>
    </div>
</div>

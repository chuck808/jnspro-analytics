<script lang="ts">
	import { invalidate } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let showCreateForm = $state(false);
	let isSubmitting = $state(false);
	let actionError = $state<string | null>(null);

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
		actionError = null;

		try {
			const response = await fetch('/api/admin/maintenance', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			if (!response.ok) {
				throw new Error(`Maintenance create failed: ${response.status}`);
			}

			showCreateForm = false;
			formData = { title: '', description: '', start_time: '', end_time: '' };
			await invalidate('admin:maintenance');
		} catch (error) {
			console.error('Error scheduling maintenance:', error);
			actionError = 'Could not schedule maintenance. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}

	async function toggleSchedule(id: string, currentStatus: boolean) {
		actionError = null;

		try {
			const response = await fetch('/api/admin/maintenance', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id, is_active: !currentStatus })
			});

			if (!response.ok) {
				throw new Error(`Maintenance update failed: ${response.status}`);
			}

			await invalidate('admin:maintenance');
		} catch (error) {
			console.error('Error updating maintenance schedule:', error);
			actionError = 'Could not update the maintenance schedule. Please try again.';
		}
	}

	async function deleteSchedule(id: string) {
		if (!confirm('Are you sure you want to delete this maintenance schedule?')) return;

		actionError = null;

		try {
			const response = await fetch('/api/admin/maintenance', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id })
			});

			if (!response.ok) {
				throw new Error(`Maintenance delete failed: ${response.status}`);
			}

			await invalidate('admin:maintenance');
		} catch (error) {
			console.error('Error deleting maintenance schedule:', error);
			actionError = 'Could not delete the maintenance schedule. Please try again.';
		}
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
			<p class="mt-0.5 text-sm text-[#9a8f7a]">Schedule and manage maintenance windows</p>
		</div>
		<button
			onclick={() => (showCreateForm = !showCreateForm)}
			class="rounded-lg bg-[#f5a623] px-4 py-2 text-sm font-semibold text-[#0a0809] transition-colors hover:bg-[#c97e0a]"
		>
			{showCreateForm ? 'Cancel' : '+ Schedule Maintenance'}
		</button>
	</div>

	{#if actionError}
		<div
			role="alert"
			class="rounded-lg border border-[#ff4444]/30 bg-[#ff4444]/10 px-4 py-3 text-sm text-[#ff7777]"
		>
			{actionError}
		</div>
	{/if}

	<!-- Create Form -->
	{#if showCreateForm}
		<div class="rounded-xl border border-[#221c18] bg-[#131010] p-6">
			<h3 class="mb-4 text-sm font-semibold text-[#f0ece4]">Schedule New Maintenance</h3>
			<form onsubmit={handleSubmit} class="space-y-4">
				<div>
					<label for="title" class="mb-1.5 block text-sm font-medium text-[#9a8f7a]">
						Title <span class="text-[#ff4444]">*</span>
					</label>
					<input
						type="text"
						id="title"
						bind:value={formData.title}
						required
						class="w-full rounded-lg border border-[#221c18] bg-[#0a0809] px-4 py-2.5 text-sm
                               text-[#f0ece4] placeholder-[#4a4038] transition-colors focus:border-[#f5a623]
                               focus:ring-1 focus:ring-[#f5a623] focus:outline-none"
						placeholder="e.g., Database Upgrade"
					/>
				</div>

				<div>
					<label for="description" class="mb-1.5 block text-sm font-medium text-[#9a8f7a]">
						Description
					</label>
					<textarea
						id="description"
						bind:value={formData.description}
						rows="3"
						class="w-full rounded-lg border border-[#221c18] bg-[#0a0809] px-4 py-2.5 text-sm
                               text-[#f0ece4] placeholder-[#4a4038] transition-colors focus:border-[#f5a623]
                               focus:ring-1 focus:ring-[#f5a623] focus:outline-none"
						placeholder="Brief description of the maintenance work..."
					></textarea>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="start_time" class="mb-1.5 block text-sm font-medium text-[#9a8f7a]">
							Start Time <span class="text-[#ff4444]">*</span>
						</label>
						<input
							type="datetime-local"
							id="start_time"
							bind:value={formData.start_time}
							required
							class="w-full rounded-lg border border-[#221c18] bg-[#0a0809] px-4 py-2.5 text-sm
                                   text-[#f0ece4] transition-colors focus:border-[#f5a623]
                                   focus:ring-1 focus:ring-[#f5a623] focus:outline-none"
						/>
					</div>

					<div>
						<label for="end_time" class="mb-1.5 block text-sm font-medium text-[#9a8f7a]">
							End Time <span class="text-[#ff4444]">*</span>
						</label>
						<input
							type="datetime-local"
							id="end_time"
							bind:value={formData.end_time}
							required
							class="w-full rounded-lg border border-[#221c18] bg-[#0a0809] px-4 py-2.5 text-sm
                                   text-[#f0ece4] transition-colors focus:border-[#f5a623]
                                   focus:ring-1 focus:ring-[#f5a623] focus:outline-none"
						/>
					</div>
				</div>

				<div class="flex gap-3 pt-2">
					<button
						type="submit"
						disabled={isSubmitting}
						class="rounded-lg bg-[#f5a623] px-6 py-2.5 text-sm
                               font-semibold text-[#0a0809] transition-colors hover:bg-[#c97e0a] disabled:opacity-50"
					>
						{isSubmitting ? 'Scheduling...' : 'Schedule Maintenance'}
					</button>
					<button
						type="button"
						onclick={() => (showCreateForm = false)}
						class="rounded-lg border border-[#221c18] bg-[#131010] px-6 py-2.5
                               text-sm text-[#f0ece4] transition-colors hover:bg-[#171210]"
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

				<div
					class="rounded-xl border border-[#221c18] bg-[#131010] p-5
                           {active ? 'ring-2 ring-[#f5a623]/20' : ''}"
				>
					<div class="mb-3 flex items-start justify-between">
						<div class="flex-1">
							<div class="mb-1 flex items-center gap-2">
								<h3 class="text-base font-semibold text-[#f0ece4]">{schedule.title}</h3>
								{#if active}
									<span class="rounded bg-[#f5a623] px-2 py-0.5 text-xs font-bold text-[#0a0809]">
										ACTIVE NOW
									</span>
								{:else if past}
									<span class="rounded bg-[#221c18] px-2 py-0.5 text-xs font-medium text-[#4a4038]">
										Completed
									</span>
								{:else if schedule.is_active}
									<span
										class="rounded border border-[#3de8c8]/20 bg-[#3de8c8]/10 px-2 py-0.5 text-xs font-medium text-[#3de8c8]"
									>
										Scheduled
									</span>
								{:else}
									<span
										class="rounded border border-[#ff4444]/20 bg-[#ff4444]/10 px-2 py-0.5 text-xs font-medium text-[#ff4444]"
									>
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
								onclick={() => toggleSchedule(schedule.id, schedule.is_active ?? false)}
								class="rounded-lg border border-[#221c18] bg-[#0a0809] px-3 py-1.5 text-xs
                                       text-[#f0ece4] transition-colors hover:bg-[color:var(--theme-surface)]"
								title={schedule.is_active ? 'Disable' : 'Enable'}
							>
								{schedule.is_active ? 'Disable' : 'Enable'}
							</button>
							<button
								onclick={() => deleteSchedule(schedule.id)}
								class="rounded-lg border border-[#ff4444]/20 bg-[#ff4444]/10 px-3 py-1.5 text-xs
                                       text-[#ff4444] transition-colors hover:bg-[#ff4444]/20"
							>
								Delete
							</button>
						</div>
					</div>

					<div class="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span class="mb-1 block text-xs tracking-wider text-[#4a4038] uppercase"
								>Start Time</span
							>
							<span class="text-[#f0ece4]">{formatDateTime(schedule.start_time)}</span>
						</div>
						<div>
							<span class="mb-1 block text-xs tracking-wider text-[#4a4038] uppercase"
								>End Time</span
							>
							<span class="text-[#f0ece4]">{formatDateTime(schedule.end_time)}</span>
						</div>
					</div>
				</div>
			{/each}
		{:else}
			<div class="rounded-xl border border-[#221c18] bg-[#131010] p-12 text-center">
				<svg
					class="mx-auto mb-4 h-12 w-12 text-[#4a4038]"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<p class="text-[#9a8f7a]">No maintenance schedules yet</p>
				<p class="mt-1 text-xs text-[#4a4038]">Click "Schedule Maintenance" to create one</p>
			</div>
		{/if}
	</div>

	<!-- Preview Link -->
	<div class="rounded-xl border border-[#f5a623]/20 bg-[#131010] p-5">
		<div class="flex items-start gap-3">
			<svg
				class="mt-0.5 h-5 w-5 flex-shrink-0 text-[#f5a623]"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			<div class="flex-1">
				<p class="mb-1 text-sm font-medium text-[#f0ece4]">Test Maintenance Page</p>
				<p class="mb-3 text-xs text-[#9a8f7a]">Preview what users will see during maintenance</p>
				<a
					href="/maintenance"
					target="_blank"
					class="inline-flex items-center gap-2 rounded-lg border border-[#221c18] bg-[#0a0809] px-4 py-2
                           text-sm text-[#f0ece4] transition-colors hover:bg-[color:var(--theme-surface)]"
				>
					Preview Maintenance Page
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
						/>
					</svg>
				</a>
			</div>
		</div>
	</div>
</div>
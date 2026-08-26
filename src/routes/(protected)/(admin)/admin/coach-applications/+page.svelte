<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let savingId: string | null = $state(null);

	function fmtDateTime(ts: string) {
		return new Date(ts).toLocaleString('en-GB', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function statusBadgeClass(status: string) {
		if (status === 'approved') return 'border border-[#3de8c8]/40 bg-[#3de8c8]/10 text-[#3de8c8]';
		if (status === 'rejected') return 'border border-red-800/40 bg-red-900/20 text-red-400';
		return 'themed-text-secondary bg-[color:var(--border)]';
	}
</script>

<svelte:head>
	<title>Coach Applications — Admin — AppGatePro</title>
</svelte:head>

<div class="space-y-5">
	<div>
		<h3 class="themed-text-primary text-lg font-bold">Coach Applications</h3>
		<p class="themed-text-secondary text-sm">
			Review who's applied to become a coach before they can invite riders. This is safeguarding
			oversight — read the full application before deciding.
		</p>
	</div>

	{#if (form as any)?.reviewError}
		<div role="alert" class="rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
			{(form as any).reviewError}
		</div>
	{/if}
	{#if (form as any)?.reviewSuccess}
		<div
			class="rounded-lg border border-[#3de8c8]/30 bg-[#3de8c8]/10 p-3 text-sm text-[#3de8c8]"
		>
			Decision recorded.
		</div>
	{/if}

	<div class="themed-card rounded-xl p-5">
		<h4 class="themed-text-primary mb-4 text-sm font-semibold">
			Pending review ({data.pending.length})
		</h4>

		{#if data.pending.length === 0}
			<p class="themed-text-secondary text-sm">No applications waiting for review.</p>
		{:else}
			<div class="space-y-4">
				{#each data.pending as application (application.id)}
					<div class="rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] p-4">
						<div class="mb-3 flex flex-wrap items-start justify-between gap-2">
							<div>
								<p class="themed-text-primary text-sm font-medium">{application.applicantName}</p>
								<p class="themed-text-secondary text-xs">{application.applicantEmail}</p>
								{#if application.applicantClub}
									<p class="text-xs text-[color:var(--text-subtle)]">{application.applicantClub}</p>
								{/if}
							</div>
							<span class="text-xs text-[color:var(--text-subtle)]">
								Submitted {fmtDateTime(application.submitted_at)}
							</span>
						</div>

						{#if application.qualification_details}
							<p class="themed-text-primary mb-4 rounded-lg bg-[color:var(--card)] p-3 text-sm whitespace-pre-wrap">
								{application.qualification_details}
							</p>
						{:else}
							<p class="themed-text-secondary mb-4 text-xs italic">No details provided.</p>
						{/if}

						<div class="flex flex-wrap gap-2">
							<form
								method="POST"
								action="?/approve"
								use:enhance={({ cancel }) => {
									if (
										!confirm(
											`Approve ${application.applicantName} as a coach? They'll be able to invite riders immediately.`
										)
									) {
										cancel();
										return;
									}
									savingId = application.id;
									return async ({ update }) => {
										try {
											await update();
										} finally {
											savingId = null;
										}
									};
								}}
							>
								<input type="hidden" name="applicationId" value={application.id} />
								<button
									type="submit"
									disabled={savingId === application.id}
									class="rounded-lg bg-[#f5a623] px-3 py-1.5 text-xs font-semibold text-[#0a0809]
                                           transition-colors hover:bg-[#c97e0a] disabled:opacity-50"
								>
									Approve
								</button>
							</form>
							<form
								method="POST"
								action="?/reject"
								use:enhance={({ cancel }) => {
									if (
										!confirm(
											`Reject ${application.applicantName}'s coach application? They can re-apply anytime.`
										)
									) {
										cancel();
										return;
									}
									savingId = application.id;
									return async ({ update }) => {
										try {
											await update();
										} finally {
											savingId = null;
										}
									};
								}}
							>
								<input type="hidden" name="applicationId" value={application.id} />
								<button
									type="submit"
									disabled={savingId === application.id}
									class="rounded-lg border border-red-800/40 px-3 py-1.5 text-xs text-red-400
                                           transition-colors hover:bg-red-900/20 disabled:opacity-50"
								>
									Reject
								</button>
							</form>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div class="themed-card rounded-xl p-5">
		<h4 class="themed-text-primary mb-4 text-sm font-semibold">History ({data.history.length})</h4>
		{#if data.history.length === 0}
			<p class="themed-text-secondary text-sm">No decided applications yet.</p>
		{:else}
			<div class="space-y-2">
				{#each data.history as application (application.id)}
					<div
						class="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[color:var(--background)] p-3 text-xs"
					>
						<div>
							<span class="themed-text-primary font-medium">{application.applicantName}</span>
							<span class="themed-text-secondary"> — {application.applicantEmail}</span>
							{#if application.source === 'admin_grant'}
								<span class="themed-text-secondary"> (direct grant)</span>
							{/if}
						</div>
						<div class="flex items-center gap-2">
							{#if application.review_notes}
								<span class="text-[color:var(--text-subtle)]">{application.review_notes}</span>
							{/if}
							<span class="rounded px-2 py-0.5 {statusBadgeClass(application.status)}">
								{application.status}
							</span>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

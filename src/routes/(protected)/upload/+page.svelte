<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type UploadState = 'idle' | 'reading' | 'uploading' | 'success' | 'error';
	type UploadResult = {
		session_id: string;
		runs_imported: number;
		timeseries_count: number;
		timeseries_failed: number;
		timeseries_errors?: string[];
		warnings?: string[];
		bike_linked?: boolean;
		profile_linked?: boolean;
	};
	type DuplicateSession = {
		id: string;
		timestamp: string;
		session_type: string;
		run_count: number;
	};

	let state = $state<UploadState>('idle');
	let file = $state<File | null>(null);
	let result = $state<UploadResult | null>(null);
	let errorMsg = $state('');
	let warnings = $state<string[]>([]);
	let dragOver = $state(false);
	let duplicateSession = $state<DuplicateSession | null>(null);

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files?.[0]) setFile(input.files[0]);
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragOver = false;
		const dropped = e.dataTransfer?.files[0];
		if (dropped) setFile(dropped);
	}

	function setFile(nextFile: File) {
		if (!nextFile.name.toLowerCase().endsWith('.json')) {
			errorMsg = 'Select a JSON session file from your AppGatePro SD card.';
			state = 'error';
			file = null;
			duplicateSession = null;
			return;
		}
		file = nextFile;
		state = 'idle';
		errorMsg = '';
		result = null;
		warnings = [];
		duplicateSession = null;
	}

	async function upload() {
		if (!file) return;
		state = 'reading';
		errorMsg = '';
		warnings = [];
		duplicateSession = null;

		try {
			const text = await file.text();
			let parsed: unknown;
			try {
				parsed = JSON.parse(text);
			} catch {
				state = 'error';
				errorMsg = 'This file is not valid JSON. It may be incomplete or corrupted.';
				return;
			}

			state = 'uploading';
			const response = await fetch('/api/upload', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(parsed)
			});
			const body = await response.json();

			if (response.status === 409 && body.duplicate) {
				state = 'error';
				duplicateSession = body.existing_session as DuplicateSession;
				errorMsg = body.message || 'This session has already been imported.';
				warnings = body.warnings ?? [];
				return;
			}

			if (!response.ok || !body.success) {
				state = 'error';
				const validationErrors = Array.isArray(body.errors) ? body.errors.join('\n') : null;
				errorMsg = validationErrors || body.message || body.error || 'Upload failed.';
				warnings = body.warnings ?? [];
				return;
			}

			result = body as UploadResult;
			warnings = body.warnings ?? [];
			state = 'success';
			file = null;
		} catch {
			state = 'error';
			errorMsg = 'Network error — check your connection and try again.';
		}
	}

	function reset() {
		state = 'idle';
		file = null;
		result = null;
		errorMsg = '';
		warnings = [];
		duplicateSession = null;
	}

	let isUploading = $derived(state === 'reading' || state === 'uploading');
</script>

<svelte:head>
	<title>Add Session — AppGatePro</title>
</svelte:head>

<div class="mx-auto max-w-3xl space-y-6">
	<section class="themed-card rounded-xl p-6">
		<p class="themed-text-faint mb-2 text-xs font-semibold tracking-wider uppercase">Add session</p>
		<h1 class="themed-text-primary text-2xl font-bold">Get the ride into AppGatePro first</h1>
		<p class="themed-text-secondary mt-2 max-w-2xl text-sm leading-relaxed">
			Sensor evidence is the important part. Context, run tags, notes and optional video can be added
			afterward without blocking the import.
		</p>
	</section>

	{#if !data.profileComplete}
		<section class="rounded-xl border border-[#f5a623]/30 bg-[#f5a623]/10 p-4 text-sm">
			<p class="font-medium text-[#f5a623]">Your session can still be imported</p>
			<p class="mt-1 text-[#9a8f7a]">
				Some power and biomechanical calculations need rider and bike measurements.
				<a href="/profile" class="ml-1 text-[#f5a623] hover:underline">Complete your profile when convenient.</a>
			</p>
		</section>
	{/if}

	<section class="themed-card rounded-xl p-6">
		<div class="flex items-start gap-4">
			<div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-[#3de8c8]/20 bg-[#3de8c8]/10 text-[#3de8c8]">
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.5 16.5a5 5 0 017 0M5 13a10 10 0 0114 0M2 9.5a15 15 0 0120 0M12 20h.01" />
				</svg>
			</div>
			<div class="min-w-0 flex-1">
				<div class="flex flex-wrap items-center gap-2">
					<h2 class="themed-text-primary text-base font-semibold">Direct Wi-Fi upload</h2>
					<span class="rounded-full border border-[#3de8c8]/20 bg-[#3de8c8]/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#3de8c8] uppercase">Automatic when enabled</span>
				</div>
				<p class="themed-text-secondary mt-2 text-sm leading-relaxed">
					If direct upload is enabled on your AppGatePro hardware, the device can send the saved session
					straight to your account. This page does not need to stay open.
				</p>
				<p class="themed-text-faint mt-2 text-xs leading-relaxed">
					The SD file remains a safe fallback. AppGatePro fingerprints the source session, so uploading the
					same file later will point you to the session that already exists rather than creating a duplicate.
				</p>
			</div>
		</div>
	</section>

	{#if state === 'success' && result}
		<section class="rounded-xl border border-[#3de8c8]/30 bg-[#131010] p-6">
			<div class="flex items-start gap-4">
				<div class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#3de8c8]/10">
					<svg class="h-6 w-6 text-[#3de8c8]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<div class="min-w-0 flex-1">
					<h2 class="text-lg font-semibold text-[#f0ece4]">Session imported</h2>
					<p class="mt-1 text-sm text-[#9a8f7a]">
						{result.runs_imported} run{result.runs_imported === 1 ? '' : 's'} recorded. You can review the evidence now and add context or exclusions where they help interpretation.
					</p>

					<div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
						<div class="rounded-lg bg-[#0a0809] p-3">
							<p class="text-xs text-[#6b5f4d]">Runs</p>
							<p class="mt-1 text-sm font-semibold text-[#f0ece4]">{result.runs_imported}</p>
						</div>
						<div class="rounded-lg bg-[#0a0809] p-3">
							<p class="text-xs text-[#6b5f4d]">Detailed trace</p>
							<p class="mt-1 text-sm font-semibold text-[#f0ece4]">{result.timeseries_count > 0 ? `${result.timeseries_count} runs` : 'Not present'}</p>
						</div>
						<div class="rounded-lg bg-[#0a0809] p-3">
							<p class="text-xs text-[#6b5f4d]">Bike snapshot</p>
							<p class="mt-1 text-sm font-semibold text-[#f0ece4]">{result.bike_linked ? 'Linked' : 'Not linked'}</p>
						</div>
						<div class="rounded-lg bg-[#0a0809] p-3">
							<p class="text-xs text-[#6b5f4d]">Rider snapshot</p>
							<p class="mt-1 text-sm font-semibold text-[#f0ece4]">{result.profile_linked ? 'Linked' : 'Not linked'}</p>
						</div>
					</div>

					{#if warnings.length > 0}
						<div class="mt-4 rounded-lg border border-[#f5a623]/20 bg-[#f5a623]/10 p-3">
							<p class="text-xs font-medium text-[#f5a623]">Imported with notes</p>
							{#each warnings as warning}
								<p class="mt-1 text-xs leading-relaxed text-[#9a8f7a]">• {warning}</p>
							{/each}
							{#if result.timeseries_errors?.length}
								<details class="mt-2 border-t border-[#f5a623]/20 pt-2">
									<summary class="cursor-pointer text-xs text-[#f5a623]">Technical details</summary>
									{#each result.timeseries_errors as detail}
										<p class="mt-1 font-mono text-xs text-[#6b5f4d]">{detail}</p>
									{/each}
								</details>
							{/if}
						</div>
					{/if}

					<div class="mt-5 flex flex-wrap gap-3">
						<a href="/sessions/{result.session_id}" class="rounded-lg bg-[#f5a623] px-4 py-2.5 text-sm font-semibold text-[#0a0809] transition-colors hover:bg-[#c97e0a]">
							Review session & add context
						</a>
						<button onclick={reset} class="rounded-lg border border-[#221c18] bg-[#0a0809] px-4 py-2.5 text-sm text-[#9a8f7a] transition-colors hover:text-[#f0ece4]">
							Import another SD file
						</button>
					</div>
				</div>
			</div>
		</section>
	{:else}
		<section class="themed-card rounded-xl p-6">
			<div class="mb-4">
				<p class="themed-text-faint text-xs font-semibold tracking-wider uppercase">SD card fallback</p>
				<h2 class="themed-text-primary mt-1 text-lg font-semibold">Import a saved session file</h2>
				<p class="themed-text-secondary mt-1 text-sm">Use this if direct Wi-Fi upload is disabled, unavailable, or you simply prefer transferring the SD file yourself.</p>
			</div>

			<div
				role="button"
				tabindex="0"
				class="cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors {dragOver ? 'border-[#f5a623] bg-[#f5a623]/5' : file ? 'border-[#3de8c8]/40 bg-[#3de8c8]/5' : 'border-[#221c18] hover:border-[#f5a623]/40'}"
				ondragover={(e) => { e.preventDefault(); dragOver = true; }}
				ondragleave={() => (dragOver = false)}
				ondrop={handleDrop}
				onclick={() => document.getElementById('fileInput')?.click()}
				onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && document.getElementById('fileInput')?.click()}
			>
				<input id="fileInput" type="file" accept=".json,application/json" class="hidden" onchange={handleFileSelect} />
				{#if file}
					<p class="text-base font-semibold text-[#3de8c8]">{file.name}</p>
					<p class="mt-1 text-xs text-[#9a8f7a]">{(file.size / 1024).toFixed(1)} KB · click to change</p>
				{:else}
					<svg class="mx-auto h-8 w-8 text-[#6b5f4d]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
					</svg>
					<p class="themed-text-primary mt-3 text-base font-semibold">Drop the session JSON here</p>
					<p class="themed-text-secondary mt-1 text-xs">or click to choose it from the SD card</p>
				{/if}
			</div>

			{#if state === 'error'}
				{#if duplicateSession}
					<div class="mt-4 rounded-lg border border-[#f5a623]/30 bg-[#f5a623]/10 p-4">
						<p class="text-sm font-semibold text-[#f5a623]">Already imported</p>
						<p class="mt-1 text-xs text-[#9a8f7a]">{errorMsg}</p>
						<p class="mt-2 text-xs text-[#6b5f4d]">{duplicateSession.run_count} runs · {duplicateSession.session_type}</p>
						<div class="mt-3 flex flex-wrap gap-2">
							<a href="/sessions/{duplicateSession.id}" class="rounded-lg bg-[#f5a623] px-3 py-2 text-xs font-semibold text-[#0a0809]">Open existing session</a>
							<button onclick={reset} class="rounded-lg bg-[#221c18] px-3 py-2 text-xs text-[#f0ece4]">Choose another file</button>
						</div>
					</div>
				{:else}
					<div class="mt-4 rounded-lg border border-red-800 bg-red-900/20 p-4">
						<p class="text-sm font-medium text-red-400">Couldn’t import this file</p>
						<p class="mt-1 text-xs whitespace-pre-line text-red-300">{errorMsg}</p>
						{#each warnings as warning}
							<p class="mt-1 text-xs text-[#9a8f7a]">• {warning}</p>
						{/each}
					</div>
				{/if}
			{/if}

			<button
				onclick={upload}
				disabled={!file || isUploading}
				class="mt-4 flex w-full items-center justify-center rounded-lg bg-[#f5a623] py-3 text-sm font-semibold text-[#0a0809] transition-colors hover:bg-[#c97e0a] disabled:cursor-not-allowed disabled:opacity-40"
			>
				{isUploading ? (state === 'reading' ? 'Reading file…' : 'Importing session…') : file ? 'Import session' : 'Choose a file to continue'}
			</button>
		</section>
	{/if}

	<section class="rounded-xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface)] p-5">
		<h2 class="themed-text-primary text-sm font-semibold">After the session is saved</h2>
		<div class="mt-3 grid gap-3 sm:grid-cols-3">
			<div class="themed-nested-card rounded-lg p-3">
				<p class="text-xs font-semibold text-[#f5a623]">1 · Evidence first</p>
				<p class="themed-text-secondary mt-1 text-xs leading-relaxed">Get the sensor session into your history. Do not delay the import because context is missing.</p>
			</div>
			<div class="themed-nested-card rounded-lg p-3">
				<p class="text-xs font-semibold text-[#f5a623]">2 · Add useful context</p>
				<p class="themed-text-secondary mt-1 text-xs leading-relaxed">Weather, surface, focus and ride feel help explain what the numbers mean, but all are optional.</p>
			</div>
			<div class="themed-nested-card rounded-lg p-3">
				<p class="text-xs font-semibold text-[#f5a623]">3 · Protect the statistics</p>
				<p class="themed-text-secondary mt-1 text-xs leading-relaxed">Tag warm-up, experimental, competition or deliberately excluded runs so they stay in history without contaminating normal statistics.</p>
			</div>
		</div>
	</section>
</div>

<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// @ts-expect-error - Svelte 5 $state rune
	let state = $state('idle');
	let file = $state(null);
	let result = $state(null);
	let errorMsg = $state('');
	let warnings = $state([]);
	let dragOver = $state(false);
	let duplicateSession = $state(null);

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

	function setFile(f: File) {
		if (!f.name.endsWith('.json')) {
			errorMsg = 'Please select a JSON file from your AppGatePro SD card';
			state = 'error';
			return;
		}
		file = f;
		state = 'idle';
		errorMsg = '';
		result = null;
		warnings = [];
	}

	async function upload() {
		if (!file) return;

		state = 'reading';
		errorMsg = '';

		try {
			// Read file
			const text = await file.text();
			let parsed: unknown;
			try {
				parsed = JSON.parse(text);
			} catch {
				state = 'error';
				errorMsg = 'File is not valid JSON — it may be corrupted';
				return;
			}

			state = 'uploading';

			const response = await fetch('/api/upload', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(parsed)
			});

			const data = await response.json();

			// Check for duplicate upload
			if (response.status === 409 && data.duplicate) {
				state = 'error';
				duplicateSession = data.existing_session;
				errorMsg = data.message || 'This file has already been uploaded';
				warnings = data.warnings ?? [];
				return;
			}

			if (!response.ok || !data.success) {
				state = 'error';
				errorMsg = data.errors?.join('\n') ?? 'Upload failed';
				warnings = data.warnings ?? [];
				return;
			}

			result = data;
			warnings = data.warnings ?? [];
			state = 'success';
			file = null;
		} catch {
			state = 'error';
			errorMsg = 'Network error — check your connection and try again';
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
	<title>Upload Session — AppGatePro</title>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-6">
	<!-- Header -->
	<div class="themed-card rounded-xl p-6">
		<h2 class="themed-text-primary mb-1 text-lg font-bold">Upload Training Session</h2>
		<p class="themed-text-secondary text-sm">
			Copy the JSON file from your AppGatePro SD card and upload it here. The file will be
			automatically validated and imported.
		</p>
	</div>

	{#if !data.profileComplete}
		<div class="rounded-xl border border-[#f5a623]/30 bg-[#f5a623]/10 p-4 text-sm">
			<p class="mb-1 font-medium text-[#f5a623]">⚠ Profile incomplete</p>
			<p class="text-[#9a8f7a]">
				You can still upload sessions, but
				<a href="/profile" class="text-[#f5a623] hover:underline">completing your profile</a>
				unlocks power and biomechanical analytics.
			</p>
		</div>
	{/if}

	{#if state === 'success' && result}
		<!-- Success state -->
		<div class="rounded-xl border border-[#3de8c8]/30 bg-[#131010] p-6">
			<div class="flex items-start gap-4">
				<div
					class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#3de8c8]/10"
				>
					<svg class="h-6 w-6 text-[#3de8c8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						/>
					</svg>
				</div>
				<div class="flex-1">
					<h3 class="mb-1 text-base font-semibold text-[#f0ece4]">Session imported successfully</h3>
					<div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
						{#each [{ label: 'Runs imported', value: result.runs_imported }, { label: 'Time series', value: result.timeseries_count > 0 ? `${result.timeseries_count} runs` : 'None', warning: result.timeseries_failed > 0 }, { label: 'Bike linked', value: result.bike_linked ? '✓ Yes' : '— No active bike' }, { label: 'Profile linked', value: result.profile_linked ? '✓ Yes' : '— No profile' }] as stat}
							<div
								class="rounded-lg bg-[#0a0809] p-3 {stat.warning
									? 'border border-[#f5a623]/30'
									: ''}"
							>
								<p class="mb-1 text-xs text-[#4a4038]">{stat.label}</p>
								<p
									class="text-sm font-semibold {stat.warning ? 'text-[#f5a623]' : 'text-[#f0ece4]'}"
								>
									{stat.value}
								</p>
								{#if stat.warning}
									<p class="mt-1 text-xs text-[#9a8f7a]">{result.timeseries_failed} failed</p>
								{/if}
							</div>
						{/each}
					</div>
					{#if warnings.length > 0}
						<div class="mt-4 rounded-lg border border-[#f5a623]/20 bg-[#f5a623]/10 p-3">
							<p class="mb-2 text-xs font-medium text-[#f5a623]">⚠ Warnings</p>
							{#each warnings as w}
								<p class="text-xs leading-relaxed text-[#9a8f7a]">• {w}</p>
							{/each}
							{#if result.timeseries_errors && result.timeseries_errors.length > 0}
								<details class="mt-2 border-t border-[#f5a623]/20 pt-2">
									<summary
										class="mb-1 cursor-pointer text-xs font-medium text-[#f5a623] hover:text-[#c97e0a]"
									>
										View timeseries error details
									</summary>
									<div class="mt-2 space-y-1">
										{#each result.timeseries_errors as err}
											<p class="font-mono text-xs text-[#6b5f4d]">• {err}</p>
										{/each}
									</div>
								</details>
							{/if}
						</div>
					{/if}
					<div class="mt-5 flex gap-3">
						<a
							href="/sessions/{result.session_id}"
							class="rounded-lg bg-[#f5a623] px-4 py-2 text-sm
                                  font-semibold text-[#0a0809] transition-colors hover:bg-[#c97e0a]"
						>
							View session analytics
						</a>
						<button
							onclick={reset}
							class="rounded-lg bg-[#221c18] px-4 py-2 text-sm
                                       text-[#9a8f7a] transition-colors hover:bg-[#2a2218]"
						>
							Upload another
						</button>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<!-- Upload form -->
		<div class="space-y-5 rounded-xl border border-[#221c18] bg-[#131010] p-6">
			<!-- Drop zone -->
			<div
				role="button"
				tabindex="0"
				class="cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors
                       {dragOver
					? 'border-[#f5a623] bg-[#f5a623]/5'
					: file
						? 'border-[#3de8c8]/40 bg-[#3de8c8]/5'
						: 'border-[#221c18] hover:border-[#f5a623]/40'}"
				ondragover={(e) => {
					e.preventDefault();
					dragOver = true;
				}}
				ondragleave={() => (dragOver = false)}
				ondrop={handleDrop}
				onclick={() => document.getElementById('fileInput')?.click()}
				onkeydown={(e) => e.key === 'Enter' && document.getElementById('fileInput')?.click()}
			>
				<input
					id="fileInput"
					type="file"
					accept=".json"
					class="hidden"
					onchange={handleFileSelect}
				/>

				{#if file}
					<svg
						class="mx-auto mb-3 h-10 w-10 text-[#3de8c8]"
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
					<p class="mb-1 text-base font-semibold text-[#3de8c8]">{file.name}</p>
					<p class="text-xs text-[#9a8f7a]">
						{(file.size / 1024).toFixed(1)} KB · Click to change
					</p>
				{:else}
					<svg
						class="mx-auto mb-3 h-10 w-10 text-[#4a4038]"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
						/>
					</svg>
					<p class="mb-1 text-base font-semibold text-[#f0ece4]">Drop your session file here</p>
					<p class="text-xs text-[#9a8f7a]">or click to browse · JSON files only</p>
				{/if}
			</div>

			<!-- Error or Duplicate Warning -->
			{#if state === 'error'}
				{#if duplicateSession}
					<!-- Duplicate detected -->
					<div class="rounded-lg border border-[#f5a623] bg-[#f5a623]/20 p-4">
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
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								/>
							</svg>
							<div class="flex-1">
								<p class="mb-1 text-sm font-medium text-[#f5a623]">Duplicate file detected</p>
								<p class="mb-3 text-xs text-[#f0ece4]">{errorMsg}</p>

								<div class="mb-3 rounded-lg border border-[#221c18] bg-[#0a0809] p-3">
									<p class="mb-2 text-xs text-[#9a8f7a]">Existing session details:</p>
									<div class="grid grid-cols-2 gap-2 text-xs">
										<div>
											<span class="text-[#6b5f4d]">Type:</span>
											<span class="ml-1 text-[#f0ece4]">{duplicateSession.session_type}</span>
										</div>
										<div>
											<span class="text-[#6b5f4d]">Runs:</span>
											<span class="ml-1 text-[#f0ece4]">{duplicateSession.run_count}</span>
										</div>
									</div>
								</div>

								<div class="flex flex-wrap gap-2">
									<a
										href="/sessions/{duplicateSession.id}"
										class="rounded-lg bg-[#f5a623] px-3 py-2 text-xs
                                              font-semibold text-[#0a0809] transition-colors hover:bg-[#c97e0a]"
									>
										View existing session
									</a>
									<button
										onclick={reset}
										class="rounded-lg bg-[#221c18] px-3 py-2 text-xs
                                                   text-[#f0ece4] transition-colors hover:bg-[#2a2218]"
									>
										Try different file
									</button>
								</div>
							</div>
						</div>
					</div>
				{:else}
					<!-- Regular error -->
					<div class="rounded-lg border border-red-800 bg-red-900/20 p-4">
						<p class="mb-1 text-sm font-medium text-red-400">Upload failed</p>
						<p class="text-xs whitespace-pre-line text-red-400">{errorMsg}</p>
						{#if warnings.length > 0}
							<div class="mt-2 border-t border-red-800/40 pt-2">
								{#each warnings as w}
									<p class="text-xs text-[#9a8f7a]">⚠ {w}</p>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			{/if}

			<!-- Upload button -->
			<button
				onclick={upload}
				disabled={!file || isUploading}
				class="flex w-full items-center justify-center gap-2
                       rounded-lg bg-[#f5a623] py-3 text-sm
                       font-semibold text-[#0a0809] transition-colors hover:bg-[#c97e0a] disabled:cursor-not-allowed disabled:opacity-40"
			>
				{#if isUploading}
					<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
						<circle
							class="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-width="4"
						/>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
						/>
					</svg>
					{state === 'reading' ? 'Reading file...' : 'Uploading...'}
				{:else if file}
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
						/>
					</svg>
					Import session
				{:else}
					Select a file to continue
				{/if}
			</button>
		</div>
	{/if}

	<!-- Instructions -->
	<div class="rounded-xl border border-[#221c18] bg-[#131010] p-6">
		<h3 class="mb-4 text-sm font-semibold tracking-wider text-[#9a8f7a] uppercase">
			How to export from your device
		</h3>
		<ol class="space-y-3">
			{#each ['After your training session, save to SD card from the AppGatePro menu', 'Remove the SD card and insert it into your computer', 'Find the session JSON file in the root of the SD card', 'Upload the file here — all runs in the session are imported together'] as step, i}
				<li class="flex gap-3 text-sm text-[#9a8f7a]">
					<span
						class="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center
                                 justify-center rounded-full bg-[#221c18] text-xs font-bold text-[#f5a623]"
					>
						{i + 1}
					</span>
					{step}
				</li>
			{/each}
		</ol>
	</div>
</div>

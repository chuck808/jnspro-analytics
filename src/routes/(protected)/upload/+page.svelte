<script lang="ts">
    import type { PageData } from './$types';
    import LoadingButton from '$lib/components/LoadingButton.svelte';

    let { data }: { data: PageData } = $props();

    type UploadState = 'idle' | 'reading' | 'uploading' | 'success' | 'error';

    // @ts-ignore - Svelte 5 $state rune
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
                body: JSON.stringify(parsed),
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

        } catch (err) {
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

    async function uploadAnyway() {
        if (!file) return;
        
        // Force re-upload (this will still be detected as duplicate, but we could add a flag later if needed)
        duplicateSession = null;
        await upload();
    }

    let isUploading = $derived(state === 'reading' || state === 'uploading');
</script>

<svelte:head>
    <title>Upload Session — AppGatePro</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6">

    <!-- Header -->
    <div class="themed-card rounded-xl p-6">
        <h2 class="text-lg font-bold themed-text-primary mb-1">Upload Training Session</h2>
        <p class="text-sm themed-text-secondary">
            Copy the JSON file from your AppGatePro SD card and upload it here.
            The file will be automatically validated and imported.
        </p>
    </div>

    {#if !data.profileComplete}
        <div class="p-4 bg-[#f5a623]/10 border border-[#f5a623]/30 rounded-xl text-sm">
            <p class="font-medium text-[#f5a623] mb-1">⚠ Profile incomplete</p>
            <p class="text-[#9a8f7a]">
                You can still upload sessions, but
                <a href="/profile" class="text-[#f5a623] hover:underline">completing your profile</a>
                unlocks power and biomechanical analytics.
            </p>
        </div>
    {/if}

    {#if state === 'success' && result}
        <!-- Success state -->
        <div class="bg-[#131010] border border-[#3de8c8]/30 rounded-xl p-6">
            <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-full bg-[#3de8c8]/10 flex items-center justify-center flex-shrink-0">
                    <svg class="w-6 h-6 text-[#3de8c8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                </div>
                <div class="flex-1">
                    <h3 class="text-base font-semibold text-[#f0ece4] mb-1">Session imported successfully</h3>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                        {#each [
                            { label: 'Runs imported',   value: result.runs_imported },
                            { label: 'Time series',     value: result.timeseries_count > 0 ? `${result.timeseries_count} runs` : 'None', warning: result.timeseries_failed > 0 },
                            { label: 'Bike linked',     value: result.bike_linked ? '✓ Yes' : '— No active bike' },
                            { label: 'Profile linked',  value: result.profile_linked ? '✓ Yes' : '— No profile' },
                        ] as stat}
                            <div class="bg-[#0a0809] rounded-lg p-3 {stat.warning ? 'border border-[#f5a623]/30' : ''}">
                                <p class="text-xs text-[#4a4038] mb-1">{stat.label}</p>
                                <p class="text-sm font-semibold {stat.warning ? 'text-[#f5a623]' : 'text-[#f0ece4]'}">{stat.value}</p>
                                {#if stat.warning}
                                    <p class="text-xs text-[#9a8f7a] mt-1">{result.timeseries_failed} failed</p>
                                {/if}
                            </div>
                        {/each}
                    </div>
                    {#if warnings.length > 0}
                        <div class="mt-4 p-3 bg-[#f5a623]/10 border border-[#f5a623]/20 rounded-lg">
                            <p class="text-xs font-medium text-[#f5a623] mb-2">⚠ Warnings</p>
                            {#each warnings as w}
                                <p class="text-xs text-[#9a8f7a] leading-relaxed">• {w}</p>
                            {/each}
                            {#if result.timeseries_errors && result.timeseries_errors.length > 0}
                                <details class="mt-2 pt-2 border-t border-[#f5a623]/20">
                                    <summary class="text-xs font-medium text-[#f5a623] cursor-pointer hover:text-[#c97e0a] mb-1">
                                        View timeseries error details
                                    </summary>
                                    <div class="mt-2 space-y-1">
                                        {#each result.timeseries_errors as err}
                                            <p class="text-xs text-[#6b5f4d] font-mono">• {err}</p>
                                        {/each}
                                    </div>
                                </details>
                            {/if}
                        </div>
                    {/if}
                    <div class="flex gap-3 mt-5">
                        <a href="/sessions/{result.session_id}"
                           class="px-4 py-2 bg-[#f5a623] hover:bg-[#c97e0a] text-[#0a0809]
                                  font-semibold text-sm rounded-lg transition-colors">
                            View session analytics
                        </a>
                        <button onclick={reset}
                                class="px-4 py-2 bg-[#221c18] hover:bg-[#2a2218] text-[#9a8f7a]
                                       text-sm rounded-lg transition-colors">
                            Upload another
                        </button>
                    </div>
                </div>
            </div>
        </div>

    {:else}
        <!-- Upload form -->
        <div class="bg-[#131010] border border-[#221c18] rounded-xl p-6 space-y-5">

            <!-- Drop zone -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
                role="button"
                tabindex="0"
                class="border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
                       {dragOver
                           ? 'border-[#f5a623] bg-[#f5a623]/5'
                           : file
                               ? 'border-[#3de8c8]/40 bg-[#3de8c8]/5'
                               : 'border-[#221c18] hover:border-[#f5a623]/40'}"
                ondragover={(e) => { e.preventDefault(); dragOver = true; }}
                ondragleave={() => dragOver = false}
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
                    <svg class="w-10 h-10 text-[#3de8c8] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <p class="text-base font-semibold text-[#3de8c8] mb-1">{file.name}</p>
                    <p class="text-xs text-[#9a8f7a]">
                        {(file.size / 1024).toFixed(1)} KB · Click to change
                    </p>
                {:else}
                    <svg class="w-10 h-10 text-[#4a4038] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                    </svg>
                    <p class="text-base font-semibold text-[#f0ece4] mb-1">
                        Drop your session file here
                    </p>
                    <p class="text-xs text-[#9a8f7a]">or click to browse · JSON files only</p>
                {/if}
            </div>

            <!-- Error or Duplicate Warning -->
            {#if state === 'error'}
                {#if duplicateSession}
                    <!-- Duplicate detected -->
                    <div class="p-4 bg-[#f5a623]/20 border border-[#f5a623] rounded-lg">
                        <div class="flex items-start gap-3">
                            <svg class="w-5 h-5 text-[#f5a623] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                            </svg>
                            <div class="flex-1">
                                <p class="text-sm font-medium text-[#f5a623] mb-1">Duplicate file detected</p>
                                <p class="text-xs text-[#f0ece4] mb-3">{errorMsg}</p>
                                
                                <div class="bg-[#0a0809] rounded-lg p-3 mb-3 border border-[#221c18]">
                                    <p class="text-xs text-[#9a8f7a] mb-2">Existing session details:</p>
                                    <div class="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <span class="text-[#6b5f4d]">Type:</span>
                                            <span class="text-[#f0ece4] ml-1">{duplicateSession.session_type}</span>
                                        </div>
                                        <div>
                                            <span class="text-[#6b5f4d]">Runs:</span>
                                            <span class="text-[#f0ece4] ml-1">{duplicateSession.run_count}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="flex gap-2 flex-wrap">
                                    <a href="/sessions/{duplicateSession.id}"
                                       class="px-3 py-2 bg-[#f5a623] hover:bg-[#c97e0a] text-[#0a0809]
                                              font-semibold text-xs rounded-lg transition-colors">
                                        View existing session
                                    </a>
                                    <button onclick={reset}
                                            class="px-3 py-2 bg-[#221c18] hover:bg-[#2a2218] text-[#f0ece4]
                                                   text-xs rounded-lg transition-colors">
                                        Try different file
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                {:else}
                    <!-- Regular error -->
                    <div class="p-4 bg-red-900/20 border border-red-800 rounded-lg">
                        <p class="text-sm font-medium text-red-400 mb-1">Upload failed</p>
                        <p class="text-xs text-red-400 whitespace-pre-line">{errorMsg}</p>
                        {#if warnings.length > 0}
                            <div class="mt-2 pt-2 border-t border-red-800/40">
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
                class="w-full py-3 bg-[#f5a623] hover:bg-[#c97e0a] disabled:opacity-40
                       disabled:cursor-not-allowed text-[#0a0809] font-semibold rounded-lg
                       transition-colors text-sm flex items-center justify-center gap-2"
            >
                {#if isUploading}
                    <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    {state === 'reading' ? 'Reading file...' : 'Uploading...'}
                {:else if file}
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                    </svg>
                    Import session
                {:else}
                    Select a file to continue
                {/if}
            </button>
        </div>
    {/if}

    <!-- Instructions -->
    <div class="bg-[#131010] border border-[#221c18] rounded-xl p-6">
        <h3 class="text-sm font-semibold text-[#9a8f7a] uppercase tracking-wider mb-4">
            How to export from your device
        </h3>
        <ol class="space-y-3">
            {#each [
                'After your training session, save to SD card from the AppGatePro menu',
                'Remove the SD card and insert it into your computer',
                'Find the session JSON file in the root of the SD card',
                'Upload the file here — all runs in the session are imported together'
            ] as step, i}
                <li class="flex gap-3 text-sm text-[#9a8f7a]">
                    <span class="w-5 h-5 rounded-full bg-[#221c18] text-[#f5a623] text-xs
                                 flex items-center justify-center flex-shrink-0 font-bold mt-0.5">
                        {i + 1}
                    </span>
                    {step}
                </li>
            {/each}
        </ol>
    </div>

</div>

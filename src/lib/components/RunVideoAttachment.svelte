<script lang="ts">
	/**
	 * Optional video attachment for a single run.
	 *
	 * Sensor evidence remains complete without video. When a clip is attached,
	 * local analysis looks for the external Lights unit's finite full-white sync
	 * pulse; a clip with no usable cue still attaches and falls back to ordinary
	 * playback rather than claiming synchronized telemetry.
	 */
	import { page } from '$app/stores';
	import { invalidateAll } from '$app/navigation';
	import { analyzeVideoForSync } from '$lib/utils/videoSync';
	import RunVideoHero from './RunVideoHero.svelte';
	import type { SeriesPoint } from '$lib/performance-engine';

	interface RunVideo {
		id: string;
		storage_path: string;
		filename: string;
		mime_type: string;
		duration_ms: number | null;
		sync_offset_s: number | null;
		status: string;
		created_at: string | null;
		signed_url?: string | null;
	}

	interface HeroData {
		drillDownData: SeriesPoint[];
		speedKmh: number[];
		reactionMs: number | null;
		measuredPeakSpeedKmh: number | null;
		maxG: number | null;
		techniqueScoreOverall: number | null;
		frontWheelLifted: boolean;
		timeToWheelieMs: number | null;
	}

	let {
		runId,
		video,
		hero = false,
		heroData = null
	}: {
		runId: string;
		video: RunVideo | null;
		hero?: boolean;
		heroData?: HeroData | null;
	} = $props();

	const ALLOWED_TYPES = ['video/mp4', 'video/quicktime'];
	const MAX_SIZE_MB = 200;

	let uploading = $state(false);
	let deleting = $state(false);
	let errorMessage = $state<string | null>(null);
	let fileInput: HTMLInputElement;

	function triggerFileInput() {
		fileInput?.click();
	}

	function safeFilename(filename: string): string {
		return filename.replace(/[^a-zA-Z0-9._-]+/g, '-');
	}

	function attachmentAttemptId(): string {
		return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
	}

	async function handleFileSelect(file: File) {
		errorMessage = null;

		if (!ALLOWED_TYPES.includes(file.type)) {
			errorMessage = 'Invalid file type. Please upload an MP4 or MOV video.';
			return;
		}
		if (file.size > MAX_SIZE_MB * 1024 * 1024) {
			errorMessage = `File too large. Maximum size is ${MAX_SIZE_MB}MB.`;
			return;
		}

		const supabase = $page.data.supabase;
		const userId = $page.data.user?.id;
		if (!supabase || !userId) {
			errorMessage = 'Not signed in.';
			return;
		}

		uploading = true;
		let uploadedPath: string | null = null;
		let metadataFinalized = false;
		try {
			// Never overwrite the currently-working object before metadata points at
			// the replacement. A unique attempt path gives us a cheap two-phase
			// lifecycle: upload new -> finalize DB reference -> retire old server-side.
			const storagePath = `${userId}/${runId}/${attachmentAttemptId()}-${safeFilename(file.name)}`;
			uploadedPath = storagePath;

			const [uploadResult, analysis] = await Promise.all([
				supabase.storage.from('run-videos').upload(storagePath, file, { upsert: false }),
				analyzeVideoForSync(file)
			]);

			if (uploadResult.error) throw new Error(uploadResult.error.message);

			const response = await fetch(`/api/runs/${runId}/video`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					storage_path: storagePath,
					filename: file.name,
					mime_type: file.type,
					file_size_bytes: file.size,
					duration_ms: analysis.durationMs,
					sync_offset_s: analysis.syncOffsetS
				})
			});

			if (!response.ok) {
				const body = await response.json().catch(() => ({}));
				throw new Error(body.message || body.error || 'Failed to attach video');
			}

			metadataFinalized = true;
			await invalidateAll();
		} catch (err) {
			console.error('Video upload error:', err);
			errorMessage = err instanceof Error ? err.message : 'Upload failed';

			// If bytes reached Storage but metadata did not commit, remove this
			// attempt. The previously attached video (if any) was never overwritten.
			if (uploadedPath && !metadataFinalized) {
				const { error: cleanupError } = await supabase.storage
					.from('run-videos')
					.remove([uploadedPath]);
				if (cleanupError) {
					console.warn('Failed to clean unfinalized video upload:', cleanupError);
				}
			}
		} finally {
			uploading = false;
			if (fileInput) fileInput.value = '';
		}
	}

	async function deleteVideo() {
		if (!confirm('Remove this video?')) return;

		deleting = true;
		errorMessage = null;
		try {
			const response = await fetch(`/api/runs/${runId}/video`, { method: 'DELETE' });
			if (!response.ok) {
				const body = await response.json().catch(() => ({}));
				throw new Error(body.message || body.error || 'Failed to remove video');
			}
			await invalidateAll();
		} catch (err) {
			console.error('Video delete error:', err);
			errorMessage = err instanceof Error ? err.message : 'Delete failed';
		} finally {
			deleting = false;
		}
	}
</script>

{#if video?.signed_url}
	<div class="space-y-2">
		{#if hero && heroData && video.sync_offset_s != null}
			<RunVideoHero
				video={{
					signed_url: video.signed_url,
					sync_offset_s: video.sync_offset_s,
					duration_ms: video.duration_ms
				}}
				{...heroData}
			/>
		{:else}
			<!-- svelte-ignore a11y_media_has_caption -->
			<video
				controls
				src={video.signed_url}
				class="w-full rounded-xl border border-[#221c18] bg-black"
			></video>
		{/if}
		<div class="flex items-center gap-3 text-xs">
			<button
				type="button"
				onclick={triggerFileInput}
				disabled={uploading || deleting}
				class="text-[#9a8f7a] transition-colors hover:text-[#f5a623] disabled:opacity-50"
			>
				{uploading ? 'Replacing…' : 'Replace video'}
			</button>
			<span class="text-[#4a4038]">•</span>
			<button
				type="button"
				onclick={deleteVideo}
				disabled={uploading || deleting}
				class="text-[#9a8f7a] transition-colors hover:text-red-400 disabled:opacity-50"
			>
				{deleting ? 'Removing…' : 'Remove'}
			</button>
		</div>
	</div>
{:else}
	<button
		type="button"
		onclick={triggerFileInput}
		disabled={uploading}
		class="text-xs font-medium text-[#9a8f7a] transition-colors hover:text-[#f5a623] disabled:opacity-50"
	>
		{uploading ? 'Uploading video…' : '+ Add video'}
	</button>
{/if}

{#if errorMessage}
	<p class="mt-1 text-xs text-red-400">{errorMessage}</p>
{/if}

<input
	bind:this={fileInput}
	type="file"
	accept="video/mp4,video/quicktime"
	class="hidden"
	onchange={(e) => {
		const files = (e.target as HTMLInputElement).files;
		if (files && files.length > 0) handleFileSelect(files[0]);
	}}
/>

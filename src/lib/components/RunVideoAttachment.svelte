<script lang="ts">
	/**
	 * Foundation-slice video attachment for a single run (see VIDEO_SYNC_DESIGN.md).
	 * Deliberately low-key when no video is attached — a small text link, not an
	 * empty-state box — and a plain player once one is. No scrub-bar/HUD yet;
	 * those are a later hero-treatment pass, kept out of this component on purpose
	 * so it's easy to relocate/replace then.
	 */
	import { page } from '$app/stores';
	import { invalidateAll } from '$app/navigation';

	interface RunVideo {
		id: string;
		storage_path: string;
		filename: string;
		mime_type: string;
		duration_ms: number | null;
		status: string;
		created_at: string | null;
		signed_url?: string | null;
	}

	let { runId, video }: { runId: string; video: RunVideo | null } = $props();

	const ALLOWED_TYPES = ['video/mp4', 'video/quicktime'];
	const MAX_SIZE_MB = 200;

	let uploading = $state(false);
	let deleting = $state(false);
	let errorMessage = $state<string | null>(null);
	let fileInput: HTMLInputElement;

	function triggerFileInput() {
		fileInput?.click();
	}

	// Best-effort — never blocks the upload if it fails or times out.
	async function extractDuration(file: File): Promise<number | null> {
		return new Promise((resolve) => {
			const el = document.createElement('video');
			el.preload = 'metadata';
			const url = URL.createObjectURL(file);
			const cleanup = () => URL.revokeObjectURL(url);
			const timeout = setTimeout(() => {
				cleanup();
				resolve(null);
			}, 3000);
			el.onloadedmetadata = () => {
				clearTimeout(timeout);
				cleanup();
				resolve(Number.isFinite(el.duration) ? Math.round(el.duration * 1000) : null);
			};
			el.onerror = () => {
				clearTimeout(timeout);
				cleanup();
				resolve(null);
			};
			el.src = url;
		});
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
		try {
			const durationMs = await extractDuration(file);
			const storagePath = `${userId}/${runId}/${file.name}`;

			const { error: uploadError } = await supabase.storage
				.from('run-videos')
				.upload(storagePath, file, { upsert: true });

			if (uploadError) throw new Error(uploadError.message);

			const response = await fetch(`/api/runs/${runId}/video`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					storage_path: storagePath,
					filename: file.name,
					mime_type: file.type,
					file_size_bytes: file.size,
					duration_ms: durationMs
				})
			});

			if (!response.ok) {
				const body = await response.json();
				throw new Error(body.message || 'Failed to attach video');
			}

			await invalidateAll();
		} catch (err) {
			console.error('Video upload error:', err);
			errorMessage = err instanceof Error ? err.message : 'Upload failed';
		} finally {
			uploading = false;
		}
	}

	async function deleteVideo() {
		if (!confirm('Remove this video?')) return;

		deleting = true;
		errorMessage = null;
		try {
			const response = await fetch(`/api/runs/${runId}/video`, { method: 'DELETE' });
			if (!response.ok) {
				const body = await response.json();
				throw new Error(body.message || 'Failed to remove video');
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
		<!-- svelte-ignore a11y_media_has_caption -->
		<video
			controls
			src={video.signed_url}
			class="w-full rounded-xl border border-[#221c18] bg-black"
		></video>
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

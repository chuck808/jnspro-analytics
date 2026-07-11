<script lang="ts">
	/**
	 * Reusable image upload component with preview, drag & drop, and delete
	 * Supports both profile icons (circular) and background images
	 */

	import { createEventDispatcher } from 'svelte';

	type ImageType = 'profile_icon' | 'background_image';

	interface Props {
		type: ImageType;
		currentUrl?: string | null;
		title: string;
		description?: string;
		circular?: boolean;
		aspectRatio?: string;
		maxSizeMB?: number;
	}

	let {
		type,
		currentUrl = $bindable(null),
		title,
		description = '',
		circular = false,
		aspectRatio = '16/9',
		maxSizeMB = 5
	}: Props = $props();

	const dispatch = createEventDispatcher<{
		uploaded: { url: string; type: ImageType };
		deleted: { type: ImageType };
		error: { message: string };
	}>();

	let uploading = $state(false);
	let deleting = $state(false);
	let dragOver = $state(false);
	let previewUrl = $state<string | null>(currentUrl || null);
	let fileInput: HTMLInputElement;
	let errorMessage = $state<string | null>(null);

	// Update preview when currentUrl changes
	$effect(() => {
		previewUrl = currentUrl || null;
	});

	async function handleFileSelect(file: File) {
		errorMessage = null;

		// Validate file type
		const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
		if (!allowedTypes.includes(file.type)) {
			errorMessage = 'Invalid file type. Please upload JPEG, PNG, WebP, or GIF.';
			dispatch('error', { message: errorMessage });
			return;
		}

		// Validate file size
		const maxSize = maxSizeMB * 1024 * 1024;
		if (file.size > maxSize) {
			errorMessage = `File too large. Maximum size is ${maxSizeMB}MB.`;
			dispatch('error', { message: errorMessage });
			return;
		}

		// Show preview immediately
		const reader = new FileReader();
		reader.onload = (e) => {
			previewUrl = e.target?.result as string;
		};
		reader.readAsDataURL(file);

		// Upload the file
		await uploadImage(file);
	}

	async function uploadImage(file: File) {
		uploading = true;
		errorMessage = null;

		try {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('type', type);

			const response = await fetch('/api/user-images/upload', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Upload failed');
			}

			const data = await response.json();
			currentUrl = data.url;
			previewUrl = data.url;
			dispatch('uploaded', { url: data.url, type });
		} catch (err) {
			console.error('Upload error:', err);
			errorMessage = err instanceof Error ? err.message : 'Upload failed';
			dispatch('error', { message: errorMessage });
			previewUrl = currentUrl || null; // Revert to previous image
		} finally {
			uploading = false;
		}
	}

	async function deleteImage() {
		if (!confirm('Are you sure you want to delete this image?')) {
			return;
		}

		deleting = true;
		errorMessage = null;

		try {
			const response = await fetch('/api/user-images/delete', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type })
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Delete failed');
			}

			currentUrl = null;
			previewUrl = null;
			dispatch('deleted', { type });
		} catch (err) {
			console.error('Delete error:', err);
			errorMessage = err instanceof Error ? err.message : 'Delete failed';
			dispatch('error', { message: errorMessage });
		} finally {
			deleting = false;
		}
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragOver = false;

		const files = e.dataTransfer?.files;
		if (files && files.length > 0) {
			handleFileSelect(files[0]);
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		dragOver = true;
	}

	function handleDragLeave() {
		dragOver = false;
	}

	function triggerFileInput() {
		fileInput?.click();
	}
</script>

<div class="space-y-3">
	<div>
		<h4 class="mb-1 text-sm font-semibold text-[#f0ece4]">{title}</h4>
		{#if description}
			<p class="text-xs text-[#9a8f7a]">{description}</p>
		{/if}
	</div>

	<!-- Preview / Upload Area -->
	<div
		role="button"
		tabindex="0"
		class="relative overflow-hidden rounded-xl border-2 border-dashed transition-all
               {dragOver ? 'border-[#f5a623] bg-[#f5a623]/5' : 'border-[#221c18] bg-[#0a0809]'}
               {circular ? 'aspect-square max-w-[200px]' : ''}"
		style={!circular ? `aspect-ratio: ${aspectRatio}` : ''}
		ondrop={handleDrop}
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') triggerFileInput();
		}}
	>
		{#if previewUrl}
			<!-- Image Preview -->
			<img
				src={previewUrl}
				alt={title}
				class="h-full w-full object-cover {circular ? 'rounded-full' : ''}"
			/>

			<!-- Overlay buttons -->
			<div
				class="absolute inset-0 flex items-center justify-center gap-2
                        bg-black/50 opacity-0 transition-opacity hover:opacity-100"
			>
				<button
					type="button"
					onclick={triggerFileInput}
					disabled={uploading || deleting}
					class="rounded-lg bg-[#f5a623] px-3 py-1.5 text-xs
                           font-semibold text-[#0a0809] transition-colors hover:bg-[#c97e0a]
                           disabled:cursor-not-allowed disabled:opacity-50"
				>
					{uploading ? 'Uploading...' : 'Change'}
				</button>
				<button
					type="button"
					onclick={deleteImage}
					disabled={uploading || deleting}
					class="rounded-lg bg-red-600 px-3 py-1.5 text-xs
                           font-semibold text-white transition-colors hover:bg-red-700
                           disabled:cursor-not-allowed disabled:opacity-50"
				>
					{deleting ? 'Deleting...' : 'Delete'}
				</button>
			</div>
		{:else}
			<!-- Upload Prompt -->
			<button
				type="button"
				onclick={triggerFileInput}
				disabled={uploading}
				class="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2
                       p-6 transition-colors hover:bg-[#131010]
                       disabled:cursor-not-allowed disabled:opacity-50"
			>
				{#if uploading}
					<div
						class="h-8 w-8 animate-spin rounded-full border-2 border-[#f5a623] border-t-transparent"
					></div>
					<p class="text-sm text-[#9a8f7a]">Uploading...</p>
				{:else}
					<svg
						class="h-10 w-10 text-[#4a4038]"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
						/>
					</svg>
					<div class="text-center">
						<p class="text-sm font-medium text-[#f0ece4]">Click to upload or drag & drop</p>
						<p class="mt-1 text-xs text-[#4a4038]">
							JPEG, PNG, WebP, GIF (max {maxSizeMB}MB)
						</p>
					</div>
				{/if}
			</button>
		{/if}
	</div>

	<!-- Error Message -->
	{#if errorMessage}
		<div class="rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
			{errorMessage}
		</div>
	{/if}

	<!-- Hidden file input -->
	<input
		bind:this={fileInput}
		type="file"
		accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
		onchange={(e) => {
			const files = (e.target as HTMLInputElement).files;
			if (files && files.length > 0) {
				handleFileSelect(files[0]);
			}
		}}
		class="hidden"
	/>
</div>

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
        <h4 class="text-sm font-semibold text-[#f0ece4] mb-1">{title}</h4>
        {#if description}
            <p class="text-xs text-[#9a8f7a]">{description}</p>
        {/if}
    </div>
    
    <!-- Preview / Upload Area -->
    <div 
        role="button"
        tabindex="0"
        class="relative border-2 border-dashed rounded-xl overflow-hidden transition-all
               {dragOver ? 'border-[#f5a623] bg-[#f5a623]/5' : 'border-[#221c18] bg-[#0a0809]'}
               {circular ? 'aspect-square max-w-[200px]' : ''}"
        style={!circular ? `aspect-ratio: ${aspectRatio}` : ''}
        ondrop={handleDrop}
        ondragover={handleDragOver}
        ondragleave={handleDragLeave}
        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') triggerFileInput(); }}
    >
        {#if previewUrl}
            <!-- Image Preview -->
            <img 
                src={previewUrl} 
                alt={title}
                class="w-full h-full object-cover {circular ? 'rounded-full' : ''}"
            />
            
            <!-- Overlay buttons -->
            <div class="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity
                        flex items-center justify-center gap-2">
                <button
                    type="button"
                    onclick={triggerFileInput}
                    disabled={uploading || deleting}
                    class="px-3 py-1.5 bg-[#f5a623] hover:bg-[#c97e0a] text-[#0a0809] 
                           text-xs font-semibold rounded-lg transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {uploading ? 'Uploading...' : 'Change'}
                </button>
                <button
                    type="button"
                    onclick={deleteImage}
                    disabled={uploading || deleting}
                    class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white 
                           text-xs font-semibold rounded-lg transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
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
                class="w-full h-full flex flex-col items-center justify-center gap-2 p-6
                       hover:bg-[#131010] transition-colors cursor-pointer
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {#if uploading}
                    <div class="w-8 h-8 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin"></div>
                    <p class="text-sm text-[#9a8f7a]">Uploading...</p>
                {:else}
                    <svg class="w-10 h-10 text-[#4a4038]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                    </svg>
                    <div class="text-center">
                        <p class="text-sm font-medium text-[#f0ece4]">Click to upload or drag & drop</p>
                        <p class="text-xs text-[#4a4038] mt-1">
                            JPEG, PNG, WebP, GIF (max {maxSizeMB}MB)
                        </p>
                    </div>
                {/if}
            </button>
        {/if}
    </div>
    
    <!-- Error Message -->
    {#if errorMessage}
        <div class="p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
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

<script lang="ts">
    import { toast } from '$lib/stores/toast';
    import Toast from './Toast.svelte';
</script>

<div class="fixed top-4 right-4 z-50 space-y-2" aria-live="polite" aria-atomic="false">
    {#each $toast as message (message.id)}
        <Toast
            message={message.message}
            type={message.type}
            duration={message.duration}
            onDismiss={() => toast.dismiss(message.id)}
        />
    {/each}
</div>

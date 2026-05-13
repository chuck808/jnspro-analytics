<script lang="ts">
    import '../app.css';
    import { invalidate } from '$app/navigation';
    import { onMount } from 'svelte';
    import FeedbackButton from '$lib/components/FeedbackButton.svelte';
    import { theme } from '$lib/stores/theme';

    let { data, children } = $props();
    let { supabase, claims } = $derived(data);

    onMount(() => {
        // Initialize theme on app load
        theme.initialize();

        const { data } = supabase.auth.onAuthStateChange((event, _session) => {
            if (_session?.expires_at !== claims?.exp) {
                invalidate('supabase:auth');
            }
        });

        return () => data.subscription.unsubscribe();
    });
</script>

<svelte:head>
    <title>JNS Pro Analytics</title>
</svelte:head>

{@render children()}

<!-- Feedback button available on all pages -->
<FeedbackButton />

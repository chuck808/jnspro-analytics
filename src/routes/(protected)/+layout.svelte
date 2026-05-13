<script lang="ts">
    import Sidebar from '$lib/components/Sidebar.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import ToastContainer from '$lib/components/ToastContainer.svelte';
    import type { LayoutData } from './$types';

    let { children, data }: { children: any; data: LayoutData } = $props();
</script>

<!-- Skip to main content link -->
<a href="#main-content" 
   class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
          focus:z-50 focus:px-4 focus:py-2 focus:bg-[#f5a623] focus:text-[#0a0809] 
          focus:rounded-lg focus:font-semibold">
    Skip to main content
</a>

<Sidebar user={data.profile} />

<div class="md:ml-64">
    <Navbar user={data.profile} />
    <main id="main-content" aria-label="Main content" class="pt-25 min-h-screen bg-[#0a0809]">
        <div class="p-4 md:p-6">
            {@render children()}
        </div>
    </main>
</div>

<!-- Toast notifications -->
<ToastContainer />

<script lang="ts">
    import { page } from '$app/stores';
    import type { Database } from '$lib/types/database.types';
    import ThemeToggle from '$lib/components/ThemeToggle.svelte';
    import ThemeLogo from '$lib/components/ThemeLogo.svelte';

    type Profile = Database['public']['Tables']['profiles']['Row'];

    let { user }: { user?: Profile | null } = $props();

    const titles: Record<string, string> = {
        '/dashboard':   'Dashboard',
        '/analytics':   'Analytics',
        '/sessions':    'Sessions',
        '/upload':      'Upload Session',
        '/profile':     'Rider Profile',
        '/settings':    'Settings',
        '/admin':       'Admin',
        '/admin/users': 'Users',
    };

    let pageTitle = $derived(
        titles[$page.url.pathname] ??
        ($page.url.pathname.startsWith('/sessions/') ? 'Session Detail' :
         $page.url.pathname.startsWith('/analytics/') ? 'Analytics' :
         $page.url.pathname.startsWith('/admin/')     ? 'Admin' : 'AppGatePro')
    );

    let firstName = $derived(user?.name?.split(' ')[0] ?? null);

    function toggleMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.toggle('-translate-x-full');
    }
</script>

<nav aria-label="Top navigation" class="fixed top-0 left-0 right-0 z-30 md:left-64 bg-[#0a0809] border-b border-[#221c18]
            h-25 flex items-center px-4 gap-4">

    <!-- Mobile menu toggle -->
    <button
        onclick={toggleMobileMenu}
        aria-label="Toggle sidebar"
        aria-controls="sidebar"
        class="md:hidden p-2 rounded-lg text-[#9a8f7a] hover:bg-[#221c18]
               hover:text-[#f0ece4] transition-colors
               focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[color:var(--theme-surface)]"
    >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
    </button>

    <!-- Compact logo (mobile only) -->
    <ThemeLogo variant="compact" alt="AppGatePro" class="h-16 w-auto md:hidden" />

    <!-- Page title -->
    <h1 class="text-xl font-semibold text-[#f0ece4] truncate" id="page-title">{pageTitle}</h1>

    <!-- Right side -->
    <div class="ml-auto flex items-center gap-2 flex-shrink-0">

        <!-- Upload shortcut -->
        <a
            href="/upload"
            class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#f5a623]
                   hover:bg-[#c97e0a] text-[#0a0809] text-xs font-semibold
                   rounded-lg transition-colors
                   focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[color:var(--theme-surface)]"
        >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
            Upload
        </a>

        <!-- Beta badge -->
        <span class="hidden md:inline-flex items-center px-2 py-1 rounded text-xs font-medium
                     bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/20">
            Beta
        </span>

        <!-- Theme Toggle -->
        <ThemeToggle />

        <!-- Sign out pill — always visible -->
        <a
            href="/auth/sign-out"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border
                   border-[#221c18] bg-[#131010] text-[#9a8f7a] text-xs font-medium
                   hover:border-[#ff4444]/40 hover:text-[#ff4444] hover:bg-[#ff4444]/5
                   transition-colors
                   focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[color:var(--theme-surface)]"
        >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            {#if firstName}
                <span class="hidden sm:inline">{firstName}</span>
            {:else}
                <span class="hidden sm:inline">Sign out</span>
            {/if}
        </a>
    </div>
</nav>
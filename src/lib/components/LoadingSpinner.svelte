<script lang="ts">
    let {
        size = 'md',
        color = 'amber'
    }: {
        size?: 'sm' | 'md' | 'lg';
        color?: 'amber' | 'teal' | 'white';
    } = $props();
    
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8'
    };
    
    const colors = {
        amber: 'border-[#f5a623]',
        teal: 'border-[#3de8c8]',
        white: 'border-[#f0ece4]'
    };
</script>

<div 
    class="animate-spin rounded-full border-2 border-t-transparent {sizes[size]} {colors[color]}"
    role="status"
    aria-label="Loading"
>
    <span class="sr-only">Loading...</span>
</div>

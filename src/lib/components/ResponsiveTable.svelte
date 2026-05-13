<script lang="ts">
    let {
        headers,
        rows,
        caption = '',
        mobileLayout = 'cards'
    }: {
        headers: string[];
        rows: any[][];
        caption?: string;
        mobileLayout?: 'cards' | 'stacked';
    } = $props();
</script>

<!-- Desktop Table -->
<div class="hidden md:block overflow-x-auto">
    <table class="w-full text-sm">
        {#if caption}
            <caption class="sr-only">{caption}</caption>
        {/if}
        <thead>
            <tr class="border-b border-[color:var(--border)]">
                {#each headers as header}
                    <th scope="col" class="text-left pb-2 px-4 text-xs themed-text-secondary uppercase">
                        {header}
                    </th>
                {/each}
            </tr>
        </thead>
        <tbody>
            {#each rows as row}
                <tr class="border-b border-[color:var(--border)]/50">
                    <th scope="row" class="py-2.5 px-4 themed-text-primary text-left font-medium text-sm">{row[0]}</th>
                    {#each row.slice(1) as cell}
                        <td class="py-2.5 px-4 themed-text-primary">{cell}</td>
                    {/each}
                </tr>
            {/each}
        </tbody>
    </table>
</div>

<!-- Mobile Cards -->
<div class="md:hidden space-y-3">
    {#each rows as row}
        <div class="bg-[color:var(--background)] rounded-lg p-4 space-y-2">
            {#each headers as header, i}
                <div class="flex justify-between items-center">
                    <span class="text-xs themed-text-secondary">{header}</span>
                    <span class="text-sm font-medium themed-text-primary">{row[i]}</span>
                </div>
            {/each}
        </div>
    {/each}
</div>

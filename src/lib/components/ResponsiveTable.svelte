<script lang="ts">
	let {
		headers,
		rows,
		caption = ''
	}: {
		headers: string[];
		rows: any[][];
		caption?: string;
	} = $props();
</script>

<!-- Desktop Table -->
<div class="hidden overflow-x-auto md:block">
	<table class="w-full text-sm">
		{#if caption}
			<caption class="sr-only">{caption}</caption>
		{/if}
		<thead>
			<tr class="border-b border-[color:var(--border)]">
				{#each headers as header}
					<th scope="col" class="themed-text-secondary px-4 pb-2 text-left text-xs uppercase">
						{header}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each rows as row}
				<tr class="border-b border-[color:var(--border)]/50">
					<th scope="row" class="themed-text-primary px-4 py-2.5 text-left text-sm font-medium"
						>{row[0]}</th
					>
					{#each row.slice(1) as cell}
						<td class="themed-text-primary px-4 py-2.5">{cell}</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<!-- Mobile Cards -->
<div class="space-y-3 md:hidden">
	{#each rows as row}
		<div class="space-y-2 rounded-lg bg-[color:var(--background)] p-4">
			{#each headers as header, i}
				<div class="flex items-center justify-between">
					<span class="themed-text-secondary text-xs">{header}</span>
					<span class="themed-text-primary text-sm font-medium">{row[i]}</span>
				</div>
			{/each}
		</div>
	{/each}
</div>

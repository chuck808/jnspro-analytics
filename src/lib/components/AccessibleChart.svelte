<script lang="ts">
	import { onMount } from 'svelte';

	let {
		data,
		type = 'line',
		title,
		description,
		tableCaption
	}: {
		data: any;
		type?: 'line' | 'bar';
		title: string;
		description: string;
		tableCaption: string;
	} = $props();

	let canvasEl: HTMLCanvasElement | null = $state(null);
	let showTable = $state(false);
</script>

<div class="space-y-4">
	<!-- Chart with proper ARIA -->
	<div class="relative">
		<canvas
			bind:this={canvasEl}
			aria-label={description}
			tabindex="0"
			class="focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[#0a0809] focus:outline-none"
		></canvas>

		<button
			onclick={() => (showTable = !showTable)}
			class="absolute top-2 right-2 rounded-lg bg-[#221c18] px-3 py-1
                   text-xs text-[#9a8f7a] transition-colors hover:bg-[#2a241e]
                   focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[#0a0809] focus:outline-none"
			aria-expanded={showTable}
			aria-controls="chart-data-table"
		>
			{showTable ? 'Hide' : 'Show'} data table
		</button>
	</div>

	<!-- Accessible data table -->
	{#if showTable}
		<div class="overflow-x-auto" id="chart-data-table">
			<table class="w-full text-sm">
				<caption class="mb-2 text-left text-xs text-[#9a8f7a]">
					{tableCaption}
				</caption>
				<thead>
					<tr class="border-b border-[#221c18]">
						<th scope="col" class="px-4 py-2 text-left text-[#9a8f7a]"> Dataset </th>
						{#each data.labels as label}
							<th scope="col" class="px-4 py-2 text-left text-[#9a8f7a]">
								{label}
							</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each data.datasets as dataset}
						<tr class="border-b border-[#221c18]/50">
							<th scope="row" class="px-4 py-2 text-left font-medium text-[#f0ece4]">
								{dataset.label}
							</th>
							{#each dataset.data as value}
								<td class="px-4 py-2 text-[#f0ece4]">
									{value ?? '—'}
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

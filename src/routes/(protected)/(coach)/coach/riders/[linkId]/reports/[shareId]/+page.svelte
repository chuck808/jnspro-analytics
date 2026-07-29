<script lang="ts">
	import { goto } from '$app/navigation';
	import { ReportPreview } from '$lib/components/reports';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Shared Report — AppGatePro Coach</title>
</svelte:head>

<div class="mx-auto max-w-5xl">
	<ReportPreview report={data.report} onClose={() => goto(`/coach/riders/${data.linkId}`)} />
</div>

<script lang="ts">
	let {
		message,
		politeness = 'polite'
	}: {
		message: string;
		politeness?: 'polite' | 'assertive';
	} = $props();
</script>

<div role="status" aria-live={politeness} aria-atomic="true" class="sr-only">
	{message}
</div>

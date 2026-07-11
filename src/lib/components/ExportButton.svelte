<script lang="ts">
	import { exportSessionsToCSV } from '$lib/utils/csvExport';
	import { toast } from '$lib/stores/toast';

	let {
		sessions,
		variant = 'secondary'
	}: {
		sessions: any[];
		variant?: 'primary' | 'secondary';
	} = $props();

	function handleExport() {
		try {
			exportSessionsToCSV(sessions);
			toast.success(`${sessions.length} sessions exported successfully`);
		} catch (error) {
			console.error('Export failed:', error);
			toast.error('Failed to export sessions');
		}
	}

	const styles = {
		primary: 'bg-[#f5a623] text-[#0a0809] hover:bg-[#c97e0a]',
		secondary:
			'bg-[#0a0809] text-[#9a8f7a] border border-[#221c18] hover:border-[#f5a623]/40 hover:text-[#f5a623]'
	};
</script>

<button
	onclick={handleExport}
	disabled={sessions.length === 0}
	class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold
           transition-colors focus:ring-2 focus:ring-[#f5a623]
           focus:ring-offset-2 focus:ring-offset-[color:var(--theme-surface)] focus:outline-none
           disabled:cursor-not-allowed disabled:opacity-50
           {styles[variant]}"
>
	<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width="2"
			d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
		></path>
	</svg>
	Export CSV
</button>

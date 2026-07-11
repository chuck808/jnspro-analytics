<script lang="ts">
	interface Props {
		quality: 'excellent' | 'good' | 'fair' | 'calibrate' | 'unknown' | null;
		size?: 'sm' | 'md' | 'lg';
		showIcon?: boolean;
	}

	let { quality, size = 'md', showIcon = true }: Props = $props();

	const config = $derived(() => {
		switch (quality) {
			case 'excellent':
				return {
					label: 'Excellent',
					color: '#3de8c8',
					icon: '✓',
					description: 'Highly accurate data'
				};
			case 'good':
				return {
					label: 'Good',
					color: '#f5a623',
					icon: '✓',
					description: 'Reliable data'
				};
			case 'fair':
				return {
					label: 'Fair',
					color: '#ffcc44',
					icon: '⚠',
					description: 'Use trends, not absolutes'
				};
			case 'calibrate':
				return {
					label: 'Calibrate',
					color: '#ff4444',
					icon: '✗',
					description: 'Needs calibration'
				};
			case 'unknown':
				return {
					label: 'Unknown',
					color: '#9a8f7a',
					icon: '?',
					description: 'Quality not assessed'
				};
			default:
				return {
					label: 'N/A',
					color: '#6b5f4d',
					icon: '—',
					description: 'No data'
				};
		}
	});

	const sizeClasses = $derived(
		size === 'sm'
			? 'text-[10px] px-1.5 py-0.5'
			: size === 'md'
				? 'text-xs px-2 py-0.5'
				: 'text-sm px-3 py-1'
	);
</script>

<span
	class="data-quality-badge {sizeClasses}"
	style="background: {config().color}20; color: {config().color}; border: 1px solid {config()
		.color}40"
	title={config().description}
>
	{#if showIcon}
		<span class="icon">{config().icon}</span>
	{/if}
	<span class="label">{config().label}</span>
</span>

<style>
	.data-quality-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		border-radius: 12px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		white-space: nowrap;
		transition: all 0.2s;
	}

	.data-quality-badge:hover {
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.icon {
		font-style: normal;
		line-height: 1;
	}

	.label {
		line-height: 1;
	}
</style>

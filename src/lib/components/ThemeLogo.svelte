<script lang="ts">
	import { browser } from '$app/environment';

	type LogoVariant = 'icon' | 'header' | 'compact';

	let {
		variant = 'icon',
		alt = 'AppGatePro',
		class: className = '',
		style = ''
	}: {
		variant?: LogoVariant;
		alt?: string;
		class?: string;
		style?: string;
	} = $props();

	let isDark = $state(true);

	$effect(() => {
		if (!browser) return;

		// Check initial theme
		const updateTheme = () => {
			isDark = document.documentElement.getAttribute('data-theme') !== 'light';
		};

		updateTheme();

		// Watch for theme changes
		const observer = new MutationObserver(updateTheme);
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme']
		});

		return () => observer.disconnect();
	});

	const logoPath = $derived(`/logo-${variant}-${isDark ? 'dark' : 'light'}.svg`);
</script>

<img src={logoPath} {alt} class={className} {style} />

<script lang="ts">
    interface Props {
        title: string;
        description?: string;
        canonical?: string;
        noindex?: boolean;
        ogImage?: string;
        ogType?: 'website' | 'article';
    }
    
    let {
        title,
        description = 'Professional BMX gate start analytics platform. Track reaction times, speed, and performance metrics with AppGatePro.',
        canonical,
        noindex = false,
        ogImage = '/og-image.png',
        ogType = 'website'
    }: Props = $props();
    
    let fullTitle = $derived(title.includes('AppGatePro') ? title : `${title} — AppGatePro Analytics`);
    let canonicalUrl = $derived(canonical || '');
</script>

<svelte:head>
    <title>{fullTitle}</title>
    <meta name="description" content={description} />
    
    {#if noindex}
        <meta name="robots" content="noindex, nofollow" />
    {/if}
    
    {#if canonicalUrl}
        <link rel="canonical" href={canonicalUrl} />
    {/if}
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content={ogType} />
    <meta property="og:title" content={fullTitle} />
    <meta property="og:description" content={description} />
    {#if canonicalUrl}
        <meta property="og:url" content={canonicalUrl} />
    {/if}
    <meta property="og:image" content={ogImage} />
    <meta property="og:site_name" content="AppGatePro Analytics" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={fullTitle} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={ogImage} />
    
    <!-- Additional SEO -->
    <meta name="theme-color" content="#f5a623" />
</svelte:head>

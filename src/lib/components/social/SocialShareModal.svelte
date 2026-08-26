<script lang="ts">
	import type { ShareableAchievement } from '$lib/social/types';
	import SocialCard from './SocialCard.svelte';

	interface Props {
		achievement: ShareableAchievement;
		backgroundImageUrl?: string | null;
		profileIconUrl?: string | null;
		showProfileIcon?: boolean;
		showBackgroundImage?: boolean;
		onclose: () => void;
	}

	let {
		achievement,
		backgroundImageUrl = null,
		profileIconUrl = null,
		showProfileIcon = true,
		showBackgroundImage = true,
		onclose
	}: Props = $props();

	let cardRef = $state<HTMLElement | null>(null);
	let downloading = $state(false);
	let copied = $state(false);

	const HOMEPAGE_URL = 'https://jnsprosystems.com';

	function buildCaption(): string {
		const m = achievement.metric;
		const metricStr = `${m.value}${m.unit} ${m.label}`;
		const contextStr = achievement.conditionsBadge ? ` ${achievement.conditionsBadge.description}.` : '';
		const title = achievement.headlineTitle.replace('\n', ' ');
		return `${title} — ${metricStr}.${contextStr} Tracked with AppGatePro. #BMX #AppGatePro #ProgressNotPerfection`;
	}

	async function handleDownload() {
		if (!cardRef || downloading) return;
		downloading = true;
		try {
			const h2c = (await import('html2canvas')).default;
			const canvas = await h2c(cardRef, {
				scale: 2,
				useCORS: true,
				backgroundColor: '#060d1a',
				logging: false,
				width: 1200,
				height: 630
			});
			const link = document.createElement('a');
			link.download = `appgatepro-${achievement.type}-${new Date(achievement.sessionDate).toISOString().slice(0, 10)}.png`;
			link.href = canvas.toDataURL('image/png');
			link.click();
		} catch {
			// Fallback: open card in new tab for manual screenshot
			const win = window.open('', '_blank');
			if (win && cardRef) {
				win.document.write(`<html><head><title>AppGatePro Card</title>
                    <style>body{margin:0;background:#060d1a;display:flex;justify-content:center;align-items:center;min-height:100vh;}</style>
                    </head><body>${cardRef.outerHTML}</body></html>`);
			}
		} finally {
			downloading = false;
		}
	}

	async function handleCopyLink() {
		try {
			await navigator.clipboard.writeText(HOMEPAGE_URL);
		} catch {
			const el = document.createElement('input');
			el.value = HOMEPAGE_URL;
			document.body.appendChild(el);
			el.select();
			document.execCommand('copy');
			document.body.removeChild(el);
		}
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	function handleX() {
		const text = encodeURIComponent(buildCaption() + ' ' + HOMEPAGE_URL);
		window.open(`https://x.com/intent/tweet?text=${text}`, '_blank', 'width=550,height=420');
	}

	function handleLinkedIn() {
		window.open(
			`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(HOMEPAGE_URL)}`,
			'_blank',
			'width=550,height=500'
		);
	}

	function handleReddit() {
		window.open(
			`https://www.reddit.com/submit?url=${encodeURIComponent(HOMEPAGE_URL)}&title=${encodeURIComponent(buildCaption())}`,
			'_blank',
			'width=850,height=600'
		);
	}

	function handleFacebook() {
		window.open(
			`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(HOMEPAGE_URL)}`,
			'_blank',
			'width=550,height=420'
		);
	}

	// Reactive scale — recalculates when wrapper is bound
	let cardPreviewWrapper = $state<HTMLElement | null>(null);
	let cardScale = $derived.by(() => {
		if (!cardPreviewWrapper) return 0.5;
		return (cardPreviewWrapper.clientWidth || 600) / 1200;
	});

	function focusOnMount(node: HTMLElement) {
		node.focus();
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) onclose();
	}
</script>

<!-- Backdrop -->
<div
	class="modal-backdrop"
	onclick={handleBackdropClick}
	role="dialog"
	aria-modal="true"
	aria-label="Share achievement"
	use:focusOnMount
	onkeydown={(e) => e.key === 'Escape' && onclose()}
	tabindex="-1"
>
	<div class="modal-sheet">
		<!-- Header -->
		<div class="modal-header">
			<div>
				<h2 class="modal-title">{achievement.headlineTitle.replace('\n', ' ')}</h2>
				<p class="modal-subtitle">{achievement.headlineSubtitle}</p>
			</div>
			<button class="close-btn" onclick={onclose} aria-label="Close">
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
				>
					<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
				</svg>
			</button>
		</div>

		<!-- Card preview — 1200×630 scaled to modal width -->
		<div class="card-preview-wrapper" bind:this={cardPreviewWrapper}>
			<div
				class="card-scale-container"
				style="transform: scale({cardScale}); transform-origin: top left;"
			>
				<SocialCard
					{achievement}
					{backgroundImageUrl}
					{profileIconUrl}
					{showProfileIcon}
					{showBackgroundImage}
					bind:cardRef
				/>
			</div>
		</div>

		<!-- Share actions -->
		<div class="share-actions">
			<button class="share-btn" onclick={handleCopyLink} title="Copy link">
				<div class="share-icon">
					{#if copied}
						<svg
							width="22"
							height="22"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<polyline points="20 6 9 17 4 12" />
						</svg>
					{:else}
						<svg
							width="22"
							height="22"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
							<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
						</svg>
					{/if}
				</div>
				<span>{copied ? 'Copied!' : 'Copy link'}</span>
			</button>

			<button class="share-btn" onclick={handleX} title="Share on X">
				<div class="share-icon">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
						/>
					</svg>
				</div>
				<span>X</span>
			</button>

			<button class="share-btn" onclick={handleFacebook} title="Share on Facebook">
				<div class="share-icon">
					<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
						/>
					</svg>
				</div>
				<span>Facebook</span>
			</button>

			<button class="share-btn" onclick={handleLinkedIn} title="Share on LinkedIn">
				<div class="share-icon">
					<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
						/>
					</svg>
				</div>
				<span>LinkedIn</span>
			</button>

			<button class="share-btn" onclick={handleReddit} title="Share on Reddit">
				<div class="share-icon">
					<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"
						/>
					</svg>
				</div>
				<span>Reddit</span>
			</button>

			<button
				class="share-btn download-btn"
				onclick={handleDownload}
				title="Download as PNG"
				disabled={downloading}
			>
				<div class="share-icon">
					{#if downloading}
						<div class="spinner"></div>
					{:else}
						<svg
							width="22"
							height="22"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
							<polyline points="7 10 12 15 17 10" />
							<line x1="12" y1="15" x2="12" y2="3" />
						</svg>
					{/if}
				</div>
				<span>{downloading ? 'Saving…' : 'Download'}</span>
			</button>
		</div>

		<p class="download-note">
			Download saves a PNG at 2× resolution. Share buttons post a link to AppGatePro.
		</p>
	</div>
</div>

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.75);
		backdrop-filter: blur(4px);
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16px;
		animation: fadeIn 0.18s ease;
	}
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modal-sheet {
		background: var(--color-surface, #131010);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 20px;
		width: 100%;
		max-width: 660px;
		max-height: 92vh;
		overflow-y: auto;
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 20px;
		animation: slideUp 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	@keyframes slideUp {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.modal-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
	}
	.modal-title {
		font-size: 18px;
		font-weight: 700;
		color: var(--color-text-primary, #f0ebe3);
		margin: 0 0 4px;
	}
	.modal-subtitle {
		font-size: 13px;
		color: var(--color-text-secondary, #9a8f7a);
		margin: 0;
	}

	.close-btn {
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 8px;
		color: var(--color-text-secondary, #9a8f7a);
		cursor: pointer;
		padding: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition:
			background 0.15s,
			color 0.15s;
	}
	.close-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: var(--color-text-primary, #f0ebe3);
	}

	/* Maintains 16:9 aspect ratio for the 1200×630 card */
	.card-preview-wrapper {
		width: 100%;
		aspect-ratio: 1200 / 630;
		position: relative;
		overflow: hidden;
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.06);
		background: #060d1a;
	}
	.card-scale-container {
		position: absolute;
		top: 0;
		left: 0;
		width: 1200px;
		height: 630px;
	}

	.share-actions {
		display: flex;
		gap: 8px;
		justify-content: center;
		flex-wrap: wrap;
	}

	.share-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 12px;
		color: var(--color-text-primary, #f0ebe3);
		cursor: pointer;
		padding: 12px 16px;
		min-width: 72px;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.3px;
		transition:
			background 0.15s,
			border-color 0.15s,
			transform 0.1s;
	}
	.share-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.15);
		transform: translateY(-2px);
	}
	.share-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.share-icon {
		width: 44px;
		height: 44px;
		background: rgba(255, 255, 255, 0.08);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.download-btn .share-icon {
		background: rgba(245, 166, 35, 0.15);
		color: #f5a623;
	}
	.download-btn {
		border-color: rgba(245, 166, 35, 0.2);
	}
	.download-btn:hover:not(:disabled) {
		background: rgba(245, 166, 35, 0.1);
		border-color: rgba(245, 166, 35, 0.35);
	}

	.spinner {
		width: 20px;
		height: 20px;
		border: 2px solid rgba(245, 166, 35, 0.3);
		border-top-color: #f5a623;
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.download-note {
		font-size: 11px;
		color: var(--color-text-subtle, #6b5f4d);
		text-align: center;
		margin: 0;
	}
</style>

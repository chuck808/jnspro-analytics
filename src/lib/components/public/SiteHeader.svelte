<script lang="ts">
	import { onMount } from 'svelte';

	let menuOpen = $state(false);
	let scrolled = $state(false);
	let menuButton: HTMLButtonElement;

	onMount(() => {
		const onScroll = () => {
			scrolled = window.scrollY > 40;
		};
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});

	function toggleMenu() {
		menuOpen = !menuOpen;
	}
	function closeMenu() {
		const wasOpen = menuOpen;
		menuOpen = false;
		if (wasOpen) menuButton?.focus();
	}
	function focusOnMount(node: HTMLElement) {
		node.focus();
	}
</script>

<nav class="navbar" class:scrolled>
	<a href="/" class="nav-logo" onclick={closeMenu}>
		<img src="/logo-header-dark.svg" alt="JNS Pro Systems" class="logo-img" />
	</a>

	<div class="nav-links">
		<a href="/about" class="nav-link">About</a>
		<a href="/docs" class="nav-link">Docs</a>
		<a href="/contact" class="nav-link">Contact</a>
	</div>

	<div class="nav-actions">
		<a href="/auth/sign-in" class="btn-ghost">Sign in</a>
		<a href="/auth/sign-up" class="btn-amber">Join the beta</a>
	</div>

	<button
		bind:this={menuButton}
		class="hamburger"
		onclick={toggleMenu}
		aria-label="Menu"
		aria-expanded={menuOpen}
		aria-controls="public-mobile-menu"
	>
		<span class="ham-line" class:open={menuOpen}></span>
		<span class="ham-line mid" class:open={menuOpen}></span>
		<span class="ham-line" class:open={menuOpen}></span>
	</button>
</nav>

{#if menuOpen}
	<div
		id="public-mobile-menu"
		class="mobile-menu"
		onclick={closeMenu}
		onkeydown={(e) => e.key === 'Escape' && closeMenu()}
		role="dialog"
		aria-modal="true"
		aria-label="Navigation menu"
		tabindex="-1"
		use:focusOnMount
	>
		<a href="/about" class="mob-link" onclick={closeMenu}>About</a>
		<a href="/docs" class="mob-link" onclick={closeMenu}>Docs</a>
		<a href="/contact" class="mob-link" onclick={closeMenu}>Contact</a>
		<div class="mob-divider"></div>
		<a href="/auth/sign-in" class="mob-link" onclick={closeMenu}>Sign in</a>
		<a href="/auth/sign-up" class="mob-cta" onclick={closeMenu}>Join the beta</a>
	</div>
{/if}

<style>
	.navbar {
		position: fixed;
		inset: 0 0 auto;
		z-index: 200;
		display: flex;
		align-items: center;
		padding: 0 2.5rem;
		height: 80px;
		transition:
			background 0.3s,
			border-color 0.3s;
		border-bottom: 1px solid transparent;
	}
	.navbar.scrolled {
		background: rgba(8, 7, 7, 0.95);
		backdrop-filter: blur(20px);
		border-bottom-color: rgba(245, 166, 35, 0.08);
	}
	.logo-img {
		height: 52px;
		width: auto;
		display: block;
	}
	.nav-logo {
		text-decoration: none;
		display: flex;
		align-items: center;
	}
	.nav-links {
		display: flex;
		gap: 2.5rem;
		margin: 0 auto;
	}
	.nav-link {
		font-size: 0.875rem;
		font-weight: 500;
		color: #6a5f4f;
		text-decoration: none;
		transition: color 0.2s;
		letter-spacing: 0.02em;
	}
	.nav-link:hover {
		color: #f0ece4;
	}
	.nav-actions {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}
	.btn-ghost {
		font-size: 0.875rem;
		font-weight: 500;
		color: #6a5f4f;
		text-decoration: none;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		transition: color 0.2s;
	}
	.btn-ghost:hover {
		color: #f0ece4;
	}
	.btn-amber {
		font-size: 0.875rem;
		font-weight: 700;
		color: #080707;
		background: #f5a623;
		text-decoration: none;
		padding: 0.5rem 1.25rem;
		border-radius: 6px;
		transition: background 0.2s;
		white-space: nowrap;
	}
	.btn-amber:hover {
		background: #e09420;
	}

	/* HAMBURGER */
	.hamburger {
		display: none;
		flex-direction: column;
		gap: 5px;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		margin-left: auto;
	}
	.ham-line {
		display: block;
		width: 22px;
		height: 2px;
		background: #9a8f7a;
		border-radius: 1px;
		transition:
			transform 0.25s,
			opacity 0.25s;
	}
	.ham-line.open:nth-child(1) {
		transform: translateY(7px) rotate(45deg);
	}
	.ham-line.mid.open {
		opacity: 0;
	}
	.ham-line.open:nth-child(3) {
		transform: translateY(-7px) rotate(-45deg);
	}

	/* MOBILE MENU */
	.mobile-menu {
		position: fixed;
		inset: 80px 0 0;
		z-index: 190;
		background: rgba(8, 7, 7, 0.98);
		backdrop-filter: blur(20px);
		display: flex;
		flex-direction: column;
		padding: 2rem 1.5rem;
		gap: 0.25rem;
		border-top: 1px solid rgba(245, 166, 35, 0.08);
	}
	.mob-link {
		font-size: 1.1rem;
		font-weight: 500;
		color: #9a8f7a;
		text-decoration: none;
		padding: 0.875rem 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.04);
		transition: color 0.2s;
	}
	.mob-link:hover {
		color: #f0ece4;
	}
	.mob-divider {
		height: 1px;
		background: rgba(245, 166, 35, 0.1);
		margin: 0.75rem 0;
	}
	.mob-cta {
		display: block;
		text-align: center;
		font-family: 'Barlow Condensed', sans-serif;
		font-weight: 700;
		font-size: 1rem;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: #080707;
		background: #f5a623;
		text-decoration: none;
		padding: 0.875rem;
		border-radius: 8px;
		margin-top: 0.75rem;
		transition: background 0.2s;
	}
	.mob-cta:hover {
		background: #e09420;
	}

	@media (max-width: 768px) {
		.navbar {
			padding: 0 1.25rem;
			height: 64px;
		}
		.nav-links {
			display: none;
		}
		.nav-actions {
			display: none;
		}
		.hamburger {
			display: flex;
		}
		.logo-img {
			height: 42px;
		}
	}
</style>

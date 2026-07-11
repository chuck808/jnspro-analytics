<script lang="ts">
	import { onMount } from 'svelte';

	let menuOpen = $state(false);
	let scrolled = $state(false);

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
		menuOpen = false;
	}
</script>

<svelte:head>
	<title>AppGatePro — BMX Gate Start Analytics</title>
	<meta
		name="description"
		content="AppGatePro gives riders and coaches detailed, honest analysis of BMX gate starts. Reaction time, G-force, technique scoring and session trends — built around what can responsibly be concluded from the data."
	/>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,600;0,700;0,800;0,900;1,800&family=Barlow:wght@400;500;600&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="home">
	<!-- ── NAVBAR ── -->
	<nav class="navbar" class:scrolled>
		<a href="/" class="nav-logo" onclick={closeMenu}>
			<img src="/logo-header-dark.svg" alt="JNS Pro Systems" class="logo-img" />
		</a>

		<div class="nav-links">
			<a href="#what-it-does" class="nav-link">What it does</a>
			<a href="#how-it-works" class="nav-link">How it works</a>
			<a href="#for-coaches" class="nav-link">For coaches</a>
		</div>

		<div class="nav-actions">
			<a href="/auth/sign-in" class="btn-ghost">Sign in</a>
			<a href="/auth/sign-up" class="btn-amber">Join the beta</a>
		</div>

		<button class="hamburger" onclick={toggleMenu} aria-label="Menu">
			<span class="ham-line" class:open={menuOpen}></span>
			<span class="ham-line mid" class:open={menuOpen}></span>
			<span class="ham-line" class:open={menuOpen}></span>
		</button>
	</nav>

	{#if menuOpen}
		<div
			class="mobile-menu"
			onclick={closeMenu}
			onkeydown={(e) => e.key === 'Escape' && closeMenu()}
			role="dialog"
			aria-modal="true"
			aria-label="Navigation menu"
			tabindex="-1"
		>
			<a href="#what-it-does" class="mob-link" onclick={closeMenu}>What it does</a>
			<a href="#how-it-works" class="mob-link" onclick={closeMenu}>How it works</a>
			<a href="#for-coaches" class="mob-link" onclick={closeMenu}>For coaches</a>
			<div class="mob-divider"></div>
			<a href="/auth/sign-in" class="mob-link" onclick={closeMenu}>Sign in</a>
			<a href="/auth/sign-up" class="mob-cta" onclick={closeMenu}>Join the beta</a>
		</div>
	{/if}

	<!-- ── HERO ── -->
	<section class="hero">
		<div class="hero-img-wrap">
			<img src="/bmx-hero.webp" alt="BMX rider gate start" class="hero-img" />
			<div class="hero-scrim"></div>
		</div>
		<div class="hero-grid"></div>
		<div class="hero-content">
			<div class="hero-left">
				<div class="hero-tag">
					<span class="tag-dot"></span>
					Beta · UCI-compliant · 200Hz IMU
				</div>
				<h1 class="hero-title">
					<span class="t-dim">Gate start</span>
					<span class="t-white">analytics</span>
					<span class="t-amber t-italic">that's honest</span>
				</h1>
				<p class="hero-desc">
					AppGatePro measures what happens in the first three seconds out of the gate — reaction
					time, acceleration, technique — and tells you what it can <em>responsibly</em> conclude from
					that data. Not just what happened. What it means.
				</p>
				<div class="hero-cta">
					<a href="/auth/sign-up" class="btn-primary">
						Join the beta
						<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2.5"
								d="M13 7l5 5-5 5M6 12h12"
							/>
						</svg>
					</a>
					<a href="/auth/sign-in" class="btn-outline">Sign in</a>
				</div>
			</div>

			<div class="hero-right">
				<div class="app-preview">
					<div class="ap-header">
						<div class="ap-session">
							<span class="ap-title">Session · 8 Apr 2026</span>
							<span class="ap-pill">7 of 9 runs · 2 warmups excluded</span>
						</div>
						<span class="ap-confidence">Moderate confidence</span>
					</div>
					<div class="ap-metrics">
						<div class="ap-metric">
							<span class="apm-label">Best reaction</span>
							<span class="apm-value amber">142ms</span>
							<span class="apm-basis">📡 Measured</span>
						</div>
						<div class="ap-metric">
							<span class="apm-label">Peak G-force</span>
							<span class="apm-value">3.4G</span>
							<span class="apm-basis">📡 Measured</span>
						</div>
						<div class="ap-metric">
							<span class="apm-label">Consistency</span>
							<span class="apm-value teal">CV 4.2%</span>
							<span class="apm-basis">∫ Derived</span>
						</div>
					</div>
					<div class="ap-narrative">
						<div class="ap-nar-header">
							<span class="ap-nar-label">Session narrative</span>
							<span class="ap-nar-conf">high confidence</span>
						</div>
						<p class="ap-nar-text">
							Reaction time is the strongest element — consistent across all 7 runs. G-force output
							is developing. Speed carry needs attention.
						</p>
					</div>
					<div class="ap-scores">
						{#each [{ label: 'Launch', score: 84, color: '#f5a623' }, { label: 'Drive', score: 71, color: '#f5a623' }, { label: 'Carry', score: 58, color: '#ff6b3d' }, { label: 'Smooth', score: 76, color: '#f5a623' }, { label: 'Repeat', score: 88, color: '#3de8c8' }] as s}
							<div class="ap-score">
								<div class="aps-bar-wrap">
									<div class="aps-bar" style="height: {s.score}%; background: {s.color}"></div>
								</div>
								<span class="aps-label">{s.label}</span>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- ── WHAT IT DOES ── -->
	<section class="section what-it-does" id="what-it-does">
		<div class="section-inner">
			<div class="section-head">
				<div class="section-eyebrow">What it does</div>
				<h2 class="section-title">Every run. Every metric. Explained.</h2>
				<p class="section-sub">
					The device attaches to the rider and records 200 times a second. The platform turns that
					into coaching language — but only says what the data actually supports.
				</p>
			</div>
			<div class="metrics-grid">
				{#each [{ label: 'Reaction time', basis: 'Measured', basisIcon: '📡', desc: 'Time from gate drop to first forward movement, detected by the IMU. Accurate to the millisecond.' }, { label: 'Peak G-force', basis: 'Measured', basisIcon: '📡', desc: 'Maximum acceleration force during the drive phase. The raw explosive output of the first pedal strokes.' }, { label: 'Speed curve', basis: 'Derived', basisIcon: '∫', desc: 'Speed at every point in the run, integrated from the IMU acceleration trace. Clearly flagged as an estimate.' }, { label: 'Technique scores', basis: 'Composite', basisIcon: '◈', desc: 'Six dimensions — launch quality, explosiveness, speed carry, smoothness, impulse timing, repeatability — each 0 to 100.' }, { label: 'Consistency', basis: 'Derived', basisIcon: '∫', desc: 'How repeatable the rider is across all runs in a session. Coefficient of variation across reaction times and speeds.' }, { label: 'Front wheel lift', basis: 'Measured', basisIcon: '📡', desc: 'Pitch angle throughout the run. Classifies lifts as controlled, excessive, or late — each has different coaching implications.' }] as m, i}
					<div class="metric-card" style="animation-delay: {i * 80}ms">
						<div class="mc-top">
							<span class="mc-basis">{m.basisIcon} {m.basis}</span>
						</div>
						<h3 class="mc-label">{m.label}</h3>
						<p class="mc-desc">{m.desc}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- ── HOW IT WORKS ── -->
	<section class="section how-it-works" id="how-it-works">
		<div class="section-inner">
			<div class="section-head">
				<div class="section-eyebrow">How it works</div>
				<h2 class="section-title">Device to dashboard in minutes.</h2>
			</div>
			<div class="steps">
				{#each [{ n: '01', title: 'Fit and go', desc: 'The AppGatePro device attaches to the rider. Set the session up, run the gate sequence, and ride.' }, { n: '02', title: 'Upload the session', desc: 'When the session is done, upload directly over WiFi or pull the SD card and drop the file in the web app.' }, { n: '03', title: 'Read the analysis', desc: 'Every run is analysed immediately. Reaction times, G-force, technique scores, session narrative — all there.' }, { n: '04', title: 'Track over time', desc: 'Sessions accumulate into trends. Consistency improving? Drop-off point shifting? The data shows it honestly.' }] as step, i}
					<div class="step">
						<div class="step-num">{step.n}</div>
						<div class="step-body">
							<h3 class="step-title">{step.title}</h3>
							<p class="step-desc">{step.desc}</p>
						</div>
						{#if i < 3}<div class="step-connector"></div>{/if}
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- ── FOR COACHES ── -->
	<section class="section for-coaches" id="for-coaches">
		<div class="section-inner coaches-inner">
			<div class="coaches-left">
				<div class="section-eyebrow">For coaches</div>
				<h2 class="section-title">The system agrees with you.</h2>
				<p class="section-sub">
					AppGatePro is not a replacement for coaching. It's a precise record of what happened
					mechanically — so the conversation between coach and rider is based on evidence, not
					memory.
				</p>
				<p class="section-sub">
					When the coach says "run four looked off," the data can confirm it. Did the G-force drop?
					Did the reaction time slip? The combination of coaching observation and objective data is
					more useful than either alone.
				</p>
				<p class="section-sub">
					The system also knows what it can't say. Context from the rider — session focus, track
					conditions, how they felt — shapes the interpretation. A testing session gets different
					analysis than a normal training session.
				</p>
			</div>
			<div class="coaches-right">
				<div class="diag-card">
					<div class="diag-header">
						<span class="diag-icon warning">⚠</span>
						<div>
							<p class="diag-title">Reaction is ahead of drive force</p>
							<p class="diag-tone">Coach observation</p>
						</div>
					</div>
					<p class="diag-summary">
						The rider is reacting well, but the first drive phase is not producing enough
						acceleration to match the start quality.
					</p>
					<div class="diag-evidence">
						<span class="diag-ev-label">Evidence</span>
						<div class="diag-ev-items">
							<span class="diag-ev">Launch quality 84/100</span>
							<span class="diag-ev">Explosiveness 58/100</span>
						</div>
					</div>
					<div class="diag-rx">
						<span class="diag-rx-label">Prescription</span>
						<ul class="diag-rx-list">
							<li>Keep gate reaction work ticking over.</li>
							<li>Add first-pedal force drills.</li>
							<li>Measure whether peak G improves without reaction time getting worse.</li>
						</ul>
					</div>
				</div>
				<p class="diag-note">
					This is what a coach diagnostic looks like in the app — generated from the session data,
					not hardcoded.
				</p>
			</div>
		</div>
	</section>

	<!-- ── JOIN THE BETA ── -->
	<section class="section join-beta">
		<div class="section-inner beta-inner">
			<div class="beta-content">
				<div class="section-eyebrow">Beta access</div>
				<h2 class="section-title">Built at the track. Tested at the gate.</h2>
				<p class="section-sub">
					AppGatePro is in active development with real riders and coaches. Beta access is open. If
					you coach a club or train seriously, this is the right time to get involved — the system
					gets better with more real-world sessions behind it.
				</p>
				<div class="beta-cta">
					<a href="/auth/sign-up" class="btn-primary">
						Request beta access
						<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2.5"
								d="M13 7l5 5-5 5M6 12h12"
							/>
						</svg>
					</a>
					<a href="/auth/sign-in" class="btn-outline">Already have an account</a>
				</div>
			</div>
			<div class="beta-facts">
				{#each [{ label: 'Sampling rate', value: '200Hz', note: 'IMU data' }, { label: 'Reaction accuracy', value: '±1ms', note: 'UCI-compliant gate' }, { label: 'Metrics per run', value: '20+', note: 'From one session' }, { label: 'Rider levels', value: 'All', note: 'Grom to elite' }] as f}
					<div class="beta-fact">
						<span class="bf-value">{f.value}</span>
						<span class="bf-label">{f.label}</span>
						<span class="bf-note">{f.note}</span>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- ── FOOTER ── -->
	<footer class="footer">
		<div class="footer-inner">
			<div class="footer-brand">
				<a href="/" class="fb-link">
					<img src="/logo-icon-dark.svg" alt="JNS" class="fb-icon" />
					<div>
						<p class="fb-name">AppGatePro</p>
						<p class="fb-by">by JNS Pro Systems</p>
					</div>
				</a>
				<p class="fb-desc">Honest BMX gate start analytics — built at the track, not in a lab.</p>
			</div>
			<div class="footer-nav">
				<div class="fn-col">
					<h4 class="fn-title">Product</h4>
					<a href="#what-it-does" class="fn-link">What it does</a>
					<a href="#how-it-works" class="fn-link">How it works</a>
					<a href="#for-coaches" class="fn-link">For coaches</a>
				</div>
				<div class="fn-col">
					<h4 class="fn-title">Account</h4>
					<a href="/auth/sign-in" class="fn-link">Sign in</a>
					<a href="/auth/sign-up" class="fn-link">Join beta</a>
				</div>
				<div class="fn-col">
					<h4 class="fn-title">Legal</h4>
					<a href="/privacy" class="fn-link">Privacy</a>
					<a href="/terms" class="fn-link">Terms</a>
				</div>
			</div>
		</div>
		<div class="footer-bottom">
			<p class="footer-copy">© {new Date().getFullYear()} JNS Pro Systems</p>
			<span class="footer-beta">Beta</span>
		</div>
	</footer>
</div>

<style>
	:global(body) {
		margin: 0;
		background: #080707;
	}
	.home {
		font-family: 'Barlow', system-ui, sans-serif;
		color: #f0ece4;
		background: #080707;
		overflow-x: hidden;
	}

	/* NAVBAR */
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

	/* HERO */
	.hero {
		position: relative;
		width: 100%;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		justify-content: center;
		overflow: hidden;
		padding-top: 80px;
	}
	.hero-img-wrap {
		position: absolute;
		inset: 0;
		z-index: 0;
	}
	.hero-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center 25%;
	}
	.hero-scrim {
		position: absolute;
		inset: 0;
		background:
			linear-gradient(
				to right,
				rgba(8, 7, 7, 0.96) 0%,
				rgba(8, 7, 7, 0.8) 45%,
				rgba(8, 7, 7, 0.55) 100%
			),
			linear-gradient(to top, rgba(8, 7, 7, 0.9) 0%, transparent 35%);
	}
	.hero-grid {
		position: absolute;
		inset: 0;
		z-index: 1;
		background-image:
			linear-gradient(rgba(245, 166, 35, 0.03) 1px, transparent 1px),
			linear-gradient(90deg, rgba(245, 166, 35, 0.03) 1px, transparent 1px);
		background-size: 60px 60px;
		mask-image: linear-gradient(to right, black 0%, transparent 55%);
		pointer-events: none;
	}
	.hero-content {
		position: relative;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 4rem 4rem 3rem;
		flex: 1;
		gap: 3rem;
	}
	.hero-left {
		max-width: 560px;
	}
	.hero-tag {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.72rem;
		font-weight: 600;
		color: #f5a623;
		background: rgba(245, 166, 35, 0.06);
		border: 1px solid rgba(245, 166, 35, 0.2);
		padding: 0.35rem 0.875rem;
		border-radius: 100px;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		margin-bottom: 1.75rem;
	}
	.tag-dot {
		width: 5px;
		height: 5px;
		background: #f5a623;
		border-radius: 50%;
		animation: pulse 2s infinite;
	}
	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.3;
		}
	}
	.hero-title {
		font-family: 'Barlow Condensed', sans-serif;
		font-weight: 900;
		font-size: clamp(3.2rem, 6vw, 5.5rem);
		line-height: 0.95;
		letter-spacing: -0.01em;
		margin: 0 0 1.75rem;
	}
	.t-dim {
		display: block;
		color: #4a4038;
	}
	.t-white {
		display: block;
		color: #f0ece4;
	}
	.t-amber {
		display: block;
		color: #f5a623;
	}
	.t-italic {
		font-style: italic;
	}
	.hero-desc {
		font-size: 1rem;
		line-height: 1.75;
		color: #9a8f7a;
		max-width: 500px;
		margin: 0 0 2.25rem;
	}
	.hero-desc em {
		color: #f0ece4;
		font-style: normal;
	}
	.hero-cta {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.btn-primary {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-family: 'Barlow Condensed', sans-serif;
		font-weight: 700;
		font-size: 0.9rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: #080707;
		background: #f5a623;
		text-decoration: none;
		padding: 0.8rem 1.75rem;
		border-radius: 6px;
		transition:
			background 0.2s,
			transform 0.15s;
	}
	.btn-primary:hover {
		background: #e09420;
		transform: translateY(-1px);
	}
	.btn-outline {
		font-family: 'Barlow Condensed', sans-serif;
		font-weight: 700;
		font-size: 0.9rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: #6a5f4f;
		text-decoration: none;
		padding: 0.8rem 1.5rem;
		border-radius: 6px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		transition:
			border-color 0.2s,
			color 0.2s;
	}
	.btn-outline:hover {
		border-color: rgba(245, 166, 35, 0.4);
		color: #f0ece4;
	}

	/* APP PREVIEW */
	.hero-right {
		flex-shrink: 0;
	}
	.app-preview {
		width: 340px;
		background: #131010;
		border: 1px solid rgba(245, 166, 35, 0.12);
		border-radius: 14px;
		padding: 1.25rem;
		box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
	}
	.ap-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #221c18;
	}
	.ap-title {
		display: block;
		font-family: 'Barlow Condensed', sans-serif;
		font-weight: 700;
		font-size: 0.9rem;
		color: #f0ece4;
		margin-bottom: 0.3rem;
	}
	.ap-pill {
		display: block;
		font-size: 0.65rem;
		color: #f5a623;
		background: rgba(245, 166, 35, 0.08);
		border: 1px solid rgba(245, 166, 35, 0.15);
		padding: 0.15rem 0.5rem;
		border-radius: 100px;
		width: fit-content;
	}
	.ap-confidence {
		font-size: 0.65rem;
		color: #4a4038;
		white-space: nowrap;
		padding-top: 0.15rem;
	}
	.ap-metrics {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
		margin-bottom: 1rem;
	}
	.ap-metric {
		background: #0a0809;
		border: 1px solid #1a1412;
		border-radius: 8px;
		padding: 0.6rem 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.apm-label {
		font-size: 0.6rem;
		color: #4a4038;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}
	.apm-value {
		font-family: 'Barlow Condensed', sans-serif;
		font-weight: 800;
		font-size: 1.1rem;
		color: #f0ece4;
		line-height: 1;
	}
	.apm-value.amber {
		color: #f5a623;
	}
	.apm-value.teal {
		color: #3de8c8;
	}
	.apm-basis {
		font-size: 0.58rem;
		color: #2a2018;
	}
	.ap-narrative {
		background: #0a0809;
		border: 1px solid #1a1412;
		border-radius: 8px;
		padding: 0.75rem;
		margin-bottom: 1rem;
	}
	.ap-nar-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.4rem;
	}
	.ap-nar-label {
		font-size: 0.6rem;
		color: #4a4038;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}
	.ap-nar-conf {
		font-size: 0.58rem;
		color: #f5a623;
	}
	.ap-nar-text {
		font-size: 0.75rem;
		color: #9a8f7a;
		line-height: 1.55;
		margin: 0;
	}
	.ap-scores {
		display: flex;
		align-items: flex-end;
		gap: 0.4rem;
		height: 60px;
	}
	.ap-score {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3rem;
		height: 100%;
	}
	.aps-bar-wrap {
		flex: 1;
		width: 100%;
		background: #1a1412;
		border-radius: 3px;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		overflow: hidden;
	}
	.aps-bar {
		width: 100%;
		border-radius: 3px 3px 0 0;
	}
	.aps-label {
		font-size: 0.55rem;
		color: #4a4038;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		white-space: nowrap;
	}

	/* SECTIONS */
	.section {
		padding: 6rem 0;
		border-top: 1px solid #131010;
	}
	.section-inner {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 4rem;
	}
	.section-head {
		max-width: 640px;
		margin-bottom: 3.5rem;
	}
	.section-eyebrow {
		font-size: 0.72rem;
		font-weight: 700;
		color: #f5a623;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		margin-bottom: 0.75rem;
	}
	.section-title {
		font-family: 'Barlow Condensed', sans-serif;
		font-weight: 800;
		font-size: clamp(1.8rem, 3vw, 2.5rem);
		line-height: 1.05;
		color: #f0ece4;
		margin: 0 0 0.875rem;
	}
	.section-sub {
		font-size: 0.95rem;
		color: #6a5f4f;
		line-height: 1.75;
		margin: 0 0 1rem;
	}

	/* METRICS GRID */
	.what-it-does {
		background: #0a0809;
	}
	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1px;
		background: #1a1412;
		border: 1px solid #1a1412;
		border-radius: 10px;
		overflow: hidden;
	}
	.metric-card {
		background: #0e0b0a;
		padding: 1.75rem;
		transition: background 0.25s;
		animation: fadeInUp 0.5s ease both;
	}
	.metric-card:hover {
		background: #131010;
	}
	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.mc-top {
		margin-bottom: 0.75rem;
	}
	.mc-basis {
		font-size: 0.65rem;
		font-weight: 600;
		color: #4a4038;
		background: #131010;
		border: 1px solid #1a1412;
		padding: 0.2rem 0.5rem;
		border-radius: 100px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}
	.mc-label {
		font-family: 'Barlow Condensed', sans-serif;
		font-weight: 700;
		font-size: 1.05rem;
		color: #f0ece4;
		margin: 0 0 0.5rem;
		letter-spacing: 0.02em;
	}
	.mc-desc {
		font-size: 0.85rem;
		color: #6a5f4f;
		line-height: 1.65;
		margin: 0;
	}

	/* STEPS */
	.how-it-works {
		background: #080707;
	}
	.steps {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 2rem;
		position: relative;
	}
	.step {
		position: relative;
	}
	.step-num {
		font-family: 'Barlow Condensed', sans-serif;
		font-weight: 900;
		font-size: 3rem;
		color: rgba(245, 166, 35, 0.12);
		line-height: 1;
		margin-bottom: 0.75rem;
		letter-spacing: -0.02em;
	}
	.step-title {
		font-family: 'Barlow Condensed', sans-serif;
		font-weight: 700;
		font-size: 1rem;
		color: #f0ece4;
		margin: 0 0 0.5rem;
		letter-spacing: 0.02em;
	}
	.step-desc {
		font-size: 0.875rem;
		color: #6a5f4f;
		line-height: 1.65;
		margin: 0;
	}
	.step-connector {
		position: absolute;
		top: 1.5rem;
		right: -1.25rem;
		width: 0.5rem;
		height: 1px;
		background: rgba(245, 166, 35, 0.2);
	}

	/* COACHES */
	.for-coaches {
		background: #0a0809;
	}
	.coaches-inner {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 5rem;
		align-items: start;
	}
	.diag-card {
		background: #131010;
		border: 1px solid #221c18;
		border-radius: 12px;
		padding: 1.5rem;
	}
	.diag-header {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}
	.diag-icon {
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		font-size: 0.875rem;
		flex-shrink: 0;
	}
	.diag-icon.warning {
		background: rgba(255, 107, 61, 0.12);
		color: #ff6b3d;
	}
	.diag-title {
		font-family: 'Barlow Condensed', sans-serif;
		font-weight: 700;
		font-size: 0.95rem;
		color: #f0ece4;
		margin: 0 0 0.2rem;
	}
	.diag-tone {
		font-size: 0.65rem;
		color: #4a4038;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin: 0;
	}
	.diag-summary {
		font-size: 0.85rem;
		color: #9a8f7a;
		line-height: 1.6;
		margin: 0 0 1rem;
	}
	.diag-evidence {
		margin-bottom: 1rem;
	}
	.diag-ev-label,
	.diag-rx-label {
		font-size: 0.62rem;
		color: #4a4038;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		display: block;
		margin-bottom: 0.4rem;
	}
	.diag-ev-items {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.diag-ev {
		font-size: 0.72rem;
		color: #9a8f7a;
		background: #0a0809;
		border: 1px solid #1a1412;
		padding: 0.2rem 0.6rem;
		border-radius: 100px;
	}
	.diag-rx-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.diag-rx-list li {
		font-size: 0.8rem;
		color: #6a5f4f;
		line-height: 1.5;
		padding-left: 1rem;
		position: relative;
	}
	.diag-rx-list li::before {
		content: '—';
		position: absolute;
		left: 0;
		color: #2a2018;
	}
	.diag-note {
		font-size: 0.72rem;
		color: #2a2018;
		line-height: 1.5;
		margin: 0.875rem 0 0;
		font-style: italic;
	}

	/* BETA */
	.join-beta {
		background: #080707;
		border-top: 1px solid rgba(245, 166, 35, 0.08);
	}
	.beta-inner {
		display: grid;
		grid-template-columns: 1.5fr 1fr;
		gap: 5rem;
		align-items: center;
	}
	.beta-cta {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
		margin-top: 2rem;
	}
	.beta-facts {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1px;
		background: #1a1412;
		border: 1px solid #1a1412;
		border-radius: 10px;
		overflow: hidden;
	}
	.beta-fact {
		background: #0e0b0a;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}
	.bf-value {
		font-family: 'Barlow Condensed', sans-serif;
		font-weight: 900;
		font-size: 2rem;
		color: #f5a623;
		line-height: 1;
	}
	.bf-label {
		font-size: 0.8rem;
		color: #f0ece4;
		font-weight: 600;
	}
	.bf-note {
		font-size: 0.7rem;
		color: #4a4038;
	}

	/* FOOTER */
	.footer {
		background: #080707;
		border-top: 1px solid #131010;
		padding: 3rem 0 2rem;
	}
	.footer-inner {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 4rem;
		display: grid;
		grid-template-columns: 1.5fr 1fr;
		gap: 4rem;
		margin-bottom: 2rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid #131010;
	}
	.footer-brand {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.fb-link {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		text-decoration: none;
		width: fit-content;
	}
	.fb-icon {
		width: 28px;
		height: 28px;
		opacity: 0.7;
	}
	.fb-name {
		font-family: 'Barlow Condensed', sans-serif;
		font-weight: 800;
		font-size: 0.9rem;
		color: #f5a623;
		margin: 0;
	}
	.fb-by {
		font-size: 0.65rem;
		color: #4a4038;
		margin: 0;
	}
	.fb-desc {
		font-size: 0.8rem;
		color: #4a4038;
		line-height: 1.6;
		max-width: 360px;
		margin: 0;
	}
	.footer-nav {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.5rem;
	}
	.fn-col {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.fn-title {
		font-family: 'Barlow Condensed', sans-serif;
		font-weight: 700;
		font-size: 0.72rem;
		color: #6a5f4f;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		margin: 0 0 0.25rem;
	}
	.fn-link {
		font-size: 0.825rem;
		color: #4a4038;
		text-decoration: none;
		transition: color 0.2s;
		width: fit-content;
	}
	.fn-link:hover {
		color: #f5a623;
	}
	.footer-bottom {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 4rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.footer-copy {
		font-size: 0.72rem;
		color: #2a2018;
		margin: 0;
	}
	.footer-beta {
		font-size: 0.65rem;
		font-weight: 700;
		color: #f5a623;
		background: rgba(245, 166, 35, 0.05);
		border: 1px solid rgba(245, 166, 35, 0.12);
		padding: 0.25rem 0.65rem;
		border-radius: 100px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	/* RESPONSIVE */
	@media (max-width: 1024px) {
		.hero-right {
			display: none;
		}
		.steps {
			grid-template-columns: 1fr 1fr;
			gap: 2.5rem;
		}
		.step-connector {
			display: none;
		}
		.coaches-inner {
			grid-template-columns: 1fr;
			gap: 2.5rem;
		}
		.beta-inner {
			grid-template-columns: 1fr;
			gap: 2.5rem;
		}
		.metrics-grid {
			grid-template-columns: 1fr 1fr;
		}
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
		.hero-content {
			padding: 2.5rem 1.25rem 2rem;
		}
		.hero-title {
			font-size: clamp(2.5rem, 10vw, 3.5rem);
		}
		.section {
			padding: 4rem 0;
		}
		.section-inner {
			padding: 0 1.25rem;
		}
		.section-head {
			margin-bottom: 2.5rem;
		}
		.metrics-grid {
			grid-template-columns: 1fr;
		}
		.steps {
			grid-template-columns: 1fr;
			gap: 2rem;
		}
		.footer-inner {
			grid-template-columns: 1fr;
			gap: 2rem;
			padding: 0 1.25rem;
			margin-bottom: 1.5rem;
			padding-bottom: 1.5rem;
		}
		.footer-nav {
			grid-template-columns: repeat(3, 1fr);
		}
		.footer-bottom {
			padding: 0 1.25rem;
		}
	}
	@media (max-width: 480px) {
		.footer-nav {
			grid-template-columns: 1fr;
		}
		.beta-facts {
			grid-template-columns: 1fr;
		}
		.hero-cta {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>

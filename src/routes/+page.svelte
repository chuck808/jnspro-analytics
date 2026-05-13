<script lang="ts">
    // Home page is always dark theme, no need for ThemeLogo component
</script>

<svelte:head>
    <title>AppGatePro — BMX Gate Start Analytics</title>
    <meta name="description" content="Lab-grade BMX gate start analytics. UCI-compliant timing, 200Hz biomechanical data, and performance insights previously only available to elite teams." />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
    <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,600;0,700;0,800;0,900;1,800&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet" />
</svelte:head>

<div class="home">

    <!-- ── NAVBAR ─────────────────────────────────────────────────────────── -->
    <nav class="navbar">
        <a href="/" class="nav-logo">
            <img src="/logo-header-dark.svg" alt="JNS Pro Systems" style="height: 100px; width: auto;" />
        </a>

        <div class="nav-links">
            <a href="#features" class="nav-link">Features</a>
            <a href="#analytics" class="nav-link">Analytics</a>
            <a href="#pricing" class="nav-link">Pricing</a>
            <a href="/docs" class="nav-link">Docs</a>
        </div>

        <div class="nav-actions">
            <a href="/auth/sign-in" class="btn-ghost">Sign in</a>
            <a href="/auth/sign-up" class="btn-amber">Get started free</a>
        </div>
    </nav>

    <!-- ── HERO — full bleed ──────────────────────────────────────────────── -->
    <section class="hero">

        <!-- Full-width background image -->
        <div class="hero-img-wrap">
            <img src="/bmx-hero.webp" alt="BMX rider gate start" class="hero-img" />
            <div class="hero-img-scrim"></div>
        </div>

        <!-- Grid overlay for texture -->
        <div class="hero-grid"></div>

        <!-- Content sits on top -->
        <div class="hero-content">

            <!-- Left: headline -->
            <div class="hero-left">
                <div class="hero-badge">
                    <span class="badge-dot"></span>
                    UCI-compliant · 200Hz IMU · Real-time
                </div>

                <h1 class="hero-title">
                    <span class="t-white">Gate Start</span>
                    <span class="t-amber">Analytics</span>
                    <span class="t-white t-italic">For Everyone</span>
                </h1>

                <p class="hero-desc">
                    Lab-grade BMX performance data — reaction times,
                    biomechanical power curves, technique scoring —
                    previously only available to elite teams.
                    Now accessible to every rider and coach.
                </p>

                <div class="hero-cta">
                    <a href="/auth/sign-up" class="btn-primary">
                        Start free beta
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5-5 5M6 12h12"/>
                        </svg>
                    </a>
                    <a href="/auth/sign-in" class="btn-outline">Sign in</a>
                </div>
            </div>

            <!-- Right: floating data cards -->
            <div class="hero-right">
                <div class="data-cluster">
                    <div class="data-card dc-top">
                        <span class="dc-label">Reaction</span>
                        <span class="dc-value">0.142s</span>
                        <span class="dc-sub">Run #2 · Best today</span>
                    </div>
                    <div class="data-card dc-mid">
                        <span class="dc-label">Peak G-Force</span>
                        <span class="dc-value">3.42G</span>
                        <div class="dc-bar-wrap">
                            <div class="dc-bar" style="width: 85%"></div>
                        </div>
                    </div>
                    <div class="data-card dc-bot">
                        <span class="dc-label">Peak Speed</span>
                        <span class="dc-value speed">46.1 km/h</span>
                        <span class="dc-sub">⚠ IMU estimated</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Bottom stat strip -->
        <div class="hero-stats">
            {#each [
                { value: '200Hz', label: 'IMU sampling rate' },
                { value: '<15ms', label: 'Live data latency' },
                { value: '£50k', label: 'Commercial equivalent' },
                { value: '£5–10', label: 'Per month' },
            ] as s}
                <div class="stat">
                    <span class="stat-val">{s.value}</span>
                    <span class="stat-lbl">{s.label}</span>
                </div>
            {/each}
        </div>
    </section>

    <!-- ── FEATURES — full width, dark ───────────────────────────────────── -->
    <section class="features" id="features">
        <div class="features-header">
            <div class="section-label">What you get</div>
            <h2 class="section-title">Everything. No tiers. No paywalls.</h2>
            <p class="section-sub">
                One price, full access. The same data at every level —
                simple views for young riders, full biomechanics for elite coaches.
            </p>
        </div>

        <div class="features-grid">
            {#each [
                {
                    icon: 'lightning',
                    title: 'UCI-Compliant Timing',
                    desc: 'Random delays, 632Hz light sequence, reaction time to the millisecond. The exact standard used in elite competition.'
                },
                {
                    icon: 'chart',
                    title: 'Biomechanical Analytics',
                    desc: 'G-force curves, speed integration, impulse analysis, power estimation, technique scoring. Previously a £50,000 system.'
                },
                {
                    icon: 'layers',
                    title: 'Layered for Every Rider',
                    desc: 'Simple headline numbers for a young rider. Full biomechanical breakdowns for elite athletes. Same data, different lens.'
                },
                {
                    icon: 'signal',
                    title: 'Live Dashboard',
                    desc: 'Real-time G-force, reaction and elapsed timer over WiFi every run. No cables. No latency.'
                },
                {
                    icon: 'trending',
                    title: 'Over-Time Trends',
                    desc: 'Consistency scoring, reaction trends, session comparison and statistical significance. Track real improvement.'
                },
                {
                    icon: 'wheel',
                    title: 'Pitch & Wheelie Detection',
                    desc: '200Hz orientation data reveals front wheel lift, peak pitch and drive phase technique. Coaching insights every run.'
                }
            ] as f, i}
                <div class="feature-card" style="animation-delay: {i * 100}ms">
                    <div class="f-icon-wrap">
                        {#if f.icon === 'lightning'}
                            <svg class="f-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"/>
                            </svg>
                        {:else if f.icon === 'chart'}
                            <svg class="f-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
                            </svg>
                        {:else if f.icon === 'layers'}
                            <svg class="f-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                            </svg>
                        {:else if f.icon === 'signal'}
                            <svg class="f-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"/>
                            </svg>
                        {:else if f.icon === 'trending'}
                            <svg class="f-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                            </svg>
                        {:else if f.icon === 'wheel'}
                            <svg class="f-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="12" cy="12" r="10" stroke-width="2"/>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2v20M2 12h20M6.34 6.34l11.32 11.32M17.66 6.34L6.34 17.66"/>
                            </svg>
                        {/if}
                    </div>
                    <h3 class="f-title">{f.title}</h3>
                    <p class="f-desc">{f.desc}</p>
                    <div class="f-glow"></div>
                </div>
            {/each}
        </div>
    </section>

    <!-- ── ANALYTICS STRIP — amber accent ────────────────────────────────── -->
    <section class="analytics-strip" id="analytics">
        <div class="strip-left">
            <div class="section-label light">The analytics</div>
            <h2 class="section-title light">Lab-grade data.<br/>Accessible price.</h2>
            <p class="section-sub light">
                AppGatePro computes the same analytics as commercial systems
                costing £10,000–£50,000. Every session. Every rider.
            </p>
            <ul class="check-list">
                {#each [
                    'Reaction time to ±1ms',
                    'Speed curve from IMU integration',
                    'Peak, average and end speed',
                    'Estimated power output (W)',
                    'Impulse & force distribution',
                    'Acceleration phase splits (0→10, 0→20… km/h)',
                    'Technique scoring (0–100)',
                    'Consistency CV across sessions',
                    'UCI age category tracking',
                    'Session comparison & trend analysis',
                ] as item, i}
                    <li class="check-item" style="animation-delay: {i * 50}ms">
                        <svg class="ci-check" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                        </svg>
                        <span>{item}</span>
                    </li>
                {/each}
            </ul>
        </div>

        <div class="strip-right">
            <!-- Mock analytics card -->
            <div class="mock-card">
                <div class="mock-header">
                    <span class="mock-title">Session · 8 Apr 2026</span>
                    <span class="mock-runs">5 runs</span>
                </div>

                <div class="mock-metrics">
                    {#each [
                        { label: 'Best Reaction', value: '0.142s', color: '#f5a623', icon: 'timer' },
                        { label: 'Avg Reaction',  value: '0.161s', color: '#f0ece4', icon: 'avg' },
                        { label: 'Peak Speed',    value: '46.1 km/h', color: '#ff6b3d', icon: 'speed' },
                        { label: 'Tech Score',    value: '82 / 100', color: '#3de8c8', icon: 'score' },
                    ] as m}
                        <div class="mock-metric">
                            <div class="mm-top">
                                <span class="mm-label">{m.label}</span>
                                <div class="mm-icon" style="color: {m.color}">
                                    {#if m.icon === 'timer'}
                                        <svg viewBox="0 0 16 16" fill="currentColor">
                                            <circle cx="8" cy="9" r="6" opacity="0.2"/>
                                            <path d="M8 3v6l3 3"/>
                                        </svg>
                                    {:else if m.icon === 'speed'}
                                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-width="1.5" d="M3 11a6 6 0 1110 0M8 8l2.5 2.5"/>
                                        </svg>
                                    {:else if m.icon === 'score'}
                                        <svg viewBox="0 0 16 16" fill="currentColor">
                                            <path d="M8 1l2 5h5l-4 3 1.5 5L8 11l-4.5 3L5 9 1 6h5z"/>
                                        </svg>
                                    {:else}
                                        <svg viewBox="0 0 16 16" fill="currentColor">
                                            <circle cx="8" cy="8" r="2"/>
                                            <circle cx="4" cy="8" r="1.5"/>
                                            <circle cx="12" cy="8" r="1.5"/>
                                        </svg>
                                    {/if}
                                </div>
                            </div>
                            <span class="mm-value" style="color: {m.color}">{m.value}</span>
                        </div>
                    {/each}
                </div>

                <!-- Consistency bar -->
                <div class="mock-consistency">
                    <div class="mc-header">
                        <span>Reaction consistency</span>
                        <span style="color: #3de8c8">Outstanding</span>
                    </div>
                    <div class="mc-track">
                        <div class="mc-fill" style="width: 94%"></div>
                    </div>
                    <span class="mc-cv">CV 1.8%</span>
                </div>

                <!-- Mini chart -->
                <div class="mock-chart">
                    {#each [18,42,78,115,158,178,172,148,118,88,62,42,28,18,12,8,5,4,3,3] as h, i}
                        <div class="mock-bar"
                             style="height:{h}px; opacity: {h > 80 ? 1 : 0.5};
                                    animation-delay:{i*30}ms"></div>
                    {/each}
                </div>
                <p class="mock-note">
                    <svg viewBox="0 0 16 16" fill="currentColor" style="width: 12px; height: 12px; display: inline; vertical-align: middle; margin-right: 4px;">
                        <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7 5h2v5H7V5zm0 6h2v2H7v-2z"/>
                    </svg>
                    Speed estimated from IMU · Bias: 0.098 m/s²
                </p>
            </div>
        </div>
    </section>

    <!-- ── PRICING — full width ───────────────────────────────────────────── -->
    <section class="pricing" id="pricing">
        <div class="pricing-header">
            <div class="section-label">Pricing</div>
            <h2 class="section-title">Simple. Honest. Affordable.</h2>
            <p class="section-sub">
                One plan. Full access. No data tiers, no paywalled analytics.
                Every rider gets the same data as an elite team.
            </p>
        </div>

        <div class="pricing-body">
            <div class="price-left">
                <div class="price-badge">
                    <svg viewBox="0 0 16 16" fill="currentColor" style="width: 14px; height: 14px;">
                        <path d="M8 0l2 5h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z"/>
                    </svg>
                    Beta Access
                </div>
                <div class="price-tag">
                    <span class="price-sym">£</span>
                    <span class="price-num">5–10</span>
                    <span class="price-mo">/month</span>
                </div>
                <p class="price-note">
                    Beta pricing · Final price confirmed once hosting costs are known
                </p>
                <a href="/auth/sign-up" class="btn-pricing">
                    Join the beta
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5-5 5M6 12h12"/>
                    </svg>
                </a>
                <div class="price-compare">
                    <div class="pc-item">
                        <span class="pc-label">Commercial alternatives</span>
                        <span class="pc-value">£10,000–£50,000</span>
                    </div>
                    <div class="pc-divider"></div>
                    <div class="pc-item">
                        <span class="pc-label">AppGatePro</span>
                        <span class="pc-value highlight">A fraction of the cost</span>
                    </div>
                </div>
            </div>

            <div class="price-right">
                <p class="price-includes">Everything included — no extras:</p>
                <div class="price-features">
                    {#each [
                        { text: 'Unlimited session uploads', badge: null },
                        { text: 'Full biomechanical analytics', badge: null },
                        { text: 'Over-time trend tracking', badge: null },
                        { text: 'Session comparison tools', badge: null },
                        { text: 'All rider levels supported', badge: null },
                        { text: 'UCI age category tracking', badge: null },
                        { text: 'Future updates included free', badge: null },
                        { text: 'Sprint & cadence modes', badge: 'Soon' },
                        { text: 'Leaderboard', badge: 'Soon' },
                        { text: 'Coach multi-rider view', badge: 'Soon' },
                    ] as f, i}
                        <div class="pf" style="animation-delay: {i * 40}ms">
                            <svg class="pf-tick" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                            </svg>
                            <span class="pf-text">{f.text}</span>
                            {#if f.badge}
                                <span class="pf-badge">{f.badge}</span>
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    </section>

    <!-- ── FOOTER ─────────────────────────────────────────────────────────── -->
    <footer class="footer">
        <div class="footer-top">
            <div class="footer-brand">
                <a href="/" class="fb-logo-link">
                    <img src="/logo-icon-dark.svg" alt="JNS" class="footer-logo" />
                    <div>
                        <p class="fb-name">AppGatePro</p>
                        <p class="fb-tag">by JNS Pro Systems</p>
                    </div>
                </a>
                <p class="fb-desc">
                    Making lab-grade BMX gate start analytics accessible to every rider and coach.
                </p>
            </div>

            <div class="footer-nav">
                <div class="fn-col">
                    <h4 class="fn-title">Product</h4>
                    <a href="#features" class="fn-link">Features</a>
                    <a href="#analytics" class="fn-link">Analytics</a>
                    <a href="#pricing" class="fn-link">Pricing</a>
                    <a href="/docs" class="fn-link">Documentation</a>
                </div>
                <div class="fn-col">
                    <h4 class="fn-title">Company</h4>
                    <a href="/about" class="fn-link">About</a>
                    <a href="/contact" class="fn-link">Contact</a>
                </div>
                <div class="fn-col">
                    <h4 class="fn-title">Legal</h4>
                    <a href="/privacy" class="fn-link">Privacy Policy</a>
                    <a href="/terms" class="fn-link">Terms of Service</a>
                </div>
            </div>
        </div>

        <div class="footer-bottom">
            <p class="footer-copy">© {new Date().getFullYear()} JNS Pro Systems. All rights reserved.</p>
            <div class="footer-badge">
                <svg viewBox="0 0 16 16" fill="currentColor" style="width: 12px; height: 12px;">
                    <path d="M8 1l2 4 4.5.5-3.5 3 1 4.5L8 11l-4 2 1-4.5-3.5-3L6 5z"/>
                </svg>
                <span>Beta</span>
            </div>
        </div>
    </footer>

</div>

<style>
    :global(body) { margin: 0; background: #080707; }

    .home {
        font-family: 'Barlow', system-ui, sans-serif;
        color: #f0ece4;
        background: #080707;
        overflow-x: hidden;
    }

    /* ── NAVBAR ── */
    .navbar {
        position: fixed;
        inset: 0 0 auto;
        z-index: 100;
        display: flex;
        align-items: center;
        padding: 0 2rem;
        height: 100px;
        background: rgba(8,7,7,0.9);
        backdrop-filter: blur(16px);
        border-bottom: 1px solid rgba(245,166,35,0.1);
    }

    .nav-logo {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        text-decoration: none;
    }

    .nav-links {
        display: flex;
        gap: 2rem;
        margin: 0 auto;
    }
    .nav-link {
        font-size: 0.875rem;
        font-weight: 500;
        color: #9a8f7a;
        text-decoration: none;
        transition: color 0.2s;
    }
    .nav-link:hover { color: #f0ece4; }

    .nav-actions { display: flex; gap: 0.75rem; align-items: center; }

    .btn-ghost {
        font-size: 0.875rem;
        font-weight: 600;
        color: #9a8f7a;
        text-decoration: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        transition: color 0.2s;
    }
    .btn-ghost:hover { color: #f0ece4; }

    .btn-amber {
        font-size: 0.875rem;
        font-weight: 700;
        color: #0a0809;
        background: #f5a623;
        text-decoration: none;
        padding: 0.5rem 1.25rem;
        border-radius: 6px;
        transition: background 0.2s;
        white-space: nowrap;
    }
    .btn-amber:hover { background: #c97e0a; }

    /* ── HERO — full bleed ── */
    .hero {
        position: relative;
        width: 100%;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        overflow: hidden;
        padding-top: 100px;
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
        object-position: center 20%;
        display: block;
    }
    .hero-img-scrim {
        position: absolute;
        inset: 0;
        background:
            linear-gradient(to right, rgba(8,7,7,0.92) 0%, rgba(8,7,7,0.65) 50%, rgba(8,7,7,0.3) 100%),
            linear-gradient(to top, rgba(8,7,7,0.8) 0%, transparent 40%);
    }

    .hero-grid {
        position: absolute;
        inset: 0;
        z-index: 1;
        background-image:
            linear-gradient(rgba(245,166,35,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(245,166,35,0.05) 1px, transparent 1px);
        background-size: 80px 80px;
        mask-image: linear-gradient(to right, black 0%, transparent 60%);
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
        gap: 4rem;
    }

    .hero-left { max-width: 600px; }

    .hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.75rem;
        font-weight: 600;
        color: #f5a623;
        background: rgba(245,166,35,0.08);
        border: 1px solid rgba(245,166,35,0.25);
        padding: 0.375rem 0.875rem;
        border-radius: 100px;
        letter-spacing: 0.04em;
        margin-bottom: 1.75rem;
    }

    .badge-dot {
        width: 6px;
        height: 6px;
        background: #f5a623;
        border-radius: 50%;
        animation: pulse 2s infinite;
    }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

    .hero-title {
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 900;
        font-size: clamp(3.5rem, 7vw, 6.5rem);
        line-height: 0.92;
        letter-spacing: -0.01em;
        margin: 0 0 1.75rem;
    }
    .t-white { display: block; color: #f0ece4; }
    .t-amber { display: block; color: #f5a623; }
    .t-italic { font-style: italic; }

    .hero-desc {
        font-size: 1.05rem;
        line-height: 1.7;
        color: #b0a898;
        max-width: 520px;
        margin: 0 0 2.25rem;
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
        font-size: 1rem;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: #0a0809;
        background: #f5a623;
        text-decoration: none;
        padding: 0.875rem 2rem;
        border-radius: 8px;
        transition: background 0.2s, transform 0.15s;
    }
    .btn-primary:hover { background: #c97e0a; transform: translateY(-1px); }

    .btn-outline {
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 700;
        font-size: 1rem;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: #f0ece4;
        text-decoration: none;
        padding: 0.875rem 1.5rem;
        border-radius: 8px;
        border: 1px solid rgba(240,236,228,0.25);
        transition: border-color 0.2s, color 0.2s;
    }
    .btn-outline:hover { border-color: #f5a623; color: #f5a623; }

    /* Floating data cards */
    .hero-right {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: flex-end;
    }

    .data-cluster {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        width: 220px;
    }

    .data-card {
        background: rgba(8,7,7,0.8);
        border: 1px solid rgba(245,166,35,0.2);
        backdrop-filter: blur(12px);
        border-radius: 12px;
        padding: 1rem 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        animation: floatCard 4s ease-in-out infinite;
    }

    .dc-top { animation-delay: 0s; }
    .dc-mid { animation-delay: 1.3s; }
    .dc-bot { animation-delay: 2.6s; }

    @keyframes floatCard {
        0%,100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
    }

    .dc-label {
        font-size: 0.65rem;
        color: #4a4038;
        text-transform: uppercase;
        letter-spacing: 0.08em;
    }
    .dc-value {
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 800;
        font-size: 1.6rem;
        color: #f5a623;
        line-height: 1;
    }
    .dc-value.speed { color: #ff6b3d; }
    .dc-sub { font-size: 0.65rem; color: #4a4038; }

    .dc-bar-wrap {
        width: 100%;
        height: 4px;
        background: #221c18;
        border-radius: 2px;
        margin-top: 0.25rem;
    }
    .dc-bar {
        height: 100%;
        background: linear-gradient(90deg, #f5a623, #ff6b3d);
        border-radius: 2px;
    }

    /* Hero stat strip */
    .hero-stats {
        position: relative;
        z-index: 2;
        display: flex;
        border-top: 1px solid rgba(245,166,35,0.1);
        background: rgba(8,7,7,0.7);
        backdrop-filter: blur(8px);
    }

    .stat {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1.25rem;
        border-right: 1px solid rgba(245,166,35,0.08);
    }
    .stat:last-child { border-right: none; }

    .stat-val {
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 800;
        font-size: 1.75rem;
        color: #f5a623;
        line-height: 1;
    }
    .stat-lbl {
        font-size: 0.72rem;
        color: #4a4038;
        margin-top: 0.25rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    /* ── FEATURES ── */
    .features {
        background: #0c0a09;
        padding: 5rem 4rem;
    }

    .features-header {
        margin-bottom: 3rem;
    }

    .section-label {
        font-size: 0.72rem;
        font-weight: 700;
        color: #f5a623;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        margin-bottom: 0.75rem;
    }
    .section-label.light { color: #0a0809; opacity: 0.6; }

    .section-title {
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 800;
        font-size: clamp(2rem, 3.5vw, 3rem);
        line-height: 1.05;
        color: #f0ece4;
        margin: 0 0 0.75rem;
    }
    .section-title.light { color: #0a0809; }

    .section-sub {
        font-size: 1rem;
        color: #9a8f7a;
        line-height: 1.65;
        max-width: 640px;
    }
    .section-sub.light { color: rgba(8,7,7,0.7); }

    .features-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1px;
        background: #221c18;
        border: 1px solid #221c18;
        border-radius: 12px;
        overflow: hidden;
    }

    .feature-card {
        position: relative;
        background: #131010;
        padding: 2rem;
        transition: all 0.3s ease;
        animation: fadeInUp 0.6s ease both;
        overflow: hidden;
    }
    .feature-card:hover { 
        background: #171210;
        transform: translateY(-4px);
    }
    .feature-card:hover .f-icon-wrap { transform: scale(1.1); }
    .feature-card:hover .f-glow { opacity: 1; }

    @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .f-icon-wrap {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(245,166,35,0.1);
        border-radius: 12px;
        margin-bottom: 1.25rem;
        transition: transform 0.3s ease;
    }

    .f-icon {
        width: 28px;
        height: 28px;
        color: #f5a623;
        stroke-width: 2;
    }

    .f-title {
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 700;
        font-size: 1.1rem;
        color: #f0ece4;
        margin: 0 0 0.6rem;
        letter-spacing: 0.02em;
    }
    .f-desc {
        font-size: 0.875rem;
        color: #9a8f7a;
        line-height: 1.65;
        margin: 0;
    }

    .f-glow {
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at top left, rgba(245,166,35,0.05), transparent 60%);
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
    }

    /* ── ANALYTICS STRIP — amber bg ── */
    .analytics-strip {
        display: flex;
        min-height: 600px;
        background: #f5a623;
    }

    .strip-left {
        flex: 1;
        padding: 5rem 4rem;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .check-list {
        list-style: none;
        padding: 0;
        margin: 1.5rem 0 0;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem 2rem;
    }

    .check-item {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: rgba(8,7,7,0.8);
        animation: slideIn 0.4s ease both;
    }

    @keyframes slideIn {
        from { opacity: 0; transform: translateX(-10px); }
        to { opacity: 1; transform: translateX(0); }
    }

    .ci-check {
        width: 18px;
        height: 18px;
        color: #0a0809;
        flex-shrink: 0;
        margin-top: 0.05rem;
    }

    .strip-right {
        flex: 1;
        background: #0a0809;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 4rem;
    }

    /* Mock card */
    .mock-card {
        width: 100%;
        max-width: 420px;
        background: #131010;
        border: 1px solid #221c18;
        border-radius: 16px;
        padding: 1.75rem;
    }

    .mock-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1.25rem;
    }
    .mock-title {
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 700;
        font-size: 1rem;
        color: #f0ece4;
    }
    .mock-runs {
        font-size: 0.75rem;
        color: #4a4038;
        background: #221c18;
        padding: 0.2rem 0.6rem;
        border-radius: 100px;
    }

    .mock-metrics {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
        margin-bottom: 1.25rem;
    }
    .mock-metric {
        background: #0a0809;
        border-radius: 8px;
        padding: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        border: 1px solid rgba(245,166,35,0.05);
        transition: border-color 0.2s ease;
    }
    .mock-metric:hover {
        border-color: rgba(245,166,35,0.15);
    }

    .mm-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .mm-label { 
        font-size: 0.65rem; 
        color: #4a4038; 
        text-transform: uppercase; 
        letter-spacing: 0.06em; 
    }

    .mm-icon {
        width: 16px;
        height: 16px;
        opacity: 0.6;
    }
    .mm-icon svg {
        width: 100%;
        height: 100%;
    }

    .mm-value {
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 700;
        font-size: 1.25rem;
    }

    .mock-consistency { margin-bottom: 1.25rem; }
    .mc-header {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        color: #9a8f7a;
        margin-bottom: 0.4rem;
    }
    .mc-track {
        width: 100%;
        height: 4px;
        background: #221c18;
        border-radius: 2px;
        margin-bottom: 0.25rem;
    }
    .mc-fill {
        height: 100%;
        background: #3de8c8;
        border-radius: 2px;
    }
    .mc-cv { font-size: 0.65rem; color: #4a4038; }

    .mock-chart {
        display: flex;
        align-items: flex-end;
        gap: 3px;
        height: 80px;
        margin-bottom: 0.75rem;
    }
    .mock-bar {
        flex: 1;
        background: #f5a623;
        border-radius: 2px 2px 0 0;
        animation: barUp 0.5s ease both;
        min-width: 3px;
    }
    @keyframes barUp {
        from { transform: scaleY(0); transform-origin: bottom; }
        to   { transform: scaleY(1); transform-origin: bottom; }
    }
    .mock-note { font-size: 0.65rem; color: #4a4038; margin: 0; }

    /* ── PRICING ── */
    .pricing {
        background: #080707;
        padding: 5rem 4rem;
        border-top: 1px solid #221c18;
    }

    .pricing-header {
        margin-bottom: 3rem;
    }

    .pricing-body {
        display: flex;
        gap: 6rem;
        align-items: flex-start;
        background: #131010;
        border: 1px solid rgba(245,166,35,0.15);
        border-radius: 16px;
        padding: 3.5rem 4rem;
    }

    .price-left { flex-shrink: 0; }

    .price-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.7rem;
        font-weight: 700;
        color: #f5a623;
        background: rgba(245,166,35,0.1);
        border: 1px solid rgba(245,166,35,0.2);
        padding: 0.35rem 0.75rem;
        border-radius: 100px;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        margin-bottom: 1.5rem;
    }

    .price-tag {
        display: flex;
        align-items: baseline;
        gap: 0.25rem;
        margin-bottom: 0.5rem;
    }
    .price-sym {
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 700;
        font-size: 2rem;
        color: #f5a623;
    }
    .price-num {
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 900;
        font-size: 5rem;
        color: #f5a623;
        line-height: 1;
    }
    .price-mo { font-size: 1.1rem; color: #9a8f7a; }

    .price-note { 
        font-size: 0.8rem; 
        color: #4a4038; 
        margin: 0 0 1.5rem; 
        max-width: 280px; 
        line-height: 1.5; 
    }

    .btn-pricing {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 700;
        font-size: 1rem;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: #0a0809;
        background: #f5a623;
        text-decoration: none;
        padding: 0.875rem 2rem;
        border-radius: 8px;
        transition: all 0.2s ease;
        margin-bottom: 2rem;
    }
    .btn-pricing:hover { 
        background: #c97e0a; 
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(245,166,35,0.3);
    }

    .price-compare {
        background: #0a0809;
        border: 1px solid rgba(245,166,35,0.1);
        border-radius: 8px;
        padding: 1rem;
        max-width: 280px;
    }

    .pc-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .pc-label {
        font-size: 0.7rem;
        color: #4a4038;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .pc-value {
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 700;
        font-size: 0.95rem;
        color: #9a8f7a;
    }

    .pc-value.highlight {
        color: #f5a623;
        font-size: 1.05rem;
    }

    .pc-divider {
        height: 1px;
        background: rgba(245,166,35,0.1);
        margin: 0.75rem 0;
    }

    .price-right { flex: 1; }
    .price-includes {
        font-size: 0.75rem;
        font-weight: 700;
        color: #9a8f7a;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin: 0 0 1rem;
    }
    .price-features {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.6rem;
    }
    .pf {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: #9a8f7a;
        animation: fadeIn 0.4s ease both;
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    .pf-tick { 
        width: 18px;
        height: 18px;
        color: #3de8c8; 
        flex-shrink: 0; 
    }

    .pf-text {
        flex: 1;
    }

    .pf-badge {
        font-size: 0.65rem;
        font-weight: 700;
        color: #f5a623;
        background: rgba(245,166,35,0.1);
        border: 1px solid rgba(245,166,35,0.2);
        padding: 0.15rem 0.5rem;
        border-radius: 100px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    /* ── FOOTER ── */
    .footer {
        background: #080707;
        border-top: 1px solid #221c18;
        padding: 3rem 4rem 2rem;
    }

    .footer-top {
        display: grid;
        grid-template-columns: 1.5fr 1fr;
        gap: 4rem;
        margin-bottom: 2.5rem;
        padding-bottom: 2.5rem;
        border-bottom: 1px solid rgba(245,166,35,0.08);
    }

    .footer-brand {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .fb-logo-link {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        text-decoration: none;
        width: fit-content;
    }

    .fb-logo-link :global(.footer-logo) { 
        width: 32px; 
        height: 32px; 
        object-fit: contain; 
        opacity: 0.8;
        transition: opacity 0.2s;
    }
    .fb-logo-link:hover :global(.footer-logo) { opacity: 1; }

    .fb-name {
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 800;
        font-size: 1rem;
        color: #f5a623;
        margin: 0;
        letter-spacing: 0.02em;
    }
    .fb-tag { 
        font-size: 0.7rem; 
        color: #4a4038; 
        margin: 0; 
    }

    .fb-desc {
        font-size: 0.875rem;
        color: #6a5f4f;
        line-height: 1.6;
        max-width: 400px;
        margin: 0;
    }

    .footer-nav {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 2rem;
    }

    .fn-col {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .fn-title {
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 700;
        font-size: 0.8rem;
        color: #9a8f7a;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin: 0 0 0.25rem;
    }

    .fn-link {
        font-size: 0.875rem;
        color: #6a5f4f;
        text-decoration: none;
        transition: color 0.2s;
        width: fit-content;
    }
    .fn-link:hover { color: #f5a623; }

    .footer-bottom {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .footer-copy {
        font-size: 0.75rem;
        color: #4a4038;
        margin: 0;
    }

    .footer-badge {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.7rem;
        font-weight: 700;
        color: #f5a623;
        background: rgba(245,166,35,0.05);
        border: 1px solid rgba(245,166,35,0.15);
        padding: 0.3rem 0.7rem;
        border-radius: 100px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    /* ── RESPONSIVE ── */
    @media (max-width: 1024px) {
        .hero-right { display: none; }
        .analytics-strip { flex-direction: column; }
        .strip-right { padding: 3rem 2rem; }
        .pricing-body { flex-direction: column; gap: 2.5rem; padding: 2.5rem 2rem; }
        .price-features { grid-template-columns: 1fr; }
    }

    @media (max-width: 768px) {
        .navbar { padding: 0 1rem; }
        .nav-links { display: none; }
        .hero-content { padding: 3rem 1.5rem 2rem; }
        .hero-stats .stat-lbl { display: none; }
        .features { padding: 3.5rem 1.5rem; }
        .features-grid { grid-template-columns: 1fr 1fr; }
        .strip-left { padding: 3rem 1.5rem; }
        .check-list { grid-template-columns: 1fr; }
        .pricing { padding: 3.5rem 1.5rem; }
        .footer { padding: 2rem 1.5rem 1.5rem; }
        .footer-top { 
            grid-template-columns: 1fr;
            gap: 2rem;
        }
        .footer-nav {
            grid-template-columns: repeat(3, 1fr);
            gap: 1.5rem;
        }
    }

    @media (max-width: 480px) {
        .features-grid { grid-template-columns: 1fr; }
        .hero-title { font-size: 3rem; }
        .footer-nav { grid-template-columns: 1fr; }
        .footer-bottom { 
            flex-direction: column; 
            gap: 1rem; 
            align-items: flex-start;
        }
    }
</style>

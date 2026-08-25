<script lang="ts">
	import { fade } from 'svelte/transition';

	let expandedFaq = $state<string | null>(null);

	function toggleFaq(id: string) {
		expandedFaq = expandedFaq === id ? null : id;
	}

	const faqs = [
		{
			id: 'upload',
			category: 'Getting Started',
			question: 'How do I upload my first session?',
			answer:
				'If direct Wi-Fi upload is enabled on your AppGatePro hardware, the saved session can be sent straight to your account without keeping this page open. The Upload page is the manual fallback: select the JSON session file from the SD card and import it there. If the same source session was already sent over Wi-Fi, AppGatePro will point you to the existing session instead of creating a duplicate.'
		},
		{
			id: 'bike',
			category: 'Getting Started',
			question: 'Do I need to set up my bike first?',
			answer:
				'No. A recorded session can still be imported without a complete rider or bike profile. Rider mass and bike mass are needed for some derived power and biomechanical context, and linking the correct bike also makes setup comparisons meaningful. Complete Profile when convenient rather than delaying the sensor evidence.'
		},
		{
			id: 'speed-blocked',
			category: 'Troubleshooting',
			question: 'Why are my speed metrics showing as blocked?',
			answer:
				'Speed is derived from the motion trace and is only shown when the underlying evidence passes the speed-validity checks. If a session shows a calibration or evidence-quality warning, review that warning before interpreting speed. Invalid speed evidence is omitted rather than replaced with a convenient number.'
		},
		{
			id: 'power-blocked',
			category: 'Troubleshooting',
			question: "Why can't I see power metrics?",
			answer:
				'AppGatePro power is a derived estimate from the recorded motion physics, not power-meter data. It needs usable motion evidence plus the rider and bike mass linked to that session. Add your rider weight and bike weight in Profile so future sessions can carry the required mass context.'
		},
		{
			id: 'reaction-time',
			category: 'Understanding Metrics',
			question: 'What is a good reaction time?',
			answer:
				'There is no single useful number for every rider. Start with your own eligible history: is your best evidence improving, and are you becoming more repeatable? The Compare page can add peer context when a sufficiently large cohort exists, and it shows the cohort and sample size used rather than treating a fixed band as universal truth.'
		},
		{
			id: 'max-g',
			category: 'Understanding Metrics',
			question: 'What does Max G-Force mean?',
			answer:
				'Max G is the highest acceleration force recorded during the gate-start evidence window. A higher peak can indicate a more explosive acceleration event, but it should be interpreted with timing, technique, data quality and like-for-like sessions rather than as a standalone score.'
		},
		{
			id: 'consistency',
			category: 'Understanding Metrics',
			question: 'How is consistency calculated?',
			answer:
				'Within-session reaction consistency uses coefficient of variation (CV%): standard deviation divided by the mean, expressed as a percentage. Lower means the eligible reaction times cluster more tightly. The session list currently describes CV below 2% as very repeatable, below 5% as consistent, and 5% or above as variable.'
		},
		{
			id: 'technique-score',
			category: 'Understanding Metrics',
			question: 'What are technique scores?',
			answer:
				'Technique scores are composite 0–100 indicators built from recorded evidence. The detailed view uses six dimensions: launch quality, explosiveness, speed carry, smoothness, impulse timing and repeatability. They are supporting diagnostics, not direct measurements or a substitute for the underlying traces.'
		},
		{
			id: 'goals',
			category: 'Features',
			question: 'How do training goals work?',
			answer:
				'Goals track the best eligible evidence toward a target from the point the goal is created. If evidence is later excluded, the goal projection can reverse accordingly. Closing a goal records a finish date; it does not by itself claim the target was achieved, and completed goals freeze at the evidence available at closure.'
		},
		{
			id: 'reports',
			category: 'Features',
			question: 'Can I generate reports to share?',
			answer:
				'Yes. Session pages can generate Session, Progress, Diagnostic, or Rider / Parent reports, with Simple, Standard, Coach, or Technical audience detail. Reports can include charts, data-quality notes, goals and a technical appendix where available. A linked coach only receives a report when you explicitly send it.'
		},
		{
			id: 'analytics-depth',
			category: 'Features',
			question: 'What do the analytics unlock thresholds mean?',
			answer:
				'Longitudinal analysis becomes more useful as genuine session history accumulates. With 0–2 sessions the Progress page focuses on building a baseline; from 3 sessions it can offer a progress report and more trend context; at 10+ sessions the fuller advanced view is available. Missing or invalid evidence can still limit an individual metric regardless of session count.'
		},
		{
			id: 'leaderboard',
			category: 'Features',
			question: 'How does Compare and competitive ranking work?',
			answer:
				'Compare has two separate layers. Peer benchmarking compares your best eligible evidence with an aggregate cohort when there are enough riders to support it; this does not require competitive opt-in. Competitive ranking is optional, uses all-time best eligible evidence, and is only shown when the selected competitive cohort has enough opted-in riders. Your full sessions are not published in the ranking.'
		},
		{
			id: 'data-quality',
			category: 'Troubleshooting',
			question: 'What do the data quality messages mean?',
			answer:
				'Data-quality and calibration messages describe whether the recorded evidence is suitable for particular derived diagnostics. They are not a judgement on the rider. When evidence is not trustworthy enough for a metric, AppGatePro prefers to omit or qualify that result rather than silently substitute a value.'
		},
		{
			id: 'csv-format',
			category: 'Data & Upload',
			question: 'What file format is required for manual upload?',
			answer:
				'The manual SD-card fallback accepts the JSON session file produced by AppGatePro hardware. The file contains the recorded session and run evidence used by the same canonical ingest path as direct Wi-Fi upload. If the file is incomplete, corrupted, invalid, or already imported, the Upload page will explain that rather than creating a second session.'
		},
		{
			id: 'multiple-runs',
			category: 'Data & Upload',
			question: 'Can one session contain multiple runs?',
			answer:
				'Yes. A saved AppGatePro session can contain multiple recorded runs and they are imported together into one session. Runs you later tag as warm-up, experimental, competition, or excluded remain in the historical record while the relevant exclusions are kept out of normal performance statistics.'
		},
		{
			id: 'delete-session',
			category: 'Data & Upload',
			question: 'Can I delete a session if I uploaded it by mistake?',
			answer:
				'Yes. Open Sessions and use the delete control on the session card, then confirm the deletion. Removing a session also reconciles derived snapshots and goal evidence so a deleted PB does not continue to influence the rest of the product.'
		},
		{
			id: 'export',
			category: 'Data & Upload',
			question: 'Can I export my data?',
			answer:
				'Yes. The Sessions page can export the currently loaded session summaries as CSV. Generated reports also provide print/export actions appropriate to the report view. Exported summaries are useful for your own analysis or backup, but they are not a replacement for the original AppGatePro source files.'
		},
		{
			id: 'mobile',
			category: 'Platform & Access',
			question: 'Does this work on mobile?',
			answer:
				'Yes. The rider, coach and admin workspaces are responsive, and the session run selector supports mobile interaction. Dense charts and tables may still be easier to inspect on a larger screen, but core review and session workflows are designed to remain usable trackside.'
		},
		{
			id: 'offline',
			category: 'Platform & Access',
			question: 'Can I use this offline?',
			answer:
				'No supported offline mode is currently provided. Upload, authentication and server-backed analysis require an internet connection. Direct device upload uses Wi-Fi when enabled on the hardware; SD-card files can be retained and uploaded later when a connection is available.'
		},
		{
			id: 'privacy',
			category: 'Platform & Access',
			question: 'Who can see my data?',
			answer:
				'Your full session and run history is private by default. Competitive ranking is opt-in and exposes ranking evidence rather than full sessions. An approved coach relationship has its own explicit sharing boundary: the coach can see the onboarding reference, goals, the shared conversation/flags and reports you choose to send, but does not automatically receive your raw session/run history.'
		},
		{
			id: 'support',
			category: 'Help & Support',
			question: 'How do I get help or report a bug?',
			answer:
				'Email support@jnsprosystems.com or use the Contact form. For a data issue, include the affected session and what you expected to see; screenshots can help. You can also use the in-app feedback control to report a bug or request a feature.'
		},
		{
			id: 'account',
			category: 'Help & Support',
			question: 'How do I update my account details?',
			answer:
				'Use Profile for rider details and bike setup, and Settings for account preferences. Profile changes can provide context for future session snapshots and derived analysis; they do not rewrite the sensor evidence that was originally recorded.'
		}
	];

	const categories = [...new Set(faqs.map((f) => f.category))];
</script>

<svelte:head>
	<title>Help & FAQ — AppGatePro Analytics</title>
</svelte:head>

<div class="px-4 py-8 sm:px-6 lg:px-8">
	<!-- Header -->
	<div class="mb-8">
		<div class="mb-2 flex items-center gap-3">
			<div class="themed-bg-accent flex h-10 w-10 items-center justify-center rounded-lg">
				<svg class="themed-accent h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			</div>
			<div>
				<h1 class="themed-text-primary text-2xl font-bold">Help & FAQ</h1>
				<p class="themed-text-secondary text-sm">Quick answers to common questions</p>
			</div>
		</div>
	</div>

	<!-- Quick Actions -->
	<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
		<a
			href="/upload"
			class="group rounded-xl border border-[#221c18] bg-[#131010] p-4 transition-colors hover:border-[#f5a623]/40"
		>
			<div class="flex items-center gap-3">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5a623]/10 transition-colors group-hover:bg-[#f5a623]/20"
				>
					<svg class="h-5 w-5 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
						/>
					</svg>
				</div>
				<div>
					<p
						class="text-sm font-semibold text-[#f0ece4] transition-colors group-hover:text-[#f5a623]"
					>
						Upload Session
					</p>
					<p class="text-xs text-[#6b5f4d]">Start analyzing</p>
				</div>
			</div>
		</a>

		<a
			href="/docs"
			class="group rounded-xl border border-[#221c18] bg-[#131010] p-4 transition-colors hover:border-[#f5a623]/40"
		>
			<div class="flex items-center gap-3">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5a623]/10 transition-colors group-hover:bg-[#f5a623]/20"
				>
					<svg class="h-5 w-5 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
						/>
					</svg>
				</div>
				<div>
					<p
						class="text-sm font-semibold text-[#f0ece4] transition-colors group-hover:text-[#f5a623]"
					>
						User Guide
					</p>
					<p class="text-xs text-[#6b5f4d]">Full documentation</p>
				</div>
			</div>
		</a>

		<a
			href="mailto:support@jnsprosystems.com"
			class="group rounded-xl border border-[#221c18] bg-[#131010] p-4 transition-colors hover:border-[#f5a623]/40"
		>
			<div class="flex items-center gap-3">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5a623]/10 transition-colors group-hover:bg-[#f5a623]/20"
				>
					<svg class="h-5 w-5 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
						/>
					</svg>
				</div>
				<div>
					<p
						class="text-sm font-semibold text-[#f0ece4] transition-colors group-hover:text-[#f5a623]"
					>
						Contact Support
					</p>
					<p class="text-xs text-[#6b5f4d]">Get personal help</p>
				</div>
			</div>
		</a>
	</div>

	<!-- FAQ Categories -->
	{#each categories as category}
		<div class="mb-6">
			<h2 class="mb-3 flex items-center gap-2 text-base font-bold text-[#f5a623]">
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
					/>
				</svg>
				{category}
			</h2>

			<div class="space-y-2">
				{#each faqs.filter((f) => f.category === category) as faq}
					<div class="overflow-hidden rounded-lg border border-[#221c18] bg-[#131010]">
						<button
							onclick={() => toggleFaq(faq.id)}
							class="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-[#171210]
                                   focus:ring-2 focus:ring-[#f5a623] focus:outline-none focus:ring-inset"
						>
							<span class="text-sm font-medium text-[#f0ece4]">{faq.question}</span>
							<svg
								class="h-5 w-5 flex-shrink-0 text-[#6b5f4d] transition-transform {expandedFaq ===
								faq.id
									? 'rotate-180'
									: ''}"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 9l-7 7-7-7"
								/>
							</svg>
						</button>

						{#if expandedFaq === faq.id}
							<div class="px-5 pt-1 pb-4" transition:fade={{ duration: 200 }}>
								<p class="text-sm leading-relaxed text-[#9a8f7a]">{faq.answer}</p>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/each}

	<!-- Still Need Help -->
	<div class="mt-8 rounded-xl border border-[#f5a623]/20 bg-[#131010] p-6">
		<div class="flex items-start gap-4">
			<div
				class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[#f5a623]/10"
			>
				<svg class="h-6 w-6 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
					/>
				</svg>
			</div>
			<div class="flex-1">
				<h3 class="mb-2 text-base font-bold text-[#f0ece4]">Still need help?</h3>
				<p class="mb-4 text-sm text-[#9a8f7a]">
					Can't find what you're looking for? Our support team is here to help.
				</p>
				<div class="flex flex-wrap gap-3">
					<a
						href="mailto:support@jnsprosystems.com"
						class="inline-flex items-center gap-2 rounded-lg bg-[#f5a623] px-4 py-2 text-sm
                              font-semibold text-[#0a0809] transition-colors hover:bg-[#c97e0a]
                              focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[color:var(--theme-surface)] focus:outline-none"
					>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
							/>
						</svg>
						Email Support
					</a>
					<a
						href="/docs"
						class="inline-flex items-center gap-2 rounded-lg border border-[#221c18] bg-[#131010] px-4 py-2
                              text-sm font-medium text-[#f0ece4] transition-colors hover:border-[#f5a623]/40
                              focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[color:var(--theme-surface)] focus:outline-none"
					>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
							/>
						</svg>
						Read Full Guide
					</a>
				</div>
			</div>
		</div>
	</div>
</div>
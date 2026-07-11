<script lang="ts">
	import type { ShareableAchievement } from '$lib/social/types';
	import { getWeatherMeta, getSurfaceMeta } from '$lib/types/sessionContext';

	interface Props {
		achievement: ShareableAchievement;
		backgroundImageUrl?: string | null;
		profileIconUrl?: string | null;
		showProfileIcon?: boolean;
		showBackgroundImage?: boolean;
		cardRef?: HTMLElement | null;
	}

	let {
		achievement,
		backgroundImageUrl = null,
		profileIconUrl = null,
		showProfileIcon = true,
		showBackgroundImage = true,
		cardRef = $bindable(null)
	}: Props = $props();

	// All derived from reactive prop — $derived prevents Svelte 5 state_referenced_locally warnings
	const HEADLINES: Record<string, { big: string; sub: string }> = {
		pb: { big: 'NEW PERSONAL\nBEST', sub: 'All-time record broken' },
		'condition-pb': { big: 'CONDITION\nBEST', sub: 'Personal best for these conditions' },
		milestone: { big: 'GOAL\nMILESTONE', sub: 'Target in sight' },
		consistency: { big: 'LOCKED\nIN', sub: 'Most consistent session' },
		resilience: { big: 'SOLID\nUNDER\nPRESSURE', sub: 'Performed when it counted' },
		progression: { big: 'MOVING\nFORWARD', sub: 'Progress confirmed' },
		trend: { big: 'TRENDING\nUP', sub: 'Sustained improvement' }
	};

	const BADGE_LABELS: Record<string, string> = {
		pb: 'NEW PB',
		'condition-pb': 'COND. PB',
		milestone: 'MILESTONE',
		consistency: 'CONSISTENT',
		resilience: 'RESILIENT',
		progression: 'IMPROVING',
		trend: 'TRENDING'
	};

	const TAGLINES: Record<string, string[]> = {
		pb: ['Every session.', 'Every condition.', 'Every step forward.'],
		'condition-pb': ['Different conditions.', 'Same commitment.', 'Better every time.'],
		milestone: ['Set the goal.', 'Do the work.', 'Hit the target.'],
		consistency: ['Not just fast.', 'Consistently fast.', "That's the difference."],
		resilience: ["Doesn't matter", 'how it feels.', 'The data speaks.'],
		progression: ["Progress isn't always", 'visible. Until it is.'],
		trend: ['Compounding.', 'Every session.', 'Every rep.']
	};

	let metric = $derived(achievement.metric);
	let ctx = $derived(achievement.context);
	let weatherMeta = $derived(
		ctx.weatherCondition ? getWeatherMeta(ctx.weatherCondition as any) : null
	);
	let surfaceMeta = $derived(ctx.trackSurface ? getSurfaceMeta(ctx.trackSurface as any) : null);
	let headline = $derived(
		HEADLINES[achievement.type] ?? {
			big: achievement.title.toUpperCase(),
			sub: achievement.subtitle
		}
	);
	let hasDelta = $derived(metric.improvementDisplay !== undefined);
	let isLowerBetter = $derived(
		achievement.type === 'pb' && metric.label.toLowerCase().includes('reaction')
	);
	let showConditions = $derived(
		ctx.weatherCondition !== null || ctx.trackSurface !== null || ctx.rideFeel !== null
	);
	let badgeLabel = $derived(BADGE_LABELS[achievement.type] ?? 'ACHIEVEMENT');
	let taglines = $derived(TAGLINES[achievement.type] ?? ['Every session.', 'Every step forward.']);
	let dateDisplay = $derived(
		new Date(achievement.sessionDate).toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		})
	);
</script>

<!--
    SocialCard — 1200×630px, dark navy/cyan/white palette
    Designed for screenshot/download — not for functional UI interaction.
    Self-contained: no external CSS dependencies.
-->
<div
	bind:this={cardRef}
	style="width:1200px;height:630px;position:relative;overflow:hidden;background:#060d1a;"
>
	<!-- ── Background image layer ───────────────────────────────────────── -->
	{#if backgroundImageUrl && showBackgroundImage}
		<div
			style="
            position:absolute;inset:0;
            background:url({backgroundImageUrl}) center/cover no-repeat;
            opacity:0.18;
        "
		></div>
	{/if}

	<!-- ── Gradient overlays ─────────────────────────────────────────────── -->
	<div
		style="position:absolute;inset:0;background:linear-gradient(105deg,#060d1a 38%,rgba(6,13,26,0.82) 58%,rgba(6,13,26,0.55) 100%);z-index:1;"
	></div>
	<div
		style="position:absolute;bottom:0;left:0;right:0;height:120px;background:linear-gradient(to top,#060d1a,transparent);z-index:1;"
	></div>
	<!-- Cyan accent stripe — top edge -->
	<div
		style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#00e5ff,#00b4d8,transparent);z-index:10;"
	></div>

	<!-- ── LEFT PANEL (0–580px) ──────────────────────────────────────────── -->
	<div
		style="position:absolute;top:0;left:0;width:580px;height:630px;z-index:2;padding:36px 40px 0;"
	>
		<!-- Logo -->
		<div style="display:flex;align-items:center;gap:10px;margin-bottom:28px;">
			<svg width="32" height="32" viewBox="0 0 32 32" fill="none">
				<rect width="32" height="32" rx="6" fill="#00e5ff" fill-opacity="0.15" />
				<path
					d="M6 16 L10 10 L14 18 L18 8 L22 16 L26 12"
					stroke="#00e5ff"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					fill="none"
				/>
			</svg>
			<div>
				<div
					style="color:#00e5ff;font-family:Impact,sans-serif;font-size:18px;letter-spacing:4px;line-height:1;"
				>
					APPGATEPRO
				</div>
				<div
					style="font-size:10px;letter-spacing:5px;color:rgba(255,255,255,0.4);font-family:sans-serif;font-weight:600;"
				>
					BMX ANALYTICS
				</div>
			</div>
		</div>

		<!-- Achievement headline -->
		<div style="margin-bottom:16px;">
			{#each headline.big.split('\n') as line, i}
				<div
					style="
                    font-family:Impact,sans-serif;
                    font-size:{headline.big.split('\n').length === 1 ? 88 : 76}px;
                    line-height:0.92;
                    letter-spacing:2px;
                    color:{i === headline.big.split('\n').length - 1 ? '#00e5ff' : '#ffffff'};
                    text-shadow:{i === headline.big.split('\n').length - 1
						? '0 0 40px rgba(0,229,255,0.4)'
						: 'none'};
                "
				>
					{line}
				</div>
			{/each}
		</div>

		<!-- Taglines -->
		<div style="margin-bottom:24px;">
			{#each taglines as line}
				<div
					style="font-family:sans-serif;font-size:13px;font-style:italic;color:rgba(255,255,255,0.55);letter-spacing:0.5px;line-height:1.8;"
				>
					{line}
				</div>
			{/each}
			{#if achievement.type === 'pb' || achievement.type === 'condition-pb'}
				<div
					style="font-family:sans-serif;font-size:12px;font-style:italic;color:#00e5ff;letter-spacing:1px;margin-top:4px;"
				>
					#ProgressNotPerfection
				</div>
			{/if}
		</div>

		<!-- Metric box -->
		<div
			style="
            background:rgba(255,255,255,0.05);
            border:1px solid rgba(0,229,255,0.25);
            border-radius:12px;
            padding:18px 20px;
            display:flex;
            align-items:center;
            gap:16px;
            position:relative;
            overflow:hidden;
        "
		>
			<!-- Subtle cyan glow -->
			<div
				style="position:absolute;top:-20px;right:-20px;width:80px;height:80px;background:radial-gradient(circle,rgba(0,229,255,0.15),transparent);border-radius:50%;"
			></div>

			<!-- Icon -->
			<div
				style="
                width:48px;height:48px;
                border:2px solid rgba(0,229,255,0.4);
                border-radius:50%;
                display:flex;align-items:center;justify-content:center;
                flex-shrink:0;
            "
			>
				<div style="font-size:22px;">
					{metric.label.toLowerCase().includes('reaction')
						? '⏱'
						: metric.label.toLowerCase().includes('speed')
							? '🚀'
							: metric.label.toLowerCase().includes('g-force') ||
								  metric.label.toLowerCase().includes('g force')
								? '💥'
								: metric.label.toLowerCase().includes('consistency')
									? '🎯'
									: '⭐'}
				</div>
			</div>

			<!-- Metric data -->
			<div style="flex:1;">
				<div
					style="font-family:sans-serif;font-size:11px;letter-spacing:2px;color:rgba(255,255,255,0.5);font-weight:700;text-transform:uppercase;margin-bottom:4px;"
				>
					{metric.label}
				</div>
				<div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;">
					<span
						style="font-size:44px;font-family:Impact,sans-serif;color:#00e5ff;letter-spacing:1px;line-height:1;"
						>{metric.value}</span
					>
					<span style="font-size:20px;font-family:Impact,sans-serif;color:rgba(0,229,255,0.7);"
						>{metric.unit}</span
					>
					{#if hasDelta && metric.improvementDisplay}
						<span style="font-family:sans-serif;font-size:14px;font-weight:700;color:#4ade80;">
							{isLowerBetter ? '↓' : '↑'}
							{metric.improvementDisplay}
						</span>
					{/if}
				</div>
				{#if metric.previousValue}
					<div
						style="font-family:sans-serif;font-size:11px;color:rgba(255,255,255,0.35);letter-spacing:1px;margin-top:2px;text-transform:uppercase;"
					>
						Previous: {metric.label.toLowerCase().includes('reaction')
							? (metric.previousValue / 1000).toFixed(3) + 's'
							: metric.label.toLowerCase().includes('speed')
								? (metric.previousValue * 3.6).toFixed(1) + ' km/h'
								: metric.previousValue.toFixed(2)}
					</div>
				{/if}
			</div>

			<!-- Badge -->
			<div
				style="
                background:linear-gradient(135deg,#00e5ff,#00b4d8);
                border-radius:8px;
                padding:10px 14px;
                text-align:center;
                flex-shrink:0;
            "
			>
				<div
					style="font-size:9px;font-family:sans-serif;font-weight:800;letter-spacing:1.5px;color:#060d1a;"
				>
					NEW
				</div>
				<div
					style="font-size:14px;font-family:Impact,sans-serif;color:#060d1a;letter-spacing:1px;line-height:1.1;"
				>
					{badgeLabel}
				</div>
			</div>
		</div>

		<!-- Context line -->
		{#if achievement.contextLine}
			<div
				style="
                margin-top:14px;
                font-family:sans-serif;
                font-size:12px;
                font-style:italic;
                color:rgba(255,255,255,0.45);
                letter-spacing:0.3px;
            "
			>
				{achievement.contextLine}
			</div>
		{/if}
	</div>

	<!-- ── DIVIDER LINE ──────────────────────────────────────────────────── -->
	<div
		style="position:absolute;top:36px;left:600px;bottom:80px;width:1px;background:linear-gradient(to bottom,transparent,rgba(0,229,255,0.2) 20%,rgba(0,229,255,0.2) 80%,transparent);z-index:2;"
	></div>

	<!-- ── RIGHT PANEL (620px–1160px) ───────────────────────────────────── -->
	<div
		style="position:absolute;top:0;left:620px;width:540px;height:630px;z-index:2;padding:36px 40px 0 20px;display:flex;flex-direction:column;gap:14px;"
	>
		<!-- CONDITIONS panel -->
		{#if showConditions}
			<div
				style="
                background:rgba(255,255,255,0.04);
                border:1px solid rgba(255,255,255,0.08);
                border-radius:10px;
                padding:14px 16px;
            "
			>
				<div
					style="font-family:sans-serif;font-size:10px;letter-spacing:3px;color:rgba(255,255,255,0.35);font-weight:700;text-transform:uppercase;margin-bottom:10px;"
				>
					Conditions
				</div>
				<div style="display:flex;gap:20px;align-items:flex-start;">
					{#if weatherMeta}
						<div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
							<span style="font-size:22px;">{weatherMeta.icon}</span>
							<span
								style="font-family:sans-serif;font-size:9px;letter-spacing:1px;color:rgba(255,255,255,0.35);text-transform:uppercase;"
								>Weather</span
							>
							<span
								style="font-family:sans-serif;font-size:12px;font-weight:600;color:rgba(255,255,255,0.8);"
								>{weatherMeta.label}</span
							>
						</div>
						<div style="width:1px;background:rgba(255,255,255,0.08);align-self:stretch;"></div>
					{/if}
					{#if surfaceMeta}
						<div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
							<span style="font-size:22px;">{surfaceMeta.icon}</span>
							<span
								style="font-family:sans-serif;font-size:9px;letter-spacing:1px;color:rgba(255,255,255,0.35);text-transform:uppercase;"
								>Surface</span
							>
							<span
								style="font-family:sans-serif;font-size:12px;font-weight:600;color:rgba(255,255,255,0.8);"
								>{surfaceMeta.label}</span
							>
						</div>
					{/if}
					{#if ctx.rideFeel}
						{#if weatherMeta || surfaceMeta}<div
								style="width:1px;background:rgba(255,255,255,0.08);align-self:stretch;"
							></div>{/if}
						<div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
							<span style="font-size:22px;">
								{ctx.rideFeel === 'peak'
									? '🔥'
									: ctx.rideFeel === 'dialled'
										? '🎯'
										: ctx.rideFeel === 'good'
											? '💪'
											: ctx.rideFeel === 'solid'
												? '👍'
												: '😔'}
							</span>
							<span
								style="font-family:sans-serif;font-size:9px;letter-spacing:1px;color:rgba(255,255,255,0.35);text-transform:uppercase;"
								>Readiness</span
							>
							<span
								style="font-family:sans-serif;font-size:12px;font-weight:600;color:rgba(255,255,255,0.8);"
							>
								{ctx.rideFeel === 'peak'
									? 'Peak'
									: ctx.rideFeel === 'dialled'
										? 'Dialled'
										: ctx.rideFeel === 'good'
											? 'Good'
											: ctx.rideFeel === 'solid'
												? 'Solid'
												: 'Off Day'}
							</span>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<!-- QUOTE panel -->
		{#if achievement.narrativeNote || achievement.contextLine}
			<div
				style="
                background:rgba(0,229,255,0.05);
                border:1px solid rgba(0,229,255,0.15);
                border-left:3px solid #00e5ff;
                border-radius:0 10px 10px 0;
                padding:14px 16px;
            "
			>
				{#if achievement.narrativeNote}
					<div
						style="font-family:sans-serif;font-size:13px;font-style:italic;color:rgba(255,255,255,0.6);line-height:1.5;margin-bottom:6px;"
					>
						"{achievement.narrativeNote}"
					</div>
				{/if}
				{#if achievement.contextLine}
					<div
						style="font-family:Impact,sans-serif;font-size:20px;color:#00e5ff;letter-spacing:1px;"
					>
						{achievement.contextLine.toUpperCase()} 💪
					</div>
				{/if}
			</div>
		{:else}
			<div
				style="
                background:rgba(0,229,255,0.05);
                border:1px solid rgba(0,229,255,0.15);
                border-left:3px solid #00e5ff;
                border-radius:0 10px 10px 0;
                padding:14px 16px;
            "
			>
				<div style="font-family:Impact,sans-serif;font-size:22px;color:#00e5ff;letter-spacing:1px;">
					{achievement.type === 'pb'
						? 'RECORDS EXIST TO BE BROKEN. 🏆'
						: achievement.type === 'consistency'
							? 'CONSISTENCY IS THE REAL SKILL. 🎯'
							: achievement.type === 'resilience'
								? "CONDITIONS DON'T DEFINE YOU. 💪"
								: 'PROGRESS IS HAPPENING. 📈'}
				</div>
			</div>
		{/if}

		<!-- PROGRESS panel — longitudinal scope only -->
		{#if achievement.metric.improvementPercent !== undefined && achievement.scope === 'longitudinal'}
			<div
				style="
                background:rgba(255,255,255,0.04);
                border:1px solid rgba(255,255,255,0.08);
                border-radius:10px;
                padding:14px 16px;
            "
			>
				<div
					style="font-family:sans-serif;font-size:10px;letter-spacing:3px;color:rgba(255,255,255,0.35);font-weight:700;text-transform:uppercase;margin-bottom:10px;"
				>
					Progress
				</div>
				<div style="display:flex;align-items:center;gap:12px;">
					<div
						style="width:36px;height:36px;background:rgba(0,229,255,0.15);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;"
					>
						🚀
					</div>
					<div>
						<div
							style="font-family:sans-serif;font-size:10px;letter-spacing:1px;color:rgba(255,255,255,0.4);text-transform:uppercase;"
						>
							{achievement.metric.label}
						</div>
						<div
							style="font-family:Impact,sans-serif;font-size:28px;color:#4ade80;letter-spacing:1px;line-height:1;"
						>
							{achievement.metric.improvementDisplay ??
								`${achievement.metric.improvementPercent.toFixed(1)}% better`}
						</div>
					</div>
					<div style="margin-left:auto;text-align:right;">
						<div style="font-family:Impact,sans-serif;font-size:32px;color:#00e5ff;line-height:1;">
							{achievement.metric.improvementPercent.toFixed(0)}%
						</div>
						<div
							style="font-family:sans-serif;font-size:9px;letter-spacing:1px;color:rgba(255,255,255,0.4);text-transform:uppercase;"
						>
							improvement
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- WORTH SHARING panel -->
		<div
			style="
            background:rgba(255,255,255,0.04);
            border:1px solid rgba(255,255,255,0.08);
            border-radius:10px;
            padding:14px 16px;
            display:flex;
            align-items:center;
            gap:14px;
            margin-top:auto;
        "
		>
			<div
				style="
                width:40px;height:40px;
                background:rgba(0,229,255,0.1);
                border-radius:8px;
                display:flex;align-items:center;justify-content:center;
                flex-shrink:0;
            "
			>
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="#00e5ff"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle
						cx="18"
						cy="19"
						r="3"
					/>
					<line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line
						x1="15.41"
						y1="6.51"
						x2="8.59"
						y2="10.49"
					/>
				</svg>
			</div>
			<div style="flex:1;">
				<div
					style="font-family:sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;color:#00e5ff;text-transform:uppercase;margin-bottom:2px;"
				>
					Worth Sharing
				</div>
				<div
					style="font-family:sans-serif;font-size:12px;color:rgba(255,255,255,0.5);font-style:italic;"
				>
					{achievement.type === 'pb'
						? 'Proud of this one. Onwards and upwards.'
						: achievement.type === 'resilience'
							? "The data doesn't lie. Good session."
							: achievement.type === 'consistency'
								? 'Locked in. Every run.'
								: 'Progress confirmed. Keep going.'}
				</div>
			</div>
			<!-- Decorative QR-like SVG — links to jnsprosystems.com -->
			<div
				style="width:52px;height:52px;background:#fff;border-radius:6px;padding:4px;flex-shrink:0;"
			>
				<svg width="44" height="44" viewBox="0 0 44 44" fill="none">
					<rect x="2" y="2" width="14" height="14" rx="2" fill="#060d1a" />
					<rect x="4" y="4" width="10" height="10" rx="1" fill="#fff" />
					<rect x="6" y="6" width="6" height="6" rx="0.5" fill="#060d1a" />
					<rect x="28" y="2" width="14" height="14" rx="2" fill="#060d1a" />
					<rect x="30" y="4" width="10" height="10" rx="1" fill="#fff" />
					<rect x="32" y="6" width="6" height="6" rx="0.5" fill="#060d1a" />
					<rect x="2" y="28" width="14" height="14" rx="2" fill="#060d1a" />
					<rect x="4" y="30" width="10" height="10" rx="1" fill="#fff" />
					<rect x="6" y="32" width="6" height="6" rx="0.5" fill="#060d1a" />
					<rect x="20" y="2" width="4" height="4" fill="#060d1a" />
					<rect x="26" y="2" width="2" height="2" fill="#060d1a" />
					<rect x="2" y="20" width="4" height="4" fill="#060d1a" />
					<rect x="2" y="26" width="2" height="2" fill="#060d1a" />
					<rect x="20" y="20" width="6" height="6" rx="1" fill="#060d1a" />
					<rect x="28" y="20" width="4" height="2" fill="#060d1a" />
					<rect x="34" y="20" width="8" height="2" fill="#060d1a" />
					<rect x="28" y="24" width="2" height="4" fill="#060d1a" />
					<rect x="32" y="24" width="10" height="2" fill="#060d1a" />
					<rect x="20" y="28" width="2" height="8" fill="#060d1a" />
					<rect x="24" y="30" width="4" height="4" fill="#060d1a" />
					<rect x="30" y="28" width="12" height="4" fill="#060d1a" />
					<rect x="30" y="34" width="4" height="8" fill="#060d1a" />
					<rect x="36" y="34" width="6" height="2" fill="#060d1a" />
					<rect x="38" y="38" width="4" height="4" fill="#060d1a" />
					<rect x="20" y="38" width="6" height="4" fill="#060d1a" />
				</svg>
			</div>
		</div>
	</div>

	<!-- ── FOOTER ─────────────────────────────────────────────────────────── -->
	<div
		style="
        position:absolute;bottom:0;left:0;right:0;height:68px;
        background:rgba(0,0,0,0.6);
        border-top:1px solid rgba(255,255,255,0.06);
        display:flex;align-items:center;
        padding:0 36px;
        z-index:5;
        gap:16px;
    "
	>
		<!-- Profile icon -->
		{#if profileIconUrl && showProfileIcon}
			<img
				src={profileIconUrl}
				alt="Rider"
				style="width:38px;height:38px;border-radius:50%;border:2px solid rgba(0,229,255,0.4);object-fit:cover;flex-shrink:0;"
			/>
		{:else}
			<div
				style="
                width:38px;height:38px;border-radius:50%;
                background:rgba(0,229,255,0.1);
                border:2px solid rgba(0,229,255,0.3);
                display:flex;align-items:center;justify-content:center;
                font-size:18px;flex-shrink:0;
            "
			>
				🏍
			</div>
		{/if}

		<!-- Rider info -->
		<div
			style="display:flex;align-items:center;gap:0;font-family:sans-serif;font-size:12px;color:rgba(255,255,255,0.5);"
		>
			<span
				style="color:rgba(255,255,255,0.35);letter-spacing:1px;text-transform:uppercase;font-size:10px;"
				>Rider
			</span>
			<span style="color:rgba(255,255,255,0.85);font-weight:700;margin-left:6px;"
				>{achievement.riderDisplayName}</span
			>
			<span style="margin:0 12px;color:rgba(255,255,255,0.2);">•</span>
			<span
				style="color:rgba(255,255,255,0.35);letter-spacing:1px;text-transform:uppercase;font-size:10px;"
				>Date
			</span>
			<span style="color:rgba(255,255,255,0.6);font-weight:600;margin-left:6px;">{dateDisplay}</span
			>
		</div>

		<div style="flex:1;"></div>

		<!-- Branding -->
		<div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
			<span
				style="font-family:sans-serif;font-size:10px;color:rgba(255,255,255,0.25);letter-spacing:1px;text-transform:uppercase;"
				>Powered by</span
			>
			<svg width="18" height="18" viewBox="0 0 32 32" fill="none">
				<rect width="32" height="32" rx="6" fill="#00e5ff" fill-opacity="0.15" />
				<path
					d="M6 16 L10 10 L14 18 L18 8 L22 16 L26 12"
					stroke="#00e5ff"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					fill="none"
				/>
			</svg>
			<span style="font-family:Impact,sans-serif;font-size:16px;color:#00e5ff;letter-spacing:3px;"
				>APPGATEPRO</span
			>
		</div>
	</div>

	<!-- Bottom tagline -->
	<div
		style="
        position:absolute;bottom:20px;left:0;right:0;
        text-align:center;
        font-family:sans-serif;
        font-size:9px;
        letter-spacing:5px;
        color:rgba(0,229,255,0.3);
        text-transform:uppercase;
        z-index:6;
    "
	>
		MEASURE · UNDERSTAND · IMPROVE
	</div>
</div>

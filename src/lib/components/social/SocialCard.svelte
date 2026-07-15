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
        cardRef = $bindable(null),
    }: Props = $props();

    // All reactive — no const from props (Svelte 5)
    let metric          = $derived(achievement.metric);
    let ctx             = $derived(achievement.context);
    let badge           = $derived(achievement.conditionsBadge);
    let supporting      = $derived(achievement.supporting);
    let weatherMeta     = $derived(ctx.weatherCondition ? getWeatherMeta(ctx.weatherCondition as any) : null);
    let surfaceMeta     = $derived(ctx.trackSurface     ? getSurfaceMeta(ctx.trackSurface as any)     : null);
    let headlineLines   = $derived(achievement.headlineTitle.split('\n'));
    let hasDelta        = $derived(metric.improvementDisplay !== undefined);
    let isLowerBetter   = $derived(metric.label.toLowerCase().includes('reaction') || metric.label.toLowerCase().includes('variation'));
    let dateDisplay     = $derived(new Date(achievement.sessionDate).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
    }));
    let showConditionsRight = $derived(
        ctx.weatherCondition !== null || ctx.trackSurface !== null || ctx.rideFeel !== null
    );
    let showProgress = $derived(
        supporting.progressSinceOnboarding !== null && supporting.progressSinceOnboarding!.length > 0
    );
</script>

<!--
    SocialCard — 1200×630px
    Layout: Left panel (achievement) | Right panel (story)
    Palette: dark navy #060d1a, cyan #00e5ff, white, green #4ade80
-->
<div
    bind:this={cardRef}
    style="width:1200px;height:630px;position:relative;overflow:hidden;background:#060d1a;font-family:sans-serif;"
>
    <!-- ── Rider background image ─────────────────────────────────────────── -->
    {#if backgroundImageUrl && showBackgroundImage}
        <div style="
            position:absolute;left:0;top:0;width:620px;height:100%;
            background:url({backgroundImageUrl}) center/cover no-repeat;
            opacity:0.22;
        "></div>
    {/if}

    <!-- Left panel gradient overlay -->
    <div style="position:absolute;left:0;top:0;width:620px;height:100%;
        background:linear-gradient(110deg,rgba(6,13,26,0.95) 40%,rgba(6,13,26,0.7) 70%,rgba(6,13,26,0.3) 100%);
        z-index:1;"></div>

    <!-- Top cyan accent line -->
    <div style="position:absolute;top:0;left:0;right:0;height:3px;
        background:linear-gradient(90deg,#00e5ff,#00b4d8,transparent);z-index:10;"></div>

    <!-- ── LEFT PANEL ────────────────────────────────────────────────────── -->
    <div style="position:absolute;top:0;left:0;width:600px;height:630px;z-index:2;
        padding:32px 36px 0;display:flex;flex-direction:column;justify-content:space-between;">

        <!-- Top section: logo + headline + metric -->
        <div>
            <!-- Logo -->
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;">
                <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                    <rect width="32" height="32" rx="6" fill="#00e5ff" fill-opacity="0.15"/>
                    <path d="M6 16 L10 10 L14 18 L18 8 L22 16 L26 12" stroke="#00e5ff" stroke-width="2.5"
                        stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                </svg>
                <div>
                    <div style="color:#00e5ff;font-family:Impact,sans-serif;font-size:16px;letter-spacing:4px;line-height:1;">APPGATEPRO</div>
                    <div style="font-size:9px;letter-spacing:4px;color:rgba(255,255,255,0.35);font-weight:600;">BMX ANALYTICS</div>
                </div>
            </div>

            <!-- Achievement headline — last line in cyan -->
            <div style="margin-bottom:12px;">
                {#each headlineLines as line, i}
                    <div style="
                        font-family:Impact,sans-serif;
                        font-size:{headlineLines.length === 1 ? 82 : 72}px;
                        line-height:0.9;
                        letter-spacing:2px;
                        color:{i === headlineLines.length - 1 ? '#00e5ff' : '#ffffff'};
                        text-shadow:{i === headlineLines.length - 1 ? '0 0 40px rgba(0,229,255,0.35)' : 'none'};
                    ">{line}</div>
                {/each}
            </div>

            <!-- Taglines -->
            <div style="margin-bottom:20px;">
                {#each achievement.taglines as line}
                    <div style="font-size:13px;font-style:italic;color:rgba(255,255,255,0.5);line-height:1.8;">{line}</div>
                {/each}
            </div>

            <!-- ── PRIMARY METRIC BOX ─────────────────────────────────────── -->
            <div style="
                background:rgba(255,255,255,0.05);
                border:1px solid rgba(0,229,255,0.25);
                border-radius:12px;
                padding:16px 18px;
                display:flex;align-items:center;gap:14px;
                position:relative;overflow:hidden;
            ">
                <div style="position:absolute;top:-15px;right:-15px;width:70px;height:70px;
                    background:radial-gradient(circle,rgba(0,229,255,0.12),transparent);border-radius:50%;"></div>

                <!-- Icon -->
                <div style="width:44px;height:44px;border:2px solid rgba(0,229,255,0.35);
                    border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <span style="font-size:20px;">
                        {metric.label.toLowerCase().includes('reaction')    ? '⏱' :
                         metric.label.toLowerCase().includes('speed')       ? '🚀' :
                         metric.label.toLowerCase().includes('g-force') || metric.label.toLowerCase().includes('g force') ? '💥' :
                         metric.label.toLowerCase().includes('consistency') || metric.label.toLowerCase().includes('variation') ? '🎯' :
                         metric.label.toLowerCase().includes('quality')     ? '⭐' :
                         metric.label.toLowerCase().includes('runs')        ? '🔁' : '⭐'}
                    </span>
                </div>

                <!-- Value -->
                <div style="flex:1;">
                    <div style="font-size:10px;letter-spacing:2px;color:rgba(255,255,255,0.45);
                        font-weight:700;text-transform:uppercase;margin-bottom:3px;">{metric.label}</div>
                    <div style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;">
                        <span style="font-size:42px;font-family:Impact,sans-serif;color:#00e5ff;letter-spacing:1px;line-height:1;">{metric.value}</span>
                        <span style="font-size:18px;font-family:Impact,sans-serif;color:rgba(0,229,255,0.7);">{metric.unit}</span>
                        {#if hasDelta && metric.improvementDisplay}
                            <span style="font-size:13px;font-weight:700;color:#4ade80;">
                                {isLowerBetter ? '↓' : '↑'} {metric.improvementDisplay}
                            </span>
                        {/if}
                    </div>
                    {#if metric.previousValue !== undefined}
                        <div style="font-size:10px;color:rgba(255,255,255,0.3);letter-spacing:1px;margin-top:2px;text-transform:uppercase;">
                            Previous:
                            {metric.label.toLowerCase().includes('reaction')
                                ? (metric.previousValue / 1000).toFixed(3) + 's'
                                : metric.label.toLowerCase().includes('speed')
                                ? (metric.previousValue * 3.6).toFixed(1) + ' km/h'
                                : metric.previousValue.toFixed(2)}
                        </div>
                    {/if}
                    {#if metric.context}
                        <div style="font-size:10px;color:rgba(0,229,255,0.5);margin-top:2px;font-style:italic;">{metric.context}</div>
                    {/if}
                </div>

                <!-- Badge -->
                <div style="background:linear-gradient(135deg,#00e5ff,#00b4d8);border-radius:8px;
                    padding:8px 12px;text-align:center;flex-shrink:0;">
                    <div style="font-size:8px;font-weight:800;letter-spacing:1.5px;color:#060d1a;">NEW</div>
                    <div style="font-size:12px;font-family:Impact,sans-serif;color:#060d1a;letter-spacing:1px;line-height:1.1;">
                        {achievement.type === 'pb' ? 'PB' :
                         achievement.type === 'condition-pb' ? 'COND PB' :
                         achievement.type === 'milestone' ? 'MILESTONE' :
                         achievement.type === 'consistency' || achievement.type === 'session-quality' ? 'LOCKED IN' :
                         achievement.type === 'resilience' ? 'RESILIENT' :
                         achievement.type === 'progression' ? 'TRENDING' :
                         'ACHIEVED'}
                    </div>
                </div>
            </div>
        </div>

        <!-- ── CONDITIONS BADGE (bottom left) ────────────────────────────── -->
        {#if badge}
            <div style="
                background:rgba(245,166,35,0.08);
                border:1px solid rgba(245,166,35,0.25);
                border-radius:12px;
                padding:14px 16px;
                display:flex;align-items:center;gap:14px;
                margin-bottom:72px;
            ">
                <!-- Gold star badge -->
                <div style="position:relative;flex-shrink:0;">
                    <div style="width:44px;height:44px;background:rgba(245,166,35,0.15);
                        border:2px solid rgba(245,166,35,0.4);border-radius:50%;
                        display:flex;align-items:center;justify-content:center;">
                        <span style="font-size:22px;">{badge.icon}</span>
                    </div>
                </div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:10px;letter-spacing:2px;color:#f5a623;font-weight:700;
                        text-transform:uppercase;margin-bottom:2px;">
                        {badge.conditions.length > 0 ? badge.conditions[0] : 'Session Context'}
                    </div>
                    <div style="font-size:16px;font-weight:700;color:#fff;line-height:1.2;margin-bottom:2px;">{badge.label}</div>
                    <div style="font-size:11px;color:rgba(255,255,255,0.5);font-style:italic;">{badge.description}</div>
                </div>
            </div>
        {:else}
            <div style="margin-bottom:72px;"></div>
        {/if}
    </div>

    <!-- ── DIVIDER ─────────────────────────────────────────────────────────── -->
    <div style="position:absolute;top:32px;left:616px;bottom:76px;width:1px;
        background:linear-gradient(to bottom,transparent,rgba(0,229,255,0.15) 20%,rgba(0,229,255,0.15) 80%,transparent);
        z-index:2;"></div>

    <!-- ── RIGHT PANEL ───────────────────────────────────────────────────── -->
    <div style="position:absolute;top:0;left:636px;width:524px;height:630px;z-index:2;
        padding:32px 36px 0 20px;display:flex;flex-direction:column;gap:16px;">

        <!-- CONDITIONS (top right) -->
        {#if showConditionsRight}
            <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);
                border-radius:10px;padding:18px 20px;">
                <div style="font-size:10px;letter-spacing:3px;color:rgba(255,255,255,0.3);
                    font-weight:700;text-transform:uppercase;margin-bottom:14px;">Conditions</div>
                <div style="display:flex;gap:26px;align-items:flex-start;flex-wrap:wrap;">
                    {#if weatherMeta}
                        <div style="display:flex;flex-direction:column;align-items:center;gap:5px;">
                            <span style="font-size:28px;">{weatherMeta.icon}</span>
                            <span style="font-size:9px;letter-spacing:1px;color:rgba(255,255,255,0.3);text-transform:uppercase;">Weather</span>
                            <span style="font-size:14px;font-weight:600;color:rgba(255,255,255,0.75);">{weatherMeta.label}</span>
                        </div>
                        {#if surfaceMeta || ctx.rideFeel}<div style="width:1px;background:rgba(255,255,255,0.07);align-self:stretch;"></div>{/if}
                    {/if}
                    {#if surfaceMeta}
                        <div style="display:flex;flex-direction:column;align-items:center;gap:5px;">
                            <span style="font-size:28px;">{surfaceMeta.icon}</span>
                            <span style="font-size:9px;letter-spacing:1px;color:rgba(255,255,255,0.3);text-transform:uppercase;">Surface</span>
                            <span style="font-size:14px;font-weight:600;color:rgba(255,255,255,0.75);">{surfaceMeta.label}</span>
                        </div>
                        {#if ctx.rideFeel}<div style="width:1px;background:rgba(255,255,255,0.07);align-self:stretch;"></div>{/if}
                    {/if}
                    {#if ctx.rideFeel}
                        <div style="display:flex;flex-direction:column;align-items:center;gap:5px;">
                            <span style="font-size:28px;">
                                {ctx.rideFeel === 'peak'    ? '🔥' :
                                 ctx.rideFeel === 'dialled' ? '🎯' :
                                 ctx.rideFeel === 'good'    ? '💪' :
                                 ctx.rideFeel === 'solid'   ? '👍' : '😔'}
                            </span>
                            <span style="font-size:9px;letter-spacing:1px;color:rgba(255,255,255,0.3);text-transform:uppercase;">Readiness</span>
                            <span style="font-size:14px;font-weight:600;color:rgba(255,255,255,0.75);">
                                {ctx.rideFeel === 'peak'    ? 'Peak'    :
                                 ctx.rideFeel === 'dialled' ? 'Dialled' :
                                 ctx.rideFeel === 'good'    ? 'Good'    :
                                 ctx.rideFeel === 'solid'   ? 'Solid'   : 'Off Day'}
                            </span>
                        </div>
                    {/if}
                </div>
            </div>
        {/if}

        <!-- QUOTE PANEL -->
        {#if supporting.quotePunchline}
            <div style="background:rgba(0,229,255,0.05);border:1px solid rgba(0,229,255,0.12);
                border-left:3px solid #00e5ff;border-radius:0 10px 10px 0;padding:20px 22px;">
                {#if supporting.quoteNote}
                    <div style="font-size:14px;font-style:italic;color:rgba(255,255,255,0.55);line-height:1.5;margin-bottom:8px;">
                        "{supporting.quoteNote}"
                    </div>
                {/if}
                <div style="font-family:Impact,sans-serif;font-size:24px;color:#00e5ff;letter-spacing:1px;">
                    {supporting.quotePunchline} 💪
                </div>
            </div>
        {/if}

        <!-- PROGRESS SINCE ONBOARDING -->
        {#if showProgress && supporting.progressSinceOnboarding}
            <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);
                border-radius:10px;padding:18px 20px;">
                <div style="font-size:10px;letter-spacing:3px;color:rgba(255,255,255,0.3);
                    font-weight:700;text-transform:uppercase;margin-bottom:14px;">Progress trend</div>
                <div style="display:flex;flex-direction:column;gap:12px;">
                    {#each supporting.progressSinceOnboarding as row}
                        <div style="display:flex;align-items:center;gap:14px;">
                            <div style="width:40px;height:40px;background:rgba(0,229,255,0.1);
                                border-radius:8px;display:flex;align-items:center;justify-content:center;
                                font-size:18px;flex-shrink:0;">
                                {row.label.toLowerCase().includes('reaction') ? '🚀' : '🎯'}
                            </div>
                            <div style="flex:1;">
                                <div style="font-size:10px;letter-spacing:1px;color:rgba(255,255,255,0.35);text-transform:uppercase;">{row.label}</div>
                                <div style="font-family:Impact,sans-serif;font-size:26px;
                                    color:{row.trend === 'improving' ? '#4ade80' : '#ff4444'};
                                    letter-spacing:1px;line-height:1;">{row.value}</div>
                            </div>
                            <div style="text-align:right;flex-shrink:0;">
                                <div style="font-family:Impact,sans-serif;font-size:16px;
                                    color:{row.trend === 'improving' ? '#00e5ff' : '#ffcc44'};
                                    letter-spacing:1px;line-height:1;">{row.trendLabel.split(' ')[0]}</div>
                                <div style="font-size:10px;color:rgba(255,255,255,0.35);letter-spacing:1px;text-transform:uppercase;">
                                    {row.trendLabel.split(' ').slice(1).join(' ')}
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}

        <!-- SESSION HIGHLIGHTS -->
        {#if supporting.sessionHighlights && supporting.sessionHighlights.length > 0}
            <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);
                border-radius:10px;padding:18px 20px;">
                <div style="font-size:10px;letter-spacing:3px;color:rgba(255,255,255,0.3);
                    font-weight:700;text-transform:uppercase;margin-bottom:12px;">Session stats</div>
                {#each supporting.sessionHighlights as h}
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;">
                        <span style="font-size:13px;color:rgba(255,255,255,0.45);">{h.label}</span>
                        <span style="font-size:13px;font-weight:600;color:#00e5ff;">{h.value}</span>
                    </div>
                {/each}
            </div>
        {/if}

        <!-- WORTH SHARING panel — always shown, fills remaining space -->
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);
            border-radius:10px;padding:18px 20px;display:flex;align-items:center;gap:16px;margin-top:auto;">
            <div style="width:44px;height:44px;background:rgba(0,229,255,0.1);border-radius:8px;
                display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
            </div>
            <div style="flex:1;">
                <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:#00e5ff;
                    text-transform:uppercase;margin-bottom:3px;">Worth Sharing</div>
                <div style="font-size:12.5px;color:rgba(255,255,255,0.45);font-style:italic;">
                    {achievement.type === 'pb' || achievement.type === 'condition-pb'
                        ? 'Proud of this one. Onwards and upwards.'
                        : achievement.type === 'resilience'
                        ? "The data doesn't lie. Good session."
                        : achievement.type === 'consistency' || achievement.type === 'session-quality'
                        ? 'Locked in. Every run.'
                        : 'Progress confirmed. Keep going.'}
                </div>
            </div>
            <!-- Decorative QR pattern -->
            <div style="width:56px;height:56px;background:#fff;border-radius:6px;padding:4px;flex-shrink:0;">
                <svg width="48" height="48" viewBox="0 0 44 44" fill="none">
                    <rect x="2" y="2" width="14" height="14" rx="2" fill="#060d1a"/>
                    <rect x="4" y="4" width="10" height="10" rx="1" fill="#fff"/>
                    <rect x="6" y="6" width="6" height="6" rx="0.5" fill="#060d1a"/>
                    <rect x="28" y="2" width="14" height="14" rx="2" fill="#060d1a"/>
                    <rect x="30" y="4" width="10" height="10" rx="1" fill="#fff"/>
                    <rect x="32" y="6" width="6" height="6" rx="0.5" fill="#060d1a"/>
                    <rect x="2" y="28" width="14" height="14" rx="2" fill="#060d1a"/>
                    <rect x="4" y="30" width="10" height="10" rx="1" fill="#fff"/>
                    <rect x="6" y="32" width="6" height="6" rx="0.5" fill="#060d1a"/>
                    <rect x="20" y="2" width="4" height="4" fill="#060d1a"/>
                    <rect x="20" y="20" width="6" height="6" rx="1" fill="#060d1a"/>
                    <rect x="28" y="20" width="4" height="2" fill="#060d1a"/>
                    <rect x="34" y="20" width="8" height="2" fill="#060d1a"/>
                    <rect x="28" y="24" width="2" height="4" fill="#060d1a"/>
                    <rect x="20" y="28" width="2" height="8" fill="#060d1a"/>
                    <rect x="24" y="30" width="4" height="4" fill="#060d1a"/>
                    <rect x="30" y="28" width="12" height="4" fill="#060d1a"/>
                    <rect x="38" y="34" width="4" height="4" fill="#060d1a"/>
                </svg>
            </div>
        </div>
    </div>

    <!-- ── FOOTER ─────────────────────────────────────────────────────────── -->
    <div style="position:absolute;bottom:0;left:0;right:0;height:66px;
        background:rgba(0,0,0,0.65);border-top:1px solid rgba(255,255,255,0.05);
        display:flex;align-items:center;padding:0 32px;z-index:5;gap:14px;">

        <!-- Profile icon -->
        {#if profileIconUrl && showProfileIcon}
            <img src={profileIconUrl} alt="Rider"
                style="width:36px;height:36px;border-radius:50%;border:2px solid rgba(0,229,255,0.35);
                object-fit:cover;flex-shrink:0;"/>
        {:else}
            <div style="width:36px;height:36px;border-radius:50%;background:rgba(0,229,255,0.1);
                border:2px solid rgba(0,229,255,0.25);display:flex;align-items:center;
                justify-content:center;font-size:16px;flex-shrink:0;">🏍</div>
        {/if}

        <!-- Rider info -->
        <div style="display:flex;align-items:center;gap:0;font-size:11px;color:rgba(255,255,255,0.45);">
            <span style="color:rgba(255,255,255,0.3);letter-spacing:1px;text-transform:uppercase;font-size:9px;">Rider </span>
            <span style="color:rgba(255,255,255,0.85);font-weight:700;margin-left:5px;">{achievement.riderDisplayName}</span>
            {#if achievement.riderClass}
                <span style="margin:0 10px;color:rgba(255,255,255,0.15);">•</span>
                <span style="color:rgba(255,255,255,0.3);letter-spacing:1px;text-transform:uppercase;font-size:9px;">Class </span>
                <span style="color:rgba(255,255,255,0.55);margin-left:5px;">{achievement.riderClass}</span>
            {/if}
            <span style="margin:0 10px;color:rgba(255,255,255,0.15);">•</span>
            <span style="color:rgba(255,255,255,0.3);letter-spacing:1px;text-transform:uppercase;font-size:9px;">Date </span>
            <span style="color:rgba(255,255,255,0.55);margin-left:5px;">{dateDisplay}</span>
        </div>

        <div style="flex:1;"></div>

        <!-- Tagline + branding -->
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;">
            <div style="font-size:8px;letter-spacing:4px;color:rgba(0,229,255,0.25);text-transform:uppercase;">
                MEASURE · UNDERSTAND · IMPROVE
            </div>
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:9px;color:rgba(255,255,255,0.2);letter-spacing:1px;text-transform:uppercase;">Powered by</span>
                <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
                    <rect width="32" height="32" rx="6" fill="#00e5ff" fill-opacity="0.15"/>
                    <path d="M6 16 L10 10 L14 18 L18 8 L22 16 L26 12" stroke="#00e5ff" stroke-width="2.5"
                        stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                </svg>
                <span style="font-family:Impact,sans-serif;font-size:14px;color:#00e5ff;letter-spacing:3px;">APPGATEPRO</span>
            </div>
        </div>
    </div>
</div>

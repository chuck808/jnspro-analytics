# Analytics & Trends

---

## What Analytics Is For

Looking at individual sessions tells you what happened that day. The analytics page tells you whether you're actually getting better.

A reaction time of 0.245 seconds is a number. Whether that's an improvement, a plateau, or a decline depends on what came before it and what's been happening across your last ten sessions. Analytics provides that context — it looks across all your uploaded sessions and tells you what the patterns show.

The system gets more useful the more data you give it. With three sessions it can show you basic trends. With ten it starts identifying reliable patterns. With twenty or more it can tell you with statistical confidence what's actually changing and what's just noise.

---

## How the Page Is Laid Out

The analytics page works in layers, from the most important information at the top to the detailed data at the bottom.

**Performance Overview** is the first thing you see — a headline based on your recent sessions, your personal bests with competitive benchmarks, and a quick visual of your session quality over the last ten sessions. This is the "what's happening" layer. If you only have a minute, this is the bit to look at.

**Session Narrative** translates your most recent session into plain English. Not numbers — a short paragraph describing what the data actually shows. Whether your runs were consistent, where fatigue appeared, whether there were any data quality issues. It adapts to what happened, so it reads differently for a strong session than a scattered one.

**Training Insights** shows the patterns behind your current performance — how repeatable your starts are, where fatigue typically hits in a session, how your best and average runs compare, and what the data suggests about how many quality reps you can sustain. This is the "why is it happening" layer.

**Performance Patterns** only appears once you have at least three sessions. Four charts designed around coaching questions rather than raw data display. More on these below.

**Raw Performance Trends** is exactly what it sounds like — reaction time, peak speed, and consistency tracked over time as simple charts. The actual numbers, with trend lines.

**Advanced Analytics** is collapsed by default because most people won't need it. Speed distribution, quickness correlation, session comparison, and rolling statistical analysis. Expand it if you want to dig deeper; leave it closed if you don't.

**Session History** sits at the bottom — a chronological list of your sessions with links to the detail pages. Reference material for when you want to find a specific session.

---

## Understanding Trend Charts

All the trend charts on this page use linear regression for their trend lines. That means the line shows the overall direction of change, not the exact path between individual data points. If the reaction time trend line is going down, your reaction time is generally improving — even if specific sessions jump around.

You need at least three sessions for trend charts to appear at all, and at least six before the trend calculations become reliable. With three to five sessions, the trend line can be easily skewed by a single outlier. With six or more, the system starts showing percentage change figures and can be more confident the trend is real.

When the system tells you your reaction time is "improving by 5.3%," that's comparing the average of your last five sessions to the average of the five before that. It's not your best-ever versus your most recent — it's whether your average is moving in the right direction consistently.

Normal session-to-session variation is 3–5%. That's measurement variation, daily form, environmental factors. The system only flags changes larger than that as trends, so if it's showing you a trend, the change is statistically larger than routine noise.

---

## Performance Patterns

These four charts are the most useful coaching tools on the page. Each one answers a specific question that you can't answer by looking at individual sessions.

**Best vs Average Gap** shows the percentage difference between your best run and your average run in each session. Lower is better. A gap below 5% means you're very consistent — your average is close to your best. A gap above 15% means you're chasing peaks but your typical performance isn't keeping up.

If this gap is closing over time, your floor is rising. That's what training is supposed to do. If it's widening, you're occasionally hitting great runs but your reliable performance isn't improving — which doesn't translate to race results. Stop chasing peak runs and focus on making the average better. The peaks will follow.

**Optimal Set Length** shows how many runs you can sustain at high quality in a session — defined as within 5% of your best run that session. This number typically increases with training as your fitness and gate-specific endurance improve.

Use this practically: if your optimal set length is six, doing ten-run sessions means 40% of your reps are junk — adding fatigue without adding quality. Better to do six focused reps, recover properly, and do another set if you're genuinely fresh.

**Drop-Off Position** shows which run number you typically start fading on — when performance drops more than 10% below your best. If this number is moving later over time (run 5 to run 7 to run 9), your endurance is improving. If it's moving earlier, you're either overtraining or not recovering properly between sessions.

A practical rule: stop your sets one or two runs before your typical drop-off point. The runs after your drop-off aren't quality reps — they're just accumulating fatigue.

**Speed vs Consistency** shows peak speed and consistency CV% on the same chart over time. Both improving together is the ideal. Speed improving while consistency degrades means you're getting faster but less reliable — unsustainable. Consistency improving while speed plateaus means you've built a solid base but need a new stimulus to push performance further.

---

## Cross-Session Intelligence

This is the system looking across all your sessions to find patterns that aren't visible from within any single one.

It looks at whether your average performance is improving, plateauing, or declining. It tracks whether your consistency is getting better or worse over time — consistency improvements often precede speed improvements, so this is an early indicator that training is working. It identifies whether fatigue is appearing earlier or later in sessions over time, and whether your best and average runs are converging.

The headlines the system generates from this analysis are descriptions, not motivational statements:

"Reaction time improving steadily" means your recent average is significantly better than your historical average and the trend is stable.

"Consistency degrading — possible overtraining" means your CV% is increasing over time, which is a common pattern when fatigue is accumulating.

"Mixed session quality" means there's no clear pattern — sessions are varying too much to identify a reliable trend.

These headlines come with a confidence level. High confidence means 10 or more sessions with a clear trend. Medium confidence means 5–9 sessions with an identifiable pattern. Low confidence means 3–4 sessions where the system can see something but isn't certain. Low confidence isn't wrong — it just means you need more data before the assessment is reliable.

---

## Personal Bests and Benchmarks

Your all-time best reaction time, peak speed, and max G-force appear at the top of the page with ratings showing where those numbers fall relative to different levels of BMX competition.

These benchmarks are based on actual performance data and are meant as context, not goals. If your reaction time is rated "Club level," that means it's typical for club-level riders. Whether you want to work toward the next tier depends on your own training objectives — the system isn't pushing you toward anything.

One thing worth knowing: the benchmarks are thresholds, not precise measurements. Performance at any level varies enormously by age, weight, track conditions, and equipment. Use them as reference points, not verdicts.

The system also adjusts its technique scoring and assessments based on your declared rider level in your profile. A grom with a 300ms reaction time and a club rider with the same time are assessed differently because the context is different.

---

## Session Quality Score

Every session gets a quality score from 0 to 100 based on how repeatable your starts were and whether your performance declined through the session.

A high score (80+) means your runs were consistent and you didn't show significant fatigue. A low score (below 40) means either your runs were erratic or you showed clear performance decline — or both.

This score isn't about how fast you went. It's about how well-structured your session was. A session quality of 80 with a 260ms average reaction time is better training than a session quality of 40 with a 250ms average, because the first is building reliable performance and the second is grinding through unfocused reps.

---

## Data Quality and What Gets Shown

Not everything is shown to everyone — the system adjusts based on data quality.

Speed calculations need valid IMU calibration, firmware-calculated peak speed data, and a complete acceleration trace. If the bias correction is too high, speed data gets flagged as unreliable and speed-based analytics are either hidden or shown with a clear warning.

If you have the breakbeam timing module, elapsed time is a precision measurement to ±1ms, which anchors the speed curve to a real value and makes speed analytics significantly more reliable. Without the breakbeam, speed is estimated from IMU integration — reliable for comparing your own runs against each other, less so as absolute values.

Power estimates need your body weight and bike weight from your profile settings. If either is missing, power analytics don't appear — showing estimates without accurate mass data would be misleading.

Consistency metrics only need reaction times, which are directly measured. These are the most reliable numbers in the system.

---

## Advanced Analytics

The collapsible section at the bottom contains tools most riders won't need, but which are genuinely useful for deeper analysis.

**Speed Distribution** shows how your speeds are distributed across all your runs — whether you have a tight band (consistent) or a wide spread (variable).

**Quickness Correlation** examines the relationship between reaction time and peak speed. Typically you'd expect a strong negative correlation — faster reactions leading to higher speeds. A weak or positive correlation might suggest you're reacting quickly but not converting that into acceleration efficiently.

**Session Comparison** lets you pick any two sessions and compare all metrics side by side. Useful for understanding what changed between a strong session and a weak one.

**Rolling Analytics** (10+ sessions) calculates moving averages that smooth out day-to-day variation and show the underlying trend more clearly.

**Statistical Analysis** (20+ sessions) adds confidence intervals and significance testing — how certain can you be that the trend you're seeing is real rather than random variation. Primarily useful for riders preparing for selection events who need to know their reliable performance level, not just their personal best.

---

## What to Pay Attention To

**Whether trends are stable or erratic.** Gradual, consistent improvement is better than spikey peaks and valleys. Consistent trend direction means your training is working predictably.

**The gap between your best and average.** More important than your absolute best. A rider with a 250ms best and 255ms average is more race-ready than one with a 240ms best and 270ms average.

**Session quality trends over time.** If your quality scores are consistently high, your training is well-structured. If they're all over the place, something in your session planning or recovery isn't consistent.

**Confidence levels.** Only trust high-confidence assessments. Medium and low confidence means "possibly a pattern," not "definitely a pattern."

**Where the recommendations cluster.** If the system keeps flagging the same thing across multiple sessions, it's seeing a real pattern. That's worth taking seriously.

---

## What Not to Worry About

**One bad session.** Three bad sessions is a pattern. One is just a bad day.

**Absolute speed numbers without context.** They mean nothing without knowing the distance marker, track surface, bike setup, and data quality rating.

**Short-term trends with fewer than six sessions.** Directional at best. Trends become reliable around eight to ten sessions.

**Perfect linear progress.** It doesn't exist. Plateaus, regressions, and breakthroughs are all normal. The trend over months matters more than the trend over weeks.

---

## Common Patterns

**Early progress, then plateau.** Your first ten sessions show clear improvement. The next ten show minimal change. This is normal — initial gains are technique fixes and motor learning, which happen fast. Later gains are physiological adaptations, which take longer. When you hit this, don't train harder — change what you're training.

**Inconsistent data, no clear trends.** Your analytics page shows wide variation and no confidence in any patterns. Usually this means your session structure isn't consistent, your equipment setup is varying, or you're training too sporadically for patterns to establish. Standardising your sessions and training more regularly fixes this.

**High session quality but no improvement.** Your consistency is excellent but your times aren't getting faster. You've optimised your current approach and your body has adapted to it. You need a new training stimulus — technique work, strength training, or pushing the intensity in a different way.

**Speed improving, consistency declining.** Your peak times are dropping but your CV% is rising. You're pushing for faster times at the expense of reliability. Back off the intensity and focus on making your average runs faster rather than your best runs faster.

---

## Honest Limitations

The analytics system is pattern recognition applied to sensor data. It works well when you're training consistently, your data quality is good, and your session structure is reasonably stable.

It works poorly when sessions are sporadic, data is noisy, or your training structure changes dramatically from week to week.

The trends assume current patterns will continue. They can't predict technique breakthroughs, performance drops from illness or injury, the effect of equipment changes, or external factors like track conditions and weather.

What the system can tell you is what your data shows right now and what direction it's been moving. What it can't tell you is why that's happening or exactly what to do about it. That's what coaching is for. The analytics page gives you and your coach better information to work with — it doesn't replace the conversation.

---

*For help with specific sections of the analytics page, use the Help buttons throughout the page.*

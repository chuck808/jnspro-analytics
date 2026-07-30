# Analytics & Trends

---

## What this page is actually for

A single session tells you what happened on one day. This page tells you whether you're actually getting better — which is a different question, and one you genuinely can't answer by staring at one upload at a time.

A 0.245s reaction time doesn't mean much on its own. Is that an improvement? A plateau? A bad day? You can only tell by looking at what came before it. That's what this page does: it looks across everything you've uploaded and tells you what the pattern actually shows.

It also gets more useful the more you feed it. Three sessions gets you basic trend lines. Ten gets you patterns worth trusting. Twenty-plus gets you real statistical confidence about what's signal and what's noise.

---

## Three tabs, three different questions

The page is split into **Overview**, **Trends**, and **Insights** — accessible via a tab bar that appears at the bottom once you scroll. Each one answers a different question, and you'll reach for them at different frequencies.

### Overview — "where do I stand right now?"

![Analytics Overview tab](/docs/analytics-overview-tab.png)

This is the thirty-second check. A headline verdict on where your performance sits right now, your personal bests, and an **Analytics Unlocked** checklist showing what's currently available versus what needs more data:

| Sessions logged | What unlocks |
|---|---|
| 1 | Session summaries |
| 2 | Session comparison |
| 3 | Trend charts, consistency scoring |
| 10 | Full rolling analytics |
| 20 | Statistical significance testing |

There's no way to skip the queue here, and that's deliberate — a trend line built from two data points isn't a trend, it's a coin flip. The system would rather tell you honestly that you need more sessions than show you a confident-looking chart built on nothing.

### Trends — "is the direction actually real?"

![Analytics Trends tab](/docs/analytics-trends-tab.png)

This is where the coaching-relevant charts live — **Performance Patterns** designed around questions a coach would actually ask, not just raw numbers plotted over time:

- **Best vs Average Gap** — how close your typical run is to your best one. Shrinking gap means your floor is rising, which is what training is actually supposed to do. A widening gap means you're occasionally hitting great runs without your reliable baseline improving — which doesn't translate to race day.
- **Optimal Set Length** — how many runs you can hold quality through before things degrade. If that number is 6 and you're doing 10-run sessions, the last 4 are adding fatigue, not training.
- **Drop-Off Position** — which run number you typically start fading on. Moving later over time means your endurance is improving; moving earlier usually means overtraining or under-recovering.
- **Speed vs Consistency** — plotted together deliberately, because both improving together is the healthy pattern. Speed climbing while consistency drops means you're getting faster and less reliable at the same time — rarely sustainable.

Below that sits **Raw Performance Trends** — reaction time, peak speed, and consistency, plotted plainly with a linear-regression trend line. All the trend charts on this page work the same way underneath: they need at least three sessions to appear at all, and the confidence firms up meaningfully past six. A trend line built on three or four sessions can get thrown off by one unusual outing; by ten or so, one bad session barely moves it.

> **Worth knowing:** normal session-to-session variation is roughly 3–5%, just from form, conditions, and measurement noise. The system only calls something a trend once the change is bigger than that — so if it's telling you your reaction time is "improving by 5.3%," that's a real, above-noise signal, not it reading tea leaves.

### Insights — "what's actually driving this?"

![Analytics Insights tab](/docs/analytics-insights-tab.png)

The deep end — nine different lenses on your longitudinal data, each answering a narrower question than the Trends tab does. It unlocks progressively: the charts need 5+ sessions to appear at all (below that you'll just see a "come back once you've logged more" message), and one specific panel needs 10+ before it says anything. Here's what each one is actually for:

**Technique Quality Over Time** — tracks the four-component score (overall, reaction, explosiveness, smoothness) session by session. This is the longitudinal view of the same scoring model you see on individual runs, so a dip here means the *pattern* is slipping, not just one bad run.

**Technique Score Trends** — the six-dimension breakdown (launch quality, explosiveness, speed carry, smoothness, impulse timing, repeatability), tracked the same way. Deliberately separate from the chart above — if the four-component score looks flat but this one shows movement in a specific dimension, that's telling you *which* aspect of technique is actually shifting underneath an unchanged headline number.

**Force Application Smoothness** — your jerk-derived smoothness score over time. Two riders can have identical peak G-force with completely different smoothness trends; this is the one that catches "getting stronger but choppier" before it shows up anywhere else.

**Power Output Development** — peak and average power over time, only populated once you've entered rider and bike weight. No mass data, no power trend — a guess dressed up as a number isn't more useful than no number, so the chart just doesn't render rather than mislead you.

**Sensor Data Quality** — bias correction and calibration reliability across sessions, not just within one. If this trend is degrading, that's a mounting or calibration habit worth fixing before it quietly erodes every speed-derived metric you're tracking elsewhere.

**Wheelie Pattern Analysis** — how often you're getting front-wheel lift, and specifically whether your reaction time differs on runs with a wheelie versus without. That comparison is the actual point: it turns "do I wheelie a lot" into "is wheelie-ing costing me anything," which is the question that actually matters.

**Strengths & Limiters Evolution** — classifies your recurring strengths and limiters into consistent (showing up most sessions), resolved (used to show up, doesn't anymore), persistent (still showing up — the ones worth focusing on), and emerging (new, worth watching). A persistent limiter is a much stronger signal than a strength or weakness that only appeared once.

**Diagnostic Patterns** — every diagnostic issue the system has flagged, ranked by how often it recurs. One occurrence is a data point. The same diagnostic across five sessions is a real pattern worth an actual conversation with your coach, not a coincidence.

**Correlation Insights** — the one panel gated specifically at 10+ sessions, because correlation claims need real statistical weight behind them or they're just noise dressed up as insight. Looks at relationships like reaction time versus peak speed — are you converting quick reactions into actual velocity, or leaving that speed on the table? — and rates the strength of what it finds (from "weak" to "very strong") rather than presenting every correlation as equally meaningful.

---

## Reading the confidence levels honestly

Every headline the system generates — "reaction time improving steadily," "consistency degrading," "mixed session quality" — comes with a confidence rating attached, and the rating matters as much as the headline:

- **High confidence** — 10+ sessions, a clear, stable trend.
- **Medium confidence** — 5–9 sessions, a pattern you can see forming.
- **Low confidence** — 3–4 sessions, something's visible but it's early days.

Low confidence isn't the system hedging its bets for no reason — it means exactly what it says: there's a hint of something, but not enough data yet to be sure it's real rather than noise. Treat a low-confidence headline as a "keep an eye on this," not a verdict.

---

## What's actually worth your attention

**Whether trends are stable or erratic.** Steady, gradual movement in the right direction beats spiky peaks and valleys — it means your training is producing predictable results, not just occasional good days.

**The gap between best and average**, more than your outright personal best. A rider posting 250ms best / 255ms average is more race-ready than one posting 240ms best / 270ms average, even though the second rider's best is faster.

**Where recommendations repeat.** If the same suggestion keeps surfacing across multiple sessions, that's the system seeing a genuine pattern, not a one-off note.

---

## What's not worth worrying about

One rough session. Three in a row is a pattern; one is just a Tuesday. Short-term trends built on fewer than six sessions — directional at best, and don't over-read them. And perfectly linear progress, because it doesn't exist. Plateaus, small regressions, and sudden jumps are all completely normal; the trend over months is what matters, not the trend over the last two weeks.

---

## Honest limitations

This page is pattern recognition applied to sensor data, and it's only as good as the training data feeding it. It works well when you're training reasonably consistently and your session structure doesn't swing wildly week to week. It works poorly when sessions are sporadic or your setup keeps changing.

It also can't predict a technique breakthrough, an illness, or a bad-weather week — it only describes what's already happened and the direction it's currently pointing. (Equipment and biometric changes are handled separately: see the **Setup changed** banner on the session Overview page, which specifically detects and compares before/after an equipment or biometric change — but that comparison is only as good as how promptly you keep your profile updated.) What it can tell you is what your data shows right now. What it can't tell you is *why*, or exactly what to change. That conversation is what your coach is for — this page just gives the two of you better information to have it with.

---

_For a level-appropriate explanation of any specific chart, use the Help buttons throughout this page._

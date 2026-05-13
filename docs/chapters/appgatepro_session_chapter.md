# Your Session Data

---

## What the Session Page Is For

The analytics page shows you trends across multiple sessions. The session page shows you what actually happened in a specific one — run by run, metric by metric.

This is the most detailed view in the system. Everything the sensor recorded, everything the firmware calculated, and everything the analytics layer computed is available here. That's a lot of information. Some of it you'll check every session. Some of it you'll only look at when something seems off. It's all there when you need it, but you don't need to look at all of it every time.

---

## Finding Your Way Around

At the top of the page is a summary bar showing the headline numbers for the whole session — run count, best reaction time, best peak speed, best max G-force, and consistency score. These are your at-a-glance numbers. Everything below is explanation and detail.

**A note on elapsed time and speed accuracy**

The AppGatePro records data for a window you set in the device settings — typically 3–4 seconds, long enough to capture your full run at your chosen distance. The distance is also set in the device (10m, 20m, or whatever your track setup uses).

If you have the breakbeam timing module, elapsed time becomes a precision measurement — the exact moment you cross the line, to ±1ms. Combined with your known distance, this gives you a real average speed calculation rather than an estimate, and significantly improves the accuracy of everything the system calculates from velocity.

Without the breakbeam, the device records for the full window and speed is estimated from the IMU data. These estimates are reliable for comparing your own runs against each other and tracking progress over time — just not absolute values you'd quote as ground truth. The system tells you clearly which situation you're in.

If any of your active goals improved during this session, you'll see a progress indicator here too, showing which metric improved, by how much, and whether it was a significant enough step to record as a milestone.

Below the summary is a run comparison table showing all runs side by side. Click any row to select that run for detailed viewing. On desktop you'll also see pill buttons for each run — click to switch. On mobile it's swipeable.

---

## The Analytics Systems

The session page currently runs analytics from two systems. This is something that'll consolidate over time, but for now it's worth knowing what each one shows.

**The Performance Engine** appears near the top of the run detail section. It gives you a plain English headline and summary of the run, key metrics, insights about technique and data quality, and prioritised next actions. It also produces charts showing acceleration with phase markers, speed with acceleration overlay, jerk (rate of change of force), impulse, and power. This is the newer system — it's where new development is happening.

**The original analytics** shows the G-force chart everyone's familiar with, technique scores broken into four components, speed splits, and additional views of power and impulse. These formulas are well-validated and riders are used to reading them, which is why they're still here.

Both systems are working from the same underlying data. If a number looks different between them, it's usually because they're calculating slightly different things or presenting the same thing differently.

---

## Understanding the Charts

### G-Force

The core chart. Time on the x-axis, G-force on the y-axis, filled area showing your acceleration trace through the run.

What you're looking for: an early peak (ideally in the first 0.5–1.0 seconds), a single dominant peak rather than several peaks of similar height, and a gradual decline after the peak rather than a sudden drop. An early, high, clean peak means you're front-loading your power into the snap. Multiple peaks usually mean uneven pedal strokes.

Typical values: 2.0–2.5G is club level, 2.5–3.0G is strong, above 3.0G approaches the edge of the sensor's measurement range and should be treated with some caution. The sensor compensates for this but very high numbers become less precise.

### Speed and Acceleration

A dual-axis chart with speed (km/h, left axis) and acceleration (G-force, right axis) on the same timeline. Both together reveal things neither shows alone — you can have high acceleration but poor speed conversion, or moderate acceleration and excellent speed, depending on technique.

Speed should build in a roughly S-shape (slow start, rapid middle, tapering off). Peak acceleration should happen noticeably before peak speed — if they're occurring at the same time, something's not right.

**With the breakbeam module:** elapsed time is a precision measurement, so average speed over your set distance is a genuine calculation. The speed curve is anchored to this real value, making it significantly more reliable.

**Without the breakbeam:** speed is estimated from IMU integration with bias correction applied. You'll see a data quality badge (Excellent / Good / Fair / Poor) and a bias correction value in m/s². Under 0.5 m/s² is excellent. Above 3.0 m/s² means the speed estimate is approximate at best. These numbers are reliable for comparing your own runs against each other — treat them with caution as absolute values.

### Jerk

Jerk is how quickly your force application changes — the rate of change of acceleration. It's a smoothness indicator. Positive jerk means force is increasing, negative means it's decreasing.

A smoothness score (0–100) appears below the chart. Above 80 is excellent. Below 60 suggests choppy or uneven force delivery. Two riders with identical peak G-force can have very different jerk profiles — the smoother rider is usually more consistent and more efficient.

### Impulse

Cumulative force over time, shown as a rising line. The steeper the rise, the more force per unit time. Key numbers: total impulse (total force delivery for the run) and time to 50% impulse (how long it took to deliver half your total force). Gate starts reward front-loaded power — getting 50% of your force in under 0.5 seconds is much better than spreading it evenly across 2 seconds.

### Power

Estimated using force × velocity. Only appears if you have rider weight and bike weight entered in your profile — without accurate mass data the numbers would be misleading, so the system doesn't show them.

These are estimates from IMU data, not crank power meter measurements. With the breakbeam module the velocity component is more accurate, which improves the power estimate. Without it, treat power figures as useful relative comparisons rather than absolute values.

---

## Technique Scoring

Four component scores, weighted into an overall score:

- **Reaction (30%)** — based on your reaction time relative to benchmarks for your rider level
- **Explosiveness (25%)** — how much of your power you front-load into the first 500ms relative to your peak
- **Smoothness (25%)** — how steady your force application is, derived from jerk analysis
- **Efficiency (20%)** — how quickly you convert acceleration into speed

Overall score ranges: 85–100 is excellent, 70–84 is good, 55–69 is fair, below 55 needs work. Scores are benchmarked against your declared rider level — a grom scoring 70 and a club rider scoring 70 are at different absolute levels.

The technique scores are most useful when tracked over time. A single session's scores are data points. Ten sessions' scores show a trend. Watch for all scores improving together (technique work is paying off), or inconsistencies — reaction improving while smoothness drops often means you're rushing the start; efficiency stuck while explosiveness improves usually means a technique or setup issue.

Don't chase perfect scores. Chase consistent scores that stay stable or improve as your absolute performance improves.

---

## Key Metrics

**Reaction time** is time from gate drop to first detectable movement. It's as close to a direct measurement as the system gets — the sensor catches the moment you actually start moving, not when you intend to. Benchmarks: under 220ms is elite, 220–250ms national, 250–280ms regional, 280–320ms club, above 320ms developing. High variance (50ms+ range across runs) usually means inconsistent preparation. Consistently under 180ms might mean you're anticipating the gate rather than reacting to it — a call for your coach, not the data.

**Max G-force** conflates strength, technique, body position, and bike setup. Two riders with identical max G might be doing completely different things. Its value is as a tracking metric over time. Rising max G with stable or improving technique scores means you're getting stronger and maintaining form. Rising max G with falling technique scores means you're muscling it.

**Peak speed** — with the breakbeam, this is anchored to a real measurement and is genuinely reliable. Without it, it's calculated from acceleration integration and is best used for relative comparison between your own runs rather than as an absolute figure.

**Consistency (CV%)** is the coefficient of variation of your reaction times across the session. Below 5% is excellent, 5–8% good, 8–12% fair, above 12% variable. A rider who hits 0.260s every run beats one who hits 0.220s once and 0.310s twice. Racing rewards reliability, and consistency is trainable — improving it usually precedes improving peak times.

---

## Phase Analysis and Speed Splits

The system divides your gate start into three phases: the drive phase (maximum force application), the transition phase (converting force to velocity), and the velocity phase (maintaining the speed you've built). Each has its own duration, efficiency, and characteristic metrics.

The drive phase is your snap — explosive power delivery. Problems here show as low peak G, late peak timing, or poor front-loading.

The transition phase is where technique quality reveals itself. You generated force in the drive phase; now you're translating it to speed. Low efficiency here despite good G-force usually points to technique or body position.

The velocity phase is about maintaining what you've built. Early peak (speed peaks and drops quickly) or poor endurance through the run show up here.

The speed splits table (when valid data exists) shows when and where you reached target speeds — 30, 40, 50 km/h and so on, with time from gate drop and distance at that point. Tracking these over multiple sessions shows whether your acceleration efficiency is improving.

---

## Session-Level Patterns

**Cross-run progression** shows how a metric changed across your runs in order (run 1 → 2 → 3 → etc). Declining trend = fatigue. Improving trend = warm-up effect or finding your rhythm. Flat trend = consistent preparation.

**Optimal set length** — the system estimates how many runs you can sustain at high quality per session. If your drop-off consistently happens at run 6, doing 10-run sessions means 40% of your reps are junk. Use this to plan your sessions rather than grinding through more reps than you can do well.

**Wheelie detection** — if you have timeseries data, front wheel lift is tracked: whether it happened, when, how long. Wheelies at the gate aren't necessarily a problem. Whether it's costing you speed and whether you can control it is context the data can't provide — that's for your coach.

---

## Data Quality

Each run has an analytics valid flag from the firmware. If it's false, speed-based metrics don't appear — not because the system is being precious, but because showing potentially misleading numbers is worse than showing nothing. Reaction time and raw G-force always appear because they're direct measurements. Calculated metrics are hidden when the underlying data isn't trustworthy.

Without the breakbeam, the bias correction value tells you how much correction was needed for the speed integration. Under 0.5 m/s² is excellent. Above 3.0 m/s² means treat speed estimates as approximate. High bias correction usually means the device wasn't calibrated properly before the run or wasn't mounted securely. With the breakbeam, the speed curve is anchored to a real measurement so bias correction matters less.

If analytics don't appear, it's usually one of: analytics_valid is false for that run, your profile is missing weight data (needed for power), or the acceleration data was incomplete. The system won't fill gaps with guesses.

---

## What to Look At

**Every session:** Reaction time and consistency, max G-force, technique scores, G-force chart shape. Quick visual confirmation that things look reasonable — 30 seconds if nothing's unusual.

**When something feels off:** Data quality badge and bias correction value first. Then speed curve shape. Then jerk profile (was technique clean or choppy?). Then drop-off analysis if you had more than five runs.

**Occasionally:** Speed splits (tracking specific distance targets), phase analysis (understanding where improvements happened), power estimates (tracking strength progression over time).

**When investigating a specific issue:** The run comparison tool, historical context, and data drill-down for raw export. These are there when you need them, not to be checked every session.

---

## Common Patterns

**Good session:** Technique scores stable (70–85), consistency CV% below 8%, G-force chart shows clean early peak with gradual decline, best and average runs within 5–10%, no data quality warnings. Repeatable, efficient starts. This is what you're building toward.

**Fatigue session:** Performance degrades run to run — reaction times slow, G-force peaks lower and later, smoothness scores drop, technique deteriorates through the session. Either you came in already fatigued, or the session was too long. Cut set length or increase recovery time.

**Chasing peaks:** Best run is 15–20% better than average, high variance across all metrics, some runs excellent and others poor, CV% above 12%. You're trying to hit a perfect run instead of building consistent mechanics. Back off the intensity and focus on repeatability.

**Equipment or setup issue:** All runs show the same odd pattern. Efficiency scores particularly low despite reasonable G-force. Power and speed don't align. Unlike fatigue, which gets worse through a session, equipment issues affect all runs similarly.

**Data quality issue:** Multiple runs with analytics_valid false, high bias correction, speed curves that don't make sense. Check calibration, check mounting, note it and move on. Learn what you can from the reaction time and G-force data.

---

## Honest Limitations

The session page contains three types of information and they're not equally reliable.

**Direct measurements** — reaction time, elapsed time (precision with breakbeam, recording window without), acceleration trace, pitch and roll angles. These are the numbers you can trust most. With the breakbeam, elapsed time joins this category fully.

**Calculated metrics** — peak speed, power, efficiency scores. With the breakbeam these are significantly more accurate. Without it, they're good for comparing your own runs against each other but treat absolute values with appropriate caution.

**Interpreted insights** — technique scores, weakness identification, phase classifications. Pattern recognition from formulas. Useful as suggestions and prompts, not as prescriptions. The system can tell you what the data looks like — it can't tell you why it looks that way or exactly what to change.

Use direct measurements to track absolute progress. Use calculated metrics for relative comparison. Use insights as starting points for conversations with your coach, not as verdicts.

---

## A Note on Information Overload

There's a lot on this page. You don't need to look at all of it every session, and trying to will make it less useful, not more.

Most sessions: look at the summary, check technique scores, glance at the G-force chart, note anything unusual. Thirty seconds.

Sessions where something's interesting or you're working on a specific thing: ten minutes if you're going deep on a particular issue.

The detailed analytics are there for investigation, not for routine consumption. Use them when you have a question they can answer.

---

*For help with specific sections of the session page, use the Help buttons throughout the page.*

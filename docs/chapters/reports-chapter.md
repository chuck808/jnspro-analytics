# Reports

---

## What Reports Are For

The session page shows you everything. Every metric, every chart, every number the system can calculate. That's useful when you're exploring your data, but it's not useful when you want to share what happened with your coach, or when you just want to understand the key points without clicking through fifteen sections.

Reports take the data and turn it into a document. Focused, readable, shareable. Not everything — the things that matter.

There are two kinds. Session reports summarise a single session — what happened, how consistent you were, what to work on next. Progress reports summarise your training over time — which direction things are moving, what's improving, what isn't, how confident the system is in what it's seeing.

---

## Generating a Session Report

From any session page, scroll to the bottom and click **Generate Session Report**. A panel opens where you pick the detail level and what to include, then click Generate. The report appears immediately — you can read it on screen, print it, save it as PDF, or export the raw data as JSON.

Generate one when you want to send a summary to your coach, when you've had a session worth documenting, or when you want to understand what just happened before the context fades. Don't generate them out of habit and then not read them.

---

## Generating a Progress Report

From the Analytics page, once you've uploaded at least three sessions, you'll see a **Generate Progress Report** button. This looks across all your sessions and tells you what's actually changing over time — reaction time trending faster or slower, consistency tightening or widening, fatigue appearing earlier or later in sets.

Three sessions is the minimum the system needs to identify a pattern rather than just connecting two dots. With ten or more sessions, the analysis gets considerably more reliable.

---

## Detail Levels

When you generate a report you choose a detail level. These are genuinely different documents, not just the same thing at different lengths.

### Simple

For the rider themselves, or for parents who want to know how things are going without technical context.

Plain language. One or two focus points. Clear next-session actions. No scores, no percentages, no jargon. If your report says "your starts were consistent but your force application was choppy," that's a Simple report. You know what it means and what to do about it without needing to understand what coefficient of variation is.

### Standard

For club-level riders who are engaged with their training and want a bit more than the headline.

Key metrics with one-line explanations. Recommendations with brief reasoning. Data quality notes where they're relevant. You'll see numbers — session quality score, repeatability score — but each one is explained rather than presented raw.

### Coach

For coaches, or for experienced riders who are self-coaching at a serious level.

Full session intelligence. Technique pattern analysis — not just scores, but what the pattern suggests. Best-vs-average gap with training implications. Conflicts between metrics called out explicitly. Prioritised recommendations with watch-for indicators.

This level is direct. It describes what the data shows and what it implies for training decisions. If your drop-off is early and your best-vs-average gap is wide, the report will say so and tell you what that combination typically means. It assumes you understand coaching terminology and can handle a candid reading of the data.

### Technical

For data analysis, debugging, or when you need everything.

Everything from Coach level, plus raw metric values, full data quality diagnostics, and an appendix of computed values. Use this if you're exporting data for your own analysis, troubleshooting something that looks wrong, or you want to see exactly how the system arrived at a conclusion.

---

## The Honest Questions

### What does "trends are emerging" mean?

It means the system can see a pattern in your data but doesn't have enough sessions yet to be statistically confident it's real rather than noise.

Progress reports are based on comparing your recent sessions against your earlier sessions. The more sessions you have, the more confident the system can be. With three or four sessions, it'll flag patterns as emerging — they're probably real, but they might just be variation. With ten or more sessions, if the trend holds, it'll show as high confidence — the pattern is reliable enough to plan around.

The confidence indicator isn't about whether your data is accurate. Your reaction times are what they are — they're measured directly. It's about whether the *trend* is reliable. And the system is honest about the difference rather than presenting every movement as a significant development.

- Low confidence: this might be a thing, keep an eye on it
- Trends emerging: this is probably a thing, don't overreact yet  
- High confidence: this is definitely a thing, plan accordingly

### What does "best vs average gap" mean?

Your best run in a session is your ceiling. Your average run is your floor. The gap between them tells you where your training effort should go.

A 5% gap means most of your runs are close to your best. You're producing reliable starts. When you race, you'll tend to perform near your ceiling.

A 25% gap means you can produce a fast start, but most of your runs are well below that. You're inconsistent. In training that's frustrating. In racing it's expensive — sometimes you'll be fast, often you won't, and you can't predict which.

If your gap is wide, the fix usually isn't trying harder on every run. It's usually the opposite — dial back slightly, focus on repeatable execution, and let your average improve. Your peak might not move for a while, but your floor will rise, which is what training is supposed to achieve.

Progress reports tell you whether this gap is getting wider or narrower over time. Narrowing is progress. Widening means you're probably chasing peaks at the expense of consistency.

### Why is speed described as "directional only"?

Because it's calculated rather than measured.

Reaction time is a direct measurement — the sensor detected when you moved, and recorded the time. That number is reliable.

Speed is calculated by integrating your acceleration data over time. If you accelerated at 2.5G for 0.8 seconds, the maths gives you an approximate speed. But small errors in sensor readings compound as the calculation runs, which is why the firmware applies a bias correction. When that correction value is high — above about 1.5 m/s² — the system knows the speed estimate is getting unreliable.

"Directional only" means: the chart is probably showing the right shape, and the number is probably in the right ballpark, but don't quote it as a precise figure. Use it to compare runs within the same session, or to see whether your speed is trending up across sessions. Don't use it to argue about whether you hit 32 km/h or 34 km/h.

For tracking your own progress over time, directional speed is fine. For precise analysis, you'd want a speed trap or GPS to cross-reference.

### Can I share a report with a coach who doesn't use AppGatePro?

Yes. The report is self-contained — it doesn't assume the reader has platform access or knows how to interpret the session page. It explains what the numbers mean, what they suggest, and what to do about them.

Print it, save it as PDF, or copy the text into a message. The JSON export is there if your coach wants structured data rather than a formatted document.

Reports don't include your account details. If you want to share anonymously — posting on a forum for feedback, for example — that's fine.

### Why doesn't the report match exactly what I see on the session page?

Because the report is selective and the session page isn't.

The session page shows every metric the system can calculate, because different riders care about different things. The report picks the metrics that matter most for the key patterns it's identified and explains what they mean. It's a coaching summary, not a data dump.

Some things that appear on the session page won't appear in the report:

- Individual run metrics (the report focuses on session-level patterns, not run-by-run detail)
- Speed values when data quality is poor (rather than show unreliable numbers, it omits them and explains why)
- Power estimates when weight data is missing (same reason)
- Every chart (charts are optional — tick the box if you want them included)

The session page is your analysis workspace. The report is what you take away from it.

---

## What the Report Can't Tell You

Reports are good at summarising what happened and identifying patterns. They're not coaching.

They won't diagnose complex technique problems — they'll identify the area but not prescribe a fix. They won't compare you against other riders. They won't make training programme recommendations. And they won't override your coach's judgement — they're a tool for coaching conversations, not a replacement for them.

No report will show you metrics where the data quality is too poor to be useful. The system suppresses unreliable numbers rather than presenting them with asterisks. And if there aren't enough sessions for trend analysis, it'll say so rather than attempting it anyway.

If a report conclusion doesn't match what you or your coach are seeing in person, trust your eyes. The data is what it is, but coaching involves context the sensors don't have.

---

## Common Situations

**"The report says I'm improving but I don't feel faster."**

Progress often shows up in the data before it shows up in perception. If your average reaction time is dropping from 0.31s to 0.28s over ten sessions, that's real improvement — but it doesn't feel dramatically different because the change is gradual. Also check what the report is actually saying is improving. Sometimes it's consistency or repeatability rather than raw speed, which is still progress but shows up differently in how you feel.

**"I got a personal best but the report says the session quality was poor."**

One great run in a session of otherwise inconsistent runs will set a PB but produce a poor session quality score and a wide best-vs-average gap. Both things are true. The report will acknowledge the PB and point out that most of your runs weren't close to it. What you do with that depends on your training phase — if you're experimenting and one run clicked, that's useful. If you're in a consistency phase, it's a flag.

**"The report flagged a problem but my coach says I'm fine."**

Trust your coach. The report is looking at sensor data and applying statistical patterns. Your coach is watching your movement and making coaching judgements that go beyond what a sensor can see. Use the report to inform the conversation, not to override coaching decisions.

---

## What to Pay Attention To

**Direction, not just values.** Is the thing you're working on moving the right way? A reaction time of 0.265s means nothing without knowing whether it was 0.280s last month or 0.245s.

**Confidence level.** A medium-confidence trend is interesting. A high-confidence trend is something to plan around. Don't celebrate or panic based on three sessions.

**Conflicts.** If the report mentions that one metric is improving while another is declining — speed up but consistency down, for example — that's worth investigating. These patterns are easy to miss session-to-session but compound over weeks. The report spots them.

**Data quality notes.** When the report says "speed values are directional only" or "some metrics weren't available," that's the system being honest about what to trust. Don't skip those notes.

---

## A Note on Saving Reports

Reports aren't currently saved to your account. If you want to keep one, export it as PDF or save the text. 

Saving report history, automatic scheduled reports, and report-to-report comparison are planned for future versions. The core system needs to be reliable first.

---

*For help with the session page metrics that feed into reports, see the Session chapter. For understanding the trend analysis that drives progress reports, see the Analytics chapter.*

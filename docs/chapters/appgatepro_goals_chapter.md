# Training Goals

---

## What Goals Are For

Training without a target tends to drift. You show up, you do your runs, you get numbers — but there's no clear line between where you are and where you're trying to get to. The goals system creates that line.

It's not a points system or a badge collection. You set a target for a specific metric, give yourself a deadline, and the system tracks whether you're moving in the right direction and at a realistic pace. That's it.

Once a goal is active, everything runs automatically. Every session you upload updates your progress. The system watches your data, spots when something meaningful changes, and tells you what it sees. You don't have to do anything except keep training and keep uploading.

---

## Setting a Goal

To create a goal you need three things: a metric, a target value, and a deadline.

**The metric** is what you're trying to improve — reaction time, peak G-force, consistency, elapsed time, acceleration phase, or gates per session. The system pulls your current value from your recent session data automatically, so you'll see where you're starting from before you set a target.

**The target value** is where you want to get to. The system will suggest a range — conservative, realistic, ambitious — based on typical improvement rates for your current level. These suggestions are statistical rather than motivational. A conservative target assumes you'll improve at the lower end of what's typical. Ambitious assumes the upper end. Stretch assumes everything goes perfectly.

Pick the one that feels genuinely achievable in the time you've set. The system won't let you create a goal that's statistically implausible — if your best reaction time is 0.350 seconds, it won't let you target 0.200 seconds in four weeks. Not because it's judging your ambition, but because a target that far outside realistic improvement rates is more likely to demotivate than focus your training.

**The deadline** is when you want to get there. You can always extend it later if your timeline shifts.

If you train at a specific distance — 10m, 20m, 50m — you can add that to the goal and the system will only consider runs at that distance when tracking progress. Useful if you're training for a specific track setup. If you leave it blank, the system uses your best performance across all distances.

---

## What the Metrics Actually Mean

**Reaction time** is the time from gate drop to first detectable movement. It's a direct sensor measurement. Lower is better. Typical improvement with focused training is 2–5% per month.

**Peak G-force** is your maximum acceleration during a run, usually in the first half-second. Higher is better. It reflects strength, technique, and body position together, which means improvements can come from several directions at once. Typical improvement is 3–8% per month.

**Consistency** measures how repeatable your reaction times are within a session — specifically, the coefficient of variation. Higher is better. Consistency often improves faster than raw performance because it's more about routine and preparation than physical development. 5–10% per month is achievable.

**Elapsed time** is the total run time from gate drop to end of recorded data. Lower is better. How quickly this improves depends heavily on distance and what technique changes you're making.

**Acceleration phase** is the time to reach peak speed. Lower is better. This is technique-dependent and can change quickly with form improvements, or plateau if you're already efficient.

**Gates per session** is how many runs you complete. Higher is better. This is about fitness and recovery capacity rather than technique.

---

## How the Progress Predictions Work

Once you've uploaded at least two sessions after creating a goal, the system starts estimating when you'll hit your target. These aren't guesses — they're regression models fitted to your actual data.

The system tries three approaches and uses whichever fits your data best. Linear regression assumes steady, constant improvement. Polynomial regression assumes fast early gains that slow down over time — common when you're new to training or working through a technique change. Exponential fitting assumes improvement that accelerates — less common, but it shows up when training effects start to compound. The system calculates how well each model fits and picks the best one automatically.

The prediction shows as a range rather than a single number. When you see "5–9 sessions, most likely 7," that means the most likely outcome is 7 sessions, but the realistic range given your current data is 5 to 9. The range gets tighter as you accumulate more sessions — with three or four data points it might be wide; with ten or twelve it should be much tighter.

The system also shows a confidence level — typically 68% or 85%. An 85% confidence level means there's an 85% probability your actual progress will fall within the stated range, assuming your improvement rate continues more or less as it has been.

When the system can't generate a reliable prediction — because your progress has stalled, the data is too noisy, or the model fit is poor — it tells you why rather than showing something misleading. That's more useful than a confident number that isn't actually reliable.

---

## Progress Status

Each goal has a status that updates every time you upload a session. It's calculated by comparing your actual improvement percentage to where you should be based on how much time has passed.

**Way Ahead** means you're 30% or more ahead of schedule. You'll hit the target comfortably before the deadline. Worth noting — rapid progress can sometimes indicate overtraining. The health monitoring section covers this.

**Ahead** means you're 10–30% ahead of schedule. This is the position you want to be in.

**On Track** means you're within 10% either way of where you should be. Keep doing what you're doing.

**Behind** means you're 10–30% behind schedule. Not critical yet, but something needs to change — either more training, different training, or a more realistic deadline.

**Way Behind** means you're 30% or more behind schedule. Unless something changes significantly, you won't hit this goal by the deadline. Time to reassess whether the target or the timeline needs adjusting.

**Stalled** means your last three sessions show no improvement, regardless of where you are relative to schedule. Stalled progress usually means something needs to change — technique, recovery, training load, or the goal itself.

These statuses are directional rather than precise. They don't account for the fact that improvement is rarely linear. Use them as prompts to think about your training, not as verdicts on whether you're doing well.

---

## Milestones

Whenever your performance improves by at least 0.5% toward a goal, the system automatically records a milestone. Over time, these build into a timeline on your goals page showing the actual dates your performance improved:

```
0.245s · 15 Jan  →  0.238s · 3 Feb  →  0.229s · 20 Feb  →  0.218s · 10 Mar
```

The 0.5% threshold exists to filter out measurement noise. Session-to-session variation is typically 1–2%, so a 0.5% improvement represents a genuine step forward. Smaller improvements still count toward your goal's current value — they just don't create a marker in the timeline.

The dates are accurate — they reflect when the improvement actually happened, based on the session timestamp, not when you viewed the session.

When you view a session that created a milestone, you'll see a marker on the goal progress section of that page. On the goals page itself, you'll see the full timeline.

There's no ceremony around milestones. They're data points, not events. Their value is in looking back at them later and seeing that progress happened consistently — or spotting that the gaps between milestones have been getting longer, which is useful information in itself.

---

## Health Monitoring

This is where the system does something most goal trackers don't bother with: it watches for signs that you're pushing too hard.

Every time you view your goals, the system looks at your recent sessions for three things. First, a fatigue score based on whether your performance is declining, how consistent your runs are within sessions, and how your training load has changed recently. A score under 30 is normal. 30–60 is moderate fatigue, worth monitoring. Over 60 means consider a rest day. Over 80 means stop.

Second, training load — your session frequency and intensity over the last few weeks. A sudden increase of more than 30% in volume, or too many consecutive training days without rest, gets flagged as a load spike.

Third, performance anomalies — statistical patterns that look unusual. Sudden drops in performance, extreme session-to-session variation, or inconsistent technique metrics that suggest fatigue or something else is going on.

The health status runs from Healthy through Monitor and Caution to Critical. If you see Monitor, keep training but pay attention to how you're recovering. Caution means consider reducing intensity or taking a rest day. Critical means rest — don't push through it.

One reading at Caution might be noise. Three in a row is a signal worth taking seriously.

What the health monitoring can't do is account for things it doesn't know about — nutrition, sleep, illness, stress, other training. It can spot that your data looks like overtraining patterns. It can't tell you why, and it's not medical advice. Use it as one input into your training decisions alongside your own judgement.

---

## Suggestions

When your progress status changes significantly, the system generates suggestions for what to do about it. If you're well ahead of schedule, it might suggest you're ready for a more ambitious target. If you're behind, it might suggest extending the deadline or reassessing whether the target is realistic. If the health monitoring is flagging concerns, it might suggest pausing the goal temporarily.

These suggestions are generated from your data. They're context-aware but they're not omniscient. Sometimes the right call is to follow them. Sometimes it's to ignore them. That's a judgement call only you can make — the system can see your data but it can't see everything.

---

## What's Worth Paying Attention To

**The prediction range, not just the median.** A tight range (5–7 sessions) means the system is confident. A wide range (4–15 sessions) means your data is noisy or inconsistent. The range tells you more than the single number.

**Whether the prediction model keeps changing.** If it switches between polynomial, linear, and polynomial every few sessions, your improvement isn't consistent enough for reliable forecasting. That's useful information about your training, not a failure of the system.

**Health warnings that persist.** One caution flag might be noise. Three in a row is signal. The system is designed to be conservative — it would rather flag a false positive than miss something real.

**Whether milestones are getting further apart.** If your early milestones were weeks apart and recent ones are months apart, your improvement rate is slowing. This is normal as you approach your limits, but it's worth noticing when you're thinking about deadline realism.

**When the system's suggestion agrees with your gut.** If it suggests extending your deadline and you've been quietly thinking the goal was too aggressive, take that seriously. If it suggests a rest and you've been feeling ragged, definitely take it.

---

## What Not to Worry About

**Small fluctuations in your progress percentage** between sessions. Measurement noise of 1–2% is normal. Only sustained changes across three or more sessions are meaningful.

**Hitting the median prediction exactly.** If the system said 7 sessions and it took 9, you were in the upper end of the range. That's not a failure.

**Collecting milestones.** Having 10 milestones instead of 5 doesn't mean anything except that you had more 0.5%+ improvements. The overall trajectory matters, not the count.

**Perfect adherence to the suggestions.** They're recommendations from a system that can see your data but not your full situation. Use them as prompts, not instructions.

---

## When to Delete or Adjust a Goal

Goals aren't permanent. Delete or complete them when the target no longer makes sense — you've hit it, your priorities have shifted, you've had an injury, or the target is demotivating you rather than focusing you.

You can extend the deadline if your timeline was too ambitious. You can adjust the target if your starting point was wrong or your situation has changed. The system isn't tracking whether you stick to the original terms. It's tracking whether you're making progress.

If a deadline passes without you hitting the goal, the system archives it without penalty. You can look back at what you achieved, decide whether to try again with a fresh goal, and move on.

---

## Honest Limitations

The predictions work well when you're training at least weekly, your data quality is consistent, and you're in an active phase of improvement. They work poorly when sessions are sporadic, your data is noisy, or you're already close to your physiological ceiling.

The models assume your current improvement rate will continue. That's often wrong. Progress isn't linear — you'll plateau, then jump, then plateau again. The system adjusts as it gets new data, but it can't predict when a technique breakthrough will happen or when you'll hit a wall.

The health monitoring is pattern recognition, not medical advice. If you're injured or ill, see someone qualified to help — the goals dashboard isn't the right tool for that.

Used consistently and honestly, the goals system should help you train more intentionally and reach targets more reliably than you would without it. That's what it's for. It's organized data with some maths applied to it — useful, but not magic.

---

*For help with specific aspects of the goals system, use the Help section on the goals page.*

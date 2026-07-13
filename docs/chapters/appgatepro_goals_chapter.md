# Training Goals

---

## What this is actually for

Training without a target tends to drift. You show up, do your runs, get numbers — but there's no clear line between where you are and where you're trying to get to. That's the entire point of this page: it gives you that line, then watches your sessions and tells you honestly whether you're moving along it.

It's not a badge collection or a points system. Set a target, give it a deadline, and the system tracks whether you're on pace — automatically, every time you upload a session. You don't do anything extra. Just keep training and keep uploading.

![Training Goals header](/docs/goals-header-stats.png)

---

## Setting a goal

Three things: a metric, a target, and a deadline.

For the **metric**, the system pulls your current value straight from your recent sessions, so you're setting a target from where you actually are, not a guess. It'll also suggest conservative/realistic/ambitious target ranges based on typical improvement rates — and it won't let you set something statistically implausible. If your best reaction time is 0.350s, it isn't going to let you target 0.200s in four weeks. That's not the system doubting you; a target that far outside realistic improvement is more likely to demoralise than motivate.

If you train at a fixed distance, add it — the system then only counts runs at that distance toward your progress. Leave it blank and it uses your best across all distances.

---

## Reading a goal card

![A single goal card, mid-progress](/docs/goals-goal-card.png)

Start, current, and target values sit right there, along with a **Status** that updates every time you upload:

| Status | What it means |
|---|---|
| Way Ahead | 30%+ ahead of the pace you'd need to hit the deadline |
| Ahead | 15–30% ahead of pace |
| On Track | Within ±15% either way — right where you should be |
| Behind | 15–30% behind pace |
| Way Behind | 30%+ behind — unless something changes, you're not hitting this deadline |
| Stalled | No meaningful improvement across your last three sessions, regardless of overall pace |

These are directional prompts, not verdicts. Progress isn't linear — you'll plateau, then jump, then plateau again — so don't read too much into any single session nudging your status one way or the other.

---

## The predictions are real regression, not guesses

Once you've logged at least two sessions after creating a goal, the system starts estimating when you'll hit your target — and it's doing actual curve-fitting against your data, not eyeballing it. It tries linear (steady improvement), polynomial (fast early gains that taper — common early on or after a technique change), and exponential (accelerating improvement) fits, and picks whichever matches your actual sessions best.

The prediction shows as a range, not a single number — "5–9 sessions, most likely 7" — because a single number would be false precision. That range narrows as you log more sessions: wide with three or four data points, much tighter by ten or twelve. It also comes with a confidence level, typically 68% or 85%, meaning exactly what it sounds like: an 85% chance your actual progress lands inside that range, assuming your current trajectory holds.

If the data's too noisy or thin to predict anything reliable, it says so rather than showing you a confident-looking number it can't back up.

---

## Milestones

Every time your progress improves by at least 0.5%, it gets logged as a milestone — building into a timeline of the actual dates your performance moved:

```
0.245s · 15 Jan  →  0.238s · 3 Feb  →  0.229s · 20 Feb  →  0.218s · 10 Mar
```

The 0.5% threshold exists purely to filter out measurement noise (normal session-to-session variation is 1–2%), so a milestone means a real step, not statistical wobble. No fanfare attached to them individually — their value is in looking back later and seeing whether progress has been steady, or whether the gaps between milestones have been quietly stretching out.

---

## Health monitoring — the part most goal trackers skip

Every time you check your goals, the system also looks at your recent sessions for signs you're pushing too hard: a fatigue score, training load spikes, and unusual performance patterns.

| Fatigue score | What it means |
|---|---|
| Under 20 | Well-recovered, ready to train |
| 20–39 | Minor indicators — continue, but keep an eye on recovery |
| 40–59 | Moderate fatigue — consider reducing intensity or a rest day |
| 60–79 | Significant — a rest day is strongly recommended |
| 80+ | High — take 2–3 full rest days |

> **Worth knowing:** one reading in the caution zone might just be noise from a single hard session. Three in a row is a real signal worth acting on. The system is deliberately built to err toward flagging a false positive rather than missing something real — so don't panic at a single amber reading, but don't ignore a pattern either.

What this can't do: know about your sleep, nutrition, stress, or anything else going on outside the sessions you upload. It can recognise that your *data* looks like overtraining. It can't tell you why, and it isn't medical advice — treat it as one input among several, not the final word.

---

## Suggestions

When your status shifts meaningfully, the system generates a specific, actionable suggestion rather than a generic nudge — well ahead of schedule might prompt a more ambitious target or a shorter deadline; behind schedule might prompt extending the deadline or easing the target; stalled progress prompts a suggestion to revisit the goal entirely; and health-monitoring concerns can prompt pausing a goal outright rather than pushing through.

Each suggestion comes with the actual data behind it, and you can apply it directly — clicking apply on an extended deadline genuinely extends the deadline there and then. They're prompts, not instructions. Sometimes the right call is to follow one. Sometimes it's to ignore it. The data's there either way.

---

## When to change or drop a goal

Goals aren't a contract. Delete or complete one whenever the target stops making sense — you've hit it, priorities shifted, you picked up an injury, or it's become demotivating rather than focusing. Extend the deadline if your timeline was too ambitious. Adjust the target if your starting point turns out to have been off. If a deadline passes without the goal being hit, it just archives quietly — no penalty, and nothing stopping you from setting a fresh one and trying again.

---

## Honest limitations

The predictions work well when you're training at least weekly with reasonably consistent data quality. They work poorly with sporadic sessions, noisy data, or once you're close to your physiological ceiling — the models assume your current trajectory continues, which is often wrong, since real progress plateaus and jumps rather than climbing in a straight line.

And to say it plainly: the health monitoring is pattern recognition, not medical advice. If you're actually injured or unwell, that's a conversation for someone qualified, not this dashboard.

Used honestly, this system should help you train with more intention and hit targets more reliably than winging it. That's genuinely what it's for. It's organised data with some maths applied — useful, but not magic.

---

_For help with any specific part of the goals system, use the Help section on this page._

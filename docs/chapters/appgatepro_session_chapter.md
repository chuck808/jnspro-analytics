# Your Session Data

---

## What you're looking at

You just uploaded a session. Now there's a page — well, three pages — full of numbers, charts, and little coloured badges. Here's what it all means and, more importantly, how much of it you actually need to look at.

Short version: not all of it, not every time. This is the most detailed view in the whole system — everything the sensor recorded, everything the firmware calculated, everything the analytics engine derived from that. That's a lot to take in, so it's split across three pages instead of dumped on you all at once. Think of them as three different questions:

- **Overview** — "How did today go?"
- **Analysis** — "What actually happened in this specific run?"
- **Deep Dive** — "I want to dig into something specific."

You'll use Overview every session. You'll use Analysis often. Deep Dive is there for when something's odd or you want to compare things properly — most sessions you won't touch it at all, and that's fine.

---

## Overview — the 30-second check

This is where you land after uploading, and it's built to be skimmed.

![Session overview — context, tags, and the session summary](/docs/session-overview-top.png)

At the top: the date, how many runs, and a **Context** panel where you can log the weather, track surface, and how the session felt. None of this changes your numbers — a 0.198s reaction time is 0.198s whether it was sunny or pouring — but it gives future-you something to look back on. If you notice six months from now that your times are consistently better on dry concrete than damp asphalt, that's only visible because you logged it. If you just want the data and can't be bothered, ignore this section entirely. Nothing downstream depends on it.

Below that is **Tag runs** — mark a run as a warmup, your best effort, an experiment, or exclude it from stats entirely. This matters more than it sounds like it should: tagged-out runs still exist and you can still look at them, they just stop dragging your session averages around. If you always throw in two throwaway warmup runs before your real efforts, tag them — your consistency score will actually reflect your training instead of getting muddied by laps you weren't trying on.

> **Worth knowing:** if you've got active training goals, a small progress indicator shows up here too, telling you which metric moved and by how much. And if the session produced something genuinely worth celebrating — a real personal best, not just "a decent run" — you'll see a **Share** button that generates a card you can post or send to your coach. It only shows up when something real happened; the system won't manufacture excitement out of an ordinary Tuesday.

Scroll down and you'll hit the session narrative — a plain-English paragraph, not a wall of numbers, telling you what the data actually shows. Then strengths/focus areas, the headline stats (best reaction, best peak speed, best max G, consistency), and finally a chart showing how you trended across the runs in this session:

![Cross-run progression chart, tracking reaction time across the session](/docs/session-overview-progression.png)

A rising line here isn't automatically bad — it depends what you're tracking (lower reaction time is better, higher peak speed is better) — but a *consistent* decline across the session, in whichever direction is worse for that metric, usually just means fatigue. That's useful to know before your next set.

---

## Analysis — pick a run, see everything about it

This is where the actual investigation happens. Select a run from the row of buttons, and the whole page fills in with that run's data.

![Run selector, with tags visible only on the selected run](/docs/session-analysis-run-selector.png)

Notice only the *selected* run shows its full tag control — the others just show a small tag icon if they've got one, so the row doesn't turn into visual noise once you've tagged half your session.

### Attaching video

Attaching video is entirely optional, per run, and off by default — plenty of sessions won't have one, and that's not a missing feature, it's the intended state. A low-key "+ Add video" link sits on this page for any run that doesn't have one yet; upload a clip from your phone, an action cam, whatever your mate happened to be holding, and it attaches to that specific run.

**How the sync actually works.** The light tower fires a brief white flash at the very start of every gate sequence — well before the green "go" light, timed so it never interferes with the moment you're actually reacting to. The app scans your uploaded clip for that flash and uses it to line the video up against the G-force trace automatically. You don't drag anything into place by hand. If the flash isn't visible in your clip for whatever reason — bad framing, the camera started late — sync detection just fails gracefully and you get a plain video player instead of a broken or misaligned one. Nothing else about the run breaks.

**Once it's synced**, the video plays as a hero player at the top of the page with three layers of information built around it:

- A couple of **persistent stat pills** in the corner — reaction time, peak speed, and technique score — visible the whole time, not just at one instant.
- A **live telemetry readout** below the video that updates as you scrub or play — the actual G-force and speed value at whatever instant you're currently watching.
- **Momentary callouts** that appear only when the video passes a specific instant worth flagging — peak G-force, or a wheel lift, timed to when they actually happened in the footage rather than sitting on screen the whole time as clutter.

Underneath the video is a merged scrub bar — the G-force trace itself doubles as the seek control, so dragging through the chart moves the video and vice versa. It spans the whole clip, not just the timed portion, since the run-up to the gate has real viewing value too.

![Live telemetry readout and the merged scrub bar underneath the video](/docs/session-analysis-video-hero.png)

### The G-force chart

The chart everyone checks first:

![G-force chart for a single run](/docs/session-analysis-gforce.png)

What you actually want to see: an early peak (ideally in the first half-second to a second), one clean dominant peak rather than several smaller bumps, and a gradual taper afterward rather than a cliff-edge drop. That shape means you front-loaded your power into the snap. Several similar-height peaks usually means uneven pedal strokes rather than one clean drive.

Rough feel for the numbers: 2.0–2.5G is solid club-level output, 2.5–3.0G is strong, and above 3.0G is pushing toward the edge of what the sensor measures reliably — treat very high spikes with a little healthy skepticism.

### Speed, jerk, impulse, power

Below the G-force chart:

- **Speed & Acceleration** — a dual-axis chart. Speed should build in a rough S-curve; peak acceleration should land noticeably *before* peak speed. If they're happening at the same instant, something about the run doesn't add up.
- **Jerk** — how fast your force output is changing. It's a smoothness read. Two riders can post identical peak G with very different jerk profiles — the smoother one is usually the more efficient one.
- **Impulse** — cumulative force over the run. Gate starts reward front-loading: getting half your total force out in under half a second beats spreading the same total evenly across two seconds.
- **Power** — only shows up if you've entered your weight and bike weight in your profile. Without real mass numbers, a power estimate is just a guess dressed up as a figure, so the system doesn't show one at all rather than show a misleading one.

### Two technique scoring systems, on purpose

You'll actually see technique scored twice on this page, in two different places, and that's not a bug.

There's a compact **Technique Scores** ring showing four weighted components — Reaction (30%), Explosiveness (25%), Smoothness (25%), Efficiency (20%) — rolled into one overall number. This is the original scoring model, well-validated, and it's what most of the rest of the app (goals, leaderboards, trend charts) still references.

Further down is the newer, more granular **Detailed Technique Breakdown** — six dimensions instead of four, each benchmarked against your declared rider level:

![Detailed technique breakdown, six dimensions](/docs/session-analysis-technique.png)

| Dimension | What it's actually measuring |
|---|---|
| Launch Quality | Reaction time and initial drive, together |
| Explosiveness | Peak power and acceleration |
| Speed Carry | How well you maintain velocity through the run |
| Smoothness | Force-application consistency (from the jerk trace) |
| Impulse Timing | How quickly you deliver force |
| Repeatability | Run-to-run consistency |

Both systems pull from the same underlying data, so if a number looks slightly different between them, it's not an error — they're just measuring slightly different things, or measuring the same thing in a slightly different way. They'll consolidate into one system eventually; for now, the four-component score is the one everything else in the app leans on, and the six-dimension breakdown is there when you want a finer-grained read on *why*.

Every score here — in both systems — is benchmarked against your **declared rider level**, not one flat scale. A 230ms reaction time is "excellent" for an intermediate rider and merely "good" for an expert. The actual bands:

| Level | Reaction — Excellent | Reaction — Good | Reaction — Needs work above | Peak G — Good | Peak G — Excellent |
|---|---|---|---|---|---|
| Grom | < 280ms | < 380ms | 520ms | 1.2G | 1.8G |
| Rider / Intermediate | < 230ms | < 320ms | 430ms | 1.8G | 2.4G |
| Expert | < 200ms | < 280ms | 380ms | 2.1G | 2.8G |
| Elite | < 180ms | < 250ms | 340ms | 2.3G | 3.0G |

> **Worth knowing:** these thresholds aren't fixed forever. They start as reasonable seed values based on coaching experience and the (fairly thin) published BMX gate-start literature, and they're designed to be replaced automatically once enough real rider data accumulates. If your numbers look oddly harsh or generous compared to how a session actually felt, that's worth mentioning to your coach — the benchmarks are provisional by design, not gospel.

### Phase analysis and splits

The system also breaks your run into three phases — **drive** (the initial explosive force), **transition** (converting that force into speed), and **velocity** (holding onto the speed you built). Weak drive phase shows up as low peak G or a late peak. Weak transition despite decent G-force usually points at technique or body position rather than raw power. Weak velocity phase means you built speed and then bled it off too fast.

If you've got a few runs at consistent distances, the acceleration splits table shows time and distance to hit specific speed targets (30, 40, 50 km/h) — handy for tracking whether your acceleration efficiency is actually improving over multiple sessions, not just this one.

---

## Deep Dive — comparisons, targets, and notes

This page exists for the moments when you want to line things up side by side rather than look at one run in isolation.

![Run comparison table](/docs/session-deepdive-comparison.png)

Pick any two runs and get a straight metric-by-metric comparison — reaction time, max G, peak speed, technique score, elapsed time — with the winner on each row flagged. Directly below, **Performance Targets** shows your progress against personalised goals for your rider level:

![Performance targets panel](/docs/session-deepdive-targets.png)

Further down: G-force stability across the session (how consistent your first half-second of force application was, run to run), a data drill-down for raw export, session notes (pre-session plans, in-session observations, post-session reflection, coach feedback — private to your account, no effect on analytics), and a one-click comparison against your previous session. There's also a report generator here if you want a shareable PDF for a coach or parent.

Most sessions, you genuinely won't need this page. It's here for when something's interesting enough to warrant digging, not for routine after-every-session checking.

---

## Data quality — what gets hidden, and why

Every run carries a validity flag from the firmware. If it's `false`, speed-derived metrics simply don't render — not because the system is being cautious for the sake of it, but because a confidently-wrong number is worse than an honest gap. Reaction time and raw G-force always show, because they're direct sensor readings, not calculations built on top of something that might be shaky.

If you don't have the breakbeam timing module, speed is estimated from IMU integration rather than measured directly. You'll see a data quality badge (Excellent/Good/Fair/Poor) and a bias correction value — under 0.5 m/s² is excellent, above 3.0 m/s² means treat the speed numbers as approximate at best. High bias correction usually means the device wasn't calibrated properly, or wasn't mounted securely, before that run.

With the breakbeam module fitted, elapsed time becomes a precision measurement (±1ms), which anchors the whole speed curve to something real rather than an estimate — every downstream number gets meaningfully more trustworthy.

---

## What's actually worth your attention

**Every session:** glance at reaction time, consistency, max G, and the shape of the G-force chart. Thirty seconds, unless something looks off.

**When something feels different:** check the data quality badge and bias correction first — rule out a mounting or calibration issue before you start second-guessing your technique. Then look at the speed curve shape, then the jerk profile.

**Occasionally:** speed splits, phase analysis, power (if you've got mass data entered) — these are for when you're specifically investigating something, not routine checks.

---

## Honest limitations

Not everything on these pages is equally trustworthy, and it's worth knowing which is which.

**Direct measurements** — reaction time, raw acceleration, pitch and roll, and (with the breakbeam) elapsed time. Trust these the most; they're what the sensor actually recorded.

**Calculated metrics** — peak speed, power, efficiency. Reliable for comparing your own runs against each other. With the breakbeam fitted, reliable enough to trust as absolute figures too. Without it, treat them as directional.

**Interpreted insights** — technique scores, weakness flags, phase classifications. Pattern recognition applied to formulas. Useful as a prompt for a conversation with your coach, not as a verdict. The system can tell you *what* the data looks like. It can't tell you *why*, and it's not trying to.

---

_For help with a specific section, use the Help buttons scattered throughout these pages — each one gives you a level-appropriate explanation, whether you want the quick version or the full methodology._

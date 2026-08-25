# Your Session Data

---

## Three views, three different jobs

A session is split across **Overview**, **Analysis**, and **Deep Dive**. They use the same recorded evidence, but they are deliberately ordered from quickest interpretation to most detailed inspection.

- **Overview** — what happened in this session, what context matters, and what deserves attention next.
- **Analysis** — choose a run and understand its important evidence, charts, comparisons, and optional video.
- **Deep Dive** — inspect evidence quality, raw signal, derived diagnostics, benchmark context, notes, and supporting records.

You do not need to work through all three after every ride. Overview is the fast read; Analysis is where to investigate a run; Deep Dive is there when you need to challenge or explain the interpretation.

---

## Overview — understand the session before chasing a single number

The Overview page starts with the session record and its setup/context rather than immediately dropping you into a chart. Weather, surface, session focus, ride feel, bike/profile linkage, and run tags give the recorded numbers useful context without changing the underlying sensor evidence.

Run tags can also affect which runs count toward session statistics. In particular, runs deliberately excluded from stats remain in the session record but are left out of the calculations that should represent your usable training evidence.

The page then builds a session-level read from the canonical performance engine: headline evidence, progression across runs, a plain-language narrative, and strengths or limiters when the evidence supports them. If a genuine shareable achievement is detected, the page can offer the social sharing flow; ordinary sessions do not need to manufacture one.

If setup or context is missing on a first pass, the page can let you fill that in while previewing how the session summary changes. That preview uses the same performance-engine path as the persisted session view rather than a separate set of formulas.

---

## Analysis — choose a run and understand how it was delivered

Analysis is run-focused. Select a run and the page follows that selection through its headline evidence and traces.

The main charting includes the recorded G-force trace and, when the evidence is valid enough to support it, the derived speed/acceleration view. Data-quality state is carried alongside those charts so a derived curve is not presented with the same confidence as a direct recorded value.

The page also exposes run comparison and the physics views that are useful for explaining the effort, including impulse and power when their required inputs exist. Mass-dependent values are withheld when rider/bike mass is unavailable rather than being filled with guessed inputs.

### Optional run video

Video is supplementary evidence, not a requirement. A run can have no video at all and the Analysis page remains complete.

When you attach a clip, the browser can look for the optional hardware synchronisation cue: the external Lights unit shows a **full-white background for about 120 ms at gate-zero** when that feature is enabled. The detector treats the **leading edge** of that finite white pulse as the alignment point. It is not a GoPro flash and the web app does not pretend to control the camera.

If a trustworthy cue is found, the attached video can be shown in the synchronised run-video experience with recorded telemetry aligned to the run clock. If no trustworthy cue is found, attachment still succeeds and the clip falls back to ordinary playback. A failed sync must not make the sensor analysis unusable.

---

## Technique scores — useful interpretation, not raw evidence

Technique scoring is derived interpretation. The current detailed breakdown presents six dimensions:

| Dimension | Evidence basis |
|---|---|
| Launch Quality | Reaction time and initial drive |
| Explosiveness | Peak G-force / acceleration evidence |
| Speed Carry | Derived speed behaviour |
| Smoothness | Derived jerk analysis |
| Impulse Timing | Derived G-force integration |
| Repeatability | Run-to-run reaction-time spread |

The UI labels whether a dimension is based more directly on measured evidence or on a derived calculation. That distinction matters more than memorising a fixed score band from documentation.

Do not treat an old static threshold table as a permanent contract. Rider context and the performance engine own the current scoring/benchmark logic; the session page is designed to surface the evidence and confidence behind the interpretation rather than make a documentation snapshot authoritative forever.

---

## Deep Dive — inspect the evidence before the diagnosis

Deep Dive deliberately starts with evidence quality. If calibration looks suspect, or mass-dependent analytics cannot be supported, that warning comes before the detailed interpretation.

From there you can inspect the selected run's recorded G-force signal directly, compare early-force stability across runs when enough runs exist, and then work through the deeper force, phase, technique, and coach-style diagnostic views. Benchmark context and follow-up recommendations come after the underlying evidence rather than ahead of it.

This page also holds the supporting record: rider session notes, comparison with the previous session when one exists, and report-related actions. Private session notes remain rider-owned; sending a report to a linked coach deliberately strips those private notes from the shared report payload.

---

## Reports are available across the session workspace

The session layout owns the report flow, so reporting is not confined to one old “report generator” section of a page. From the session workspace you can build supported report types with different detail levels, optionally include charts, diagnostics, appendices, and goal context, then print/save the result or use the supported data export.

For an active coaching link, the rider can explicitly send a generated report through the coaching share route. That sharing action is separate from private session notes and from the coach's narrower read-only access to rider-owned data.

---

## Data quality — distinguish recorded evidence from derived values

A useful way to read the whole session workspace is by evidence layer:

**Recorded evidence** includes values and traces captured from the run itself, such as reaction timing and acceleration/G-force evidence. Start here when something looks wrong.

**Derived physics** includes values calculated from recorded evidence and setup context, such as speed estimates, impulse, power, jerk, or other physics diagnostics. These can be hidden or downgraded when the inputs do not support a trustworthy result.

**Interpretation** includes technique dimensions, strengths/limiters, recommendations, benchmark context, and narrative. These are there to explain patterns in the evidence, not to replace the evidence.

That ordering is intentional throughout the renovated session pages: preserve the source evidence, show whether a derived value is supportable, then present interpretation at the appropriate level of confidence.

---

## What to check routinely

For a normal session, start on Overview and look for the session headline, progression, context, and any quality warning. Move to Analysis when one run deserves attention or you want to compare traces. Open Deep Dive when you need to inspect the raw signal, understand why a derived metric is missing or questionable, or work through the detailed diagnostic evidence.

If a number surprises you, check its evidence quality before changing your training around it. The session workspace is designed so that a missing or qualified derived result is preferable to a confident-looking value that the available evidence cannot support.

---

_For help with a specific section, use the contextual Help controls in the app or the Help & Troubleshooting page._

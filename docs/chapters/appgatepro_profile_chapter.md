# Profile & Bike Setup

---

## Why bother filling this in

Short answer: because two calculations in this app are physics, not guesswork, and physics needs real inputs. Power estimation is force × velocity — without your actual weight and your bike's weight, that's not an estimate, it's fiction, so the system just doesn't show it rather than show you a made-up number dressed up as data. Same logic applies to a few other biomechanical figures.

Nothing else is gated behind this. Reaction time, G-force, technique scoring — all of it works from the moment you upload your first session, profile or no profile.

![Profile page — images and completeness](/docs/profile-page.png)

---

## Profile completeness, and what each piece actually unlocks

The completeness bar isn't decorative — each field is weighted toward something specific:

| Field | Weight | What it actually unlocks |
|---|---|---|
| Weight | 20% | Power and impulse estimation |
| Crank length | 20% | Captured for future biomechanical calculations — not yet used by any live calculation |
| Height | 15% | Biomechanical context for technique scoring |
| Date of birth | 15% | Correct UCI age category and age-appropriate benchmarking |
| Rider level | 10% | Sets which benchmark tier your scores are measured against |
| Rear tyre / wheel diameter | 20% | Captured for setup-change comparisons — not currently used in any speed calculation |

Weight is the single biggest real lever — rider weight and bike weight together are what actually unlock power and impulse estimation. Crank length and tyre/wheel diameter are still worth filling in (see below), just not for the reason the completeness weighting might imply.

**Rider level** deserves a specific mention: it's not a badge, it's the benchmark tier your technique scores and reaction-time ratings get measured against. Setting it accurately matters more than setting it flatteringly — a novice rider scored against elite benchmarks will just see discouraging numbers that don't reflect real progress, and an elite rider scored against novice benchmarks won't get any useful signal about where they actually stand.

---

## Profile images

Two separate image slots — a profile icon (shown as a circle throughout the app) and a background image (used as your profile header, and optionally as the backdrop on shareable achievement cards, if you choose to enable that when sharing). Both accept JPEG, PNG, WebP, or GIF up to 5MB. Neither is required for anything to function.

---

## Bike setup

Rider weight and bike weight are the two fields that actually feed a live calculation — combined mass is what makes power and impulse estimation real physics rather than a guess (see above). Speed, for what it's worth, comes from the AppGatePro sensor's own measurements, not from wheel rotation — so an unusual wheel size doesn't throw off your speed numbers the way it might on a cycling computer.

Crank length, gearing (chainring/sprocket teeth), and tyre choice are still worth recording honestly — they're what the setup-change comparison below actually compares — but none of them currently feed a calculation on their own the way weight does.

### Keeping this current matters more than it looks like it should

The app automatically compares your sessions from before and after any change to your bike setup or biometrics — new gearing, a different crank, a tyre swap, a growth spurt. It works out what changed by looking at what your profile said *at the time each session was ridden*, not what it says today, and shows you the difference on the session page once enough sessions exist on each side.

That only works if you update your profile and bike setup **before** you ride with the change, not after you remember to log it a week later. If you update a spec retroactively, sessions ridden before the real-world change get misattributed to the new setup instead — quietly, with no error message, since there's no way for the app to tell "this was true when I rode" apart from "I just remembered to update this." Update it before you ride, and this mechanism does its job with zero extra effort from you.

---

_For anything not covered here, use the Help button on the profile page._

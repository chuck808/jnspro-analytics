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
| Crank length | 20% | More accurate power/impulse calculation |
| Height | 15% | Biomechanical context for technique scoring |
| Date of birth | 15% | Correct UCI age category and age-appropriate benchmarking |
| Rider level | 10% | Sets which benchmark tier your scores are measured against |
| Rear tyre / wheel diameter | 20% | Accurate speed calculation from wheel rotation data |

Weight and crank length together are the biggest single lever — fill those in and you've unlocked the majority of what profile completeness gates.

**Rider level** deserves a specific mention: it's not a badge, it's the benchmark tier your technique scores and reaction-time ratings get measured against. Setting it accurately matters more than setting it flatteringly — a novice rider scored against elite benchmarks will just see discouraging numbers that don't reflect real progress, and an elite rider scored against novice benchmarks won't get any useful signal about where they actually stand.

---

## Profile images

Two separate image slots — a profile icon (shown as a circle throughout the app) and a background image (used as your profile header, and optionally as the backdrop on shareable achievement cards, if you choose to enable that when sharing). Both accept JPEG, PNG, WebP, or GIF up to 5MB. Neither is required for anything to function.

---

## Bike setup

Crank length and gear ratio (chainring/sprocket teeth) feed directly into the power and cadence-adjacent calculations. Wheel size matters specifically for speed accuracy — the system calculates speed from wheel rotation, so an incorrect tyre/wheel diameter entry will throw off every speed-derived number in your analytics, not just power. If you've got a non-standard wheel setup, use the custom wheel diameter field rather than picking the closest standard tyre — "close enough" here quietly degrades every speed calculation downstream.

---

_For anything not covered here, use the Help button on the profile page._

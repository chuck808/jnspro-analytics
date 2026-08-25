# Compare & Competitive Ranking

---

## Two different comparison questions

The Compare page deliberately separates peer benchmarking from competitive ranking because they answer different questions.

**Peer benchmark** asks: _how does my best eligible evidence compare with a sufficiently populated rider cohort?_ It uses anonymised aggregate distributions and can broaden to a fallback cohort when the most specific cohort is too small. The page shows which cohort was actually used and how many riders are in it.

**Competitive ranking** asks: _where does my all-time best eligible evidence rank among riders who chose to compete?_ It is optional and is kept separate from the peer benchmark so a competitive rank is never presented as if it were a population percentile.


---

## Peer benchmarking does not require competitive opt-in

You can receive peer context without publishing yourself into the competitive table. Benchmarking uses aggregate cohort data rather than exposing another rider's sessions, profile, or individual history.

The benchmark only appears when the resolved cohort is large enough to support it. If the exact cohort is too small, the system may use a broader documented fallback; if no supported cohort reaches the minimum population, it withholds the comparison instead of inventing a precise-looking percentile from too little data.

---

## Competitive ranking is opt-in and all-time

Competitive ranking is optional. When you opt in, the ranking uses your all-time best eligible snapshot for the selected metric; there are no real Week or Month ranking modes. Old URLs containing legacy period values are normalised back to the current all-time model.

The selected competitive cohort must also contain enough opted-in riders before a rank is shown. Age is the default cohort, with an explicit all-age browse mode and an optional experience-level filter. Experience level is a system-derived training-history classification, not a race or UCI category.

The displayed table is a competitive leaderboard, not a percentile chart. Equal performances share a rank using competition-rank semantics (for example, 1, 1, 3), and your rank is calculated against the whole selected cohort even if the visible table is capped to its leading rows.

---

## Eligibility and privacy boundaries

Both comparison layers use canonical eligible performance evidence, so runs excluded from analytics do not contribute a best value simply because they are fast or high-scoring.

Peer benchmarking uses anonymised aggregate distributions. Competitive ranking only includes riders who explicitly opted in. Neither mode publishes your full session history or private session notes.

---

## How to use the numbers

Treat peer benchmarking as context, not a verdict: cohort choice and sample size matter, and the page shows them for that reason. Treat competitive rank as a separate game among opted-in riders, useful when you want that form of comparison but not required for understanding your own progress.

For day-to-day training decisions, your eligible personal history remains the first comparison to make. Cohort context is most useful when it adds information your own trend cannot provide.

---

_For anything not covered here, use Help & Troubleshooting or the privacy explanation on the Compare page._

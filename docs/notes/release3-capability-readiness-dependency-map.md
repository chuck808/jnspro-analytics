# Release 3 capability/readiness dependency map

Status: current-code evidence bridge for the Home lifecycle model.

This note answers one question only:

> For each relevant rider, bike, context, and evidence input, what actually becomes blocked, unavailable, degraded, enriched, or unchanged when that input is missing?

It is intentionally narrower than the whole-product architecture handoff. It does not define a new onboarding state machine, and it does not redesign Home. It establishes the capability facts Home is allowed to orient around.

## Classification

- **Blocked** — the capability cannot proceed at all.
- **Unavailable** — the surrounding capability works, but this specific output cannot truthfully be produced.
- **Degraded / qualified** — an output exists, but trust, interpretation, provenance, or comparison scope is reduced and must be stated.
- **Enrichment missing** — core evidence remains usable; a contextual or longitudinal layer is absent.
- **Unchanged** — no current live dependency was found.

## Canonical recording and ingest boundary

Both manual upload and device ingest delegate persistence to `ingestSessionEvidence()`.

The canonical ingest path attempts to resolve the active bike and latest rider-profile snapshot, but lookup failure or absence does not abort the import. The session can be persisted with `bike_id = null` and/or `rider_profile_id = null`.

The required persistence chain is the source session plus its run and gate evidence. Failure in required persistence rolls the session back. Detailed timeseries persistence is deliberately non-fatal: a session can remain valid while detailed pitch/wheelie-style analysis is limited.

The manual Upload UI states the same product contract directly: sensor evidence comes first; context, tags, notes, and optional video can be added later; an incomplete profile warns that some calculations are unavailable but explicitly does not block import.

**Home consequence:** there is currently no evidence for a normal rider/bike-profile state called “training blocked until setup is complete.” Protected-access/safeguarding can block entry to the product, but ordinary profile/bike enrichment is not a canonical ingest prerequisite.

## Dependency matrix

| Input / authority | Recording / ingest | Direct recorded evidence | Performance Engine / session interpretation | Progress / longitudinal | Setup comparison | Peer / competitive comparison | Home consequence |
|---|---|---|---|---|---|---|---|
| Active bike record | **Unchanged** — ingest can store a null bike link | **Unchanged** for gate evidence | Bike mass becomes unavailable if there is no linked bike; mass-dependent outputs may therefore be unavailable | Non-mass evidence remains usable; historical bike context is absent | **Unavailable/degraded** where there is no linked before/after bike snapshot | **Unchanged** for current benchmark metrics | Never call training blocked. If useful, say bike details unlock richer physics/setup history. |
| Rider-profile snapshot | **Unchanged** — ingest can store a null profile link | **Unchanged** for gate evidence | Rider mass/level context may be absent; consumers must degrade | Recorded trends can still exist; profile-dependent enrichments may be absent | **Unavailable/degraded** for biometric change attribution without linked snapshots | Age cohort may be unavailable without DOB; see DOB row | Never equate missing profile snapshot with unusable training evidence. |
| Rider weight | **Unchanged** | Reaction / gate evidence unchanged | Contributes to total mass. If both rider and bike mass are absent, power and impulse are unavailable. If only one mass is present, current engine still computes using the partial mass — this is a current trust seam, not a Home readiness authority. | Technique/smoothness/data-quality evidence remains; power evidence follows engine availability. Current Progress also exposes latest rider weight for W/kg display context. | Rider-weight changes can be detected when linked profile snapshots exist | **Unchanged** for current reaction/speed/G/consistency peer cohorts | Targeted enrichment only: “add rider weight” should name the capability it improves, not imply setup completion. |
| Bike weight | **Unchanged** | Unchanged | Same total-mass dependency as rider weight for estimated power and impulse | Same mass-dependent effect on power evidence; other trends remain | Bike-weight changes are tracked | **Unchanged** | Targeted enrichment only. |
| Height | **Unchanged** | Unchanged | **Unchanged in the current Performance Engine input contract**: height is not passed into `RiderContext` and no live technique calculation was found using it | No current Progress metric dependency found | Height changes are tracked as setup/biometric change evidence | No current peer-cohort dependency found | Do not claim height unlocks live technique scoring unless implementation changes. Treat as setup-change / future biomechanical context. |
| Crank length | **Unchanged** | Unchanged | Present in `RiderContext` but no current live calculation reads it | No current Progress dependency found | Tracked as a bike setup change | Unchanged | Enrichment/setup-history field, not readiness. |
| Chainring / sprocket | **Unchanged** | Unchanged | No current live Performance Engine calculation dependency found | Unchanged | Tracked as setup changes | Unchanged | Enrichment/setup-history only. |
| Tyre IDs / custom wheel diameter | **Unchanged** | Speed remains sensor-derived; wheel size is not a speed prerequisite | No current live speed calculation dependency found | Unchanged | Tracked as setup changes | Unchanged | Enrichment/setup-history only. Do not imply wheel size is required for speed. |
| Rider level | **Unchanged** | Unchanged | **Qualified** technique scoring: reaction benchmark defaults when level is absent, so a score can still be produced but personalisation/tier selection is weaker | Technique-derived longitudinal evidence inherits that interpretation | Unchanged | Current peer service derives `experience_level` from evidence/session history, not rider-profile `rider_level` | If prompted, describe as interpretation personalisation, not a training prerequisite. |
| Date of birth | **Unchanged** | Unchanged | Core session physics/technique unchanged | Core personal longitudinal evidence unchanged | Unchanged | **Unavailable/degraded** for age-specific comparison when DOB is absent. Benchmark aggregate fetching can broaden cohorts, but the current leaderboard page does not construct the rider's peer benchmark unless rider age group is known. DOB also supplies UCI category. | Only surface when age-appropriate comparison/category is relevant; never as general setup completion. |
| Session focus | **Unchanged** and can be added later | Unchanged | **Enrichment/qualification**: testing/technique focus changes recommendation framing; session narrative uses focus alignment and interpretation | Needed to establish focus-based contextual patterns; missing focus simply means those patterns cannot be learned from that session | Unchanged | Unchanged | Optional context. Missing it is not an error. |
| RideFeel | **Unchanged** and can be added later | Unchanged | Enriches narrative with subjective/objective agreement or divergence | Needed for RideFeel contextual pattern evidence | Unchanged | Unchanged | Optional subjective context, not readiness. |
| Weather / track surface | **Unchanged** and can be added later | Unchanged | Enrich/qualify interpretation; wet/muddy surfaces add caution around speed/traction-dependent comparison | Needed for condition-specific contextual patterns; each condition needs sufficient repeated evidence | Unchanged | Unchanged | Optional context. Surface a useful pattern only when evidence exists. |
| Run classification / exclusion tags | Session is already recorded; tags are editable interpretation metadata | The run remains part of the record | **Changes eligibility** for session statistics and downstream summaries. Warmup, experimental, competition, and explicit exclusion tags are excluded from normal stats; best-effort is surfaced as an outlier rather than automatically excluded | Longitudinal/statistical projections use eligible runs, so classification affects what evidence contributes | Can affect before/after metric evidence through the session summaries that feed comparison | Benchmark snapshot reconciliation filters excluded runs | Important evidence-governance control, but not pre-training setup. |
| `chart_data` trace | Ingested run can exist without a usable trace | Gate reaction/max-G can still remain where present | **Unavailable** for physics and technique when absent. Engine emits `NO_CHART_DATA`; reaction can remain recorded | Progress adapter deliberately keeps the session as the spine, allowing data-quality history even when full engine analysis is absent | Recorded comparison metrics may still exist if supplied by gate/session summary | Peer snapshot uses gate evidence, not `chart_data` | Home can say recent evidence is partially usable; do not call the whole session failed. |
| Detailed timeseries rows | **Non-fatal** persistence | Gate/run record unchanged | Detailed trace consumers such as pitch/wheelie analytics may be limited | Corresponding detailed longitudinal evidence may be absent | Unchanged for setup-change core metrics | Unchanged | “Imported with limited detailed analysis” is legitimate; “session failed” is not. |
| Firmware speed + `analytics_valid` | Ingest unaffected | Reaction and other direct gate evidence remain | Firmware speed is the preferred single-number speed ground truth. Invalid/poor calibration must suppress or qualify speed-derived claims rather than silently substitute trustworthy speed. Shape-only integrated speed remains estimated. | Progress can retain the session while individual speed/derived evidence is unavailable or quality-qualified | Speed side of setup comparison may be absent when no usable speed evidence exists | Snapshot reconciliation uses only `analytics_valid` gate rows for best speed; reaction and max-G are not filtered the same way | This is a genuine **recent evidence degraded by quality** Home condition when it affects the latest usable session. |
| Bias / calibration quality | Ingest unaffected | Reaction remains usable | Can qualify or block speed/power interpretation; narrative explicitly separates trusted, caution, and blocked metrics | Progress retains per-session bias/validity evidence instead of inventing substitutes | May remove trustworthy speed comparison while leaving reaction/other metrics | Invalid speed is excluded from benchmark snapshot speed | Home may elevate a calibration/data-quality issue because it affects what JNSPRO can truthfully say now. |
| Session-linked bike/profile IDs | Not required to create a session | Direct evidence remains | Critical provenance for historical physics/context | Critical for historically correct mass/setup interpretation | **Required for trustworthy automatic setup-change attribution** | Current snapshot cohorting uses latest rider DOB, not historical linked DOB | Missing links are a provenance limitation, not onboarding failure. Do not silently describe current setup as historical setup. |

## Important implementation seams exposed by the audit

### 1. Partial mass currently produces physics instead of requiring complete mass

`getTotalMassKg()` adds missing rider or bike mass as zero and returns any positive total. Therefore a rider with only one of the two weights can currently receive power/impulse estimates even though the UI/profile documentation describes rider + bike weight together as the physical requirement.

This is a trust seam. Home should not encode the current partial-mass behaviour as a readiness rule. The safer product contract is: **complete system mass is the authority for trustworthy mass-dependent physics**.

### 2. Height documentation overstates the live dependency

The current Profile chapter says height provides biomechanical context for technique scoring. The live `RiderContext` has no height field, and the current technique scorer consumes reaction, chart trace, speed curve, and rider level. Height is, however, a real setup-change field.

Until a live consumer is added, Home must not promise that adding height unlocks technique scoring.

### 3. Crank length is passed but unused

`crankLengthMm` exists in `RiderContext` and is supplied by session consumers, but no current Performance Engine calculation found in this audit reads it. It remains useful for setup-change provenance and future biomechanics, not current readiness.

### 4. Rider level and benchmark experience are different authorities

The Performance Engine's technique scorer uses rider-profile `riderLevel` to choose a reaction benchmark/default. The peer benchmarking service, however, uses a separate `experienceLevel` derived from session history/performance snapshot logic. Home must not collapse those into one “skill level complete” concept.

### 5. DOB is comparison context, not training readiness

DOB determines age group/UCI category and enables age-specific peer comparison. Missing DOB does not stop ingest, direct evidence, physics, or personal Progress. It should therefore appear only as a targeted unlock for age-appropriate comparison/category where appropriate.

### 6. Context absence removes interpretation, not evidence

Focus, RideFeel, weather, and surface are explicitly interpretation/context inputs rather than physics inputs. Cross-session contextual patterns require repeated populated condition groups (currently at least three sessions in each of two groups plus a meaningful difference). A single missing context field is therefore not an incomplete setup state.

### 7. Historical fallback remains a provenance seam

The current analytics server can fall back from a missing session-linked rider profile to the latest rider profile for Performance Engine analysis. That can make an old session inherit today's rider context. The Release 3 product contract should continue to prefer session-linked historical truth and represent missing historical context as unavailable/unknown rather than silently rewriting history.

### 8. Existing language around data quality is internally inconsistent

The data-quality helper labels missing bias as `unknown` while also returning display text such as “Poor” / “Speed analytics unavailable.” The narrative layer is more nuanced: it treats unknown calibration as caution and explicitly preserves reaction evidence. Home should use the evidence-specific trust model, not a blanket “poor session” label.

## Capability conclusions for Home

### What is genuinely ready immediately after protected access

Subject to having valid sensor/session data, a rider can record/import training evidence without completing the ordinary rider/bike enrichment fields.

The product can preserve and use direct evidence such as reaction time independently of complete mass/setup context. A first session therefore does not require a fake setup-complete milestone.

### What profile/bike information actually unlocks

The strongest current live unlock is **mass-dependent physics**: trustworthy power and impulse require the rider+bike system mass contract to be complete.

Other setup fields mainly improve:

- historical provenance;
- automatic before/after setup-change detection;
- age/category comparison (DOB);
- technique interpretation personalisation (rider level);
- future or currently non-live biomechanical context.

These should be surfaced as specific unlocks, not as a percentage-complete onboarding task.

### What evidence quality can genuinely degrade

A recent session can be valid while some claims are not:

- no chart trace → no physics/technique, while direct gate evidence may remain;
- failed detailed timeseries → detailed pitch/wheelie-style analysis limited;
- invalid/calibration-limited speed → reaction can remain usable while speed/power claims are suppressed or qualified;
- missing mass → mass-dependent physics unavailable/insufficiently trustworthy;
- missing context → contextual interpretation/patterns absent, not the underlying evidence.

This is the basis for a real Home state such as **recent evidence degraded by quality**, rather than a generic error state.

## Revised Home lifecycle state families

The dependency audit supports these primary Home state families:

1. **Protected access unavailable** — safeguarding/account authority; handled before ordinary Home.
2. **Ready for first session** — protected access is available and no usable training session exists. Missing optional/enriching profile or bike fields do not change this to “blocked.”
3. **Building evidence** — usable sessions exist, but longitudinal claims are still sparse or individual metrics are still gathering enough trustworthy evidence.
4. **Established evidence** — sufficient trustworthy personal history exists for the relevant longitudinal claims Home wants to orient around.
5. **Recent evidence degraded by quality** — the newest/relevant session exists but one or more important claims are blocked or qualified by trace/calibration/validity problems; unaffected evidence remains usable.
6. **Returning rider / stale evidence** — historical evidence exists but is no longer recent enough to present as current state without qualification.

There is **no ordinary “core setup blocks training” state supported by current ingest/profile contracts**.

Capability gaps such as missing system mass, DOB, context, or setup snapshots should be represented orthogonally and only when they unlock something relevant to the rider's next action.

## Orthogonal Home projections

These are not lifecycle states and must not turn Home into an onboarding checklist:

- **Physics context:** complete system mass available / incomplete.
- **Historical setup provenance:** linked bike/profile snapshots available / gaps present.
- **Context richness:** focus/RideFeel/conditions present where useful / absent.
- **Goal:** none / active / evidence moved / reached.
- **Coach:** no relationship / relationship / unread or rider-pushed report state.
- **Benchmark:** age cohort known or broad/unknown; sample available or still building.
- **Leaderboard:** off / opted in / competitive cohort available — always optional.
- **Research:** separate consent state — always optional.
- **Social/achievement publication:** recognition eligibility is not publication consent.
- **Video:** separate optional evidence/lifecycle.

## Home content rules implied by the map

1. **Never say “complete your setup to start training”** from ordinary profile/bike incompleteness under the current contract.
2. **Name the unlock.** Prefer “Add rider and bike weight for mass-dependent power/impulse estimates” over “Profile 70% complete.”
3. **Preserve usable evidence.** If speed is invalid, reaction is not automatically invalid. If chart data is absent, the recorded session is not automatically worthless.
4. **Do not promote optional participation into readiness.** No goal, coach, leaderboard opt-in, research consent, Social publication, RideFeel, or video is a setup failure.
5. **Do not use today's setup as historical truth.** If a historical link is missing, say the historical context is unavailable rather than substituting current setup in rider-facing claims.
6. **Do not invent a longitudinal claim from session count alone.** Evidence maturity must be evaluated per claim/metric and must respect exclusions and quality.
7. **Only elevate a capability gap on Home when it changes a useful next action.** A missing field with no live consumer should not become a Home task.

## Next bounded product step

Use this dependency map to build the Home state/content matrix for the six supported primary states above. For each state define:

- the orientation headline;
- the evidence Home may summarise;
- what must be suppressed or qualified;
- the single strongest next action;
- which orthogonal capability gaps are relevant enough to surface;
- which optional states may appear as secondary projections;
- the destination route for every action.

Only after that matrix is signed off should the next Home visual be produced.
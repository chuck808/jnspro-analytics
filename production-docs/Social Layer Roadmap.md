# BMX Analytics Platform — Social Layer Roadmap & Scheme of Works

## Purpose

This document defines the implementation roadmap for the Social Layer subsystem within the BMX analytics ecosystem.

The goal is not to add generic social-media functionality, but to expose the platform’s existing contextual, progression-focused philosophy through meaningful, rider-centric celebration and sharing systems.

The social layer must:

* Reinforce rider progression and engagement
* Preserve contextual honesty
* Avoid shallow gamification
* Protect rider trust
* Respect minors and privacy
* Align with the existing deterministic analytics philosophy
* Operate as another presentation surface of the shared contextual insight model

This roadmap assumes the existing platform already contains:

* Session analytics
* Longitudinal analytics
* Goals & milestones
* Environmental context
* Rider onboarding classification
* Ride-feel and subjective state capture
* Report generation
* Contextual interpretation logic
* Leaderboards
* User feedback systems
* Historical baseline comparisons
* Deterministic insight generation

---

# Guiding Principles

## 1. Celebrate Meaningful Progress

The platform should celebrate:

* improvement
* consistency
* resilience
* progression
* contextual achievement
* persistence

—not only absolute performance.

---

## 2. Selective Celebration Over Constant Stimulation

Social output should only be generated when meaningful events occur.

No artificial engagement loops.
No participation trophies.
No empty dopamine mechanics.

The absence of celebration is acceptable.

---

## 3. Shared Truth Model

All platform surfaces must derive from the same contextual insight pipeline.

The social layer does not invent meaning.

It presents existing contextual truths in emotionally understandable forms.

---

## 4. Preserve Context

Performance without context is misleading.

Social output must incorporate:

* weather
* track conditions
* rider state
* onboarding classification
* progression stage
* historical baselines
* confidence/validity state

where appropriate.

---

## 5. Non-Prescriptive Philosophy

The system should never tell riders what they “must” do.

The system:

* observes
* contextualizes
* celebrates
* highlights patterns

The coach/rider retains agency.

---

## 6. Youth-Safe Design

The platform must avoid:

* humiliating comparison
* elite-only framing
* public negative diagnostics
* overtraining incentives
* toxic engagement systems

---

# High-Level Architecture

```txt
Raw Telemetry + Contextual Variables
        ↓
Shared Metrics Layer
        ↓
Contextual Insight Layer
        ↓
Achievement Detection Layer
        ↓
Output Surfaces
  - Session Details
  - Analytics Pages
  - Reports
  - Goals & Milestones
  - Leaderboards
  - Social Cards
```

---

# Phase 1 — Foundation Architecture

## Objective

Create the shared contextual insight and achievement infrastructure required for social output.

---

## 1.1 Create Contextual Insight Objects

### Purpose

Standardize all meaningful platform insights into a shared internal format.

### Example Structure

```ts
interface ContextualInsight {
  id: string;

  scope: 'run' | 'session' | 'longitudinal';

  type:
    | 'pb'
    | 'milestone'
    | 'consistency'
    | 'trend'
    | 'conditions'
    | 'progression'
    | 'recovery'
    | 'achievement';

  title: string;
  summary: string;

  riderId: string;
  sessionId?: string;
  runId?: string;

  confidence: 'low' | 'medium' | 'high';

  metrics: Record<string, any>;

  context: {
    weather?: string;
    wind?: string;
    trackSurface?: string;
    rideFeel?: string;
    onboardingClass?: string;
    participationLevel?: string;
    ageGroup?: string;
  };

  visibility: {
    report: boolean;
    social: boolean;
    leaderboard: boolean;
  };

  sensitivity:
    | 'public_safe'
    | 'private'
    | 'coach_only';

  createdAt: string;
}
```

---

## 1.2 Achievement Detection Engine

### Purpose

Detect meaningful rider achievements across:

* individual runs
* sessions
* longitudinal development

### Detection Categories

#### Run-Level

* fastest reaction in session
* strongest acceleration phase
* cleanest gate transition
* smoothest pitch profile
* wheel-lift control improvement

#### Session-Level

* most consistent session
* session PB
* difficult-condition PB
* fatigue-resilient performance
* milestone completion

#### Longitudinal

* progression milestones
* onboarding baseline improvements
* consistency improvements
* category percentile improvements
* historical trend reversals

---

## 1.3 Contextual Weighting Rules

### Purpose

Ensure achievements are interpreted fairly.

### Inputs

* weather
* track condition
* ride feel
* fatigue state
* rider classification
* progression stage
* historical baseline
* session validity

### Example

```txt
New PB detected
BUT
Weather = heavy rain
Ride feel = below average
Track = slow

→ Increase contextual significance
```

---

## 1.4 Achievement Validity Filters

### Purpose

Prevent misleading or low-quality celebrations.

### Suppression Rules

Suppress achievements if:

* confidence low
* invalid telemetry
* incomplete session
* calibration failure
* insufficient historical context
* warmup-only session
* corrupted metrics

---

# Phase 2 — Social Card Engine

## Objective

Create a deterministic visual social-card rendering subsystem.

---

## 2.1 Social Card Data Model

```ts
interface SocialCard {
  id: string;

  insightId: string;

  template:
    | 'pb'
    | 'milestone'
    | 'progression'
    | 'consistency'
    | 'conditions';

  title: string;
  subtitle: string;
  contextLine: string;

  metrics: {
    primary: string;
    secondary?: string;
  };

  riderDisplayName: string;

  generatedImageUrl?: string;

  privacyMode:
    | 'private'
    | 'club'
    | 'public'
    | 'anonymous';

  createdAt: string;
}
```

---

## 2.2 Card Template System

### Initial Templates

#### A. Personal Best

Examples:

* New wet-track PB
* Fastest session reaction
* Strongest acceleration sequence

---

#### B. Milestone Unlock

Examples:

* First sub-threshold reaction
* 10-session consistency streak
* Goal completion

---

#### C. Progression Snapshot

Examples:

* 8% improvement since onboarding
* Consistency improved over 30 days
* Improved despite difficult conditions

---

#### D. Resilience/Conditions

Examples:

* Best rain-session performance
* Strong session despite low readiness
* Consistency under difficult track conditions

---

## 2.3 Rendering Engine

### Recommendation

HTML/CSS → PNG generation

Advantages:

* responsive layouts
* easier typography
* branding consistency
* reusable visual components
* fast iteration
* easier future animation/video support

### Candidate Stack

* Svelte rendering layer
* Puppeteer server-side rendering
* Sharp image processing
* Supabase storage integration

---

## 2.4 Dynamic Context Lines

### Purpose

Translate contextual analytics into human-readable celebration language.

### Examples

* “Despite heavy rain and low readiness...”
* “Most consistent session in 30 days”
* “Strong progression since onboarding”
* “Best performance under difficult conditions”

---

# Phase 3 — User Controls & Privacy

## Objective

Ensure ethical and rider-safe sharing.

---

## 3.1 Sharing Preferences

Per-user controls:

* disable sharing entirely
* private-only cards
* club-visible only
* anonymized public sharing
* full public sharing
* leaderboard participation

---

## 3.2 Minor Protection Rules

Defaults for minors:

* anonymized names
* no location exposure
* no exact age exposure
* no negative public insights
* parental opt-in where required

---

## 3.3 Visibility Classification

### Public Safe

* milestones
* PBs
* progression
* consistency achievements

### Private

* fatigue concerns
* readiness concerns
* confidence issues
* trend degradation

### Coach Only

* diagnostics
* detailed interpretation
* technical decomposition
* advanced kinetic analysis

---

# Phase 4 — Integration Into Existing UX

## Objective

Embed social functionality naturally into current workflows.

---

## 4.1 Session Details Integration

Add:

```txt
Create Share Card
```

Only shown if meaningful achievements detected.

---

## 4.2 Analytics Page Integration

Add:

```txt
Share Progress Snapshot
```

Examples:

* 30-day improvement
* season progression
* milestone completion

---

## 4.3 Goal/Milestone Integration

Allow milestone achievements to automatically generate candidate cards.

---

## 4.4 Leaderboard Integration

Optional:

* top consistency achievements
* club progression highlights
* contextual weekly achievements

Avoid global dominance framing.

---

# Phase 5 — Longitudinal Journey System

## Objective

Transform isolated achievements into developmental narratives.

---

## 5.1 Rider Journey Timeline

Potential features:

* onboarding baseline
* milestone history
* progression snapshots
* seasonal summaries
* consistency evolution
* environmental performance patterns

---

## 5.2 Season Summary Cards

Examples:

* Most improved metric
* Biggest consistency gain
* Best conditions adaptation
* Year-over-year progression

---

## 5.3 “Year In BMX” Reports

Potentially high engagement.

Parent/rider/coach friendly.

---

# Phase 6 — Community Layer

## Objective

Introduce carefully controlled community interaction.

---

## 6.1 Club Feeds

Club-only progression highlights.

Focus:

* encouragement
* milestones
* development
* consistency

Avoid:

* humiliation
* toxic ranking
* elite-only attention

---

## 6.2 Contextual Leaderboards

Segment by:

* onboarding classification
* experience level
* age category
* participation level
* club

---

## 6.3 Positive Reinforcement Mechanics

Potential:

* encouragement reactions
* coach highlights
* progression acknowledgements

Avoid:

* public downvoting
* toxic comments
* popularity contests

---

# Phase 7 — Future Extensions

## 7.1 Animated Cards

Potential short motion graphics:

* progression animation
* trend visualization
* milestone reveals

---

## 7.2 Video Overlay Export

Potential future support:

* GoPro overlays
* race replay telemetry overlays
* session highlight videos

---

## 7.3 Research-Aware Public Insights

Potential anonymized community insights:

* common progression patterns
* environmental trends
* onboarding-level development benchmarks

Only if ethically appropriate.

---

# Suggested Initial MVP

## Phase 1 MVP

Build only:

* shared insight object
* achievement detection
* PB cards
* milestone cards
* PNG export
* manual sharing
* privacy controls

No feed.
No comments.
No complex social mechanics.

---

# Success Metrics

Success should NOT primarily be:

* shares
* likes
* engagement time

Primary success metrics:

* rider retention
* session return rate
* goal completion
* milestone engagement
* coach adoption
* longitudinal participation
* user trust
* meaningful sharing frequency

---

# Final Design Principle

The social layer exists to:

* reinforce progression
* contextualize achievement
* increase rider motivation
* celebrate meaningful effort
* support coaching culture
* strengthen longitudinal engagement

—not to maximize addictive engagement.

That distinction must remain visible in every implementation decision.

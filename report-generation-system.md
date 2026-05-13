# Report Generation System — Full Map

## Core Principle

One Report Engine → multiple report types → multiple entry points → shared language system → preview before export

---

## 1. Report Entry Points

### From Session Page

**Button:** Generate Session Report

**Default:**
- Type: Coach Session Report
- Scope: this session

### From Analytics Page

**Button:** Generate Progress Report

**Default:**
- Type: Progress Report
- Scope: last 5 / 10 / all sessions

**Later:**
- Generate Rider Report
- Generate Club Report
- Generate Diagnostic Report

### From Goals Page

**Button:** Generate Goals Report

**Default:**
- Type: Goals Progress Report
- Scope: all active goals
- Includes: AI predictions, milestones, health check

**Button:** Generate Health Report

**Default:**
- Type: Health & Safety Report
- Scope: recent training load
- Includes: fatigue assessment, injury risk, recommendations

---

## 2. Report Types

### A. Session Report

**Answers:** What happened in this session?

**Includes:**
- Coach summary
- Session quality
- Repeatability
- Drop-off
- Best vs average
- Technique notes
- Selected charts
- Recommendations
- Watch-for next session
- Data quality notes

---

### B. Progress Report

**Answers:** How is the rider progressing over time?

**Includes:**
- Progress summary
- Speed/reaction trends
- Consistency trend
- Set length trend
- Drop-off trend
- Best-vs-average gap
- Watch-outs
- Recommendations
- Selected charts

---

### C. Diagnostic Report

**Answers:** Can we trust this data?

**Includes:**
- Bias correction
- Calibration status
- Blocked metrics
- IMU warnings
- Speed/power trust notes
- Raw vs derived metric notes
- Debug appendix

---

### D. Rider / Parent Report

**Answers:** What should the rider understand?

**Includes:**
- Plain-language summary
- Best achievements
- One or two focus points
- Simple visuals
- Watch-for next session
- Minimal technical detail

---

### E. Coach Report

**Answers:** What should change in training?

**Includes:**
- Session + progress intelligence
- Technique → outcome links
- Drop-off/set length
- Repeatability
- Phase/split evidence
- Recommendations by priority
- Data confidence

---

### F. Goals Progress Report

**Answers:** How is the rider progressing toward their goals?

**Includes:**
- Active goals summary with AI predictions
- Progress percentage and status (ahead/on track/behind)
- Milestone timeline for each goal
- Confidence intervals (e.g., "5-9 sessions, most likely 7")
- Health status dashboard integration
- Adaptive adjustment suggestions
- Predicted achievement dates
- Historical milestone achievements

**Data Sources:**
- `training_goals` table (active + completed)
- `goal_milestones` table (auto-created progress points)
- AI prediction engine (polynomial/exponential fitting)
- Session metrics (for current values)

---

### G. Health & Safety Report

**Answers:** Is the rider training safely?

**Includes:**
- Overall health status (healthy/monitor/caution/critical)
- Fatigue score (0-100) with trend
- Injury risk assessment (low/moderate/high/critical)
- Training load analysis
- Performance anomaly detection
- Rest day recommendations
- Specific action items by priority
- Training pattern insights
- Alert summary (critical/warning/info)

**Data Sources:**
- Anomaly detection service
- Fatigue analysis module
- Injury risk assessment
- Alert consolidation system
- Session history analysis

---

## 3. Shared Report Engine

### File Structure

```
src/lib/report-engine/
  types.ts
  buildSessionReport.ts
  buildProgressReport.ts
  buildDiagnosticReport.ts
  buildRiderReport.ts
  buildCoachReport.ts
  buildGoalsReport.ts           # NEW: Goals progress report
  buildHealthReport.ts          # NEW: Health & safety report
  reportSections.ts
  reportLanguage.ts
  index.ts
```

### Consumed Inputs

The report engine consumes existing outputs — it does not recalculate separately:

- v7.2 session intelligence
- v8.1 cross-session intelligence
- v8.2 truth rules
- v8.3 controlled language
- Technique layer
- Data quality layer
- Threshold ratings
- Chart series
- Goals system data:
  - Active and completed goals from `training_goals` table
  - Auto-generated milestones from `goal_milestones` table
  - AI predictions (polynomial/exponential regression)
  - Progress status (ahead/on track/behind/way behind)
  - Health check data (fatigue, injury risk, anomalies)
- Anomaly detection outputs:
  - Performance anomalies (outliers, sudden drops)
  - Fatigue assessment (score 0-100, recommendations)
  - Injury risk levels (low/moderate/high/critical)
  - Alert consolidation (critical/warning/info)

---

## 4. Core Report Data Shape

```typescript
export interface GeneratedReport {
  id: string;
  type: ReportType;
  title: string;
  subtitle?: string;
  generatedAt: string;

  subject: {
    riderName?: string;
    sessionId?: string;
    dateRange?: string;
    sessionCount?: number;
  };

  summary: ReportSummary;
  sections: ReportSection[];
  charts: ReportChart[];
  recommendations: ReportRecommendation[];
  appendices?: ReportAppendix[];
}
```

---

## 5. Report Sections

### Section Types

```typescript
type ReportSectionType =
  | 'executive-summary'
  | 'key-findings'
  | 'session-quality'
  | 'progress-trends'
  | 'technique-analysis'
  | 'data-quality'
  | 'recommendations'
  | 'watch-for'
  | 'charts'
  | 'appendix'
  | 'goals-summary'           // NEW: Goals overview
  | 'milestones-timeline'     // NEW: Achievement history
  | 'ai-predictions'          // NEW: Prediction details
  | 'health-status'           // NEW: Health dashboard
  | 'fatigue-analysis'        // NEW: Fatigue details
  | 'injury-risk'             // NEW: Risk assessment
  | 'training-load'           // NEW: Load analysis
  | 'adaptive-suggestions';   // NEW: AI recommendations
```

### Section Shape

```typescript
export interface ReportSection {
  id: string;
  type: ReportSectionType;
  title: string;
  priority: 'high' | 'medium' | 'low';
  content: string[];
  metrics?: ReportMetric[];
}
```

---

## 6. Report Builder UI

### File Structure

```
src/lib/components/reports/
  ReportBuilder.svelte
  ReportPreview.svelte
  ReportSectionPreview.svelte
  ReportOptionsPanel.svelte
  ReportExportActions.svelte
```

### User Controls

- Report type
- Scope
- Detail level
- Include charts
- Include diagnostics
- Include recommendations
- Include raw appendix

---

## 7. Report Flow

```
User clicks Generate Report
        ↓
ReportBuilder opens
        ↓
Defaults based on current page
        ↓
User adjusts options
        ↓
ReportPreview generated
        ↓
User exports / copies / saves
```

---

## 8. Export Options

**Start with:**
- Print / Save as PDF
- Copy summary
- Export report JSON

**Then add:**
- PDF generation
- CSV appendix
- Share link
- Email report

> Do preview first, PDF second.

---

## 9. Report Preview Page

### Routes

```
/reports/new
/reports/preview
/reports/[id]
```

Or modal first: `ReportBuilder modal`

**Recommended first version:**

```
/reports/preview?type=session&sessionId=...
```

---

## 10. What Each Report Should Avoid

**Do not include:**
- Every metric
- Every chart
- Debug values by default
- Untrusted speed/power without warnings
- Contradictory recommendations

**Every report should answer:**
- What happened?
- Why does it matter?
- What should we do next?
- What should we watch for?
- How much should we trust it?

---

## 11. Build Order

### Phase 1 — Report Engine Skeleton

```
types.ts
reportSections.ts
buildSessionReport.ts
buildProgressReport.ts
```

No PDF yet.

### Phase 2 — Preview UI

```
ReportBuilder
ReportPreview
ReportOptionsPanel
```

### Phase 3 — Session Report

First real report: **Coach Session Report**

### Phase 4 — Progress Report

Second report: **Progress Report from Analytics**

### Phase 5 — Export

```
print-friendly HTML
PDF export
CSV appendix
```

### Phase 6 — Saved Reports

```
reports table in Supabase
share/export history
```

---

## 12. MVP Recommendation

Build the MVP as:

- Coach Session Report
- Progress Report
- Preview page
- Print / Save PDF

Leave advanced diagnostic reports and saved report history for later.

---

## Final Architecture

```
Session page ─────┐
                  ↓
Analytics page ─→ Report Builder
                  ↓
Goals page ──────→ Report Builder
                  ↓
            Report Engine
                  ↓
          Controlled Language
                  ↓
             Report Preview
                  ↓
        Print / PDF / Copy / Save
```

This keeps the system clean, useful, and future-ready.

---

## 13. Goals System Integration

### Available Data from Goals System

The Goals system (completed in Phase 1 & 2) provides rich data for reports:

**From `training_goals` table:**
- `metric` - Which performance metric (reactionTime, maxG, peakSpeed, consistency, etc.)
- `start_value`, `current_value`, `target_value` - Progress tracking
- `deadline` - Target completion date
- `created_at`, `updated_at`, `completed_at` - Timestamps
- `user_id` - Owner

**From `goal_milestones` table:**
- `goal_id` - Links to parent goal
- `value` - Achieved value at this milestone
- `achieved_at` - When milestone was created (uses session timestamp for accuracy)

**Computed on Goals Page:**
- `percentComplete` - Progress percentage (0-100)
- `progressStatus` - 'way_ahead' | 'ahead' | 'on_track' | 'behind' | 'way_behind'
- `prediction` - AI prediction object with:
  - `sessionsRemaining` - Best estimate
  - `type` - 'polynomial' | 'exponential' | 'linear'
  - `confidenceInterval` - { lower, median, upper }
  - `metadata.reason` - Plain language explanation

**Health Check Data:**
- `overallStatus` - 'healthy' | 'monitor' | 'caution' | 'critical'
- `shouldRest` - Boolean recommendation
- `fatigueAssessment` - Score, trend, recommendations
- `injuryRiskAssessment` - Level, factors, warnings
- `anomalies` - Performance outliers
- `alerts` - Consolidated warnings by severity

### Report Integration Points

**Session Report Enhancement:**
- Show if session improved any active goals
- Display "⭐ MILESTONE" badge when significant improvement (>0.5%)
- Link to goals page for details

**Progress Report Enhancement:**
- Include goals progress summary
- Show which metrics have active goals
- Display milestone timeline in appendix

**Goals-Specific Reports:**

1. **Goals Progress Report** (new)
   - Pull all active goals with milestones
   - Include AI predictions for each
   - Show health status if available
   - Recommend adjustments based on progress status

2. **Health & Safety Report** (new)
   - Pull health check data from goals page server
   - Include fatigue, injury risk, anomaly data
   - Provide specific rest/continue recommendations
   - Show alert summary

### Implementation Notes

**Data Fetching:**
```typescript
// In buildGoalsReport.ts
import { supabase } from '$lib/server/supabase';

const { data: goals } = await supabase
  .from('training_goals')
  .select(`
    *,
    goal_milestones(id, value, achieved_at)
  `)
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

**Milestone Auto-Creation:**
- Milestones are created automatically on session page load
- Uses `src/lib/server/goalMilestones.ts` functions
- Threshold: 0.5% improvement required
- Timestamp uses session.timestamp (not current time)

**AI Predictions:**
- Use existing prediction logic from goals page
- Located in goals intelligence service
- Requires ≥3 data points (milestones) for accuracy
- Falls back to simple linear if insufficient data

**Health Check Integration:**
```typescript
// In buildHealthReport.ts
import { performHealthCheck } from '$lib/services/anomalyDetection';

const healthCheck = performHealthCheck(performanceData, sessionHistory);
// Returns: anomalies, fatigueAssessment, injuryRiskAssessment, alerts, overallStatus
```

### Controlled Language Reuse

Reports should use the same controlled language system from v8.3:

```typescript
import { renderCoachMessage, renderTrustSummary } from '$lib/performance-engine/language';
```

This ensures:
- ✅ Consistent coach voice across all reports
- ✅ No conflicting recommendations
- ✅ Proper trust indicators for metrics
- ✅ Plain-language explanations

### Report-Specific Considerations

**Goals Report Should:**
- Celebrate achievements (milestones, completed goals)
- Be motivating and forward-looking
- Include AI predictions with confidence intervals
- Suggest adjustments when ahead/behind schedule
- Show health status if caution/critical

**Health Report Should:**
- Be clear and directive about safety
- Use color coding (green/amber/orange/red)
- Prioritize critical alerts first
- Explain *why* rest is recommended
- Link fatigue patterns to specific sessions

**Both Should Avoid:**
- Technical jargon in executive summary
- Showing debug data by default
- Contradicting session/progress reports
- Overwhelming with too many metrics

---

## Build Notes

### Rule to Avoid Sidetracks

> If it does not help the first Coach Session Report work, park it.

### Litmus Test for First Version

When you look at the generated report, ask:

> Would a coach actually send this to a rider?

If yes → you've nailed it. If not → tweak the narrative, not the tech.

### MVP Output

```
engine data → structured GeneratedReport object
```

No PDF. No saving. No AI. No fancy builder yet.

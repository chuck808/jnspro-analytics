# Admin Enhancements - Phase 2 Implementation Plan

**Status:** Foundation Complete, Features In Progress  
**Created:** April 28, 2026

---

## ✅ Foundation Completed

### Utility Libraries Created:
1. **`exportHelpers.ts`** - CSV/JSON export functionality
   - `exportToCSV()` - Export data tables to CSV
   - `exportToJSON()` - Export structured data to JSON
   - `generateHealthReport()` - Create formatted health reports
   
2. **`profanityFilter.ts`** - Display name moderation
   - `containsProfanity()` - Check for inappropriate content
   - `flaggedDisplayNames()` - Filter list of names
   - `checkDisplayName()` - Detailed name validation

---

## 🎯 Goals Intelligence Enhancements

### 1. ✅ Export Health Reports
**Status:** Utility created, needs UI integration

**Implementation:**
```svelte
<!-- Add to goals-intelligence/+page.svelte -->
<button onclick={() => {
    const report = generateHealthReport(data);
    exportToJSON(report, 'health-report');
}}>
    📥 Export Health Report
</button>
```

### 2. Model Accuracy Tracking
**Status:** Needs implementation

**Approach:**
- Track predictions vs actual outcomes
- Store in `model_predictions` table:
  ```sql
  CREATE TABLE model_predictions (
      id UUID PRIMARY KEY,
      goal_id UUID REFERENCES training_goals(id),
      model_type TEXT, -- 'linear', 'polynomial', 'exponential'
      predicted_sessions INT,
      actual_sessions INT,
      prediction_date TIMESTAMPTZ,
      actual_date TIMESTAMPTZ,
      accuracy_score NUMERIC
  );
  ```
- Calculate accuracy: `|predicted - actual| / predicted * 100`
- Display accuracy dashboard with charts

### 3. A/B Testing UI
**Status:** Needs implementation

**Features:**
- Toggle between prediction models for same goal
- Side-by-side comparison
- User preference tracking
- Statistical significance testing

**UI Components:**
- Model comparison table
- Confidence interval visualization
- Winner declaration based on accuracy

### 4. Manual Intervention Tools
**Status:** Needs implementation

**Features:**
- **Pause Goal** - Temporarily halt tracking
- **Adjust Target** - Admin can modify goal parameters
- **Send Message** - Contact user about their goal
- **Reset Progress** - Clear milestones and restart

**UI:**
```svelte
<div class="intervention-tools">
    <button>Pause Goal</button>
    <button>Adjust Target</button>
    <button>Contact User</button>
    <button>Reset Progress</button>
</div>
```

---

## 🏆 Leaderboard Admin Enhancements

### 1. ✅ Profanity Filtering
**Status:** Utility created, needs integration

**Implementation:**
```typescript
// In leaderboard-admin/+page.server.ts
import { checkDisplayName } from '$lib/utils/profanityFilter';

const flaggedNames = optedIn
    .map(p => ({
        ...p,
        nameCheck: checkDisplayName(p.leaderboard_display_name || '')
    }))
    .filter(p => p.nameCheck.isFlagged);
```

### 2. Category-Specific Health
**Status:** Needs implementation

**Metrics to Track:**
- Participation rate by age group
- Average sessions by category
- Performance distribution
- Category growth trends

**UI:**
```svelte
<div class="category-health">
    {#each ageGroups as group}
        <div class="category-card">
            <h4>{group.label}</h4>
            <p>Participants: {group.count}</p>
            <p>Avg Sessions: {group.avgSessions}</p>
            <p>Growth: {group.growth}%</p>
        </div>
    {/each}
</div>
```

### 3. Cheating Detection
**Status:** Needs implementation

**Red Flags:**
- Sudden massive improvement (>50% in one session)
- Impossible performance (reaction time < 100ms)
- Unusual session patterns (100+ sessions in one day)
- Suspicious data consistency (same exact times repeatedly)

**Algorithm:**
```typescript
function detectCheating(user: User, sessions: Session[]) {
    const flags = [];
    
    // Check for impossible times
    if (user.best_reaction < 100) {
        flags.push('Impossible reaction time');
    }
    
    // Check for suspicious jumps
    const improvements = calculateImprovements(sessions);
    if (improvements.some(i => i > 50)) {
        flags.push('Suspicious performance jump');
    }
    
    // Check for data patterns
    if (hasRepeatedValues(sessions)) {
        flags.push('Suspicious data consistency');
    }
    
    return { isSuspicious: flags.length > 0, flags };
}
```

### 4. Age Group Distribution
**Status:** Needs implementation

**Visualization:**
- Pie chart of age group distribution
- Bar chart of performance by age
- Growth trends over time
- Category comparison metrics

---

## 📊 Advanced Analytics Enhancements

### 1. Date Range Selection
**Status:** Needs implementation

**UI Component:**
```svelte
<script>
    let startDate = $state('');
    let endDate = $state('');
    
    function applyDateFilter() {
        // Reload data with date range
        goto(`/admin/advanced-analytics?start=${startDate}&end=${endDate}`);
    }
</script>

<div class="date-range-picker">
    <input type="date" bind:value={startDate} />
    <span>to</span>
    <input type="date" bind:value={endDate} />
    <button onclick={applyDateFilter}>Apply</button>
</div>
```

### 2. ✅ Export Reports (CSV/JSON)
**Status:** Utility created, needs UI integration

**Implementation:**
```svelte
<div class="export-buttons">
    <button onclick={() => exportToCSV(data.sessionsByUser, 'analytics-sessions')}>
        📥 Export CSV
    </button>
    <button onclick={() => exportToJSON(data, 'analytics-full')}>
        📥 Export JSON
    </button>
</div>
```

### 3. Cohort Retention Analysis
**Status:** Needs implementation

**Metrics:**
- Day 1 retention (users who return next day)
- Week 1 retention
- Month 1 retention
- Cohort comparison (signup month)

**Data Structure:**
```typescript
interface CohortData {
    cohortMonth: string;
    totalUsers: number;
    day1Retention: number;
    week1Retention: number;
    month1Retention: number;
}
```

### 4. Performance Trend Charts
**Status:** Needs implementation

**Charts to Add:**
- Reaction time trends over time
- Session upload trends
- User growth trends
- Performance distribution changes

**Library:** Use Chart.js (already in project)

```typescript
const trendData = {
    labels: dates,
    datasets: [{
        label: 'Average Reaction Time',
        data: values,
        borderColor: '#f5a623',
        tension: 0.4
    }]
};
```

---

## 📋 Implementation Priority

### Phase 2A: Quick Wins (High Impact, Low Effort)
1. ✅ Export functionality (Goals + Analytics) - **READY TO ADD**
2. ✅ Profanity filtering (Leaderboard) - **READY TO ADD**
3. Date range selection (Analytics) - **1-2 hours**
4. Age group distribution (Leaderboard) - **1-2 hours**

### Phase 2B: Medium Complexity
5. Manual intervention tools (Goals) - **2-3 hours**
6. Category-specific health (Leaderboard) - **2-3 hours**
7. Performance trend charts (Analytics) - **2-3 hours**
8. Model accuracy tracking UI (Goals) - **3-4 hours**

### Phase 2C: Advanced Features
9. Cohort retention analysis (Analytics) - **4-5 hours**
10. Cheating detection (Leaderboard) - **4-5 hours**
11. A/B testing UI (Goals) - **5-6 hours**
12. Model accuracy backend (Goals) - **6-8 hours** (requires database changes)

---

## 🗄️ Database Schema Changes Required

### For Model Accuracy Tracking:
```sql
CREATE TABLE IF NOT EXISTS model_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID REFERENCES training_goals(id) ON DELETE CASCADE,
    model_type TEXT NOT NULL, -- 'linear', 'polynomial', 'exponential'
    predicted_sessions_remaining INT,
    predicted_completion_date DATE,
    actual_sessions_remaining INT,
    actual_completion_date DATE,
    accuracy_score NUMERIC,
    confidence_interval_lower INT,
    confidence_interval_upper INT,
    prediction_date TIMESTAMPTZ DEFAULT NOW(),
    outcome_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_model_predictions_goal ON model_predictions(goal_id);
CREATE INDEX idx_model_predictions_type ON model_predictions(model_type);
```

### For Cheating Detection:
```sql
CREATE TABLE IF NOT EXISTS leaderboard_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    flag_type TEXT NOT NULL, -- 'suspicious_performance', 'impossible_time', 'data_pattern'
    description TEXT,
    severity TEXT, -- 'low', 'medium', 'high'
    flagged_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed BOOLEAN DEFAULT FALSE,
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    action_taken TEXT
);

CREATE INDEX idx_leaderboard_flags_user ON leaderboard_flags(user_id);
CREATE INDEX idx_leaderboard_flags_reviewed ON leaderboard_flags(reviewed);
```

---

## 🔄 Quick Implementation Steps

### To add Export buttons (5 minutes):

1. Add to `goals-intelligence/+page.svelte`:
```svelte
<script>
    import { exportToJSON, generateHealthReport } from '$lib/utils/exportHelpers';
</script>

<!-- In header section -->
<button onclick={() => {
    const report = generateHealthReport(data);
    exportToJSON(report, 'health-report');
}} class="export-btn">
    📥 Export Health Report
</button>
```

2. Add to `leaderboard-admin/+page.svelte`:
```svelte
<script>
    import { exportToCSV } from '$lib/utils/exportHelpers';
</script>

<button onclick={() => exportToCSV(data.topParticipants, 'leaderboard-participants')}>
    📥 Export Participants
</button>
```

3. Add to `advanced-analytics/+page.svelte`:
```svelte
<script>
    import { exportToCSV, exportToJSON } from '$lib/utils/exportHelpers';
</script>

<div class="export-group">
    <button onclick={() => exportToCSV(data.sessionsByUser, 'top-contributors')}>
        📥 CSV
    </button>
    <button onclick={() => exportToJSON(data, 'analytics-data')}>
        📥 JSON
    </button>
</div>
```

---

## 📝 Next Steps

**Immediate (Today):**
1. Add export buttons to all 3 dashboards
2. Integrate profanity filter into leaderboard display
3. Add date range picker to Advanced Analytics

**This Week:**
4. Implement manual intervention tools
5. Add category health dashboard
6. Create performance trend charts

**Next Week:**
7. Build cohort retention analysis
8. Implement cheating detection
9. Create A/B testing UI

**Future:**
10. Deploy model accuracy tracking system
11. Add automated alerting
12. Create admin notification system

---

## ✅ Definition of Done

Each enhancement is complete when:
- [ ] Feature implemented and tested
- [ ] UI integrated into existing dashboard
- [ ] Error handling in place
- [ ] Documentation updated
- [ ] Admin can successfully use the feature
- [ ] No TypeScript errors
- [ ] Responsive on mobile

---

**Last Updated:** April 28, 2026  
**Status:** Phase 2A in progress - Foundation complete, ready for integration

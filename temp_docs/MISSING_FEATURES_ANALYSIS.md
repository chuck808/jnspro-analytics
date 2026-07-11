# Missing Features Analysis - SessionPerformancePanel vs Main Page

## SessionPerformancePanel Components (What It Provides)

### 1. **Header Section**

- "Performance Engine" badge
- View headline (e.g., "Strong consistent session")
- View summary text
- ❌ Own detail dropdown (should use page-level instead)

### 2. **Dynamic 4-Metric Grid**

- Metrics change based on detail level
- Include explanations (hidden in grom view)
- Source: `view.metrics` from `createAnalysisView()`

### 3. **Insights Section** ⚠️ **MISSING FROM MAIN PAGE**

- Tone-coded cards (positive/neutral/warning)
- Colored border based on tone
- Title + body for each insight
- Source: `view.insights`

### 4. **Next Actions Section** ⚠️ **MISSING FROM MAIN PAGE**

- Numbered list (1, 2, 3...)
- Prioritized actionable recommendations
- Source: `view.nextActions`

### 5. **Advanced Charts Indicator** ⚠️ **MISSING FROM MAIN PAGE**

- Shows which charts are enabled (elite/coach only)
- Lists: Acceleration ✓, Speed ✓, Impulse ✓, Power ✓, Jerk ✓

### 6. **Profile Completion Warning** ✅ EXISTS ON MAIN PAGE

- Already exists in Power & Impulse section (line ~1570)

### 7. **Performance Charts (Components)** ⚠️ PARTIAL - DUPLICATES EXIST

- **AccelerationChart** component - DUPLICATED by G-Force Chart.js canvas
- **SpeedChart** component (dual-axis) - DUPLICATED by Performance Curves Chart.js canvas
- **JerkChart** component - DUPLICATED by Jerk Chart.js canvas
- **ImpulseChart** component - ❌ **MISSING FROM MAIN PAGE**
- **PowerChart** component - ❌ **MISSING FROM MAIN PAGE**
- Source: Uses dedicated chart components, not Chart.js canvases

### 8. **Calibration Warnings** ⚠️ **MISSING FROM MAIN PAGE**

- Shows detailed calibration issues (elite/coach only)
- Coach view: Lists all error diagnostics with suggestions
- Source: `analysis.diagnostics`

### 9. **Debug Info** ⚠️ **MISSING FROM MAIN PAGE**

- Expandable `<details>` with raw JSON (coach only)
- Full analysis object dump

---

## Main Page Current State

### What Exists:

- G-Force Chart (Chart.js) - DUPLICATES Acceleration
- Performance Curves (Chart.js) - DUPLICATES Speed
- Jerk Chart (Chart.js) - DUPLICATES Jerk
- Run Metrics (8 fixed cards)
- Technique Scores
- Context insight cards (before charts in elite/coach)
- Power & Impulse static metrics (not charts)
- Profile completion warning

### What's Missing:

1. ❌ **Impulse Chart** (component with cumulative curve)
2. ❌ **Power Chart** (component with power curve over time)
3. ❌ **Structured Insights Section** (tone-coded cards with all insights)
4. ❌ **Structured Next Actions Section** (numbered prioritized list)
5. ❌ **Advanced Charts Indicator** (shows what charts are enabled)
6. ❌ **Detailed Calibration Warnings** (with diagnostics and suggestions)
7. ❌ **Debug Info Section** (coach-level JSON dump)
8. ❌ **Dynamic 4-Metric Grid** (page uses fixed 8 metrics instead)

---

## Integration Plan

### Step 1: Add Missing Chart Components

- Add ImpulseChart component (after Jerk chart)
- Add PowerChart component (after Impulse chart)
- Both gated to elite/coach levels

### Step 2: Replace Chart.js Canvases with Components

- Replace G-Force Chart.js canvas → AccelerationChart component
- Replace Performance Curves Chart.js canvas → SpeedChart component
- Replace Jerk Chart.js canvas → JerkChart component
- Remove `renderCharts()` function and Chart.js logic

### Step 3: Add Structured Insights Section

- Add before the charts section (after Training Insights Panel)
- Tone-coded cards layout
- Source: `analysisView.insights`
- Gated to rider/elite/coach

### Step 4: Add Structured Next Actions Section

- Add with Insights section (2-column grid like PE panel)
- Numbered list format
- Source: `analysisView.nextActions`
- Gated to rider/elite/coach

### Step 5: Add Advanced Charts Indicator

- Add before charts section
- Shows enabled chart checkmarks
- Elite/coach only

### Step 6: Add Calibration Warnings

- Add after charts section
- Show detailed diagnostics
- Elite/coach only, coach gets full diagnostic list

### Step 7: Add Debug Info

- Add at end of run detail section
- Expandable details with JSON
- Coach only

### Step 8: Remove SessionPerformancePanel

- Delete the import
- Delete the component usage
- Verify everything still works

---

## Notes

- All features must respect the PAGE-LEVEL detail dropdown
- No duplicate dropdowns
- Maintain single source of truth (Performance Engine)
- Keep progressive disclosure (grom → rider → elite → coach)

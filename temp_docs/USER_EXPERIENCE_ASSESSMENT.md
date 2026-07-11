# Session Page - User Experience Assessment

**Detail Level Layering Analysis**

Generated: 5/2/2026, 4:20 PM

---

## Current Layered Presentation

### 🟢 **GROM / PARENT View**

#### What They See:

1. **Session Header** - Date, runs, bike (✅ Good)
2. **Goal Progress Alert** (if applicable) - Visual progress bars (✅ Good)
3. **Session Summary Stats** - 4 cards (Total Runs, Wheelies, Best Max G, Avg Reaction) (✅ Good)
4. **Session Narrative - CELEBRATION LAYOUT**
   - Hero metric with large number display (✅ Good visual)
   - Dynamic badge based on performance (✅ Good visual)
   - Session headline text (⚠️ TEXT HEAVY)
   - Impact paragraph (⚠️ TEXT HEAVY)
   - Next step card with text (⚠️ TEXT HEAVY)

#### Text vs Visual Balance:

- **Visual Elements**: 35%
- **Text Elements**: 65%
- **Assessment**: ⚠️ **TOO TEXT HEAVY** for target audience (kids/parents)

#### Issues:

1. Celebration layout has 3 text blocks (headline, impact, next step)
2. No visual charts or graphics showing their performance
3. Missing opportunity for visual celebration (e.g., progress bars, icons, animations)
4. Complex sentences in narrative that may be too advanced for younger riders

---

### 🟡 **RIDER View**

#### What They See:

1. **Session Header** (✅ Good)
2. **Goal Progress Alert** (✅ Good)
3. **Session Summary Stats** - 6 cards (✅ Good)
4. **Session Narrative Card** (⚠️ TEXT HEAVY)
   - Headline text
   - Impact text
   - Action text
   - Why this matters text
   - Watch for text
5. **Performance Insights** - Tone-coded cards with title + body (⚠️ TEXT HEAVY)
6. **Next Actions** - Numbered list (⚠️ TEXT HEAVY)
7. **Training Insights Panel** - More text-based analysis (⚠️ TEXT HEAVY)
8. **All Runs Comparison Table** (✅ Good - data table)
9. **Run Selector** (✅ Good)
10. **Charts Section** (✅ GOOD - visual balance)
    - G-Force Chart
    - Run Metrics cards
    - Technique Scores with gauge

#### Text vs Visual Balance:

- **Visual Elements**: 40%
- **Text Elements**: 60%
- **Assessment**: ⚠️ **SLIGHTLY TEXT HEAVY** for riders who want quick insights

#### Issues:

1. **4 consecutive text-heavy panels** before any charts (Narrative, Insights, Next Actions, Training Insights)
2. Insights and Next Actions could be more visual
3. Too much reading required before seeing visual data
4. Overlap between "Performance Insights" and "Training Insights Panel"

---

### 🔵 **ELITE / COACH Views**

#### What They See:

Everything from Rider view PLUS:

- Performance Curves chart
- Jerk chart with context cards
- Detailed Phase Analysis
- Speed Splits table
- Cross-Run Progression charts
- Impulse & Power charts
- Calibration Warnings
- Debug Info (coach only)

#### Text vs Visual Balance:

- **Visual Elements**: 55%
- **Text Elements**: 45%
- **Assessment**: ✅ **GOOD BALANCE** - appropriate for advanced users

#### Issues:

- Actually pretty well balanced
- Text is expected and valuable at this level
- Charts provide visual relief

---

## Key Problems Identified

### 1. **Text Overload in Early Sections (Grom/Rider)**

**Problem**: Users see 3-4 consecutive text panels before any visual data
**Impact**: Overwhelming, boring, hard to scan quickly

### 2. **Duplicate/Overlapping Information**

**Current Flow**:

- Session Narrative (text)
- Performance Insights (text)
- Next Actions (text)
- Training Insights Panel (text)

**All of these are variations of the same thing**: Performance Engine analysis presented in different formats

### 3. **Grom View Missing Visual Celebration**

**Problem**: Groms get a big number but then walls of text
**Missed Opportunity**: Could have fun visual elements like:

- Animated progress indicators
- Visual achievement badges
- Simple bar charts showing improvement
- Icon-based next steps

### 4. **Rider View Front-Loaded with Text**

**Problem**: Have to scroll through ~4 text sections before seeing any charts
**Impact**: Users want to see their data visually, not read paragraphs

---

## Recommendations

### 🎯 **Priority 1: Reduce Text Duplication**

**Consolidate Insights Sections**:
Currently we have:

1. Session Narrative
2. Performance Insights (NEW - from PE Panel)
3. Next Actions (NEW - from PE Panel)
4. Training Insights Panel

**Recommended Consolidation**:

- **Option A**: Remove #2 and #3, enhance Training Insights Panel with tone-coded cards
- **Option B**: Remove Training Insights Panel, keep #2 and #3 as the "insights layer"
- **Option C**: Merge all into one "Session Intelligence" panel with tabs/sections

### 🎯 **Priority 2: Grom View Visual Enhancement**

**Add Visual Elements**:

1. **Performance Trend Mini-Chart** (just a sparkline showing session progression)
2. **Visual Achievement Icons** instead of text badges
3. **Progress Bars** for "how you're doing" vs personal bests
4. **Icon-Based Next Steps** (big emoji + short phrase, not paragraph)
5. **Simplify Text** - reduce narrative to 1-2 sentences max

**Example Enhancement**:

```
Current:
- Hero Metric ✅
- Text badge ⚠️
- Headline (paragraph) ⚠️
- Impact (paragraph) ⚠️
- Next Step (paragraph) ⚠️

Recommended:
- Hero Metric ✅
- Visual badge/icon ✅
- Headline (one sentence) ✅
- Mini progress chart ✅ NEW
- Next Step (icon + 5 words) ✅
```

### 🎯 **Priority 3: Rider View Restructure**

**Move Charts Earlier**:
Current order:

1. Stats cards ✅
2. Text narrative ⚠️
3. Text insights ⚠️
4. Text actions ⚠️
5. Text training ⚠️
6. Charts ✅ (finally!)

Recommended order:

1. Stats cards ✅
2. **G-Force Chart** ✅ MOVED UP
3. Consolidated Insights (1 panel, not 3) ✅
4. **Technique Scores** ✅ MOVED UP
5. Detailed analysis (rest of charts)

**Rationale**: "Show, then tell" - Let them see their performance visually first, then provide context

### 🎯 **Priority 4: Make Insights More Scannable**

**Current**: Full paragraphs in cards
**Recommended**:

- **Icon/Color coding** (already have tone colors ✅)
- **Bullet points** instead of paragraphs
- **Bold key phrases**
- **Collapsible details** for longer explanations

---

## Specific Section Recommendations

### **Session Narrative (All Levels)**

**Current**: Multiple paragraphs
**Recommend**:

- **Grom**: 1 sentence headline + icon
- **Rider**: 2-3 sentences max
- **Elite/Coach**: Current is fine

### **Performance Insights**

**Current**: Cards with title + paragraph
**Recommend**:

- Keep tone-coded borders ✅
- **Add icons** representing insight type
- **Bullet point** format for body text
- **"Learn more"** collapse for additional detail

### **Next Actions**

**Current**: Numbered list with full sentences
**Recommend**:

- Keep numbering ✅
- **Add icons** for action type
- **Bold the action verb** ("Practice", "Focus on", "Try")
- Shorter phrasing

### **Training Insights Panel**

**Decision needed**: Keep or remove?

- If keeping: Make it collapsible "Advanced Analysis"
- If removing: Ensure key info is in Performance Insights

---

## Visual Enhancement Ideas

### **For Grom View**:

1. **Celebration Animation** on page load for PBs
2. **Star Rating** system (instead of percentage scores)
3. **Visual Comparison** - "You vs Last Session" simple bar chart
4. **Emoji-Based Next Steps** - 🎯 Practice your starts, 💪 Work on smoothness

### **For Rider View**:

1. **Quick Stats Dashboard** - Cards with mini sparklines
2. **Visual Insight Cards** - Icon + color + short text
3. **Interactive Charts First** - Make data the hero
4. **Collapsible Detail Sections** - "Want to learn more?"

### **For Elite/Coach**:

- Current balance is good
- Could add "Executive Summary" toggle for quick scan

---

## Proposed Changes Priority

### **Phase 1: Quick Wins** (Low effort, high impact)

1. ✅ Shorten text in Grom narrative (1-2 sentences)
2. ✅ Add icons to Insights cards
3. ✅ Bullet points in Insights instead of paragraphs
4. ✅ Move G-Force chart earlier in Rider view

### **Phase 2: Consolidation** (Medium effort)

1. ⚠️ Decide: Keep Training Insights Panel OR Performance Insights section (not both)
2. ⚠️ Merge duplicate information
3. ⚠️ Reorder sections for better visual flow

### **Phase 3: Visual Enhancements** (Higher effort)

1. 🎨 Add mini charts/sparklines to Grom view
2. 🎨 Icon system for insights and actions
3. 🎨 Collapsible details for advanced info
4. 🎨 Visual progress indicators

---

## Conclusion

**Current State**: Technically correct, logically sound, but **too text-heavy for Grom and Rider levels**.

**Root Cause**: We integrated SessionPerformancePanel's text-based insights WITHOUT removing existing text-based sections, creating duplication.

**Solution**:

1. **Consolidate** duplicate insight sections
2. **Visualize** data earlier in the flow
3. **Simplify** text for younger/casual users
4. **Enhance** with icons, charts, and visual elements

**Impact**: Better balance between "show" and "tell", making the page more engaging and scannable while preserving the rich Performance Engine analysis.

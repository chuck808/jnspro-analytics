// Auto-generated — do not edit manually
// Run scripts/generate-docs.py to regenerate

export interface DocChapter {
  slug: string;
  title: string;
  desc: string;
  icon: string;
  html: string;
  plain: string;
}

export const chapters: DocChapter[] = [
  {
    slug: "session",
    title: "Your Session Data",
    desc: "Understanding your runs, charts, technique scores, and three-page layout",
    icon: "\ud83d\udcca",
    html: `<hr />
<h2 id="what-the-session-page-is-for">What the Session Page Is For</h2>
<p>The analytics page shows you trends across multiple sessions. The session pages show you what actually happened in a specific one — run by run, metric by metric.</p>
<p>This is the most detailed view in the system. Everything the sensor recorded, everything the firmware calculated, and everything the analytics layer computed is available here. That's a lot of information, which is why it's split across three pages rather than presented all at once.</p>
<hr />
<h2 id="finding-your-way-around">Finding Your Way Around</h2>
<p>Session detail is split into three pages. You can move between them using the navigation bar at the bottom of the screen, or the links in the sidebar when you're on a session.</p>
<p><strong>Overview</strong> is where you land first. It shows the headline numbers for the whole session — run count, best reaction time, best peak speed, best max G-force, consistency score — and a plain English summary of what the session data actually shows. If any of your active goals improved during this session, you'll see a progress indicator here too. This is the page to check quickly after every session.</p>
<p><strong>Analysis</strong> is where the detail lives. Select a run from the selector at the top, and the page fills with charts and metrics for that run — G-force curve, speed and acceleration overlay, jerk profile, impulse, power, technique scores, phase breakdown, and speed splits. The multi-run overlay tool is also here, letting you compare the G-force curves of two to four runs directly on the same chart.</p>
<p><strong>Deep Dive</strong> is for investigation. Run comparison tables, performance targets, G-force stability across the session, data drill-down, session notes, and the option to compare this session against the previous one. Most sessions you won't need this page. When something looks interesting or you want to share a detailed comparison with your coach, this is where to come.</p>
<p>The sticky navigation bar at the bottom of the screen shows which page you're on, lets you switch between the three, and gives you quick access to the report generator.</p>
<hr />
<h2 id="session-context">Session Context</h2>
<p>Before you look at the numbers, you can record what the conditions were. At the top of the Overview page is a context panel where you can note the weather (sunny, cloudy, light rain, windy, cold, hot), the track surface (dry concrete, dry asphalt, damp, wet, muddy, indoor), and what you were focusing on that session (reaction time, explosiveness, speed and carry, technique, endurance, consistency, recovery, or testing).</p>
<p>This information doesn't change the analytics — your reaction times are what they are regardless of the weather. What it does is give you a record you can look back on later. If you review six months of sessions and see that your numbers are consistently better on dry concrete than damp asphalt, that's worth knowing. The context fields make those comparisons possible.</p>
<p>None of this is required. If you just want to get to the data, ignore it.</p>
<hr />
<h2 id="run-tagging">Run Tagging</h2>
<p>On the Analysis page, next to each run in the run selector, is a tag button. You can mark any run as warmup, best effort, experimental, competition, or exclude from stats.</p>
<p>Tagging affects the session averages. Runs marked as warmup or exclude from stats are removed from the session-level calculations — consistency score, average reaction time, average G-force. The runs are still there and you can still view them; they just don't pollute your session statistics with data from runs that were never intended to be representative.</p>
<p>If you always do two warmup runs before your real efforts, tag them. Your session averages will better reflect your actual training quality.</p>
<hr />
<h2 id="a-note-on-elapsed-time-and-speed-accuracy">A Note on Elapsed Time and Speed Accuracy</h2>
<p>The AppGatePro records data for a window you set in the device settings — typically 3–4 seconds, long enough to capture your full run at your chosen distance. The distance is also set in the device (10m, 20m, or whatever your track setup uses).</p>
<p>If you have the breakbeam timing module, elapsed time becomes a precision measurement — the exact moment you cross the line, to ±1ms. Combined with your known distance, this gives you a real average speed calculation rather than an estimate, and significantly improves the accuracy of everything the system calculates from velocity.</p>
<p>Without the breakbeam, the device records for the full window and speed is estimated from the IMU data. These estimates are reliable for comparing your own runs against each other and tracking progress over time — just not absolute values you'd quote as ground truth. The system tells you clearly which situation you're in.</p>
<hr />
<h2 id="understanding-the-charts">Understanding the Charts</h2>
<h3 id="g-force">G-Force</h3>
<p>The core chart. Time on the x-axis, G-force on the y-axis, filled area showing your acceleration trace through the run.</p>
<p>What you're looking for: an early peak (ideally in the first 0.5–1.0 seconds), a single dominant peak rather than several peaks of similar height, and a gradual decline after the peak rather than a sudden drop. An early, high, clean peak means you're front-loading your power into the snap. Multiple peaks usually mean uneven pedal strokes.</p>
<p>Typical values: 2.0–2.5G is club level, 2.5–3.0G is strong, above 3.0G approaches the edge of the sensor's measurement range and should be treated with some caution. The sensor compensates for this but very high numbers become less precise.</p>
<h3 id="multi-run-overlay">Multi-Run Overlay</h3>
<p>On the Analysis page, above the individual run charts, is a comparison selector. Pick two to four runs and click Update Comparison. Their G-force curves are drawn on the same chart — each run a different colour — and the system highlights where they diverge most significantly.</p>
<p>This is most useful when something felt different between runs and you want to see where it shows up in the data, or when you're working on a specific technique change and want to see whether it's showing up in the curve shape.</p>
<p>A consistency percentage appears alongside the comparison, showing how similar the selected runs are overall. Lower variation between runs indicates more repeatable technique.</p>
<h3 id="speed-and-acceleration">Speed and Acceleration</h3>
<p>A dual-axis chart with speed (km/h, left axis) and acceleration (G-force, right axis) on the same timeline. Both together reveal things neither shows alone — you can have high acceleration but poor speed conversion, or moderate acceleration and excellent speed, depending on technique.</p>
<p>Speed should build in a roughly S-shape (slow start, rapid middle, tapering off). Peak acceleration should happen noticeably before peak speed — if they're occurring at the same time, something's not right.</p>
<p><strong>With the breakbeam module:</strong> elapsed time is a precision measurement, so average speed over your set distance is a genuine calculation. The speed curve is anchored to this real value, making it significantly more reliable.</p>
<p><strong>Without the breakbeam:</strong> speed is estimated from IMU integration with bias correction applied. You'll see a data quality badge (Excellent / Good / Fair / Poor) and a bias correction value in m/s². Under 0.5 m/s² is excellent. Above 3.0 m/s² means the speed estimate is approximate at best. These numbers are reliable for comparing your own runs against each other — treat them with caution as absolute values.</p>
<h3 id="jerk">Jerk</h3>
<p>Jerk is how quickly your force application changes — the rate of change of acceleration. It's a smoothness indicator. Positive jerk means force is increasing, negative means it's decreasing.</p>
<p>A smoothness score (0–100) appears below the chart. Above 80 is excellent. Below 60 suggests choppy or uneven force delivery. Two riders with identical peak G-force can have very different jerk profiles — the smoother rider is usually more consistent and more efficient.</p>
<h3 id="impulse">Impulse</h3>
<p>Cumulative force over time, shown as a rising line. The steeper the rise, the more force per unit time. Key numbers: total impulse (total force delivery for the run) and time to 50% impulse (how long it took to deliver half your total force). Gate starts reward front-loaded power — getting 50% of your force in under 0.5 seconds is much better than spreading it evenly across 2 seconds.</p>
<h3 id="power">Power</h3>
<p>Estimated using force × velocity. Only appears if you have rider weight and bike weight entered in your profile — without accurate mass data the numbers would be misleading, so the system doesn't show them.</p>
<p>These are estimates from IMU data, not crank power meter measurements. With the breakbeam module the velocity component is more accurate, which improves the power estimate. Without it, treat power figures as useful relative comparisons rather than absolute values.</p>
<hr />
<h2 id="technique-scoring">Technique Scoring</h2>
<p>Four component scores, weighted into an overall score:</p>
<ul>
<li><strong>Reaction (30%)</strong> — based on your reaction time relative to benchmarks for your rider level</li>
<li><strong>Explosiveness (25%)</strong> — how much of your power you front-load into the first 500ms relative to your peak</li>
<li><strong>Smoothness (25%)</strong> — how steady your force application is, derived from jerk analysis</li>
<li><strong>Efficiency (20%)</strong> — how quickly you convert acceleration into speed</li>
</ul>
<p>Overall score ranges: 85–100 is excellent, 70–84 is good, 55–69 is fair, below 55 needs work. Scores are benchmarked against your declared rider level — a grom scoring 70 and a club rider scoring 70 are at different absolute levels.</p>
<p>The technique scores are most useful when tracked over time. A single session's scores are data points. Ten sessions' scores show a trend. Watch for all scores improving together (technique work is paying off), or inconsistencies — reaction improving while smoothness drops often means you're rushing the start; efficiency stuck while explosiveness improves usually means a technique or setup issue.</p>
<p>Don't chase perfect scores. Chase consistent scores that stay stable or improve as your absolute performance improves.</p>
<hr />
<h2 id="key-metrics">Key Metrics</h2>
<p><strong>Reaction time</strong> is the single most important number on this page for most riders. It's directly measured from gate drop to first detectable movement. It's not estimated or derived. It's as accurate as the sensor can be.</p>
<p><strong>Max G-force</strong> conflates strength, technique, body position, and bike setup. Two riders with identical max G might be doing completely different things. Its value is as a tracking metric over time. Rising max G with stable or improving technique scores means you're getting stronger and maintaining form. Rising max G with falling technique scores means you're muscling it.</p>
<p><strong>Peak speed</strong> — with the breakbeam, this is anchored to a real measurement and is genuinely reliable. Without it, it's calculated from acceleration integration and is best used for relative comparison between your own runs rather than as an absolute figure.</p>
<p><strong>Consistency (CV%)</strong> is the coefficient of variation of your reaction times across the session. Below 5% is excellent, 5–8% good, 8–12% fair, above 12% variable. A rider who hits 0.260s every run beats one who hits 0.220s once and 0.310s twice. Racing rewards reliability, and consistency is trainable — improving it usually precedes improving peak times.</p>
<hr />
<h2 id="phase-analysis-and-speed-splits">Phase Analysis and Speed Splits</h2>
<p>The system divides your gate start into three phases: the drive phase (maximum force application), the transition phase (converting force to velocity), and the velocity phase (maintaining the speed you've built). Each has its own duration, efficiency, and characteristic metrics.</p>
<p>The drive phase is your snap — explosive power delivery. Problems here show as low peak G, late peak timing, or poor front-loading.</p>
<p>The transition phase is where technique quality reveals itself. You generated force in the drive phase; now you're translating it to speed. Low efficiency here despite good G-force usually points to technique or body position.</p>
<p>The velocity phase is about maintaining what you've built. Early peak (speed peaks and drops quickly) or poor endurance through the run show up here.</p>
<p>The speed splits table (when valid data exists) shows when and where you reached target speeds — 30, 40, 50 km/h and so on, with time from gate drop and distance at that point. Tracking these over multiple sessions shows whether your acceleration efficiency is improving.</p>
<hr />
<h2 id="session-level-patterns">Session-Level Patterns</h2>
<p><strong>Cross-run progression</strong> shows how a metric changed across your runs in order (run 1 → 2 → 3 → etc). Declining trend = fatigue. Improving trend = warm-up effect or finding your rhythm. Flat trend = consistent preparation.</p>
<p><strong>Optimal set length</strong> — the system estimates how many runs you can sustain at high quality per session. If your drop-off consistently happens at run 6, doing 10-run sessions means 40% of your reps are junk. Use this to plan your sessions rather than grinding through more reps than you can do well.</p>
<p><strong>Wheelie detection</strong> — if you have timeseries data, front wheel lift is tracked: whether it happened, when, how long. Wheelies at the gate aren't necessarily a problem. Whether it's costing you speed and whether you can control it is context the data can't provide — that's for your coach.</p>
<hr />
<h2 id="comparing-to-previous-sessions">Comparing to Previous Sessions</h2>
<p>At the bottom of the Deep Dive page is a comparison panel that loads the previous session automatically and places key metrics side by side. It shows the delta between sessions for reaction time, peak G-force, peak speed, and consistency, and generates a brief summary of what changed significantly.</p>
<p>This is most useful after a technique change or a training block — a quick way to see whether the work is showing up in the numbers without having to go back and forth between session pages manually.</p>
<hr />
<h2 id="session-notes">Session Notes</h2>
<p>The Deep Dive page has a notes panel where you, your coach, or a parent can leave notes against the session. Notes are organised by type: pre-session (what you were planning to work on), during session (observations), post-session (reflections after), and coach feedback.</p>
<p>Notes are private to your account. They don't affect any analytics. Their value is in having a record of the human context around the numbers — what you were thinking, what your coach noticed, what felt different that day.</p>
<hr />
<h2 id="data-quality">Data Quality</h2>
<p>Each run has an analytics valid flag from the firmware. If it's false, speed-based metrics don't appear — not because the system is being precious, but because showing potentially misleading numbers is worse than showing nothing. Reaction time and raw G-force always appear because they're direct measurements. Calculated metrics are hidden when the underlying data isn't trustworthy.</p>
<p>Without the breakbeam, the bias correction value tells you how much correction was needed for the speed integration. Under 0.5 m/s² is excellent. Above 3.0 m/s² means treat speed estimates as approximate. High bias correction usually means the device wasn't calibrated properly before the run or wasn't mounted securely. With the breakbeam, the speed curve is anchored to a real measurement so bias correction matters less.</p>
<p>If analytics don't appear, it's usually one of: analytics_valid is false for that run, your profile is missing weight data (needed for power), or the acceleration data was incomplete. The system won't fill gaps with guesses.</p>
<hr />
<h2 id="what-to-look-at">What to Look At</h2>
<p><strong>Every session:</strong> Overview page — reaction time, consistency, max G, session narrative. Thirty seconds if nothing's unusual.</p>
<p><strong>When you want the detail:</strong> Analysis page — pick a run, check the G-force chart shape, technique scores, and any contextual insights the system has flagged.</p>
<p><strong>When something looks odd or you want to share with your coach:</strong> Deep Dive — comparison tables, phase analysis, data drill-down, session comparison, notes.</p>
<hr />
<h2 id="common-patterns">Common Patterns</h2>
<p><strong>Good session:</strong> Technique scores stable (70–85), consistency CV% below 8%, G-force chart shows clean early peak with gradual decline, best and average runs within 5–10%, no data quality warnings. Repeatable, efficient starts. This is what you're building toward.</p>
<p><strong>Fatigue session:</strong> Performance degrades run to run — reaction times slow, G-force peaks lower and later, smoothness scores drop, technique deteriorates through the session. Either you came in already fatigued, or the session was too long. Cut set length or increase recovery time.</p>
<p><strong>Chasing peaks:</strong> Best run is 15–20% better than average, high variance across all metrics, some runs excellent and others poor, CV% above 12%. You're trying to hit a perfect run instead of building consistent mechanics. Back off the intensity and focus on repeatability.</p>
<p><strong>Equipment or setup issue:</strong> All runs show the same odd pattern. Efficiency scores particularly low despite reasonable G-force. Power and speed don't align. Unlike fatigue, which gets worse through a session, equipment issues affect all runs similarly.</p>
<p><strong>Data quality issue:</strong> Multiple runs with analytics_valid false, high bias correction, speed curves that don't make sense. Check calibration, check mounting, note it and move on. Learn what you can from the reaction time and G-force data.</p>
<hr />
<h2 id="honest-limitations">Honest Limitations</h2>
<p>The session pages contain three types of information and they're not equally reliable.</p>
<p><strong>Direct measurements</strong> — reaction time, elapsed time (precision with breakbeam, recording window without), acceleration trace, pitch and roll angles. These are the numbers you can trust most.</p>
<p><strong>Calculated metrics</strong> — peak speed, power, efficiency scores. With the breakbeam these are significantly more accurate. Without it, they're good for comparing your own runs against each other but treat absolute values with appropriate caution.</p>
<p><strong>Interpreted insights</strong> — technique scores, weakness identification, phase classifications. Pattern recognition from formulas. Useful as suggestions and prompts, not as prescriptions. The system can tell you what the data looks like — it can't tell you why it looks that way or exactly what to change.</p>
<p>Use direct measurements to track absolute progress. Use calculated metrics for relative comparison. Use insights as starting points for conversations with your coach, not as verdicts.</p>
<hr />
<p><em>For help with specific sections, use the Help buttons throughout the session pages.</em></p>`,
    plain: `What the Session Page Is For The analytics page shows you trends across multiple sessions. The session pages show you what actually happened in a specific one — run by run, metric by metric. This is the most detailed view in the system. Everything the sensor recorded, everything the firmware calculated, and everything the analytics layer computed is available here. That's a lot of information, which is why it's split across three pages rather than presented all at once. Finding Your Way Around Session detail is split into three pages. You can move between them using the navigation bar at the bottom of the screen, or the links in the sidebar when you're on a session. Overview is where you land first. It shows the headline numbers for the whole session — run count, best reaction time, best peak speed, best max G-force, consistency score — and a plain English summary of what the session data actually shows. If any of your active goals improved during this session, you'll see a progress indicator here too. This is the page to check quickly after every session. Analysis is where the detail lives. Select a run from the selector at the top, and the page fills with charts and metrics for that run — G-force curve, speed and acceleration overlay, jerk profile, impulse, power, technique scores, phase breakdown, and speed splits. The multi-run overlay tool is also here, letting you compare the G-force curves of two to four runs directly on the same chart. Deep Dive is for investigation. Run comparison tables, performance targets, G-force stability across the session, data drill-down, session notes, and the option to compare this session against the previous one. Most sessions you won't need this page. When something looks interesting or you want to share a detailed comparison with your coach, this is where to come. The sticky navigation bar at the bottom of the screen shows which page you're on, lets you switch between the three, and gives you quick access to the report generator. Session Context Before you look at the numbers, you can record what the conditions were. At the top of the Overview page is a context panel where you can note the weather (sunny, cloudy, light rain, windy, cold, hot), the track surface (dry concrete, dry asphalt, damp, wet, muddy, indoor), and what you were focusing on that session (reaction time, explosiveness, speed and carry, technique, endurance, consistency, recovery, or testing). This information doesn't change the analytics — your reaction times are what they are regardless of the weather. What it does is give you a record you can look back on later. If you review six months of sessions and see that your numbers are consistently better on dry concrete than damp asphalt, that's worth knowing. The context fields make those comparisons possible. None of this is required. If you just want to get to the data, ignore it. Run Tagging On the Analysis page, next to each run in the run selector, is a tag button. You can mark any run as warmup, best effort, experimental, competition, or exclude from stats. Tagging affects the session averages. Runs marked as warmup or exclude from stats are removed from the session-level calculations — consistency score, average reaction time, average G-force. The runs are still there and you can still view them; they just don't pollute your session statistics with data from runs that were never intended to be representative. If you always do two warmup runs before your real efforts, tag them. Your session averages will better reflect your actual training quality. A Note on Elapsed Time and Speed Accuracy The AppGatePro records data for a window you set in the device settings — typically 3–4 seconds, long enough to capture your full run at your chosen distance. The distance is also set in the device (10m, 20m, or whatever your track setup uses). If you have the breakbeam timing module, elapsed time becomes a precision measurement — the exact moment you cross the line, to ±1ms. Combi`,
  },
  {
    slug: "analytics",
    title: "Analytics & Trends",
    desc: "Cross-session patterns, trend charts, and performance intelligence",
    icon: "\ud83d\udcc8",
    html: `<hr />
<h2 id="what-analytics-is-for">What Analytics Is For</h2>
<p>Looking at individual sessions tells you what happened that day. The analytics page tells you whether you're actually getting better.</p>
<p>A reaction time of 0.245 seconds is a number. Whether that's an improvement, a plateau, or a decline depends on what came before it and what's been happening across your last ten sessions. Analytics provides that context — it looks across all your uploaded sessions and tells you what the patterns show.</p>
<p>The system gets more useful the more data you give it. With three sessions it can show you basic trends. With ten it starts identifying reliable patterns. With twenty or more it can tell you with statistical confidence what's actually changing and what's just noise.</p>
<hr />
<h2 id="how-the-page-is-laid-out">How the Page Is Laid Out</h2>
<p>The analytics page works in layers, from the most important information at the top to the detailed data at the bottom.</p>
<p><strong>Performance Overview</strong> is the first thing you see — a headline based on your recent sessions, your personal bests with competitive benchmarks, and a quick visual of your session quality over the last ten sessions. This is the "what's happening" layer. If you only have a minute, this is the bit to look at.</p>
<p><strong>Session Narrative</strong> translates your most recent session into plain English. Not numbers — a short paragraph describing what the data actually shows. Whether your runs were consistent, where fatigue appeared, whether there were any data quality issues. It adapts to what happened, so it reads differently for a strong session than a scattered one.</p>
<p><strong>Training Insights</strong> shows the patterns behind your current performance — how repeatable your starts are, where fatigue typically hits in a session, how your best and average runs compare, and what the data suggests about how many quality reps you can sustain. This is the "why is it happening" layer.</p>
<p><strong>Performance Patterns</strong> only appears once you have at least three sessions. Four charts designed around coaching questions rather than raw data display. More on these below.</p>
<p><strong>Raw Performance Trends</strong> is exactly what it sounds like — reaction time, peak speed, and consistency tracked over time as simple charts. The actual numbers, with trend lines.</p>
<p><strong>Advanced Analytics</strong> is collapsed by default because most people won't need it. Speed distribution, quickness correlation, session comparison, and rolling statistical analysis. Expand it if you want to dig deeper; leave it closed if you don't.</p>
<p><strong>Session History</strong> sits at the bottom — a chronological list of your sessions with links to the detail pages. Reference material for when you want to find a specific session.</p>
<hr />
<h2 id="understanding-trend-charts">Understanding Trend Charts</h2>
<p>All the trend charts on this page use linear regression for their trend lines. That means the line shows the overall direction of change, not the exact path between individual data points. If the reaction time trend line is going down, your reaction time is generally improving — even if specific sessions jump around.</p>
<p>You need at least three sessions for trend charts to appear at all, and at least six before the trend calculations become reliable. With three to five sessions, the trend line can be easily skewed by a single outlier. With six or more, the system starts showing percentage change figures and can be more confident the trend is real.</p>
<p>When the system tells you your reaction time is "improving by 5.3%," that's comparing the average of your last five sessions to the average of the five before that. It's not your best-ever versus your most recent — it's whether your average is moving in the right direction consistently.</p>
<p>Normal session-to-session variation is 3–5%. That's measurement variation, daily form, environmental factors. The system only flags changes larger than that as trends, so if it's showing you a trend, the change is statistically larger than routine noise.</p>
<hr />
<h2 id="performance-patterns">Performance Patterns</h2>
<p>These four charts are the most useful coaching tools on the page. Each one answers a specific question that you can't answer by looking at individual sessions.</p>
<p><strong>Best vs Average Gap</strong> shows the percentage difference between your best run and your average run in each session. Lower is better. A gap below 5% means you're very consistent — your average is close to your best. A gap above 15% means you're chasing peaks but your typical performance isn't keeping up.</p>
<p>If this gap is closing over time, your floor is rising. That's what training is supposed to do. If it's widening, you're occasionally hitting great runs but your reliable performance isn't improving — which doesn't translate to race results. Stop chasing peak runs and focus on making the average better. The peaks will follow.</p>
<p><strong>Optimal Set Length</strong> shows how many runs you can sustain at high quality in a session — defined as within 5% of your best run that session. This number typically increases with training as your fitness and gate-specific endurance improve.</p>
<p>Use this practically: if your optimal set length is six, doing ten-run sessions means 40% of your reps are junk — adding fatigue without adding quality. Better to do six focused reps, recover properly, and do another set if you're genuinely fresh.</p>
<p><strong>Drop-Off Position</strong> shows which run number you typically start fading on — when performance drops more than 10% below your best. If this number is moving later over time (run 5 to run 7 to run 9), your endurance is improving. If it's moving earlier, you're either overtraining or not recovering properly between sessions.</p>
<p>A practical rule: stop your sets one or two runs before your typical drop-off point. The runs after your drop-off aren't quality reps — they're just accumulating fatigue.</p>
<p><strong>Speed vs Consistency</strong> shows peak speed and consistency CV% on the same chart over time. Both improving together is the ideal. Speed improving while consistency degrades means you're getting faster but less reliable — unsustainable. Consistency improving while speed plateaus means you've built a solid base but need a new stimulus to push performance further.</p>
<hr />
<h2 id="cross-session-intelligence">Cross-Session Intelligence</h2>
<p>This is the system looking across all your sessions to find patterns that aren't visible from within any single one.</p>
<p>It looks at whether your average performance is improving, plateauing, or declining. It tracks whether your consistency is getting better or worse over time — consistency improvements often precede speed improvements, so this is an early indicator that training is working. It identifies whether fatigue is appearing earlier or later in sessions over time, and whether your best and average runs are converging.</p>
<p>The headlines the system generates from this analysis are descriptions, not motivational statements:</p>
<p>"Reaction time improving steadily" means your recent average is significantly better than your historical average and the trend is stable.</p>
<p>"Consistency degrading — possible overtraining" means your CV% is increasing over time, which is a common pattern when fatigue is accumulating.</p>
<p>"Mixed session quality" means there's no clear pattern — sessions are varying too much to identify a reliable trend.</p>
<p>These headlines come with a confidence level. High confidence means 10 or more sessions with a clear trend. Medium confidence means 5–9 sessions with an identifiable pattern. Low confidence means 3–4 sessions where the system can see something but isn't certain. Low confidence isn't wrong — it just means you need more data before the assessment is reliable.</p>
<hr />
<h2 id="personal-bests-and-benchmarks">Personal Bests and Benchmarks</h2>
<p>Your all-time best reaction time, peak speed, and max G-force appear at the top of the page with ratings showing where those numbers fall relative to different levels of BMX competition.</p>
<p>These benchmarks are based on actual performance data and are meant as context, not goals. If your reaction time is rated "Club level," that means it's typical for club-level riders. Whether you want to work toward the next tier depends on your own training objectives — the system isn't pushing you toward anything.</p>
<p>One thing worth knowing: the benchmarks are thresholds, not precise measurements. Performance at any level varies enormously by age, weight, track conditions, and equipment. Use them as reference points, not verdicts.</p>
<p>The system also adjusts its technique scoring and assessments based on your declared rider level in your profile. A grom with a 300ms reaction time and a club rider with the same time are assessed differently because the context is different.</p>
<hr />
<h2 id="session-quality-score">Session Quality Score</h2>
<p>Every session gets a quality score from 0 to 100 based on how repeatable your starts were and whether your performance declined through the session.</p>
<p>A high score (80+) means your runs were consistent and you didn't show significant fatigue. A low score (below 40) means either your runs were erratic or you showed clear performance decline — or both.</p>
<p>This score isn't about how fast you went. It's about how well-structured your session was. A session quality of 80 with a 260ms average reaction time is better training than a session quality of 40 with a 250ms average, because the first is building reliable performance and the second is grinding through unfocused reps.</p>
<hr />
<h2 id="data-quality-and-what-gets-shown">Data Quality and What Gets Shown</h2>
<p>Not everything is shown to everyone — the system adjusts based on data quality.</p>
<p>Speed calculations need valid IMU calibration, firmware-calculated peak speed data, and a complete acceleration trace. If the bias correction is too high, speed data gets flagged as unreliable and speed-based analytics are either hidden or shown with a clear warning.</p>
<p>If you have the breakbeam timing module, elapsed time is a precision measurement to ±1ms, which anchors the speed curve to a real value and makes speed analytics significantly more reliable. Without the breakbeam, speed is estimated from IMU integration — reliable for comparing your own runs against each other, less so as absolute values.</p>
<p>Power estimates need your body weight and bike weight from your profile settings. If either is missing, power analytics don't appear — showing estimates without accurate mass data would be misleading.</p>
<p>Consistency metrics only need reaction times, which are directly measured. These are the most reliable numbers in the system.</p>
<hr />
<h2 id="advanced-analytics">Advanced Analytics</h2>
<p>The collapsible section at the bottom contains tools most riders won't need, but which are genuinely useful for deeper analysis.</p>
<p><strong>Speed Distribution</strong> shows how your speeds are distributed across all your runs — whether you have a tight band (consistent) or a wide spread (variable).</p>
<p><strong>Quickness Correlation</strong> examines the relationship between reaction time and peak speed. Typically you'd expect a strong negative correlation — faster reactions leading to higher speeds. A weak or positive correlation might suggest you're reacting quickly but not converting that into acceleration efficiently.</p>
<p><strong>Session Comparison</strong> lets you pick any two sessions and compare all metrics side by side. Useful for understanding what changed between a strong session and a weak one.</p>
<p><strong>Rolling Analytics</strong> (10+ sessions) calculates moving averages that smooth out day-to-day variation and show the underlying trend more clearly.</p>
<p><strong>Statistical Analysis</strong> (20+ sessions) adds confidence intervals and significance testing — how certain can you be that the trend you're seeing is real rather than random variation. Primarily useful for riders preparing for selection events who need to know their reliable performance level, not just their personal best.</p>
<hr />
<h2 id="what-to-pay-attention-to">What to Pay Attention To</h2>
<p><strong>Whether trends are stable or erratic.</strong> Gradual, consistent improvement is better than spikey peaks and valleys. Consistent trend direction means your training is working predictably.</p>
<p><strong>The gap between your best and average.</strong> More important than your absolute best. A rider with a 250ms best and 255ms average is more race-ready than one with a 240ms best and 270ms average.</p>
<p><strong>Session quality trends over time.</strong> If your quality scores are consistently high, your training is well-structured. If they're all over the place, something in your session planning or recovery isn't consistent.</p>
<p><strong>Confidence levels.</strong> Only trust high-confidence assessments. Medium and low confidence means "possibly a pattern," not "definitely a pattern."</p>
<p><strong>Where the recommendations cluster.</strong> If the system keeps flagging the same thing across multiple sessions, it's seeing a real pattern. That's worth taking seriously.</p>
<hr />
<h2 id="what-not-to-worry-about">What Not to Worry About</h2>
<p><strong>One bad session.</strong> Three bad sessions is a pattern. One is just a bad day.</p>
<p><strong>Absolute speed numbers without context.</strong> They mean nothing without knowing the distance marker, track surface, bike setup, and data quality rating.</p>
<p><strong>Short-term trends with fewer than six sessions.</strong> Directional at best. Trends become reliable around eight to ten sessions.</p>
<p><strong>Perfect linear progress.</strong> It doesn't exist. Plateaus, regressions, and breakthroughs are all normal. The trend over months matters more than the trend over weeks.</p>
<hr />
<h2 id="common-patterns">Common Patterns</h2>
<p><strong>Early progress, then plateau.</strong> Your first ten sessions show clear improvement. The next ten show minimal change. This is normal — initial gains are technique fixes and motor learning, which happen fast. Later gains are physiological adaptations, which take longer. When you hit this, don't train harder — change what you're training.</p>
<p><strong>Inconsistent data, no clear trends.</strong> Your analytics page shows wide variation and no confidence in any patterns. Usually this means your session structure isn't consistent, your equipment setup is varying, or you're training too sporadically for patterns to establish. Standardising your sessions and training more regularly fixes this.</p>
<p><strong>High session quality but no improvement.</strong> Your consistency is excellent but your times aren't getting faster. You've optimised your current approach and your body has adapted to it. You need a new training stimulus — technique work, strength training, or pushing the intensity in a different way.</p>
<p><strong>Speed improving, consistency declining.</strong> Your peak times are dropping but your CV% is rising. You're pushing for faster times at the expense of reliability. Back off the intensity and focus on making your average runs faster rather than your best runs faster.</p>
<hr />
<h2 id="honest-limitations">Honest Limitations</h2>
<p>The analytics system is pattern recognition applied to sensor data. It works well when you're training consistently, your data quality is good, and your session structure is reasonably stable.</p>
<p>It works poorly when sessions are sporadic, data is noisy, or your training structure changes dramatically from week to week.</p>
<p>The trends assume current patterns will continue. They can't predict technique breakthroughs, performance drops from illness or injury, the effect of equipment changes, or external factors like track conditions and weather.</p>
<p>What the system can tell you is what your data shows right now and what direction it's been moving. What it can't tell you is why that's happening or exactly what to do about it. That's what coaching is for. The analytics page gives you and your coach better information to work with — it doesn't replace the conversation.</p>
<hr />
<p><em>For help with specific sections of the analytics page, use the Help buttons throughout the page.</em></p>`,
    plain: `What Analytics Is For Looking at individual sessions tells you what happened that day. The analytics page tells you whether you're actually getting better. A reaction time of 0.245 seconds is a number. Whether that's an improvement, a plateau, or a decline depends on what came before it and what's been happening across your last ten sessions. Analytics provides that context — it looks across all your uploaded sessions and tells you what the patterns show. The system gets more useful the more data you give it. With three sessions it can show you basic trends. With ten it starts identifying reliable patterns. With twenty or more it can tell you with statistical confidence what's actually changing and what's just noise. How the Page Is Laid Out The analytics page works in layers, from the most important information at the top to the detailed data at the bottom. Performance Overview is the first thing you see — a headline based on your recent sessions, your personal bests with competitive benchmarks, and a quick visual of your session quality over the last ten sessions. This is the "what's happening" layer. If you only have a minute, this is the bit to look at. Session Narrative translates your most recent session into plain English. Not numbers — a short paragraph describing what the data actually shows. Whether your runs were consistent, where fatigue appeared, whether there were any data quality issues. It adapts to what happened, so it reads differently for a strong session than a scattered one. Training Insights shows the patterns behind your current performance — how repeatable your starts are, where fatigue typically hits in a session, how your best and average runs compare, and what the data suggests about how many quality reps you can sustain. This is the "why is it happening" layer. Performance Patterns only appears once you have at least three sessions. Four charts designed around coaching questions rather than raw data display. More on these below. Raw Performance Trends is exactly what it sounds like — reaction time, peak speed, and consistency tracked over time as simple charts. The actual numbers, with trend lines. Advanced Analytics is collapsed by default because most people won't need it. Speed distribution, quickness correlation, session comparison, and rolling statistical analysis. Expand it if you want to dig deeper; leave it closed if you don't. Session History sits at the bottom — a chronological list of your sessions with links to the detail pages. Reference material for when you want to find a specific session. Understanding Trend Charts All the trend charts on this page use linear regression for their trend lines. That means the line shows the overall direction of change, not the exact path between individual data points. If the reaction time trend line is going down, your reaction time is generally improving — even if specific sessions jump around. You need at least three sessions for trend charts to appear at all, and at least six before the trend calculations become reliable. With three to five sessions, the trend line can be easily skewed by a single outlier. With six or more, the system starts showing percentage change figures and can be more confident the trend is real. When the system tells you your reaction time is "improving by 5.3%," that's comparing the average of your last five sessions to the average of the five before that. It's not your best-ever versus your most recent — it's whether your average is moving in the right direction consistently. Normal session-to-session variation is 3–5%. That's measurement variation, daily form, environmental factors. The system only flags changes larger than that as trends, so if it's showing you a trend, the change is statistically larger than routine noise. Performance Patterns These four charts are the most useful coaching tools on the page. Each one answers a specific question that you can't answer by looking at individual sessions. Best vs Average Gap`,
  },
  {
    slug: "goals",
    title: "Training Goals",
    desc: "Setting targets, predictions, health monitoring, and adaptive suggestions",
    icon: "\ud83c\udfaf",
    html: `<hr />
<h2 id="what-goals-are-for">What Goals Are For</h2>
<p>Training without a target tends to drift. You show up, you do your runs, you get numbers — but there's no clear line between where you are and where you're trying to get to. The goals system creates that line.</p>
<p>It's not a points system or a badge collection. You set a target for a specific metric, give yourself a deadline, and the system tracks whether you're moving in the right direction and at a realistic pace. That's it.</p>
<p>Once a goal is active, everything runs automatically. Every session you upload updates your progress. The system watches your data, spots when something meaningful changes, and tells you what it sees. You don't have to do anything except keep training and keep uploading.</p>
<hr />
<h2 id="setting-a-goal">Setting a Goal</h2>
<p>To create a goal you need three things: a metric, a target value, and a deadline.</p>
<p><strong>The metric</strong> is what you're trying to improve — reaction time, peak G-force, consistency, elapsed time, acceleration phase, or gates per session. The system pulls your current value from your recent session data automatically, so you'll see where you're starting from before you set a target.</p>
<p><strong>The target value</strong> is where you want to get to. The system will suggest a range — conservative, realistic, ambitious — based on typical improvement rates for your current level. These suggestions are statistical rather than motivational. A conservative target assumes you'll improve at the lower end of what's typical. Ambitious assumes the upper end. Stretch assumes everything goes perfectly.</p>
<p>Pick the one that feels genuinely achievable in the time you've set. The system won't let you create a goal that's statistically implausible — if your best reaction time is 0.350 seconds, it won't let you target 0.200 seconds in four weeks. Not because it's judging your ambition, but because a target that far outside realistic improvement rates is more likely to demotivate than focus your training.</p>
<p><strong>The deadline</strong> is when you want to get there. You can always extend it later if your timeline shifts.</p>
<p>If you train at a specific distance — 10m, 20m, 50m — you can add that to the goal and the system will only consider runs at that distance when tracking progress. Useful if you're training for a specific track setup. If you leave it blank, the system uses your best performance across all distances.</p>
<hr />
<h2 id="what-the-metrics-actually-mean">What the Metrics Actually Mean</h2>
<p><strong>Reaction time</strong> is the time from gate drop to first detectable movement. It's a direct sensor measurement. Lower is better. Typical improvement with focused training is 2–5% per month.</p>
<p><strong>Peak G-force</strong> is your maximum acceleration during a run, usually in the first half-second. Higher is better. It reflects strength, technique, and body position together, which means improvements can come from several directions at once. Typical improvement is 3–8% per month.</p>
<p><strong>Consistency</strong> measures how repeatable your reaction times are within a session — specifically, the coefficient of variation. Higher is better. Consistency often improves faster than raw performance because it's more about routine and preparation than physical development. 5–10% per month is achievable.</p>
<p><strong>Elapsed time</strong> is the total run time from gate drop to end of recorded data. Lower is better. How quickly this improves depends heavily on distance and what technique changes you're making.</p>
<p><strong>Acceleration phase</strong> is the time to reach peak speed. Lower is better. This is technique-dependent and can change quickly with form improvements, or plateau if you're already efficient.</p>
<p><strong>Gates per session</strong> is how many runs you complete. Higher is better. This is about fitness and recovery capacity rather than technique.</p>
<hr />
<h2 id="how-the-progress-predictions-work">How the Progress Predictions Work</h2>
<p>Once you've uploaded at least two sessions after creating a goal, the system starts estimating when you'll hit your target. These aren't guesses — they're regression models fitted to your actual data.</p>
<p>The system tries three approaches and uses whichever fits your data best. Linear regression assumes steady, constant improvement. Polynomial regression assumes fast early gains that slow down over time — common when you're new to training or working through a technique change. Exponential fitting assumes improvement that accelerates — less common, but it shows up when training effects start to compound. The system calculates how well each model fits and picks the best one automatically.</p>
<p>The prediction shows as a range rather than a single number. When you see "5–9 sessions, most likely 7," that means the most likely outcome is 7 sessions, but the realistic range given your current data is 5 to 9. The range gets tighter as you accumulate more sessions — with three or four data points it might be wide; with ten or twelve it should be much tighter.</p>
<p>The system also shows a confidence level — typically 68% or 85%. An 85% confidence level means there's an 85% probability your actual progress will fall within the stated range, assuming your improvement rate continues more or less as it has been.</p>
<p>When the system can't generate a reliable prediction — because your progress has stalled, the data is too noisy, or the model fit is poor — it tells you why rather than showing something misleading. That's more useful than a confident number that isn't actually reliable.</p>
<hr />
<h2 id="progress-status">Progress Status</h2>
<p>Each goal has a status that updates every time you upload a session. It's calculated by comparing your actual improvement percentage to where you should be based on how much time has passed.</p>
<p><strong>Way Ahead</strong> means you're 30% or more ahead of schedule. You'll hit the target comfortably before the deadline.</p>
<p><strong>Ahead</strong> means you're 10–30% ahead of schedule. This is the position you want to be in.</p>
<p><strong>On Track</strong> means you're within 10% either way of where you should be. Keep doing what you're doing.</p>
<p><strong>Behind</strong> means you're 10–30% behind schedule. Not critical yet, but something needs to change — either more training, different training, or a more realistic deadline.</p>
<p><strong>Way Behind</strong> means you're 30% or more behind schedule. Unless something changes significantly, you won't hit this goal by the deadline. Time to reassess whether the target or the timeline needs adjusting.</p>
<p><strong>Stalled</strong> means your last three sessions show no improvement, regardless of where you are relative to schedule. Stalled progress usually means something needs to change — technique, recovery, training load, or the goal itself.</p>
<p>These statuses are directional rather than precise. They don't account for the fact that improvement is rarely linear. Use them as prompts to think about your training, not as verdicts on whether you're doing well.</p>
<hr />
<h2 id="milestones">Milestones</h2>
<p>Whenever your performance improves by at least 0.5% toward a goal, the system automatically records a milestone. Over time, these build into a timeline on your goals page showing the actual dates your performance improved:</p>
<pre><code>0.245s · 15 Jan  →  0.238s · 3 Feb  →  0.229s · 20 Feb  →  0.218s · 10 Mar
</code></pre>
<p>The 0.5% threshold exists to filter out measurement noise. Session-to-session variation is typically 1–2%, so a 0.5% improvement represents a genuine step forward. Smaller improvements still count toward your goal's current value — they just don't create a marker in the timeline.</p>
<p>The dates are accurate — they reflect when the improvement actually happened, based on the session timestamp, not when you viewed the session.</p>
<p>When you view a session that created a milestone, you'll see a marker on the goal progress section of that page. On the goals page itself, you'll see the full timeline.</p>
<p>There's no ceremony around milestones. They're data points, not events. Their value is in looking back at them later and seeing that progress happened consistently — or spotting that the gaps between milestones have been getting longer, which is useful information in itself.</p>
<hr />
<h2 id="health-monitoring">Health Monitoring</h2>
<p>This is where the system does something most goal trackers don't bother with: it watches for signs that you're pushing too hard.</p>
<p>Every time you view your goals, the system looks at your recent sessions for three things. First, a fatigue score based on whether your performance is declining, how consistent your runs are within sessions, and how your training load has changed recently. A score under 30 is normal. 30–60 is moderate fatigue, worth monitoring. Over 60 means consider a rest day. Over 80 means stop.</p>
<p>Second, training load — your session frequency and intensity over the last few weeks. A sudden increase of more than 30% in volume, or too many consecutive training days without rest, gets flagged as a load spike.</p>
<p>Third, performance anomalies — statistical patterns that look unusual. Sudden drops in performance, extreme session-to-session variation, or inconsistent technique metrics that suggest fatigue or something else is going on.</p>
<p>The health status runs from Healthy through Monitor and Caution to Critical. If you see Monitor, keep training but pay attention to how you're recovering. Caution means consider reducing intensity or taking a rest day. Critical means rest — don't push through it.</p>
<p>One reading at Caution might be noise. Three in a row is a signal worth taking seriously.</p>
<p>What the health monitoring can't do is account for things it doesn't know about — nutrition, sleep, illness, stress, other training. It can spot that your data looks like overtraining patterns. It can't tell you why, and it's not medical advice. Use it as one input into your training decisions alongside your own judgement.</p>
<hr />
<h2 id="suggestions">Suggestions</h2>
<p>When your progress status shifts significantly, the system generates suggestions based on your data. These appear as a button showing the number of current suggestions next to each goal. Click it to open the suggestions panel.</p>
<p>Suggestions are specific and actionable. The system generates them from a small set of patterns it knows how to recognise:</p>
<p><strong>If you're well ahead of schedule</strong> — you might see a suggestion to increase your target, or to shorten the deadline. The reasoning will be something like "you're on pace to hit this target three weeks early — a more ambitious target would better reflect your current trajectory."</p>
<p><strong>If you're behind or the deadline is approaching</strong> — suggestions to extend the deadline or reduce the target. These come with the data behind them: "at your current improvement rate, you're projected to reach this value by [date], which is beyond your deadline."</p>
<p><strong>If your progress has stalled</strong> — a suggestion to revisit the goal entirely, with an explanation of what stalled progress typically means and what you might try differently.</p>
<p><strong>If health monitoring is flagging concerns</strong> — a suggestion to pause the goal temporarily. The system won't push you toward a target if it's seeing patterns that suggest you need to back off.</p>
<p>Each suggestion shows a confidence level and the specific data behind it. You can apply suggestions directly — clicking apply on an extended deadline actually extends the deadline, clicking apply on a new target actually changes the target. The goal updates immediately and recalculates from there.</p>
<p>Suggestions are prompts, not instructions. Sometimes the right call is to follow them. Sometimes it's to ignore them. The data is there either way.</p>
<hr />
<h2 id="whats-worth-paying-attention-to">What's Worth Paying Attention To</h2>
<p><strong>The prediction range, not just the median.</strong> A tight range (5–7 sessions) means the system is confident. A wide range (4–15 sessions) means your data is noisy or inconsistent. The range tells you more than the single number.</p>
<p><strong>Whether the prediction model keeps changing.</strong> If it switches between polynomial, linear, and polynomial every few sessions, your improvement isn't consistent enough for reliable forecasting. That's useful information about your training, not a failure of the system.</p>
<p><strong>Health warnings that persist.</strong> One caution flag might be noise. Three in a row is signal. The system is designed to be conservative — it would rather flag a false positive than miss something real.</p>
<p><strong>Whether milestones are getting further apart.</strong> If your early milestones were weeks apart and recent ones are months apart, your improvement rate is slowing. This is normal as you approach your limits, but it's worth noticing when you're thinking about deadline realism.</p>
<p><strong>When the system's suggestion agrees with your gut.</strong> If it suggests extending your deadline and you've been quietly thinking the goal was too aggressive, take that seriously. If it suggests a rest and you've been feeling ragged, definitely take it.</p>
<hr />
<h2 id="what-not-to-worry-about">What Not to Worry About</h2>
<p><strong>Small fluctuations in your progress percentage</strong> between sessions. Measurement noise of 1–2% is normal. Only sustained changes across three or more sessions are meaningful.</p>
<p><strong>Hitting the median prediction exactly.</strong> If the system said 7 sessions and it took 9, you were in the upper end of the range. That's not a failure.</p>
<p><strong>Collecting milestones.</strong> Having 10 milestones instead of 5 doesn't mean anything except that you had more 0.5%+ improvements. The overall trajectory matters, not the count.</p>
<p><strong>Perfect adherence to the suggestions.</strong> They're recommendations from a system that can see your data but not your full situation. Use them as prompts, not instructions.</p>
<hr />
<h2 id="when-to-delete-or-adjust-a-goal">When to Delete or Adjust a Goal</h2>
<p>Goals aren't permanent. Delete or complete them when the target no longer makes sense — you've hit it, your priorities have shifted, you've had an injury, or the target is demotivating you rather than focusing you.</p>
<p>You can extend the deadline if your timeline was too ambitious. You can adjust the target if your starting point was wrong or your situation has changed. The system isn't tracking whether you stick to the original terms. It's tracking whether you're making progress.</p>
<p>If a deadline passes without you hitting the goal, the system archives it without penalty. You can look back at what you achieved, decide whether to try again with a fresh goal, and move on.</p>
<hr />
<h2 id="honest-limitations">Honest Limitations</h2>
<p>The predictions work well when you're training at least weekly, your data quality is consistent, and you're in an active phase of improvement. They work poorly when sessions are sporadic, your data is noisy, or you're already close to your physiological ceiling.</p>
<p>The models assume your current improvement rate will continue. That's often wrong. Progress isn't linear — you'll plateau, then jump, then plateau again. The system adjusts as it gets new data, but it can't predict when a technique breakthrough will happen or when you'll hit a wall.</p>
<p>The health monitoring is pattern recognition, not medical advice. If you're injured or ill, see someone qualified to help — the goals dashboard isn't the right tool for that.</p>
<p>Used consistently and honestly, the goals system should help you train more intentionally and reach targets more reliably than you would without it. That's what it's for. It's organised data with some maths applied to it — useful, but not magic.</p>
<hr />
<p><em>For help with specific aspects of the goals system, use the Help section on the goals page.</em></p>`,
    plain: `What Goals Are For Training without a target tends to drift. You show up, you do your runs, you get numbers — but there's no clear line between where you are and where you're trying to get to. The goals system creates that line. It's not a points system or a badge collection. You set a target for a specific metric, give yourself a deadline, and the system tracks whether you're moving in the right direction and at a realistic pace. That's it. Once a goal is active, everything runs automatically. Every session you upload updates your progress. The system watches your data, spots when something meaningful changes, and tells you what it sees. You don't have to do anything except keep training and keep uploading. Setting a Goal To create a goal you need three things: a metric, a target value, and a deadline. The metric is what you're trying to improve — reaction time, peak G-force, consistency, elapsed time, acceleration phase, or gates per session. The system pulls your current value from your recent session data automatically, so you'll see where you're starting from before you set a target. The target value is where you want to get to. The system will suggest a range — conservative, realistic, ambitious — based on typical improvement rates for your current level. These suggestions are statistical rather than motivational. A conservative target assumes you'll improve at the lower end of what's typical. Ambitious assumes the upper end. Stretch assumes everything goes perfectly. Pick the one that feels genuinely achievable in the time you've set. The system won't let you create a goal that's statistically implausible — if your best reaction time is 0.350 seconds, it won't let you target 0.200 seconds in four weeks. Not because it's judging your ambition, but because a target that far outside realistic improvement rates is more likely to demotivate than focus your training. The deadline is when you want to get there. You can always extend it later if your timeline shifts. If you train at a specific distance — 10m, 20m, 50m — you can add that to the goal and the system will only consider runs at that distance when tracking progress. Useful if you're training for a specific track setup. If you leave it blank, the system uses your best performance across all distances. What the Metrics Actually Mean Reaction time is the time from gate drop to first detectable movement. It's a direct sensor measurement. Lower is better. Typical improvement with focused training is 2–5% per month. Peak G-force is your maximum acceleration during a run, usually in the first half-second. Higher is better. It reflects strength, technique, and body position together, which means improvements can come from several directions at once. Typical improvement is 3–8% per month. Consistency measures how repeatable your reaction times are within a session — specifically, the coefficient of variation. Higher is better. Consistency often improves faster than raw performance because it's more about routine and preparation than physical development. 5–10% per month is achievable. Elapsed time is the total run time from gate drop to end of recorded data. Lower is better. How quickly this improves depends heavily on distance and what technique changes you're making. Acceleration phase is the time to reach peak speed. Lower is better. This is technique-dependent and can change quickly with form improvements, or plateau if you're already efficient. Gates per session is how many runs you complete. Higher is better. This is about fitness and recovery capacity rather than technique. How the Progress Predictions Work Once you've uploaded at least two sessions after creating a goal, the system starts estimating when you'll hit your target. These aren't guesses — they're regression models fitted to your actual data. The system tries three approaches and uses whichever fits your data best. Linear regression assumes steady, constant improvement. Polynomial regression assumes fast ea`,
  },
  {
    slug: "upload",
    title: "Uploading Sessions",
    desc: "Getting your data in, error messages, and what happens during processing",
    icon: "\u2b06\ufe0f",
    html: `<hr />
<h2 id="what-upload-does">What Upload Does</h2>
<p>The upload process takes the JSON file your AppGatePro device wrote to the SD card and turns it into the analytics you see on screen. It validates every field, converts raw sensor values into usable units, and stores everything in a structured database. When it works, you don't think about it. When it doesn't, understanding what's happening helps you fix it quickly.</p>
<hr />
<h2 id="getting-the-file-into-the-system">Getting the File Into the System</h2>
<p>After a training session, your device saves a file to the SD card named something like <code>session_1714389845.json</code> — the number is a timestamp, it doesn't matter. That file contains everything the firmware recorded: reaction times, the full acceleration trace at 200 samples per second, peak and average G-force, the firmware's own speed calculations if they're valid, and optionally the pitch and roll orientation data.</p>
<p>To upload it:</p>
<ol>
<li>Remove the SD card from the device and put it into your computer</li>
<li>Log into your AppGatePro Analytics account and go to <strong>Upload</strong></li>
<li>Drag the session file into the upload zone, or click to browse and select it</li>
</ol>
<p>The system reads the file in your browser, validates it, and sends it to the server for processing. Your original file on the SD card is never touched.</p>
<hr />
<h2 id="what-the-system-does-with-your-data">What the System Does With Your Data</h2>
<p>There's a bit of work happening behind the scenes during upload that's worth understanding, because it explains why the numbers you see on screen look different from what's stored in the raw file.</p>
<p><strong>Acceleration values</strong> are stored in the firmware as integers — 2.85G is written as <code>285</code>. During upload the system divides everything by 100 to give you actual G-force values. This is a deliberate firmware design decision to save space without losing precision.</p>
<p><strong>Reaction time</strong> is stored by the firmware in seconds. The platform converts it to milliseconds because that's more intuitive for gate start analysis. Your 0.245 second reaction time becomes 245ms.</p>
<p><strong>Orientation data</strong> (pitch and roll) is stored in radians by the firmware. These get converted to degrees during upload because degrees are what coaches and riders actually think in.</p>
<p><strong>Speed values</strong> are stored in metres per second and displayed in km/h. The conversion happens in the display layer, not at storage — so if you export your data to CSV, you'll see km/h.</p>
<p><strong>Elapsed time</strong> is the recording window you set on the device — long enough to capture your full run at your chosen distance. Without the breakbeam module, this is just the duration the device recorded for. With the breakbeam, it becomes a precision measurement of exactly when you crossed the line, to ±1ms. The system stores it as-is but what it means analytically is very different depending on your setup.</p>
<p><strong>Distance</strong> is what you entered on the device before the session. The system stores and displays it exactly as set. If you set 10m on the device but were actually running 12m, your speed calculations will be wrong — the physics uses your declared distance as a known value. Make sure it matches your actual setup before each session.</p>
<p><strong>The analytics valid flag</strong> is important. The firmware calculates its own speed and pitch analytics, and it knows when that data isn't reliable. If the sensor quality was poor, the firmware flags those analytics as invalid. When that happens, speed-based metrics are set to null in the database rather than showing you numbers that can't be trusted. G-force values always appear because they come directly from the sensor — it's only the derived calculations that get suppressed.</p>
<hr />
<h2 id="the-success-screen">The Success Screen</h2>
<p>When upload works, you see a summary showing how many runs were imported, whether timeseries data came through, and whether the session linked to your active bike.</p>
<p><strong>Runs imported</strong> is the number of individual gate runs successfully processed. Each one is separately viewable in the session detail.</p>
<p><strong>Time series</strong> tells you whether the high-frequency sensor data (pitch angles, roll angles, detailed acceleration) came through. If it says "None," you only have basic metrics — which is fine for most analysis. If it shows "5 runs (3 failed)," three runs are missing their orientation data but everything else is fine.</p>
<p><strong>Bike linked</strong> confirms whether the session was automatically associated with your active bike. If it says "No active bike," power calculations won't appear until you configure one in Settings. The session is otherwise fully usable.</p>
<p>Once you see the success screen, your data is in the system. There's a direct link to view the session — click it to go straight to the analysis.</p>
<hr />
<h2 id="warnings">Warnings</h2>
<p>Warnings mean the upload succeeded but something wasn't ideal. Your session is fully imported and usable. The warning tells you what might be limited.</p>
<p><strong>Timeseries failures</strong> — "3 run(s) had timeseries data that failed to import." You keep reaction time, G-force, speed, and all the core analytics. You lose pitch angle charts, wheelie detection, and roll data for those specific runs. This usually happens when the SD card write was interrupted or that particular run's data got corrupted. One or two failures per session is normal. Every single run failing consistently across multiple sessions is worth investigating.</p>
<p><strong>Unusual reaction times</strong> — a reaction time of 12 seconds gets flagged because it suggests a sensor issue rather than a real delayed start. The data is imported as-is. Check that run when you view the session — if it's clearly wrong (device was sitting idle, sensor glitch), archive it so it doesn't affect your analytics.</p>
<p><strong>G-force out of range</strong> — readings significantly above 3.5G suggest the sensor maxed out or data is corrupt. The firmware does some sensor fusion that extends the usable range slightly beyond the sensor's rated ±2G, but very high readings warrant a look at the G-force chart to see if the shape looks plausible.</p>
<p><strong>Empty chart data</strong> — a run with no acceleration samples. You'll still have reaction time and basic metrics, but no G-force chart or speed curve for that run.</p>
<hr />
<h2 id="errors">Errors</h2>
<p>Errors stop the upload completely. Nothing gets imported. The message tells you what went wrong.</p>
<p><strong>"File is not valid JSON"</strong> — the file is corrupted or incomplete. Usually happens when the device powered off mid-save, the SD card was removed too early, or the card itself has a fault. Try re-reading the file from the card. If it fails repeatedly, the session data wasn't fully written and can't be recovered.</p>
<p><strong>"Unsupported schema version: 1"</strong> — your firmware is old. Update the device firmware and future sessions will use the current format. Old v1 sessions can't be imported automatically.</p>
<p><strong>"Unsupported schema version: 3"</strong> — your firmware is newer than the platform. This shouldn't happen in normal circumstances. Check for platform updates or contact support.</p>
<p><strong>"Missing required fields: reactionTime, chartData"</strong> — the file parsed successfully but one or more runs are missing critical data. Usually means the firmware didn't finish writing the session. There's no recovery for data that wasn't captured.</p>
<p><strong>"Session file contains no runs"</strong> — valid file format, but the runs array is empty. The device created the session file but recorded nothing. This could be an accidental session trigger on the device.</p>
<p><strong>"Failed to create session record" / "Failed to insert run"</strong> — the file was fine but the database write failed. This is a server-side issue, not your file. Wait 30 seconds and try again. If it fails consistently, the platform is having issues.</p>
<p><strong>"Network error"</strong> — your connection dropped or the upload timed out. Check your connection and try again. Large sessions with many runs and full timeseries data can take 20–30 seconds, which occasionally times out on slow connections.</p>
<hr />
<h2 id="profile-and-bike-linking">Profile and Bike Linking</h2>
<p>When you upload a session, the system checks for an active bike in your profile and links the session to it automatically. This enables power calculations (which need bike weight) and keeps your equipment history organised.</p>
<p>If you don't have an active bike configured, set one up in Settings → Bikes, then refresh the session page. Power calculations run when the page loads, using whichever bike is currently linked.</p>
<p>Your rider profile (weight, skill level, age) isn't frozen at upload time. If you update your profile later, the technique scores and threshold ratings adjust when you view old sessions. The only exception is age-group analytics, which use your date of birth and effectively stay fixed.</p>
<hr />
<h2 id="your-files">Your Files</h2>
<p>The upload process reads your SD card file but never modifies or deletes it. Your original session files stay on the card until you remove them yourself.</p>
<p>You can re-upload the same file as many times as you want — each upload creates a new session in your account. If you accidentally uploaded twice, archive the duplicate.</p>
<p>A few sensible habits around SD card management: don't delete files immediately after upload in case you need to troubleshoot something. Periodically copy them to your computer for backup before clearing the card. Reformat the card occasionally (after backing up) to keep the filesystem healthy. Use a decent quality card — cheap ones fail more often, and a mid-session write failure means lost data.</p>
<hr />
<h2 id="common-problems">Common Problems</h2>
<p><strong>Session isn't appearing after upload</strong> — sessions are sorted by the date they were recorded, not when they were uploaded. If you uploaded an old session, it'll appear further down the list sorted by session date. Click the "View Session" link on the success screen to go directly to it.</p>
<p><strong>Timeseries failing consistently across all sessions</strong> — one or two failures per session is normal. Every run in every session failing points to a firmware issue, slow SD card, or card slot problem. Update your firmware first, then try a different SD card.</p>
<p><strong>G-force chart looks wrong</strong> — the chart shows exactly what was recorded. Check the bias correction value in the run details. Above 0.5 m/s² suggests the sensor baseline was off. Above 2.0 means the integrated speed will be unreliable. If the chart shows spikes or impossible values, the data is probably corrupt.</p>
<p><strong>Power calculations missing</strong> — you need a bike configured with weight entered. Add one in Settings → Bikes, mark it as active, refresh the session page.</p>
<p><strong>Speed showing as N/A</strong> — the firmware flagged those analytics as invalid. You'll still see G-force. Speed calculations are suppressed when the firmware can't trust them.</p>
<hr />
<h2 id="privacy">Privacy</h2>
<p>Sessions upload to your personal account only. Nobody else can see your data. Even if you're opted into leaderboards, only your best aggregate metrics are shared — individual session details, run-by-run data, and timeseries information stay private.</p>
<p>You can delete sessions at any time from the session page. Deletion is immediate and permanent on the platform. Your original SD card file is unaffected — if you delete a session and change your mind, re-upload from the card.</p>
<hr />
<p><em>If upload isn't working and this chapter didn't help, use the feedback button on the upload page. Include the exact error message and your firmware version.</em></p>`,
    plain: `What Upload Does The upload process takes the JSON file your AppGatePro device wrote to the SD card and turns it into the analytics you see on screen. It validates every field, converts raw sensor values into usable units, and stores everything in a structured database. When it works, you don't think about it. When it doesn't, understanding what's happening helps you fix it quickly. Getting the File Into the System After a training session, your device saves a file to the SD card named something like session_1714389845.json — the number is a timestamp, it doesn't matter. That file contains everything the firmware recorded: reaction times, the full acceleration trace at 200 samples per second, peak and average G-force, the firmware's own speed calculations if they're valid, and optionally the pitch and roll orientation data. To upload it: Remove the SD card from the device and put it into your computer Log into your AppGatePro Analytics account and go to Upload Drag the session file into the upload zone, or click to browse and select it The system reads the file in your browser, validates it, and sends it to the server for processing. Your original file on the SD card is never touched. What the System Does With Your Data There's a bit of work happening behind the scenes during upload that's worth understanding, because it explains why the numbers you see on screen look different from what's stored in the raw file. Acceleration values are stored in the firmware as integers — 2.85G is written as 285 . During upload the system divides everything by 100 to give you actual G-force values. This is a deliberate firmware design decision to save space without losing precision. Reaction time is stored by the firmware in seconds. The platform converts it to milliseconds because that's more intuitive for gate start analysis. Your 0.245 second reaction time becomes 245ms. Orientation data (pitch and roll) is stored in radians by the firmware. These get converted to degrees during upload because degrees are what coaches and riders actually think in. Speed values are stored in metres per second and displayed in km/h. The conversion happens in the display layer, not at storage — so if you export your data to CSV, you'll see km/h. Elapsed time is the recording window you set on the device — long enough to capture your full run at your chosen distance. Without the breakbeam module, this is just the duration the device recorded for. With the breakbeam, it becomes a precision measurement of exactly when you crossed the line, to ±1ms. The system stores it as-is but what it means analytically is very different depending on your setup. Distance is what you entered on the device before the session. The system stores and displays it exactly as set. If you set 10m on the device but were actually running 12m, your speed calculations will be wrong — the physics uses your declared distance as a known value. Make sure it matches your actual setup before each session. The analytics valid flag is important. The firmware calculates its own speed and pitch analytics, and it knows when that data isn't reliable. If the sensor quality was poor, the firmware flags those analytics as invalid. When that happens, speed-based metrics are set to null in the database rather than showing you numbers that can't be trusted. G-force values always appear because they come directly from the sensor — it's only the derived calculations that get suppressed. The Success Screen When upload works, you see a summary showing how many runs were imported, whether timeseries data came through, and whether the session linked to your active bike. Runs imported is the number of individual gate runs successfully processed. Each one is separately viewable in the session detail. Time series tells you whether the high-frequency sensor data (pitch angles, roll angles, detailed acceleration) came through. If it says "None," you only have basic metrics — which is fine for most analysis. If it show`,
  },
  {
    slug: "profile",
    title: "Profile & Bike Setup",
    desc: "Why profile data matters and what each field unlocks",
    icon: "\ud83d\udc64",
    html: `<hr />
<h2 id="why-this-matters">Why This Matters</h2>
<p>You can use the analytics platform without filling in your profile. You'll see reaction times, G-force charts, and basic metrics. But several things only work when the system knows more about you and your equipment.</p>
<p>Power calculations need your weight and bike weight — without both, the physics doesn't have enough information to work with. Technique scoring calibrates against your declared rider level — without it, the system uses generic intermediate benchmarks that might not be appropriate for where you actually are. Age-group analytics need your date of birth. Biomechanical calculations benefit from crank length.</p>
<p>Think of your profile as calibration. The sensor records what happened. Your profile tells the system how to interpret those measurements in physically meaningful terms.</p>
<hr />
<h2 id="your-rider-profile">Your Rider Profile</h2>
<h3 id="weight">Weight</h3>
<p>The single most important field for unlocking analytics. Power is calculated as force times velocity, and force is mass times acceleration. Without your body weight, the maths doesn't work. Power features simply don't appear until this is filled in.</p>
<p>Enter your weight in kilograms, to the nearest kg. Your weight fluctuates day to day — don't obsess over updating after every meal. Update it when it changes meaningfully and stays there (more than 2–3kg).</p>
<p>One thing worth knowing: power is proportional to mass. If you gain 5kg, your power estimates will increase for the same acceleration. That's correct — a heavier rider producing the same acceleration is actually generating more force. The system accounts for this properly.</p>
<h3 id="height">Height</h3>
<p>Used in some biomechanical calculations. Enter it in centimetres. If you're used to feet and inches, convert first — 5'9" is 175cm, not 5.9. Entering your height in feet will tell the system you're about the size of a large house cat, which won't produce useful biomechanics.</p>
<h3 id="date-of-birth">Date of Birth</h3>
<p>Used for two things: calculating your UCI category automatically (it updates as you age, so your category might change mid-season), and enabling age-group filtering on the leaderboard. Your exact age is never shown publicly — only your age bracket (e.g., 26–35).</p>
<h3 id="rider-level">Rider Level</h3>
<p>This calibrates what "excellent," "good," and "needs work" mean for your technique scores. A 0.28 second reaction time is excellent for a novice and needs work for an elite rider. Setting this wrong makes your scores either falsely encouraging or needlessly harsh.</p>
<p>The options are Novice (new to gate starts, under six months training), Intermediate (regular club training, six months to two years), Expert (competitive regional or national level), and Elite (professional or international level).</p>
<p>Be honest about where you actually are. The system doesn't care about your ambitions — it needs accurate calibration to give you useful feedback. If in doubt, go one level lower rather than higher. You can always update it when you move up.</p>
<p>If you don't set a rider level, the system defaults to Intermediate.</p>
<h3 id="sex">Sex</h3>
<p>Tracked but not currently used heavily in analytics. Planned for future sex-specific performance benchmarking.</p>
<h3 id="display-name">Display Name</h3>
<p>This is what appears on the leaderboard if you opt in. Everything else in your profile is private — this is the only thing that can become public. Either leave it blank (the system uses your first name) or set something you're comfortable having visible.</p>
<hr />
<h2 id="bike-setup">Bike Setup</h2>
<p>The system supports multiple bikes, but only one is active at a time. When you upload a session, it automatically links to whichever bike is currently active. Sessions stay linked to the bike that was active when they were uploaded — they don't retroactively switch if you change your active bike later.</p>
<h3 id="bike-weight">Bike Weight</h3>
<p>Required for power calculations alongside your body weight. The system adds rider weight and bike weight together as total system mass. Both are needed — one without the other isn't enough.</p>
<p>Weigh yourself holding the bike, then weigh yourself without it, and subtract. Or use a luggage scale. Enter the result in kilograms.</p>
<p>Typical BMX bikes are 9–12kg. If you're getting a number significantly outside that range, double-check the measurement.</p>
<h3 id="crank-length">Crank Length</h3>
<p>The length of your crank arms in millimetres, usually stamped on the back of the crank. Used in kinematic calculations — pedal velocity, hip and knee angle estimates. It contributes to biomechanical analysis accuracy but doesn't affect core metrics like reaction time, G-force, or speed.</p>
<p>Common values: 140–155mm for youth and small frames, 165–170mm for juniors and women, 175mm for most adult men (the most common value by far), 180mm for cruiser or tall riders.</p>
<p>If you don't know and can't check, 175mm is the most statistically likely value for an adult rider. But measuring is better.</p>
<h3 id="chainring-and-sprocket">Chainring and Sprocket</h3>
<p>The number of teeth on your front chainring and rear sprocket. The system uses these to calculate your gear ratio (chainring ÷ sprocket), which feeds into pedal cadence estimates and gear development calculations.</p>
<p>Count the teeth or look for the number stamped on the components. Common chainring sizes are 41–45 teeth, common sprocket sizes are 13–18 teeth.</p>
<h3 id="tyres">Tyres</h3>
<p>You can select your front and rear tyres from a library of common BMX tyres with their actual measured diameters. This enables wheel rollout calculations and gear development (rollout × gear ratio). If your exact tyre isn't in the library, pick the closest match by size, or enter a custom wheel diameter if you've measured yours.</p>
<p>If you're not interested in gear development metrics, you can skip tyre setup entirely. Speed and distance calculations come from the IMU, not wheel rotation, so they work without tyre data.</p>
<h3 id="notes">Notes</h3>
<p>A free-text field for anything you want to track — "new chain fitted March 2024," "lowered front end," "setup for indoor track." For your reference only, not used in calculations.</p>
<hr />
<h2 id="multiple-bikes">Multiple Bikes</h2>
<p>If you train on one bike and race on another, or you're experimenting with different setups, you can add multiple bikes and switch between them. Set up each bike with its own details, and the most recently saved one becomes active. Newly uploaded sessions will link to the current active bike.</p>
<p>This lets you compare performance across different equipment setups, keep accurate power calculations for each bike's weight, and maintain a historical record of what you were riding when.</p>
<p>If you update a bike's weight after uploading sessions with it, those sessions will use the updated weight next time you view them. This is usually a correction that makes historical data more accurate, but it means your historical power numbers can change retroactively if you fix an error. Worth knowing if you're tracking records.</p>
<hr />
<h2 id="common-mistakes">Common Mistakes</h2>
<p><strong>Setting rider level too high.</strong> If you set Elite when you're actually Intermediate, your technique scores will look terrible because they're being compared against Elite benchmarks. Be honest — the system works better with accurate calibration than flattering calibration.</p>
<p><strong>Leaving weight blank until you've lost some.</strong> Power calculations need your actual weight right now, not your target weight. Enter what you actually weigh or leave it blank and accept that power features won't appear.</p>
<p><strong>Forgetting to update after equipment changes.</strong> Changed cranks from 175mm to 180mm but forgot to update the profile? The biomechanical calculations are still using the old value. Update equipment fields when you change equipment.</p>
<p><strong>Entering height in feet and inches.</strong> The system uses centimetres. 5'9" is 175cm, not 5.9. Convert before you enter.</p>
<p><strong>Putting combined mass in one field.</strong> Bike weight goes in the bike section. Rider weight goes in biometrics. The system adds them together — if you put your combined mass in either field, the maths will be wrong.</p>
<hr />
<h2 id="whats-sensitive-to-profile-errors">What's Sensitive to Profile Errors</h2>
<p>Power calculations are directly proportional to mass. A 5% error in total mass creates a 5% error in estimated power. If your combined rider and bike weight is off by 5kg, your power readings will be off by a similar proportion across every session.</p>
<p>Technique scores are sensitive to rider level. Getting this wrong affects how every session is interpreted.</p>
<p>Biomechanical analysis is sensitive to crank length — a 10mm error affects pedal velocity and kinematic estimates noticeably.</p>
<p>Reaction time doesn't use any profile data. It's a pure sensor measurement.</p>
<p>G-force doesn't use profile data in any way that affects the raw values.</p>
<p>Speed from IMU integration doesn't depend on weight or bike configuration.</p>
<hr />
<h2 id="privacy">Privacy</h2>
<p>Everything in your profile is private. Your weight, height, date of birth, club, team, bike details — none of it is visible to other users or anyone else.</p>
<p>The only exception is your display name, which becomes visible on the leaderboard if you opt in. Your age group (not your exact age) becomes inferable from age-group leaderboard filters if you opt in and that filter is active.</p>
<p>When you export session data to CSV, the export includes your name and weight (used in the power calculations shown in the export). That file lives on your computer — the platform doesn't send your profile data anywhere automatically.</p>
<hr />
<p><em>For help with specific profile fields, use the Help section on the profile page.</em></p>`,
    plain: `Why This Matters You can use the analytics platform without filling in your profile. You'll see reaction times, G-force charts, and basic metrics. But several things only work when the system knows more about you and your equipment. Power calculations need your weight and bike weight — without both, the physics doesn't have enough information to work with. Technique scoring calibrates against your declared rider level — without it, the system uses generic intermediate benchmarks that might not be appropriate for where you actually are. Age-group analytics need your date of birth. Biomechanical calculations benefit from crank length. Think of your profile as calibration. The sensor records what happened. Your profile tells the system how to interpret those measurements in physically meaningful terms. Your Rider Profile Weight The single most important field for unlocking analytics. Power is calculated as force times velocity, and force is mass times acceleration. Without your body weight, the maths doesn't work. Power features simply don't appear until this is filled in. Enter your weight in kilograms, to the nearest kg. Your weight fluctuates day to day — don't obsess over updating after every meal. Update it when it changes meaningfully and stays there (more than 2–3kg). One thing worth knowing: power is proportional to mass. If you gain 5kg, your power estimates will increase for the same acceleration. That's correct — a heavier rider producing the same acceleration is actually generating more force. The system accounts for this properly. Height Used in some biomechanical calculations. Enter it in centimetres. If you're used to feet and inches, convert first — 5'9" is 175cm, not 5.9. Entering your height in feet will tell the system you're about the size of a large house cat, which won't produce useful biomechanics. Date of Birth Used for two things: calculating your UCI category automatically (it updates as you age, so your category might change mid-season), and enabling age-group filtering on the leaderboard. Your exact age is never shown publicly — only your age bracket (e.g., 26–35). Rider Level This calibrates what "excellent," "good," and "needs work" mean for your technique scores. A 0.28 second reaction time is excellent for a novice and needs work for an elite rider. Setting this wrong makes your scores either falsely encouraging or needlessly harsh. The options are Novice (new to gate starts, under six months training), Intermediate (regular club training, six months to two years), Expert (competitive regional or national level), and Elite (professional or international level). Be honest about where you actually are. The system doesn't care about your ambitions — it needs accurate calibration to give you useful feedback. If in doubt, go one level lower rather than higher. You can always update it when you move up. If you don't set a rider level, the system defaults to Intermediate. Sex Tracked but not currently used heavily in analytics. Planned for future sex-specific performance benchmarking. Display Name This is what appears on the leaderboard if you opt in. Everything else in your profile is private — this is the only thing that can become public. Either leave it blank (the system uses your first name) or set something you're comfortable having visible. Bike Setup The system supports multiple bikes, but only one is active at a time. When you upload a session, it automatically links to whichever bike is currently active. Sessions stay linked to the bike that was active when they were uploaded — they don't retroactively switch if you change your active bike later. Bike Weight Required for power calculations alongside your body weight. The system adds rider weight and bike weight together as total system mass. Both are needed — one without the other isn't enough. Weigh yourself holding the bike, then weigh yourself without it, and subtract. Or use a luggage scale. Enter the result in kilograms. Typical BMX bikes a`,
  },
  {
    slug: "reports",
    title: "Reports",
    desc: "Session and progress reports, detail levels, and sharing with coaches",
    icon: "\ud83d\udcc4",
    html: `<hr />
<h2 id="what-reports-are-for">What Reports Are For</h2>
<p>The session page shows you everything. Every metric, every chart, every number the system can calculate. That's useful when you're exploring your data, but it's not useful when you want to share what happened with your coach, or when you just want to understand the key points without clicking through fifteen sections.</p>
<p>Reports take the data and turn it into a document. Focused, readable, shareable. Not everything — the things that matter.</p>
<p>There are two kinds. Session reports summarise a single session — what happened, how consistent you were, what to work on next. Progress reports summarise your training over time — which direction things are moving, what's improving, what isn't, how confident the system is in what it's seeing.</p>
<hr />
<h2 id="generating-a-session-report">Generating a Session Report</h2>
<p>From any session page, scroll to the bottom and click <strong>Generate Session Report</strong>. A panel opens where you pick the detail level and what to include, then click Generate. The report appears immediately — you can read it on screen, print it, save it as PDF, or export the raw data as JSON.</p>
<p>Generate one when you want to send a summary to your coach, when you've had a session worth documenting, or when you want to understand what just happened before the context fades. Don't generate them out of habit and then not read them.</p>
<hr />
<h2 id="generating-a-progress-report">Generating a Progress Report</h2>
<p>From the Analytics page, once you've uploaded at least three sessions, you'll see a <strong>Generate Progress Report</strong> button. This looks across all your sessions and tells you what's actually changing over time — reaction time trending faster or slower, consistency tightening or widening, fatigue appearing earlier or later in sets.</p>
<p>Three sessions is the minimum the system needs to identify a pattern rather than just connecting two dots. With ten or more sessions, the analysis gets considerably more reliable.</p>
<hr />
<h2 id="detail-levels">Detail Levels</h2>
<p>When you generate a report you choose a detail level. These are genuinely different documents, not just the same thing at different lengths.</p>
<h3 id="simple">Simple</h3>
<p>For the rider themselves, or for parents who want to know how things are going without technical context.</p>
<p>Plain language. One or two focus points. Clear next-session actions. No scores, no percentages, no jargon. If your report says "your starts were consistent but your force application was choppy," that's a Simple report. You know what it means and what to do about it without needing to understand what coefficient of variation is.</p>
<h3 id="standard">Standard</h3>
<p>For club-level riders who are engaged with their training and want a bit more than the headline.</p>
<p>Key metrics with one-line explanations. Recommendations with brief reasoning. Data quality notes where they're relevant. You'll see numbers — session quality score, repeatability score — but each one is explained rather than presented raw.</p>
<h3 id="coach">Coach</h3>
<p>For coaches, or for experienced riders who are self-coaching at a serious level.</p>
<p>Full session intelligence. Technique pattern analysis — not just scores, but what the pattern suggests. Best-vs-average gap with training implications. Conflicts between metrics called out explicitly. Prioritised recommendations with watch-for indicators.</p>
<p>This level is direct. It describes what the data shows and what it implies for training decisions. If your drop-off is early and your best-vs-average gap is wide, the report will say so and tell you what that combination typically means. It assumes you understand coaching terminology and can handle a candid reading of the data.</p>
<h3 id="technical">Technical</h3>
<p>For data analysis, debugging, or when you need everything.</p>
<p>Everything from Coach level, plus raw metric values, full data quality diagnostics, and an appendix of computed values. Use this if you're exporting data for your own analysis, troubleshooting something that looks wrong, or you want to see exactly how the system arrived at a conclusion.</p>
<hr />
<h2 id="the-honest-questions">The Honest Questions</h2>
<h3 id="what-does-trends-are-emerging-mean">What does "trends are emerging" mean?</h3>
<p>It means the system can see a pattern in your data but doesn't have enough sessions yet to be statistically confident it's real rather than noise.</p>
<p>Progress reports are based on comparing your recent sessions against your earlier sessions. The more sessions you have, the more confident the system can be. With three or four sessions, it'll flag patterns as emerging — they're probably real, but they might just be variation. With ten or more sessions, if the trend holds, it'll show as high confidence — the pattern is reliable enough to plan around.</p>
<p>The confidence indicator isn't about whether your data is accurate. Your reaction times are what they are — they're measured directly. It's about whether the <em>trend</em> is reliable. And the system is honest about the difference rather than presenting every movement as a significant development.</p>
<ul>
<li>Low confidence: this might be a thing, keep an eye on it</li>
<li>Trends emerging: this is probably a thing, don't overreact yet  </li>
<li>High confidence: this is definitely a thing, plan accordingly</li>
</ul>
<h3 id="what-does-best-vs-average-gap-mean">What does "best vs average gap" mean?</h3>
<p>Your best run in a session is your ceiling. Your average run is your floor. The gap between them tells you where your training effort should go.</p>
<p>A 5% gap means most of your runs are close to your best. You're producing reliable starts. When you race, you'll tend to perform near your ceiling.</p>
<p>A 25% gap means you can produce a fast start, but most of your runs are well below that. You're inconsistent. In training that's frustrating. In racing it's expensive — sometimes you'll be fast, often you won't, and you can't predict which.</p>
<p>If your gap is wide, the fix usually isn't trying harder on every run. It's usually the opposite — dial back slightly, focus on repeatable execution, and let your average improve. Your peak might not move for a while, but your floor will rise, which is what training is supposed to achieve.</p>
<p>Progress reports tell you whether this gap is getting wider or narrower over time. Narrowing is progress. Widening means you're probably chasing peaks at the expense of consistency.</p>
<h3 id="why-is-speed-described-as-directional-only">Why is speed described as "directional only"?</h3>
<p>Because it's calculated rather than measured.</p>
<p>Reaction time is a direct measurement — the sensor detected when you moved, and recorded the time. That number is reliable.</p>
<p>Speed is calculated by integrating your acceleration data over time. If you accelerated at 2.5G for 0.8 seconds, the maths gives you an approximate speed. But small errors in sensor readings compound as the calculation runs, which is why the firmware applies a bias correction. When that correction value is high — above about 1.5 m/s² — the system knows the speed estimate is getting unreliable.</p>
<p>"Directional only" means: the chart is probably showing the right shape, and the number is probably in the right ballpark, but don't quote it as a precise figure. Use it to compare runs within the same session, or to see whether your speed is trending up across sessions. Don't use it to argue about whether you hit 32 km/h or 34 km/h.</p>
<p>For tracking your own progress over time, directional speed is fine. For precise analysis, you'd want a speed trap or GPS to cross-reference.</p>
<h3 id="can-i-share-a-report-with-a-coach-who-doesnt-use-appgatepro">Can I share a report with a coach who doesn't use AppGatePro?</h3>
<p>Yes. The report is self-contained — it doesn't assume the reader has platform access or knows how to interpret the session page. It explains what the numbers mean, what they suggest, and what to do about them.</p>
<p>Print it, save it as PDF, or copy the text into a message. The JSON export is there if your coach wants structured data rather than a formatted document.</p>
<p>Reports don't include your account details. If you want to share anonymously — posting on a forum for feedback, for example — that's fine.</p>
<h3 id="why-doesnt-the-report-match-exactly-what-i-see-on-the-session-page">Why doesn't the report match exactly what I see on the session page?</h3>
<p>Because the report is selective and the session page isn't.</p>
<p>The session page shows every metric the system can calculate, because different riders care about different things. The report picks the metrics that matter most for the key patterns it's identified and explains what they mean. It's a coaching summary, not a data dump.</p>
<p>Some things that appear on the session page won't appear in the report:</p>
<ul>
<li>Individual run metrics (the report focuses on session-level patterns, not run-by-run detail)</li>
<li>Speed values when data quality is poor (rather than show unreliable numbers, it omits them and explains why)</li>
<li>Power estimates when weight data is missing (same reason)</li>
<li>Every chart (charts are optional — tick the box if you want them included)</li>
</ul>
<p>The session page is your analysis workspace. The report is what you take away from it.</p>
<hr />
<h2 id="what-the-report-cant-tell-you">What the Report Can't Tell You</h2>
<p>Reports are good at summarising what happened and identifying patterns. They're not coaching.</p>
<p>They won't diagnose complex technique problems — they'll identify the area but not prescribe a fix. They won't compare you against other riders. They won't make training programme recommendations. And they won't override your coach's judgement — they're a tool for coaching conversations, not a replacement for them.</p>
<p>No report will show you metrics where the data quality is too poor to be useful. The system suppresses unreliable numbers rather than presenting them with asterisks. And if there aren't enough sessions for trend analysis, it'll say so rather than attempting it anyway.</p>
<p>If a report conclusion doesn't match what you or your coach are seeing in person, trust your eyes. The data is what it is, but coaching involves context the sensors don't have.</p>
<hr />
<h2 id="common-situations">Common Situations</h2>
<p><strong>"The report says I'm improving but I don't feel faster."</strong></p>
<p>Progress often shows up in the data before it shows up in perception. If your average reaction time is dropping from 0.31s to 0.28s over ten sessions, that's real improvement — but it doesn't feel dramatically different because the change is gradual. Also check what the report is actually saying is improving. Sometimes it's consistency or repeatability rather than raw speed, which is still progress but shows up differently in how you feel.</p>
<p><strong>"I got a personal best but the report says the session quality was poor."</strong></p>
<p>One great run in a session of otherwise inconsistent runs will set a PB but produce a poor session quality score and a wide best-vs-average gap. Both things are true. The report will acknowledge the PB and point out that most of your runs weren't close to it. What you do with that depends on your training phase — if you're experimenting and one run clicked, that's useful. If you're in a consistency phase, it's a flag.</p>
<p><strong>"The report flagged a problem but my coach says I'm fine."</strong></p>
<p>Trust your coach. The report is looking at sensor data and applying statistical patterns. Your coach is watching your movement and making coaching judgements that go beyond what a sensor can see. Use the report to inform the conversation, not to override coaching decisions.</p>
<hr />
<h2 id="what-to-pay-attention-to">What to Pay Attention To</h2>
<p><strong>Direction, not just values.</strong> Is the thing you're working on moving the right way? A reaction time of 0.265s means nothing without knowing whether it was 0.280s last month or 0.245s.</p>
<p><strong>Confidence level.</strong> A medium-confidence trend is interesting. A high-confidence trend is something to plan around. Don't celebrate or panic based on three sessions.</p>
<p><strong>Conflicts.</strong> If the report mentions that one metric is improving while another is declining — speed up but consistency down, for example — that's worth investigating. These patterns are easy to miss session-to-session but compound over weeks. The report spots them.</p>
<p><strong>Data quality notes.</strong> When the report says "speed values are directional only" or "some metrics weren't available," that's the system being honest about what to trust. Don't skip those notes.</p>
<hr />
<h2 id="a-note-on-saving-reports">A Note on Saving Reports</h2>
<p>Reports aren't currently saved to your account. If you want to keep one, export it as PDF or save the text. </p>
<p>Saving report history, automatic scheduled reports, and report-to-report comparison are planned for future versions. The core system needs to be reliable first.</p>
<hr />
<p><em>For help with the session page metrics that feed into reports, see the Session chapter. For understanding the trend analysis that drives progress reports, see the Analytics chapter.</em></p>`,
    plain: `What Reports Are For The session page shows you everything. Every metric, every chart, every number the system can calculate. That's useful when you're exploring your data, but it's not useful when you want to share what happened with your coach, or when you just want to understand the key points without clicking through fifteen sections. Reports take the data and turn it into a document. Focused, readable, shareable. Not everything — the things that matter. There are two kinds. Session reports summarise a single session — what happened, how consistent you were, what to work on next. Progress reports summarise your training over time — which direction things are moving, what's improving, what isn't, how confident the system is in what it's seeing. Generating a Session Report From any session page, scroll to the bottom and click Generate Session Report . A panel opens where you pick the detail level and what to include, then click Generate. The report appears immediately — you can read it on screen, print it, save it as PDF, or export the raw data as JSON. Generate one when you want to send a summary to your coach, when you've had a session worth documenting, or when you want to understand what just happened before the context fades. Don't generate them out of habit and then not read them. Generating a Progress Report From the Analytics page, once you've uploaded at least three sessions, you'll see a Generate Progress Report button. This looks across all your sessions and tells you what's actually changing over time — reaction time trending faster or slower, consistency tightening or widening, fatigue appearing earlier or later in sets. Three sessions is the minimum the system needs to identify a pattern rather than just connecting two dots. With ten or more sessions, the analysis gets considerably more reliable. Detail Levels When you generate a report you choose a detail level. These are genuinely different documents, not just the same thing at different lengths. Simple For the rider themselves, or for parents who want to know how things are going without technical context. Plain language. One or two focus points. Clear next-session actions. No scores, no percentages, no jargon. If your report says "your starts were consistent but your force application was choppy," that's a Simple report. You know what it means and what to do about it without needing to understand what coefficient of variation is. Standard For club-level riders who are engaged with their training and want a bit more than the headline. Key metrics with one-line explanations. Recommendations with brief reasoning. Data quality notes where they're relevant. You'll see numbers — session quality score, repeatability score — but each one is explained rather than presented raw. Coach For coaches, or for experienced riders who are self-coaching at a serious level. Full session intelligence. Technique pattern analysis — not just scores, but what the pattern suggests. Best-vs-average gap with training implications. Conflicts between metrics called out explicitly. Prioritised recommendations with watch-for indicators. This level is direct. It describes what the data shows and what it implies for training decisions. If your drop-off is early and your best-vs-average gap is wide, the report will say so and tell you what that combination typically means. It assumes you understand coaching terminology and can handle a candid reading of the data. Technical For data analysis, debugging, or when you need everything. Everything from Coach level, plus raw metric values, full data quality diagnostics, and an appendix of computed values. Use this if you're exporting data for your own analysis, troubleshooting something that looks wrong, or you want to see exactly how the system arrived at a conclusion. The Honest Questions What does "trends are emerging" mean? It means the system can see a pattern in your data but doesn't have enough sessions yet to be statistically confident it's`,
  },
  {
    slug: "leaderboard",
    title: "Leaderboards & Benchmarking",
    desc: "How ranking works, privacy controls, and using it well",
    icon: "\ud83c\udfc6",
    html: `<hr />
<h2 id="what-this-is-for">What This Is For</h2>
<p>A reaction time of 0.268 seconds is a number. Whether it's competitive, average, or needs work depends on who you're comparing against. The leaderboard provides that context — not to make you feel good or bad, but to give you an honest picture of where you stand relative to other riders.</p>
<p>This isn't a points system. There are no badges, no levels, no rewards for participation. What you get is your rank, your percentile, and the ability to see how your performance compares across different age groups and experience levels. That's it.</p>
<p>The system is opt-in. Your data stays private unless you explicitly choose to share it, and even then, you control how you appear — an anonymous display name, never your real identity.</p>
<hr />
<h2 id="privacy">Privacy</h2>
<p>When you create an account, you're not on the leaderboard. Your sessions, your numbers, your progress — all private. To appear on the leaderboard you go to Settings, find the Leaderboard section, toggle it on, choose a display name, and save. Until you do that, you're invisible to the system.</p>
<p>When you opt in, the system shares your display name, your best performance metrics, your session count, your broad age group (13–17, 18–25, etc.) and your experience level. That's all.</p>
<p>What never gets shared: your real name, your email, your exact age, your location, individual session details, or anything that could identify you personally. Opting in gives permission to use your best metrics for public rankings. It doesn't open up your whole account.</p>
<p>You can opt out at any time. Toggle the setting off, save, and you're immediately removed from all leaderboards. Your personal data stays in your account — opting out only removes you from the public-facing rankings. You can opt back in later without penalty.</p>
<p><strong>Display names</strong> can be whatever you choose or auto-generated by the system. Auto-generated names look like "FastRider2847." User-chosen ones are up to you, within reason — the system filters out anything offensive, anything that looks like a real identifiable name, and anything that could be mistaken for an official account. If your chosen name is rejected, pick another or use the auto-generated option.</p>
<hr />
<h2 id="how-the-leaderboard-works">How the Leaderboard Works</h2>
<p>Once you're opted in, the top of the leaderboard page shows your rank card — your display name, your position (e.g., #42 of 287 riders), your percentile, your metric value, and your session count. Your rank updates in real-time whenever you upload a session that improves your personal best. If you upload a session that doesn't improve your best, your rank stays the same — though others can still move past you if they improve.</p>
<p>The leaderboard table shows the top 100 riders. If you're outside the top 100, your row appears at the bottom alongside the riders immediately above and below you, so you always have context around your position.</p>
<p>You can filter by four things: the metric you care about (reaction time, peak speed, max G-force, or consistency), the time period (all time, this month, or this week), your age group, and your experience level. These filters combine — you might be #67 globally for reaction time, #12 in your age group, and #8 for this month. All three are true. They measure different things.</p>
<p>Time period filtering shows your best performance within that window, not cumulative improvement. If you haven't uploaded sessions this week, you won't appear in "This Week."</p>
<p>Age groups exist because comparing a 45-year-old's reaction time to an 18-year-old's is fighting biology. Experience levels exist because a rider with 5 sessions is still learning the system while one with 150 has had months to refine their technique. Both filters let you compare against riders at similar stages.</p>
<hr />
<h2 id="what-the-numbers-mean">What the Numbers Mean</h2>
<p><strong>Percentile matters more than rank.</strong> Being #67 of 150 riders (top 45%) is very different from being #67 of 800 riders (top 8%). The percentile tells you what fraction of opted-in riders you're ahead of. Riders in the top 10% get a star marker, top 25% get a target marker. These aren't awards — they're statistical descriptions.</p>
<p><strong>Session count provides context.</strong> A rider ranked #1 with 8 sessions might have gotten lucky once and stopped uploading. A rider ranked #1 with 287 sessions is consistently fast across months of data. Higher session counts generally mean more reliable rankings. When you're comparing yourself against top performers, check their session count before drawing conclusions.</p>
<p><strong>Rankings can change without you doing anything.</strong> If other riders improve and pass you, your rank drops — even though your absolute performance hasn't changed. This is normal. Your reaction time is still 0.268 seconds. More riders are now below that threshold than before.</p>
<p><strong>The leaderboard only activates when there are enough users for the statistics to mean anything.</strong> You need at least 30 riders globally for the main leaderboard, and at least 10 in any filtered category. This protects privacy (a leaderboard of two riders tells everyone exactly who's who) and ensures that ranks are statistically valid. If you filter to a combination with too few riders, you'll see a "not enough data" message rather than a misleading ranking.</p>
<hr />
<h2 id="peer-comparison">Peer Comparison</h2>
<p>Alongside the leaderboard, the system offers peer comparison analytics when you have active goals. This is less competitive in framing — instead of showing you where you rank, it shows you where you stand statistically.</p>
<p>When you're on the goals or analytics pages, you might see something like: "You're in the 78th percentile for reaction time among intermediate riders aged 26–35. To reach the top 10%, target 0.245s or better."</p>
<p>This uses the same underlying data as the leaderboard but without the ranked table format. Some riders find it more useful than leaderboards for training decisions. Some find the leaderboard more motivating. Both require opt-in and follow the same privacy rules.</p>
<hr />
<h2 id="using-it-well">Using It Well</h2>
<p><strong>What leaderboards are good for:</strong> Setting realistic targets (you can see exactly what reaction time gets you into the top 25%), motivational context (knowing you're two positions from a percentile milestone), and validation (if your rank is dropping despite training, the field is improving faster than you are — useful information).</p>
<p><strong>What they're not good for:</strong> Comparing yourself across different track conditions, equipment setups, or training environments. A rider training indoors with precision equipment will have different numbers from one on a club track outdoors. Leaderboards don't account for this. Making day-to-day training decisions based on rank fluctuations — weekly rank changes are noise. Letting rank pressure override sensible training decisions, particularly around recovery.</p>
<p><strong>Recommended pattern:</strong> Check monthly, not daily. Look at your percentile more than your absolute rank. Use the age group and experience level filters to compare against riders at similar stages. When you're in the right percentile range for your development level, set a concrete goal to reach the next one.</p>
<hr />
<h2 id="honest-limitations">Honest Limitations</h2>
<p>The leaderboard can be motivating if it helps you train more consistently and set concrete goals. It can be counterproductive if it makes you anxious, triggers overtraining, or makes you feel inadequate.</p>
<p>Neither of those responses is wrong — they're just different people responding differently to competitive pressure. If leaderboards support your training, use them. If they undermine it, opt out. Training without leaderboard pressure is completely valid and often more sustainable long-term.</p>
<p>Your rank is a number on a screen. It doesn't account for your training history, your equipment, your track conditions, your coaching, or the twenty other variables that determine performance. It's one signal among many, and not always the most useful one.</p>
<p>The leaderboard also can't tell you why you're ranked where you are, or what specifically to change to improve. It tells you where you stand. What to do about it is a different question — one for your coach, your training programme, and the rest of the analytics in the system.</p>
<hr />
<h2 id="common-questions">Common Questions</h2>
<p><strong>Can I see the leaderboard without being on it?</strong> Yes. You can browse and filter the leaderboard without appearing on it. This lets you decide whether you want to participate before opting in.</p>
<p><strong>If I opt out and back in, do I keep my rank?</strong> Your rank recalculates in real-time from your current best performance metrics. If you were opted out for six months, your rank reflects where you stand today. Other riders may have improved while you were out, so your position might be different — but there's no penalty for opting out and returning.</p>
<p><strong>Can coaches see my leaderboard data?</strong> Any logged-in user can see the public leaderboard, including coaches. They can see your display name and rank. They can't see who you actually are, your session details, or anything beyond what appears in the public table. If you don't want anyone to know your display name is you, use an anonymous one.</p>
<p><strong>Why does my rank change when I haven't uploaded anything?</strong> Other riders uploaded sessions and improved. Your absolute performance hasn't changed, but your relative position has. This is how leaderboards work.</p>
<p><strong>Can I opt in for some metrics but not others?</strong> No. Opting in shows you across all metric leaderboards. You can filter your own view to focus on what you care about, but other users can see all your opted-in metrics. If you're not comfortable with one metric being visible, don't opt in.</p>
<p><strong>What happens to my data if I delete my account?</strong> You're immediately removed from all leaderboards. Historical aggregate statistics that included your data can't be retroactively recalculated — they're derived from populations, not individuals — but your identifying data is gone immediately.</p>
<hr />
<h2 id="privacy-and-data-rights">Privacy and Data Rights</h2>
<p>Under GDPR you have the right to access your leaderboard data (it's visible when you're opted in), correct your display name (via Settings at any time), erasure (toggle opt-out to remove yourself immediately), portability (standard CSV export covers your performance data), and objection to benchmarking use (functionally the same as opting out).</p>
<p>No third parties have access to leaderboard data. AppGatePro doesn't share performance data with sponsors, coaches, teams, or anyone else. If you screenshot your rank and share it yourself, that's your decision — the platform doesn't facilitate or encourage it.</p>
<p>For privacy concerns or data rights requests that can't be handled via Settings, contact privacy@appgatepro.com.</p>
<hr />
<p><em>For help with the leaderboard page specifically, use the Help section on that page.</em></p>`,
    plain: `What This Is For A reaction time of 0.268 seconds is a number. Whether it's competitive, average, or needs work depends on who you're comparing against. The leaderboard provides that context — not to make you feel good or bad, but to give you an honest picture of where you stand relative to other riders. This isn't a points system. There are no badges, no levels, no rewards for participation. What you get is your rank, your percentile, and the ability to see how your performance compares across different age groups and experience levels. That's it. The system is opt-in. Your data stays private unless you explicitly choose to share it, and even then, you control how you appear — an anonymous display name, never your real identity. Privacy When you create an account, you're not on the leaderboard. Your sessions, your numbers, your progress — all private. To appear on the leaderboard you go to Settings, find the Leaderboard section, toggle it on, choose a display name, and save. Until you do that, you're invisible to the system. When you opt in, the system shares your display name, your best performance metrics, your session count, your broad age group (13–17, 18–25, etc.) and your experience level. That's all. What never gets shared: your real name, your email, your exact age, your location, individual session details, or anything that could identify you personally. Opting in gives permission to use your best metrics for public rankings. It doesn't open up your whole account. You can opt out at any time. Toggle the setting off, save, and you're immediately removed from all leaderboards. Your personal data stays in your account — opting out only removes you from the public-facing rankings. You can opt back in later without penalty. Display names can be whatever you choose or auto-generated by the system. Auto-generated names look like "FastRider2847." User-chosen ones are up to you, within reason — the system filters out anything offensive, anything that looks like a real identifiable name, and anything that could be mistaken for an official account. If your chosen name is rejected, pick another or use the auto-generated option. How the Leaderboard Works Once you're opted in, the top of the leaderboard page shows your rank card — your display name, your position (e.g., #42 of 287 riders), your percentile, your metric value, and your session count. Your rank updates in real-time whenever you upload a session that improves your personal best. If you upload a session that doesn't improve your best, your rank stays the same — though others can still move past you if they improve. The leaderboard table shows the top 100 riders. If you're outside the top 100, your row appears at the bottom alongside the riders immediately above and below you, so you always have context around your position. You can filter by four things: the metric you care about (reaction time, peak speed, max G-force, or consistency), the time period (all time, this month, or this week), your age group, and your experience level. These filters combine — you might be #67 globally for reaction time, #12 in your age group, and #8 for this month. All three are true. They measure different things. Time period filtering shows your best performance within that window, not cumulative improvement. If you haven't uploaded sessions this week, you won't appear in "This Week." Age groups exist because comparing a 45-year-old's reaction time to an 18-year-old's is fighting biology. Experience levels exist because a rider with 5 sessions is still learning the system while one with 150 has had months to refine their technique. Both filters let you compare against riders at similar stages. What the Numbers Mean Percentile matters more than rank. Being #67 of 150 riders (top 45%) is very different from being #67 of 800 riders (top 8%). The percentile tells you what fraction of opted-in riders you're ahead of. Riders in the top 10% get a star marker, top 25% get a target marker. These `,
  },
  {
    slug: "help",
    title: "Help & Troubleshooting",
    desc: "Common problems, upload errors, account issues, and bug reporting",
    icon: "\u2753",
    html: `<hr />
<h2 id="start-here">Start Here</h2>
<p>Most problems fall into one of these categories. Find yours and go to the relevant section.</p>
<p><strong>Upload problems</strong> — see the Upload chapter. It covers every error message, what caused it, and what to do about it.</p>
<p><strong>Numbers look wrong</strong> — check your profile first. Missing weight data means no power calculations. Wrong rider level means miscalibrated technique scores. The Profile chapter explains what each field affects.</p>
<p><strong>Something looks right in one place and wrong in another</strong> — the dashboard shows all-time bests, Analytics shows trends, individual sessions show run-level detail. They're calculating different things and they're supposed to look different. The chapters for each page explain what each one shows.</p>
<p><strong>Features are missing or showing N/A</strong> — usually a profile completeness issue. Power needs rider weight and bike weight. Age-group analytics need a date of birth. Speed suppression happens when the firmware flags a run as unreliable. Check the relevant chapter for what each feature requires.</p>
<p><strong>Can't log in</strong> — see the account section below.</p>
<p><strong>Something is broken that should work</strong> — see the bug reporting section below.</p>
<hr />
<h2 id="common-problems">Common Problems</h2>
<h3 id="sessions">Sessions</h3>
<p><strong>I uploaded a session but can't find it.</strong> Sessions sort by when they were recorded (the device timestamp), not when you uploaded them. If your device clock was wrong, or you uploaded an old session, it'll appear sorted by its actual date rather than at the top of the list. Use the date filter to search, or click the "View Session" link on the upload success screen before navigating away.</p>
<p><strong>A session shows in the list but clicking it gives an error.</strong> Try navigating to it from the Sessions list rather than a direct URL or bookmark. If the problem persists, the session record may be corrupted — contact support.</p>
<p><strong>Some runs are missing from a session.</strong> Check the upload success screen — timeseries warnings don't remove runs, they only affect orientation data. If core runs are missing, they weren't in the file. The firmware didn't record them, and upload can't create data that doesn't exist.</p>
<h3 id="data">Data</h3>
<p><strong>Reaction times show as thousands of milliseconds.</strong> The firmware is writing reaction time in milliseconds instead of seconds, then the upload system multiplies by 1000 again. This is a firmware bug. Update the firmware and re-upload.</p>
<p><strong>Speed shows as N/A or is clearly wrong.</strong> The firmware flagged those analytics as unreliable — high bias correction, insufficient data, or sensor error. Speed gets suppressed rather than showing numbers that can't be trusted. Reaction time and G-force still work. See the Session chapter for what the bias correction value tells you.</p>
<p><strong>Power shows N/A.</strong> Both rider weight and bike weight need to be set in your profile. One without the other isn't enough. Set both, then refresh the session page.</p>
<p><strong>G-force chart has spikes or jumps.</strong> Usually sensor noise, a device movement during the run, or an SD card write error creating gaps. If a run looks clearly corrupt, archive it — it won't help your analytics and it can set false personal bests on the dashboard.</p>
<h3 id="account">Account</h3>
<p><strong>Can't log in despite correct password.</strong> Try copy-pasting rather than typing. Try a different browser. Clear cache and cookies. Use "Forgot password" if you're not certain the password is right.</p>
<p><strong>Keeps logging you out.</strong> Session tokens expire after about 30 days. Log back in — your data is safe. If it's happening much more frequently, check whether your browser is blocking cookies.</p>
<p><strong>Settings won't save.</strong> The platform doesn't auto-save. Make sure you're clicking Save and watching for error messages. If saves consistently fail, try a different browser.</p>
<h3 id="performance">Performance</h3>
<p><strong>Platform is slow.</strong> Large sessions with full timeseries data take longer to process and render. Charts in particular are GPU-dependent — older or lower-powered devices will struggle. Try on a desktop or laptop if you're on mobile. Closing other browser tabs helps.</p>
<p><strong>Upload times out.</strong> Session files with many runs and full timeseries can be several megabytes and take 20–30 seconds on a slow connection. Try again, or try on a faster connection. If it consistently times out, contact support.</p>
<p><strong>Charts don't appear.</strong> Check that JavaScript is enabled and that browser extensions (particularly ad blockers) aren't interfering with Canvas rendering. Try incognito mode to isolate the issue.</p>
<hr />
<h2 id="if-everything-seems-broken">If Everything Seems Broken</h2>
<p>Work through this in order:</p>
<ol>
<li>
<p><strong>Try incognito or private browsing mode.</strong> If it works there, the issue is a browser extension, cached data, or a cookie. Clear cache, or disable extensions one by one to find the culprit.</p>
</li>
<li>
<p><strong>Try a different browser.</strong> Chrome tends to work best. Firefox is a reliable second. If switching browser fixes it, your original browser has a configuration issue.</p>
</li>
<li>
<p><strong>Try a different device.</strong> Desktop vs laptop vs mobile. If it works on one but not another, the issue is device-specific.</p>
</li>
<li>
<p><strong>Check your internet connection.</strong> Try other websites. Restart your router. Try a mobile hotspot.</p>
</li>
<li>
<p><strong>Contact support.</strong> If none of the above helps, something is wrong with the platform or your account specifically.</p>
</li>
</ol>
<hr />
<h2 id="reporting-a-bug">Reporting a Bug</h2>
<p>A bug is something that should work but doesn't. A feature request is something that doesn't exist but you wish it did. Both are welcome, but they go through different processes.</p>
<p>When reporting a bug, include:
- What you were trying to do
- What you expected to happen
- What actually happened
- Your browser and operating system
- Whether it happens every time or just occasionally</p>
<p>The more specific you are, the faster it gets resolved. "Upload is broken" is hard to act on. "Upload fails with 'Failed to insert run 3' error on sessions with more than 5 runs, using Chrome on Windows 11" is actionable.</p>
<p>Don't include your actual session files in bug reports — they contain your performance data and are private. If support needs a file to diagnose something, they'll ask for it specifically.</p>
<p>Use the feedback button on whichever page the issue occurred. It captures the page context automatically, which helps with diagnosis.</p>
<hr />
<h2 id="when-to-contact-support">When to Contact Support</h2>
<p>Try the self-service options first — check the relevant chapter, refresh the page, try a different browser. Most things resolve with basic troubleshooting.</p>
<p>Contact support when:
- You can't log in and the password reset isn't working
- You've lost access to your two-factor authentication device
- You uploaded sessions and the data looks corrupted or lost
- A bug persists after you've tried basic troubleshooting
- You have a privacy concern — something visible that shouldn't be
- You want to delete your account and can't find the option</p>
<p>Support typically responds within one to two business days. For account access or data loss issues, same-day response where possible.</p>
<p>Email support@appgatepro.com, or use the in-app feedback button.</p>
<hr />
<h2 id="browser-console-errors">Browser Console Errors</h2>
<p>If support asks you to check the browser console: press F12 (or Cmd+Option+I on Mac), click the Console tab, reproduce the issue, and screenshot any red error messages. You don't need to understand what they say — support will interpret them.</p>
<p>The most common ones and what they mean:</p>
<p><strong>"Failed to fetch" or "Network error"</strong> — your connection dropped, or the server is temporarily unreachable.</p>
<p><strong>"401 Unauthorized"</strong> — your session expired. Log in again.</p>
<p><strong>"404 Not Found"</strong> — the page or resource doesn't exist at that URL. Usually a broken link or deleted content.</p>
<p><strong>"500 Internal Server Error"</strong> — something went wrong on the server side. Not your fault. Report it.</p>
<hr />
<h2 id="quick-answers">Quick Answers</h2>
<p><strong>Can I upload sessions out of order?</strong> Yes — they sort by device timestamp regardless of upload order.</p>
<p><strong>Can I re-upload the same file?</strong> Yes — each upload creates a new session. If you accidentally deleted one, re-upload the file and archive the duplicate.</p>
<p><strong>Does upload modify my SD card?</strong> No — the file is read but never touched.</p>
<p><strong>Can I share a session with my coach?</strong> Export it as CSV and send the file. There's no built-in sharing — sessions are private by default.</p>
<p><strong>What happens if I stop using the platform?</strong> Your data stays in your account indefinitely. Nothing expires or gets deleted unless you delete it yourself.</p>
<p><strong>Can I use it on mobile?</strong> Yes, but the platform is designed desktop-first. Charts in particular are easier to read on a larger screen. Upload works fine on mobile.</p>
<hr />
<p><em>If your problem isn't covered here, use the feedback button on the relevant page or email support@appgatepro.com.</em></p>`,
    plain: `Start Here Most problems fall into one of these categories. Find yours and go to the relevant section. Upload problems — see the Upload chapter. It covers every error message, what caused it, and what to do about it. Numbers look wrong — check your profile first. Missing weight data means no power calculations. Wrong rider level means miscalibrated technique scores. The Profile chapter explains what each field affects. Something looks right in one place and wrong in another — the dashboard shows all-time bests, Analytics shows trends, individual sessions show run-level detail. They're calculating different things and they're supposed to look different. The chapters for each page explain what each one shows. Features are missing or showing N/A — usually a profile completeness issue. Power needs rider weight and bike weight. Age-group analytics need a date of birth. Speed suppression happens when the firmware flags a run as unreliable. Check the relevant chapter for what each feature requires. Can't log in — see the account section below. Something is broken that should work — see the bug reporting section below. Common Problems Sessions I uploaded a session but can't find it. Sessions sort by when they were recorded (the device timestamp), not when you uploaded them. If your device clock was wrong, or you uploaded an old session, it'll appear sorted by its actual date rather than at the top of the list. Use the date filter to search, or click the "View Session" link on the upload success screen before navigating away. A session shows in the list but clicking it gives an error. Try navigating to it from the Sessions list rather than a direct URL or bookmark. If the problem persists, the session record may be corrupted — contact support. Some runs are missing from a session. Check the upload success screen — timeseries warnings don't remove runs, they only affect orientation data. If core runs are missing, they weren't in the file. The firmware didn't record them, and upload can't create data that doesn't exist. Data Reaction times show as thousands of milliseconds. The firmware is writing reaction time in milliseconds instead of seconds, then the upload system multiplies by 1000 again. This is a firmware bug. Update the firmware and re-upload. Speed shows as N/A or is clearly wrong. The firmware flagged those analytics as unreliable — high bias correction, insufficient data, or sensor error. Speed gets suppressed rather than showing numbers that can't be trusted. Reaction time and G-force still work. See the Session chapter for what the bias correction value tells you. Power shows N/A. Both rider weight and bike weight need to be set in your profile. One without the other isn't enough. Set both, then refresh the session page. G-force chart has spikes or jumps. Usually sensor noise, a device movement during the run, or an SD card write error creating gaps. If a run looks clearly corrupt, archive it — it won't help your analytics and it can set false personal bests on the dashboard. Account Can't log in despite correct password. Try copy-pasting rather than typing. Try a different browser. Clear cache and cookies. Use "Forgot password" if you're not certain the password is right. Keeps logging you out. Session tokens expire after about 30 days. Log back in — your data is safe. If it's happening much more frequently, check whether your browser is blocking cookies. Settings won't save. The platform doesn't auto-save. Make sure you're clicking Save and watching for error messages. If saves consistently fail, try a different browser. Performance Platform is slow. Large sessions with full timeseries data take longer to process and render. Charts in particular are GPU-dependent — older or lower-powered devices will struggle. Try on a desktop or laptop if you're on mobile. Closing other browser tabs helps. Upload times out. Session files with many runs and full timeseries can be several megabytes and take 20–30 seconds on a slow connecti`,
  },
];

export const chapterMap = new Map(chapters.map(c => [c.slug, c]));

export const slugs = chapters.map(c => c.slug);

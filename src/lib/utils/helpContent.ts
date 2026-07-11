/**
 * helpContent.ts
 *
 * Contextual help content for each analytics section.
 * Three audience levels per section:
 *   grom    — young rider or parent, plain language
 *   club    — club-level rider, some technical context
 *   elite   — elite rider or coach, full methodology
 *
 * Content is deliberately non-prescriptive — it explains what the
 * data means and what questions it raises, not what training to do.
 */

export type HelpLevel = 'grom' | 'club' | 'elite';

export interface HelpContent {
	title: string;
	description: string; // one-line summary shown in the button tooltip
	levels: Record<
		HelpLevel,
		{
			heading: string;
			body: string;
			callout?: string; // optional "worth knowing" box
			thresholds?: { label: string; value: string; color: string }[];
		}
	>;
}

export const HELP_CONTENT: Record<string, HelpContent> = {
	reactionTime: {
		title: 'Reaction Time',
		description: 'Time from the last gate light to your first movement',
		levels: {
			grom: {
				heading: 'What is reaction time?',
				body: `This is how quickly you move after the gate drops. It's measured from the moment the last light comes on to when the sensor first detects you moving forward.\n\nA shorter number means you reacted faster — that's the goal. Don't worry too much about exact numbers when you're starting out. Focus on being ready and relaxed on the gate, not tense.`,
				callout: `Even the best riders in the world don't react "instantly" — typical times are between 0.2 and 0.5 seconds. Your body physically can't react faster than about 0.15 seconds no matter how hard you try.`
			},
			club: {
				heading: 'How reaction time is measured',
				body: `Reaction time is the interval between the final UCI gate signal and the first detected forward acceleration from the IMU sensor. It includes both your neural processing time (hearing/seeing the signal) and your physical response time (actually moving).\n\nConsistency matters as much as raw speed. A rider who consistently hits 0.38s is in a stronger race position than one who alternates between 0.28s and 0.52s — the latter can't predict where they'll be at the first berm.`,
				callout: `The AppGatePro system uses a UCI-compliant random start sequence. The lamp gap compensation is tuned to match the hardware speaker latency so times are comparable to official timing systems.`,
				thresholds: [
					{ label: 'Elite', value: '< 0.35s', color: '#3de8c8' },
					{ label: 'Competitive', value: '< 0.45s', color: '#f5a623' },
					{ label: 'Developing', value: '< 0.55s', color: '#ffcc44' },
					{ label: 'Focus area', value: '> 0.55s', color: '#ff4444' }
				]
			},
			elite: {
				heading: 'Reaction time — methodology and interpretation',
				body: `Reaction time is computed as the delta between the final lamp signal timestamp and the first sample where forward acceleration exceeds the bias-corrected baseline by a defined threshold.\n\nTwo components make up the measured value: afferent processing time (signal → conscious awareness, typically 100–150ms) and efferent motor time (conscious decision → muscle activation → measurable movement, typically 100–200ms). Training can compress both, but the afferent floor is physiological.\n\nFor coaching analysis, the coefficient of variation (CV%) is more diagnostic than the mean. A CV below 3% across a session indicates a stable pre-motor state — the rider is achieving consistent arousal and readiness. CV above 8% suggests variable preparation, attention, or anticipatory timing strategy.\n\nCorrelating reaction time with subsequent peak G-force is also informative. A negative correlation (quicker reaction → higher G) is the expected pattern in a well-trained gate start. A positive correlation suggests the rider may be compromising drive phase setup in pursuit of reaction speed.`,
				callout: `The Quickness Correlation panel in Analytics shows this relationship across all your sessions automatically.`,
				thresholds: [
					{ label: 'Elite threshold', value: '< 0.320s', color: '#3de8c8' },
					{ label: 'National level', value: '0.320–0.380s', color: '#3de8c8' },
					{ label: 'Regional competitive', value: '0.380–0.450s', color: '#f5a623' },
					{ label: 'Development target', value: '0.450–0.550s', color: '#ffcc44' }
				]
			}
		}
	},

	gForce: {
		title: 'G-Force',
		description: 'Peak acceleration force measured during your gate start',
		levels: {
			grom: {
				heading: 'What does G-force mean?',
				body: `G-force measures how hard you're pushing — basically how explosively you start. 1G is just your own body weight. When you blast out of the gate and really drive your bike forward, the sensor picks up much more than 1G.\n\nHigher numbers generally mean a more explosive start. But it's not just about peak power — when you generate that force and how long you can sustain it matters too.`,
				callout: `Fighter pilots experience around 9G in tight turns. Formula 1 drivers hit 5G under braking. A good BMX gate start might see 2–3G. You're already doing something pretty impressive.`
			},
			club: {
				heading: 'How G-force relates to your start',
				body: `The sensor measures total acceleration in all directions combined. At rest it reads approximately 1G (gravity). During a gate start, the rider leans forward at 30–45 degrees and drives hard, so the forward propulsive component adds to the gravity reading.\n\nPeak G is a proxy for explosive power output at the gate. It typically occurs in the first 30% of the run during the drive phase. Where in the run your peak occurs — and how quickly you reach it — tells you about the character of your start.\n\nAn early, sharp peak suggests an explosive drive-phase start. A slower rise to a lower peak might indicate a technique issue in the first pedal stroke or timing of weight transfer.`,
				thresholds: [
					{ label: 'Very explosive', value: '> 2.5G', color: '#3de8c8' },
					{ label: 'Strong', value: '2.0–2.5G', color: '#f5a623' },
					{ label: 'Developing', value: '1.5–2.0G', color: '#ffcc44' },
					{ label: 'Focus area', value: '< 1.5G', color: '#ff4444' }
				]
			},
			elite: {
				heading: 'G-force measurement and interpretation',
				body: `The BMI270 accelerometer is hardcoded at ±2G range, providing 16384 LSB/G resolution. The sensor measures the total acceleration vector including the gravity component (~1G at rest). Net forward propulsive acceleration is estimated by subtracting the gravity baseline and applying a forward efficiency factor derived from typical rider lean angle during a gate start.\n\nPeak G and the time-to-peak-G are both analytically useful. Peak G reflects maximum instantaneous force output. Time-to-peak-G (the acceleration phase metric) reflects how quickly that force is mobilised — elite riders typically reach peak within the first 40–55% of elapsed time.\n\nThe G-force curve shape is also informative. A sharp, narrow peak suggests ballistic first-stroke effort. A broader, sustained curve suggests better sustained drive but potentially less explosive initiation. Neither is universally better — track geometry and race format determine which profile is advantageous.\n\nNote that G-force values should always be interpreted in context of rider mass. The power estimation panel converts G-force to estimated wattage using rider + bike mass for cross-rider comparability.`,
				callout: `G-force values above ~4.2G on this hardware indicate potential sensor noise or data quality issues given the ±2G sensor range. The upload validator will flag these.`
			}
		}
	},

	consistency: {
		title: 'Consistency (CV%)',
		description: 'How repeatable your reaction times are across a session',
		levels: {
			grom: {
				heading: 'What is consistency?',
				body: `Consistency measures whether your reaction times are roughly the same every run, or whether they jump around a lot.\n\nIf your times are 0.32s, 0.33s, 0.31s, 0.34s — that's very consistent, and the number will be low (which is good). If they're 0.28s, 0.51s, 0.35s, 0.44s — that's inconsistent and the number will be higher.\n\nBeing consistent usually matters more than having one amazing run. In a race you can't choose which run you're having — so the closer they all are, the better.`,
				callout: `Think of it like a dartboard. You'd rather throw consistently in the same spot (even if it's not the bullseye) than have one perfect throw and three way off target.`
			},
			club: {
				heading: 'Coefficient of Variation (CV%)',
				body: `Consistency is measured using the Coefficient of Variation — the standard deviation of your reaction times expressed as a percentage of the mean. A lower CV% means your times cluster more tightly together.\n\nWithin-session consistency reflects your ability to reproduce the same mental and physical preparation state run after run. It's affected by fatigue, focus, anticipatory timing strategy, and physical arousal levels.\n\nA session with good consistency but a slow mean suggests the process is sound but needs refinement. A fast mean with poor consistency suggests occasional peak performance but unreliable delivery — race performance will be closer to the average than the best.`,
				thresholds: [
					{ label: 'Outstanding', value: 'CV < 2%', color: '#3de8c8' },
					{ label: 'Good', value: 'CV 2–5%', color: '#f5a623' },
					{ label: 'Variable', value: 'CV 5–8%', color: '#ffcc44' },
					{ label: 'Inconsistent', value: 'CV > 8%', color: '#ff4444' }
				]
			},
			elite: {
				heading: 'CV% methodology and coaching applications',
				body: `CV% = (σ / μ) × 100 where σ is the standard deviation and μ is the mean of reaction times within a session. AppGatePro computes this per-session and tracks it longitudinally.\n\nFor coaching analysis, within-session CV% should be examined alongside session position (does consistency degrade through a session, indicating fatigue?) and correlated with contextual factors like track surface, temperature, or competition vs training environment.\n\nAcross-session CV% trend is a useful indicator of long-term mental skills development — specifically the ability to reliably enter the optimal pre-performance state. A rider whose within-session CV% is decreasing over months of training is developing a more robust pre-motor routine regardless of whether their mean reaction time is improving.\n\nNote that extremely low CV% (< 1%) combined with suspiciously consistent sub-threshold times warrants investigation for anticipatory timing — some riders learn to "read" random sequences and break from pre-movement before the final signal.`,
				callout: `The longitudinal consistency chart in Analytics shows CV% per session over time. Look for step-changes that might correspond to changes in training environment or preparation routine.`
			}
		}
	},

	phaseAnalysis: {
		title: 'Phase Analysis',
		description: 'How your gate start breaks down into distinct movement phases',
		levels: {
			grom: {
				heading: 'What are the phases of a gate start?',
				body: `A gate start isn't one smooth movement — it has distinct parts. The system breaks your start into three phases:\n\n**Reaction phase** — from the gate signal to your first movement.\n\n**Drive phase** — where you push hardest and accelerate most. This is where most of your power goes.\n\n**Transition phase** — as you move away from the gate and start to settle into your sprint position.\n\nKnowing which phase takes the most time helps you understand where your start comes from and what might be worth working on.`
			},
			club: {
				heading: 'Phase detection methodology',
				body: `Phase boundaries are detected automatically from the acceleration signal:\n\n**Reaction phase** ends when forward acceleration first exceeds the bias-corrected baseline threshold — this marks conscious movement onset.\n\n**Drive phase** is the interval between movement onset and peak acceleration — the period of maximum force application. The character of this phase (explosive vs. sustained) distinguishes different start styles.\n\n**Transition phase** covers peak acceleration to the end of the recorded run — acceleration is still positive but decreasing as resistance builds and the rider moves into sprint position.\n\nThe ratio of drive phase to total elapsed time is a useful metric. Elite riders typically reach peak in 40–55% of elapsed time. Reaching peak very early (< 35%) may indicate maximum effort applied too soon. Very late peaks (> 65%) suggest a delayed or technique-limited drive phase.`
			},
			elite: {
				heading: 'Phase analysis — signal processing and interpretation',
				body: `Phase boundaries are identified through first and second derivative analysis of the IMU acceleration signal at 200Hz after bias correction.\n\nReaction onset is defined as the first sample where dA/dt exceeds a hysteresis threshold above the resting baseline, with a minimum hold duration to avoid noise false-positives.\n\nPeak acceleration is identified as the global maximum of the smoothed acceleration signal within the run window.\n\nFor biomechanical analysis, the key coaching metrics derived from phase data are:\n\n- **Time-to-peak (acceleration phase)** — absolute duration of the drive phase in seconds\n- **Drive phase fraction** — drive phase / total elapsed time × 100\n- **Peak G timing** — what percentage of the run's total distance has been covered when peak G is reached\n- **Jerk (rate of change of acceleration)** — the derivative of the G-force curve; high jerk = explosive ballistic start; lower jerk = more controlled force application\n\nThe Jerk Index in the session detail view shows normalised jerk across the run. A sharp spike early with rapid falloff is characteristic of an explosive first-stroke start. Distributed jerk suggests more sustained multi-stroke drive.`,
				callout: `Phase analysis requires at least 15 chart data samples per run at 200Hz for reliable boundary detection. Shorter runs may show phase data but with wider uncertainty margins.`
			}
		}
	},

	speedAnalysis: {
		title: 'Speed & Distance',
		description: 'Estimated velocity and distance from IMU integration',
		levels: {
			grom: {
				heading: 'How fast were you going?',
				body: `The system estimates your speed by doing some maths with the acceleration data — basically, if you know how hard you were accelerating and for how long, you can work backwards to estimate how fast you were going.\n\nThis is an estimate, not a laser measurement. The numbers will be in the right ballpark but they're not as precise as a proper speed trap at a race. They're useful for comparing runs against each other and tracking progress over time.`,
				callout: `⚠️ Speed numbers are estimated from the movement sensor. They're shown with a warning symbol so you always know. Once breakbeam sensors are added to the system, precise measured speeds will replace these estimates.`
			},
			club: {
				heading: 'IMU-based speed estimation',
				body: `Speed is computed by numerically integrating the bias-corrected acceleration signal over time: v(t) = v(0) + ∫a(t)dt. Distance is a second integration: s(t) = ∫v(t)dt.\n\nThe critical limitation is integration drift — any small bias in the acceleration signal compounds over time, causing the velocity estimate to diverge from reality. AppGatePro applies a bias correction using the resting baseline of each run to minimise this, and caps integrated velocity at a physically plausible ceiling for a BMX gate start (approximately 72 km/h over the measurement window).\n\nThe result is most reliable for comparing runs within a session (relative comparisons) rather than absolute speed values. Speed trends across sessions should be interpreted with the same caution.`,
				thresholds: [
					{ label: 'High confidence', value: 'Data quality: Excellent/Good', color: '#3de8c8' },
					{ label: 'Usable', value: 'Data quality: Fair', color: '#f5a623' },
					{ label: 'Low confidence', value: 'Data quality: Poor', color: '#ff4444' }
				],
				callout: `The Data Quality indicator on each run reflects the bias correction quality. Sessions with consistent sensor placement and orientation produce better estimates.`
			},
			elite: {
				heading: 'Speed estimation — methodology, limitations and planned improvement',
				body: `**Current method:** Forward velocity is estimated via trapezoidal numerical integration of the bias-corrected IMU acceleration at 200Hz. Bias is estimated from the mean of the first N samples before movement onset (resting baseline). The net forward acceleration component is derived from the total acceleration vector by subtracting the gravity baseline (~1G) and applying a forward efficiency factor based on typical rider lean angle.\n\nKnown error sources:\n- Gravity component estimation assumes fixed lean angle; actual lean angle varies through the start\n- Sensor axis misalignment from mount positioning\n- Integration drift accumulates even with bias correction\n- No zero-velocity update (ZUPT) correction between runs\n\n**Planned improvement:** Breakbeam sensor integration will provide discrete velocity measurements at known distances, enabling velocity calibration checkpoints that dramatically improve integration accuracy. The infrastructure for this is already present in the firmware and data pipeline.\n\n**For current use:** Speed data is reliable for within-session relative comparisons and directional trend analysis across sessions. Absolute values should be treated as estimates with ±15–25% uncertainty. The speed distribution heatmap in Analytics is a useful tool for this — the distribution shape and centre are informative even if the absolute values carry uncertainty.`
			}
		}
	},

	techniqueScore: {
		title: 'Technique Score',
		description: 'A composite score rating the quality of your gate start',
		levels: {
			grom: {
				heading: 'What is the technique score?',
				body: `The technique score gives you a single number out of 100 to summarise how well your gate start went. It looks at four things:\n\n• **Reaction** — how quickly you responded\n• **Explosiveness** — how much of your power came in the first part of the start\n• **Smoothness** — how steadily you applied force (without big spikes and dips)\n• **Efficiency** — how well your speed built up compared to the ideal\n\nA higher score is better, but it's most useful for comparing your own runs against each other rather than worrying about hitting a specific number.`
			},
			club: {
				heading: 'How the technique score is calculated',
				body: `The technique score is a weighted composite of four components:\n\n**Reaction (30%)** — Benchmarked against a target for your rider level. A reaction at or below the benchmark scores 100; it scales down proportionally above.\n\n**Explosiveness (25%)** — The ratio of peak G achieved in the first 30% of the run to the peak G across the whole run. High explosiveness means you front-load your effort.\n\n**Smoothness (25%)** — Inverse of normalised jerk (rate of change of acceleration). High smoothness means consistent force application without sharp spikes. Note: this rewards a different pattern than explosiveness — the two are somewhat in tension.\n\n**Efficiency (20%)** — The ratio of the area under the actual speed curve (to peak speed) versus the ideal triangular area. Higher efficiency means speed built up closer to the theoretical ideal linear acceleration.`,
				callout: `The score components are shown individually in the breakdown panel. If your overall score is lower than expected, check which component is dragging it down.`,
				thresholds: [
					{ label: 'Excellent', value: '> 80', color: '#3de8c8' },
					{ label: 'Good', value: '65–80', color: '#f5a623' },
					{ label: 'Fair', value: '50–65', color: '#ffcc44' },
					{ label: 'Developing', value: '< 50', color: '#ff4444' }
				]
			},
			elite: {
				heading: 'Technique score — weighting rationale and coaching use',
				body: `The composite score uses fixed weights: Reaction 0.30, Explosiveness 0.25, Smoothness 0.25, Efficiency 0.20. These reflect the relative importance of each component in gate start outcomes based on biomechanics literature and empirical observations from elite BMX racing.\n\nFor coaching use, the individual components are more diagnostically useful than the composite score. Common profiles:\n\n**High explosiveness + low smoothness** — Ballistic start style. Fast first stroke, potentially erratic force application through the drive phase. Common in riders with good strength but less refined technique.\n\n**High smoothness + low explosiveness** — Controlled but underpowered start. Force is well-distributed but peak magnitude is low. Often associated with riders prioritising technique over power, or those who haven't yet developed the strength base.\n\n**High efficiency + low reaction** — The rider builds up to speed well but starts late. The drive phase mechanics are sound — the bottleneck is pre-motor preparation.\n\nThe score benchmarks are calibrated against the rider's self-declared level in their profile (novice/intermediate/expert/elite). Reaction benchmarks adjust accordingly; power metrics do not.`
			}
		}
	},

	powerEstimate: {
		title: 'Power Output',
		description: 'Estimated mechanical power during your gate start (requires rider mass)',
		levels: {
			grom: {
				heading: 'What is power output?',
				body: `Power output is an estimate of how much physical work you're doing during the gate start. It's measured in watts — the same unit as a light bulb or an electric motor.\n\nThink of it as "how hard are you working?" rather than just "how fast are you going." A bigger rider generating the same speed as a smaller rider is doing more work.\n\nThese numbers are estimated from the sensor data and your body + bike weight, so treat them as a rough guide rather than exact figures.`,
				callout: `⚠️ Power figures are estimated from IMU data and body mass. They're useful for tracking your own progress over time but not for comparing directly against other riders or published benchmarks.`
			},
			club: {
				heading: 'Power estimation methodology',
				body: `Mechanical power is estimated as P = F × v, where:\n- F (force) = mass × forward acceleration = (rider mass + bike mass) × net forward acceleration\n- v = estimated velocity from IMU integration\n\nNet forward acceleration is derived from the total G-force reading by subtracting the gravity baseline (~1G) and applying a forward efficiency factor to account for the rider's lean angle.\n\nRequires accurate rider mass and bike mass in the profile. Update these in Settings → Profile for best results.\n\nPeak power during a gate start is typically generated in the drive phase (first 30–50% of elapsed time). Average power across the full run is a lower figure.`,
				callout: `Power values above ~2500W or below 50W likely indicate data quality issues and should be treated with caution.`
			},
			elite: {
				heading: 'Power estimation — formula, assumptions and validation status',
				body: `**Formula:** P(t) = m_total × a_forward(t) × v(t)\n\nwhere:\n- m_total = rider mass + bike mass (from profile)\n- a_forward = max(0, G_total - 1.0) × 9.80665 × 0.3 (forward efficiency factor)\n- v(t) = IMU-integrated velocity\n\n**Key assumptions and limitations:**\n1. Forward efficiency factor (0.3) is an approximation based on typical 30–45° lean angle. Actual efficiency varies by rider position and phase.\n2. Velocity estimate carries IMU integration uncertainty (see Speed methodology)\n3. No air resistance term — resistance is assumed negligible for the short gate start window\n4. Gravity baseline subtraction assumes sensor is reasonably aligned with gravity axis\n\n**Validation status:** Unvalidated against ground-truth power measurement (e.g. crank power meter or force plate). Values should be treated as relative indicators rather than absolute physiological power output. The shape of the power curve and the relative power across runs is more informative than the absolute peak value.\n\nValidation against real device data at known distances is planned once hardware beta testing begins. Current values are confirmed to be in a physiologically plausible range (400–900W peak for trained adult BMX riders) with the corrected formula.`
			}
		}
	},

	sessionConsistency: {
		title: 'Session Consistency Trend',
		description: 'How your run-to-run consistency changes across sessions over time',
		levels: {
			grom: {
				heading: 'Getting more consistent over time',
				body: `This chart shows whether your runs are getting more similar to each other as time goes on. If the bars are getting shorter and greener over time, that's a great sign — it means your gate start is becoming more reliable.\n\nEven if your best times aren't improving, becoming more consistent is real progress. It means you're building a solid technique foundation.`
			},
			club: {
				heading: 'Longitudinal consistency analysis',
				body: `The consistency chart shows per-session CV% over time. This is one of the more sensitive long-term indicators of mental skills and pre-performance routine quality.\n\nA general downward trend in CV% over months indicates growing reliability in achieving the optimal pre-motor state — even if mean reaction times aren't decreasing at the same rate.\n\nLook for step-changes — sudden increases in CV% that persist can indicate changes in training environment, competition stress, or equipment. Sudden decreases often follow deliberate work on pre-performance preparation.`
			},
			elite: {
				heading: 'CV% longitudinal analysis for coaching',
				body: `Within-session CV% as a longitudinal metric reflects the stability of the pre-motor state across the training cycle. It is sensitive to:\n\n- **Mental skills development** — athletes with strong pre-performance routines show consistently low CV%\n- **Fatigue** — CV% often increases late in a training cycle before a rest period\n- **Environmental stressors** — new tracks, competition settings, or supervision changes frequently show in CV% before they appear in mean performance\n- **Anticipatory learning** — CV% can drop artifactually if the rider is timing the random sequence rather than reacting; this is worth monitoring if CV% drops below 1%\n\nFor periodisation planning, tracking the rolling average of CV% across a mesocycle is more informative than single-session values. An athlete should show decreasing CV% through the preparation phase and stable, low CV% into the competition phase.`,
				callout: `The consistency chart in Analytics colour-codes sessions: teal < 2%, amber 2–5%, red 5%+.`
			}
		}
	},

	quicknessCorrelation: {
		title: 'Quickness Correlation',
		description: 'Whether your fastest reactions also produce the most explosive starts',
		levels: {
			grom: {
				heading: 'Are your best reactions also your best starts?',
				body: `This section looks at whether the runs where you reacted fastest were also the runs where you pushed hardest.\n\nIdeally, both happen together — you react quickly AND you explode out of the gate powerfully. If they're happening separately (your quickest reactions are weak starts, or your strongest starts are slow reactions), that's useful information about where to focus.`
			},
			club: {
				heading: 'Reaction-power correlation',
				body: `The quickness correlation shows the Pearson correlation coefficient between reaction time and peak G-force across all runs.\n\nA negative correlation (r < −0.4) is the ideal pattern — quicker reactions are associated with more explosive starts. This suggests the rider's arousal and preparation state affects both components simultaneously.\n\nA positive correlation (r > 0.4) is unusual and suggests the rider may be compromising their drive phase setup to optimise reaction time, or experiencing fatigue effects where quick reactions precede tired push-offs.\n\nNo strong correlation (|r| < 0.4) indicates the two components are independently variable — there may be room to align them through a more unified preparation approach.`,
				thresholds: [
					{ label: 'Ideal pattern', value: 'r < −0.4', color: '#3de8c8' },
					{ label: 'No strong link', value: '−0.4 to +0.4', color: '#f5a623' },
					{ label: 'Possible compensation', value: 'r > +0.4', color: '#ff4444' }
				]
			},
			elite: {
				heading: 'Pearson correlation — interpretation for performance coaching',
				body: `The Pearson r between reaction time and peak G-force across all valid runs is computed as:\n\nr = Σ[(rt_i − rt̄)(G_i − Ḡ)] / (σ_rt × σ_G × n)\n\nInterpretation in the context of gate start biomechanics:\n\nThe correlation reflects whether the rider's pre-activation state (arousal, focus, muscular readiness) is being modulated consistently across both reaction and drive components. A unified preparation state should produce negative correlation — both components improve or degrade together.\n\nFor coaching intervention, the "same run" case (best reaction AND best G-force on the same run) is the clearest indicator of successful preparation. Tracking how frequently this coincidence occurs across a session provides a non-parametric measure of preparation consistency.\n\nNote: correlation is only meaningful with sufficient runs (n ≥ 10). With fewer runs, treat the directional pattern as provisional.`
			}
		}
	},

	reactionTrend: {
		title: 'Reaction Time Trend',
		description: 'How your reaction times are changing session by session',
		levels: {
			grom: {
				heading: 'Are you getting faster over time?',
				body: `This chart shows your best and average reaction times for each session you've done. If the lines are going down (remember — lower is faster for reaction time), you're improving.\n\nDon't worry if it bounces around a bit. Some days are better than others. Look for the overall direction over weeks and months rather than session to session.`
			},
			club: {
				heading: 'Tracking reaction time progress',
				body: `The trend chart plots both best and average reaction times per session. The Y-axis is reversed so improvements appear as upward trends visually.\n\nThe average line is usually more informative than best times alone — it's less affected by lucky runs and shows your typical performance level. A narrowing gap between best and average indicates improving consistency as well as speed.\n\nLook for plateaus or regressions as signals to adjust training stimulus. Sustained improvement requires progressive challenge — if your times plateau, consider whether the training environment still provides sufficient pressure.`
			},
			elite: {
				heading: 'Longitudinal reaction time analysis',
				body: `Session-level reaction time trends should be interpreted within the context of the training cycle. Key patterns:\n\n**Progressive improvement** — steady decrease in both best and mean times indicates effective stimulus and adaptation. Look for 3–5% improvement per mesocycle (4–6 weeks).\n\n**Plateau** — stable times across sessions. May indicate adaptation ceiling, insufficient training stimulus, or the need for a different intervention (e.g., mental skills work if physical capacity is not limiting).\n\n**Regression** — increasing times may indicate accumulated fatigue, competition stress, or technical regression. Differentiate between short-term variance (1–2 sessions) and sustained trends (3+ sessions).\n\nThe best vs average gap is diagnostically useful. A widening gap suggests increasing variance — the rider can occasionally access peak performance but can't sustain it. This often points to inconsistent pre-performance preparation.`,
				callout: `Combine with the Consistency trend chart to separate reaction speed improvements from reliability improvements.`
			}
		}
	},

	speedTrend: {
		title: 'Peak Speed Trend',
		description: 'How your estimated peak speeds are changing across sessions',
		levels: {
			grom: {
				heading: 'Are you getting faster?',
				body: `This chart shows the fastest speed you hit in each training session. Higher numbers mean you're building up speed faster from the gate.\n\nRemember these are estimates from the sensor, not exact measurements. Use them to compare your own runs against each other, not against other riders.`,
				callout: `⚠️ Speed values are estimated from IMU data. Once breakbeam sensors are added to the hardware, you'll get precise measured speeds instead.`
			},
			club: {
				heading: 'IMU-based speed trends',
				body: `Peak speed per session is tracked over time. These are estimates from IMU integration, not direct measurements, so treat absolute values with caution.\n\nThe trend direction and relative changes are informative even if absolute values carry uncertainty. A sustained upward trend indicates improving acceleration capability.\n\nSpeed improvements can come from better technique (more efficient force application), increased power output, or both. Cross-reference with the G-force trend to distinguish power gains from technique refinements.`,
				callout: `Speed estimates are most reliable for within-session comparisons. Cross-session trends show the direction but the magnitude may be affected by sensor placement consistency.`
			},
			elite: {
				heading: 'Speed trend analysis and limitations',
				body: `Peak speed values are derived from IMU integration of forward acceleration. Known limitations include integration drift, gravity baseline estimation errors, and sensor mounting position variance.\n\nFor coaching use, focus on the trend direction rather than absolute magnitudes. Velocity improvements correlated with increased peak G-force suggest power gains. Velocity improvements without corresponding G-force increases suggest technique improvements (more efficient force application or better positioning).\n\nThe speed distribution heatmap in Advanced Analytics shows the shape of the speed distribution across all runs — this is more robust than peak values for identifying genuine performance shifts.`,
				callout: `Planned hardware addition of breakbeam sensors will provide velocity ground truth at fixed distances, dramatically improving speed estimation accuracy.`
			}
		}
	},

	bestVsAvgGap: {
		title: 'Best vs Average Gap',
		description: 'How close your average performance is to your best within each session',
		levels: {
			grom: {
				heading: 'How consistent are you within a session?',
				body: `This chart shows the gap between your best run and your average run in each session. A smaller gap means most of your runs are close to your best — that's what you want.\n\nIf the gap is big, it means you had one or two great runs but the others weren't as good. Closing that gap makes your performance more reliable.`
			},
			club: {
				heading: 'Best vs average gap analysis',
				body: `The gap is calculated as: ((best − average) / best) × 100\n\nA gap below 5% indicates excellent within-session consistency — most runs are clustering near your peak capability. A gap above 15% suggests high variance — you can access peak performance but not reliably.\n\nThis metric is complementary to CV%. CV% measures how tightly runs cluster around the mean. Gap% measures how far the mean is from the ceiling. Both are needed to understand session quality.`,
				thresholds: [
					{ label: 'Excellent', value: '< 5%', color: '#3de8c8' },
					{ label: 'Good', value: '5–15%', color: '#f5a623' },
					{ label: 'Variable', value: '> 15%', color: '#ff4444' }
				]
			},
			elite: {
				heading: 'Gap metric — coaching applications',
				body: `Best-vs-average gap is a ceiling-referenced consistency metric. Unlike CV% (which is mean-referenced), gap% directly quantifies how much performance headroom exists between typical and peak output.\n\nCoaching interpretation patterns:\n\n**Narrowing gap over time** — the athlete is raising their floor, not just their ceiling. This is sustainable performance development.\n\n**Widening gap** — peak capability is increasing but typical performance is not keeping pace. May indicate the rider can occasionally access a higher performance state but hasn't yet consolidated the preparation routine to access it reliably.\n\n**Stable narrow gap** — indicates a well-trained, consistent performer. Further improvement requires raising the ceiling, not closing the gap.\n\nFor periodisation, gap% should narrow through a preparation phase as technique consolidates. In competition phases, accept slightly wider gaps as the athlete explores peak performance states.`
			}
		}
	},

	optimalSetLength: {
		title: 'Optimal Set Length',
		description: 'How many quality runs you can sustain before fatigue affects performance',
		levels: {
			grom: {
				heading: 'How many runs before you get tired?',
				body: `This shows how many runs you can do in a session before you start to slow down or get less consistent. Everyone has a limit — even pros.\n\nKnowing your number helps you train smarter. If you can do 8 good runs before fatigue kicks in, there's not much point doing 15 in a session — you're just practicing being tired.`
			},
			club: {
				heading: 'Optimal set length analysis',
				body: `Set length is determined by identifying the point in a session where performance (reaction time or consistency) begins to degrade sustainably.\n\nThe optimal set length is the number of runs you can complete before fatigue meaningfully affects output. Training beyond this point has diminishing returns — you're grooving tired technique rather than peak technique.\n\nTypical ranges: beginners 3–5 runs, club riders 5–8 runs, elite 8–12+ runs. Set length improves with training age and specific conditioning.`,
				thresholds: [
					{ label: 'Strong', value: '8+ runs', color: '#3de8c8' },
					{ label: 'Moderate', value: '5–7 runs', color: '#f5a623' },
					{ label: 'Developing', value: '< 5 runs', color: '#ffcc44' }
				]
			},
			elite: {
				heading: 'Set length detection and training volume planning',
				body: `Set length is computed per session by identifying the run number where performance begins sustained decline. The algorithm examines both reaction time degradation and CV% increase across the session.\n\nFor training volume planning: optimal set length defines the maximum productive training volume per session. Exceeding this systematically risks grooving compensatory movement patterns or degraded neuromuscular recruitment.\n\nSet length typically improves with:\n- Training age (neurological efficiency)\n- BMX-specific conditioning (local muscular endurance)\n- Improved bike setup (reduced parasitic energy losses)\n\nMonitor set length longitudinally as an indicator of fatigue resistance. Decreasing set length across a mesocycle may signal accumulated fatigue requiring a recovery intervention.`,
				callout: `For multi-day competitions, knowing your set length helps plan practice run allocation — use early runs for performance, not volume.`
			}
		}
	},

	dropOffPosition: {
		title: 'Drop-Off Position',
		description: 'Where in the session your performance typically starts to decline',
		levels: {
			grom: {
				heading: 'When do you start to fade?',
				body: `This shows which run number is usually when you start to slow down or get less consistent. It might be run 5, run 8, run 10 — everyone's different.\n\nIf the number is going up over time, that's great — it means you're building more stamina and can keep going for longer before fatigue hits.`
			},
			club: {
				heading: 'Fatigue onset tracking',
				body: `Drop-off position identifies the specific run number where performance degradation becomes detectable. This is typically 1–2 runs before set length ends.\n\nEarly drop-off (runs 3–5) suggests limited anaerobic capacity or technical inefficiency causing faster fatigue accumulation. Mid drop-off (runs 6–8) is typical for club-level riders. Late drop-off (runs 9+) indicates well-developed fatigue resistance.\n\nTrack this metric over months. Delaying drop-off position is a key training adaptation — it directly translates to more productive runs per session and better late-race performance when racing multiple rounds.`
			},
			elite: {
				heading: 'Drop-off run — fatigue profiling for periodisation',
				body: `Drop-off run number is detected per session using a moving window analysis of reaction time and CV%. The algorithm identifies the first run where performance exits a defined tolerance band around the session-best rolling average.\n\nFor periodisation: drop-off position is sensitive to cumulative training load. A declining trend (drop-off occurring earlier in sessions) over successive weeks is an early indicator of incomplete recovery between sessions. This often precedes overreaching symptoms.\n\nAthletes with very late drop-off (> run 12) may be under-loading their sessions — training volume should be planned to induce moderate fatigue by session end, not to avoid fatigue entirely.\n\nDrop-off profiling also informs competition strategy. Athletes who maintain performance deep into sessions have an advantage in multi-round formats where fatigue accumulates across the day.`
			}
		}
	},

	speedVsConsistency: {
		title: 'Speed vs Consistency Trade-Off',
		description: 'How peak speed and consistency relate across your sessions',
		levels: {
			grom: {
				heading: 'Fast and consistent — or one or the other?',
				body: `This chart shows whether you're getting faster AND more consistent at the same time, or whether one improves while the other gets worse.\n\nIdeally both lines should be moving in the right direction together — speed going up, consistency staying good (remember, lower CV% is better for consistency).`
			},
			club: {
				heading: 'Speed-consistency relationship',
				body: `The dual-axis chart plots peak speed and consistency (CV%) across sessions. Speed is on the left axis (higher = better). CV% is on the right axis, reversed (lower = better).\n\nCommon patterns:\n\n**Both improving** — speed increasing, CV% decreasing. Ideal development trajectory.\n\n**Speed improving, consistency degrading** — rider is pushing for peak performance at the cost of reliability. Common early in skill acquisition.\n\n**Consistency improving, speed plateauing** — technique consolidation phase. Performance ceiling is being reinforced even if it's not yet rising.`,
				callout: `The relationship between these metrics reveals your current training focus. Deliberately cycling between speed emphasis and consistency emphasis across mesocycles can be productive.`
			},
			elite: {
				heading: 'Speed-consistency coupling for long-term development',
				body: `The dual-axis speed vs CV% chart reveals the coupling between performance ceiling (peak speed) and performance floor (consistency).\n\n**Theoretical framework:** Skill acquisition theory predicts an initial trade-off (speed gains at consistency cost) followed by recoupling as the skill consolidates. Elite performers eventually show improvement in both dimensions simultaneously.\n\n**Coaching applications:**\n\nEarly training phase: accept higher CV% while exploring peak performance. The priority is discovering what the rider is capable of.\n\nMid training phase: consolidate gains by emphasising consistency while holding speed stable. CV% should decrease without speed regression.\n\nPre-competition phase: both metrics should be optimised — high speed with low CV%. If they're still trading off, the skill hasn't fully consolidated.\n\nMonitor for coupling breakdown under fatigue or competition stress — this signals areas requiring resilience training.`
			}
		}
	},

	sessionComparison: {
		title: 'Session Comparison',
		description: 'Direct side-by-side comparison of two training sessions',
		levels: {
			grom: {
				heading: 'How do two sessions compare?',
				body: `Pick any two of your sessions and see how they compare across all the key numbers — reaction times, speed, G-force, consistency, and how many runs you did.\n\nThe change column shows whether you improved (green up arrow) or went backwards (red down arrow) between the two sessions.`
			},
			club: {
				heading: 'Session-level comparison',
				body: `The comparison table lets you select any two sessions and compare all key performance metrics side-by-side.\n\nUseful comparisons:\n- **First vs latest session** — overall progress since starting\n- **Current vs peak session** — understanding gaps to your best performance\n- **Similar-weather sessions** — isolating technical improvement from environmental effects\n- **Pre/post intervention** — evaluating training or setup changes\n\nThe percentage change column shows whether each metric improved (green, lower = better for time-based metrics) or declined (red).`
			},
			elite: {
				heading: 'Comparative session analysis',
				body: `Session comparison enables controlled analysis of specific interventions or environmental factors.\n\n**Methodological uses:**\n\n**A/B testing equipment changes** — compare sessions immediately before and after a setup change to isolate its effect.\n\n**Environmental effect quantification** — compare sessions at different venues or weather conditions to understand sensitivity to external factors.\n\n**Training load assessment** — compare early-week vs late-week sessions to quantify within-week fatigue accumulation.\n\n**Skill retention testing** — compare sessions before and after a break from training to assess skill durability.\n\nFor valid comparisons, ensure both sessions have similar structure (run count, time of day, etc.) to minimize confounding variables.`
			}
		}
	},

	rollingAnalytics: {
		title: 'Rolling Analytics',
		description: 'How your last 5 sessions compare to the previous 5',
		levels: {
			grom: {
				heading: 'Are you improving lately?',
				body: `This compares your most recent 5 sessions to the 5 before that, so you can see if you're getting better, staying the same, or going backwards.\n\nIt's a quick way to check if your training is working without having to look at every single session.`
			},
			club: {
				heading: 'Rolling window analysis',
				body: `Rolling analytics compares the average of your last 5 sessions against the previous 5. This smooths out single-session variance and reveals genuine trends.\n\nA green upward arrow means recent performance is better than the preceding period — training stimulus is producing positive adaptation. A red downward arrow suggests plateau or regression — may indicate fatigue accumulation, inadequate recovery, or the need for a training stimulus change.\n\nThis unlocks at 10 sessions and updates automatically as you add more data.`
			},
			elite: {
				heading: 'Rolling window trend detection',
				body: `The rolling 5-session window average provides a noise-filtered view of performance trends. It's more responsive than whole-dataset averages but more stable than single-session values.\n\n**Statistical rationale:** A 5-session window provides sufficient data points for meaningful averaging while remaining sensitive to recent changes. The comparison to the preceding 5-session window provides a local gradient estimate.\n\n**Applications:**\n\n**Mesocycle evaluation** — assess whether a 4–6 week training block produced measurable improvement.\n\n**Taper verification** — confirm that performance is rising into a competition phase.\n\n**Fatigue monitoring** — detect performance decline that might indicate overreaching.\n\nFor interpretation, a change > 3% between windows is typically meaningful. Smaller changes may be noise.`
			}
		}
	},

	performanceEngine: {
		title: 'Performance Engine',
		description: 'AI-powered analysis that adapts to your experience level',
		levels: {
			grom: {
				heading: 'What is the Performance Engine?',
				body: `The Performance Engine is like having a coach look at your gate start and explain what happened in a way that makes sense for you.\n\nIt looks at all your numbers — reaction time, speed, power, smoothness — and tells you the most important things in plain language. As you get more experienced, you can turn up the detail level to see more technical information.`,
				callout: `The Performance Engine uses the same sensor data as the rest of the app, but it's smarter about explaining what it means and what to focus on.`
			},
			club: {
				heading: 'Intelligent analysis system',
				body: `The Performance Engine is an advanced analytics module that processes your raw sensor data through physics-based algorithms and generates audience-appropriate insights.\n\nUnlike the traditional metrics sections (which show raw numbers), the Performance Engine interprets patterns, identifies strengths and weaknesses, and provides prioritized recommendations. It adapts to four detail levels (Grom, Rider, Elite, Coach) to match your technical background.\n\nThe engine validates data quality, detects calibration issues, and adjusts its output accordingly — so you always know when to trust the numbers.`,
				callout: `At Elite and Coach detail levels, you unlock advanced charts showing acceleration, speed, jerk, impulse, and power curves.`
			},
			elite: {
				heading: 'Performance Engine — architecture and methodology',
				body: `The Performance Engine is a modular physics analysis system that transforms raw IMU data into structured insights through a multi-stage pipeline:\n\n**Stage 1: Physics Analysis** — Computes acceleration profiles, integrated velocity, jerk (rate of change of acceleration), impulse, phase boundaries, and estimated power output.\n\n**Stage 2: Validation** — Diagnostic checks flag outliers, calibration issues, and data quality problems that would compromise derived metrics.\n\n**Stage 3: Intelligence Layer** — Pattern recognition algorithms identify performance characteristics, compare against thresholds, and generate tone-tagged insights (positive/neutral/warning).\n\n**Stage 4: View Creation** — The analysis is rendered into an audience-appropriate view (grom/rider/elite/coach) with adaptive detail levels.\n\nAll formulas are documented in the codebase. The system is designed to be expanded — technique scoring, speed splits, and advanced phase analysis are being migrated from the legacy analytics system into the engine.`,
				callout: `The Performance Engine is the future of AppGatePro analytics — all features will eventually consolidate into this system.`
			}
		}
	},

	performanceEngineMetrics: {
		title: 'Performance Metrics',
		description: 'Key performance indicators from the engine analysis',
		levels: {
			grom: {
				heading: 'Understanding your metrics',
				body: `The Performance Engine shows you the most important numbers from your run — things like reaction time, peak speed, max power, and smoothness.\n\nThese numbers help you understand what you did well and what you might want to work on. Don't worry about memorizing exact values — focus on whether they're improving over time.`
			},
			club: {
				heading: 'How metrics are selected',
				body: `The Performance Engine selects which metrics to display based on data availability, quality, and your detail level setting.\n\nAt Grom and Rider levels, you see simplified core metrics. At Elite and Coach levels, you see physics-derived values like peak acceleration, jerk smoothness, and phase timing.\n\nMetrics marked with ⚠ are estimated or have quality warnings — still useful for comparison, but treat absolute values with caution.`
			},
			elite: {
				heading: 'Metric computation and reliability',
				body: `All displayed metrics pass through validation before rendering:\n\n**Direct measurements** (reaction time, G-force) — High confidence, sensor-limited accuracy.\n\n**Integrated values** (speed, distance) — Moderate confidence, affected by IMU drift and bias correction quality.\n\n**Derived values** (power, impulse) — Confidence dependent on profile completeness and calibration quality.\n\nThe engine flags unreliable metrics and provides diagnostic context at Coach level. Metrics outside physiologically plausible ranges are suppressed or marked accordingly.`
			}
		}
	},

	performanceEngineInsights: {
		title: 'Insights',
		description: 'AI-generated observations about your performance',
		levels: {
			grom: {
				heading: 'What are insights?',
				body: `Insights are observations the Performance Engine makes about your run — things it noticed that might be interesting or important.\n\nThey're color-coded: teal is good news, amber is neutral information, and red is something to pay attention to. Each insight explains what the data shows and why it matters.`
			},
			club: {
				heading: 'How insights are generated',
				body: `Insights are generated by pattern-matching algorithms that analyze your physics data against thresholds and expected ranges.\n\nEach insight has a tone (positive/neutral/warning) that reflects whether the pattern is beneficial, unremarkable, or concerning. The engine prioritizes the most relevant insights for your detail level — you won't see every possible observation unless you're at Coach level.\n\nInsights evolve as the engine learns more sophisticated patterns — the system improves over time.`
			},
			elite: {
				heading: 'Insight generation framework',
				body: `Insights are produced through a rules engine that evaluates physics characteristics against conditional thresholds:\n\n**Threshold comparison** — Is peak G above/below expected for rider level?\n\n**Pattern detection** — Is acceleration profile explosive or sustained?\n\n**Relationship analysis** — Does time-to-peak align with phase boundaries?\n\n**Quality assessment** — Are data artifacts present that affect interpretation?\n\nEach insight includes: title, body text, tone (positive/neutral/warning), and confidence level. The view layer filters insights by detail level and prioritizes by relevance.\n\nFuture versions will incorporate machine learning to identify rider-specific patterns that fixed rules might miss.`
			}
		}
	},

	performanceEngineActions: {
		title: 'Next Actions',
		description: 'Prioritized recommendations based on your performance',
		levels: {
			grom: {
				heading: 'What should I work on?',
				body: `The Next Actions list tells you what to focus on based on this run. They're in order of importance — start with #1.\n\nThese aren't training plans or drills — they're high-level focus areas. Talk to your coach about how to work on them specifically.`
			},
			club: {
				heading: 'Recommendation prioritization',
				body: `Next Actions are generated based on detected weaknesses, data quality issues, or opportunities for improvement. They're ordered by priority — the first action is the most impactful.\n\nThe engine avoids prescriptive training advice — it identifies focus areas, not specific drills. This is intentional: effective training requires coaching context that analytics can't provide.\n\nActions adapt to your profile completeness and data quality. If power analysis is blocked, the top action might be "Complete your profile."`
			},
			elite: {
				heading: 'Action generation logic',
				body: `Next Actions are produced through a priority-weighted recommendation system:\n\n**Priority 1: Data Quality** — Profile completion, calibration warnings\n\n**Priority 2: Critical Performance Gaps** — Reaction time >0.6s, peak G <1.5G, CV% >10%\n\n**Priority 3: Optimization Opportunities** — Technique refinement, phase timing, consistency improvement\n\nThe system generates candidate actions from insight patterns, then filters and ranks them based on impact potential. Actions that require prerequisite completion (e.g., "analyze power" requires profile data) are deprioritized until dependencies are met.\n\nFuture versions will incorporate session history to avoid repeating stale recommendations.`
			}
		}
	},

	techniqueScoreTrends: {
		title: 'Technique Score Trends',
		description: 'How your technique scores develop across multiple dimensions over time',
		levels: {
			grom: {
				heading: 'Tracking your technique improvements',
				body: `This chart shows how different parts of your gate start technique are improving (or changing) over time. Each colored line represents one aspect — like reaction timing, explosiveness, or smoothness.\n\nYou can click the buttons above the chart to hide or show different lines. This helps you focus on specific areas you're working on. Look for lines that go upward — that means you're getting better in that area.`,
				callout: `If one area isn't improving much, that might be where you need to focus your practice. Talk to your coach about it.`
			},
			club: {
				heading: 'Multi-dimensional technique development',
				body: `Technique scores are broken into dimensions: Overall, Launch Quality, Explosiveness, Speed Carry, Smoothness, Impulse Timing, and Repeatability. Each is scored 0–100 based on performance engine analysis.\n\nTracking these separately reveals which aspects of your start are progressing fastest and which need attention. A rising overall score with flat individual dimensions suggests balanced improvement. One dimension improving while others plateau indicates a specific area of focus.\n\nUse the toggle buttons to isolate dimensions you're actively training. Look for correlation — does improving explosiveness also lift launch quality?`,
				thresholds: [
					{ label: 'Excellent', value: '80+', color: '#3de8c8' },
					{ label: 'Good', value: '60–79', color: '#f5a623' },
					{ label: 'Developing', value: '40–59', color: '#ff6b3d' }
				]
			},
			elite: {
				heading: 'Dimensional technique analysis for coaching',
				body: `Each dimension isolates a specific biomechanical or timing characteristic:\n\n**Launch Quality** — Initial movement efficiency and positioning\n**Explosiveness** — Rate of force application in first 30% of run\n**Speed Carry** — Maintenance of velocity through the measured window\n**Smoothness** — Consistency of force application (inverse of jerk)\n**Impulse Timing** — Temporal distribution of force application\n**Repeatability** — Run-to-run consistency within the session\n\nFor periodisation: different training phases should show different dimensional priorities. Preparation phases emphasize smoothness and repeatability. Pre-competition phases should show rising explosiveness and launch quality.\n\nDimensions that improve together suggest coupled movement patterns. Dimensions that trade off (one rises, another falls) indicate technique modifications that haven't yet consolidated.`,
				callout: `Combine with the Strengths & Limiters Evolution chart to see which areas have shifted from limiters to strengths over time.`
			}
		}
	},

	diagnosticPatterns: {
		title: 'Recurring Diagnostic Patterns',
		description: 'Issues or observations that appear repeatedly across multiple sessions',
		levels: {
			grom: {
				heading: 'Patterns that keep showing up',
				body: `This shows issues or observations that have appeared in multiple training sessions. If something shows up a lot (like "3x" or "5x"), it means the system has noticed the same thing several times.\n\nGreen patterns (✅) are good things you're doing consistently. Orange/yellow (ℹ️) are things to be aware of. Red warnings (⚠️) are areas that need attention — especially if they keep coming back.`,
				callout: `If you see the same warning many times, it's worth asking your coach about it. Recurring problems need specific attention to fix.`
			},
			club: {
				heading: 'Pattern recognition across sessions',
				body: `The diagnostics system flags observations in each session. This panel aggregates them to show which patterns are persistent versus one-off occurrences.\n\nRecurring positive patterns (appearing in 60%+ of sessions) represent consolidated technique strengths. Recurring warnings indicate systematic issues that training hasn't yet addressed — these are high-priority intervention targets.\n\nThe "Last Seen" date shows recency. A warning that hasn't appeared in recent sessions may indicate successful correction. A warning appearing across consecutive recent sessions needs immediate attention.`
			},
			elite: {
				heading: 'Diagnostic pattern analysis for intervention planning',
				body: `This aggregates performance engine diagnostics across the last 10 sessions to identify systematic versus transient issues.\n\n**Persistent warnings** (appearing in 40%+ of sessions) indicate technical limiters that require structured intervention. Common examples: early wheelie pattern, inconsistent first-stroke timing, suboptimal drive phase positioning.\n\n**Resolved patterns** (appeared historically but not in recent 3 sessions) suggest successful adaptation from previous training focus.\n\n**Emerging patterns** (appearing only in recent sessions) may indicate regression under fatigue, setup changes, or new technical experiments that haven't consolidated.\n\nFor coaching: prioritize recurring warnings over frequency. A pattern appearing 3 times across 10 sessions with increasing recent frequency is more concerning than one appearing 5 times but not recently.`,
				callout: `Cross-reference with the Strengths & Limiters Evolution panel to confirm whether flagged issues are being addressed or persisting.`
			}
		}
	},

	strengthsLimitersEvolution: {
		title: 'Strengths & Limiters Evolution',
		description: 'How your strengths and areas for improvement change across training cycles',
		levels: {
			grom: {
				heading: "What you're good at and what needs work",
				body: `This breaks your performance into four categories:\n\n**Consistent Strengths** 💪 — Things you do well most of the time. These are your reliable skills.\n\n**Emerging Strengths** 🌱 — Things that are getting better recently. Keep working on these!\n\n**Resolved Issues** ✅ — Problems you used to have but don't anymore. Great progress!\n\n**Persistent Focus Areas** 🎯 — Things that keep needing attention across multiple sessions. These need specific work.`,
				callout: `Your consistent strengths are your foundation. Persistent focus areas are where the biggest gains can happen if you work on them deliberately.`
			},
			club: {
				heading: 'Longitudinal strength and limiter tracking',
				body: `The performance engine identifies strengths and limiters in each session. This panel tracks how those classifications change over time.\n\n**Consistent Strengths** appear in 60%+ of sessions — your reliable foundation. Build on these in competition.\n\n**Emerging Strengths** appear in recent sessions but weren't present early — evidence of successful training adaptation.\n\n**Resolved Limiters** appeared in early sessions but not recently — cleared issues that no longer constrain performance.\n\n**Persistent Limiters** appear repeatedly, including recent sessions — systematic constraints requiring targeted intervention.\n\nThis reveals whether training is successfully converting limiters to strengths or whether issues are persisting despite focus.`
			},
			elite: {
				heading: 'Strengths/limiters evolution for periodisation assessment',
				body: `This panel tracks the migration of performance characteristics across categories over training cycles. It answers: "Is training producing the intended adaptations?"\n\n**Evaluation criteria:**\n\n**Successful progression** — Limiters from early sessions migrate to resolved or emerging strengths. Consistent strengths remain stable.\n\n**Stalled development** — Limiters persist across multiple mesocycles without resolution. Indicates inadequate training stimulus or need for different intervention approach.\n\n**Regression patterns** — Previously consistent strengths disappear or migrate to limiters. May indicate overtraining, injury compensation, or technique modification that hasn't consolidated.\n\nFor coaching applications: compare this panel to training log to verify that resolved limiters correspond to specific training focuses, and persistent limiters receive intervention priority.`,
				callout: `Use this alongside the Technique Score Trends chart. A limiter that's flagged consistently should show in dropping scores in related dimensions.`
			}
		}
	},

	bestSessionAnalysis: {
		title: 'Best Session Analysis',
		description: 'Detailed breakdown of your highest-performing training session',
		levels: {
			grom: {
				heading: 'What made your best session great',
				body: `This shows your best session so far — the one where your overall score was highest. It tells you what you did well that day and what the conditions were.\n\nKnowing what made this session great helps you try to recreate those conditions. Maybe you were well-rested, or the weather was good, or you'd been practicing specific drills. The "What Made This Session Great" section lists the specific strengths from that day.`,
				callout: `Try to remember how you felt and what you did in the lead-up to this session. Can you replicate any of those factors in future training?`
			},
			club: {
				heading: 'Peak performance session characteristics',
				body: `This identifies your highest overall technique score session and breaks down its characteristics. Key metrics displayed:\n\n**Overall Score** — The composite technique score that defined this as your best\n**Session Quality** — Internal consistency and data reliability\n**Repeatability** — How consistent runs were within this session\n\nThe "What Made This Session Great" section lists the specific strengths identified by the performance engine that day. Common patterns: excellent reaction times, high explosiveness scores, strong repeatability, effective phase timing.\n\nAnalyzing your best session reveals your performance ceiling under optimal conditions. Compare against typical sessions to identify replicable factors versus one-off circumstances.`,
				thresholds: [
					{ label: 'Elite performance', value: '85+', color: '#3de8c8' },
					{ label: 'Strong session', value: '70–84', color: '#f5a623' },
					{ label: 'Good session', value: '55–69', color: '#ffcc44' }
				]
			},
			elite: {
				heading: 'Peak performance profiling for replication',
				body: `This panel profiles the session with the highest overall technique score to establish a performance template for replication.\n\n**Coaching applications:**\n\n**Contextual analysis** — Review session timestamp, weather conditions, time of day, training week position. Which factors are controllable?\n\n**Strength profiling** — The listed strengths define what "peak you" looks like. Are these strengths present in all sessions or unique to peak performance?\n\n**Repeatability assessment** — High repeatability in best session suggests you can reliably access peak state. Low repeatability in best session suggests ceiling was reached but inconsistently.\n\n**Comparative analysis** — Use the "View Full Session" link to review run-level data. What distinguished this session from others with similar conditions?\n\nFor periodisation: if best session occurred early in training cycle, ceiling was reached quickly — current training may be maintaining rather than advancing. If best session is recent, adaptation is still progressing.`,
				callout: `Cross-reference with the Benchmark Achievement Tracking panel to see if this session represents an outlier or a new performance level you're sustaining.`
			}
		}
	},

	consistencyTrendsAnalytics: {
		title: 'Consistency Trends',
		description: 'Tracking repeatability, CV%, and best-vs-average gap across sessions',
		levels: {
			grom: {
				heading: 'Getting more consistent over time',
				body: `This chart tracks three ways of measuring how consistent you are:\n\n**Repeatability Score** (teal line) — A simple score showing how similar your runs are. Higher is better.\n\n**CV %** (orange line) — How much your times vary. Lower is better (means more consistent).\n\n**Best vs Avg Gap** (red line) — How far your average is from your best. Smaller gap means most runs are close to your best.\n\nAt the bottom, you'll see percentage improvements from your first session to now. Green means you're getting more consistent!`,
				callout: `Being consistent is as important as being fast. If you can do your best run reliably, you'll perform better in races.`
			},
			club: {
				heading: 'Multi-metric consistency assessment',
				body: `Three complementary consistency metrics tracked longitudinally:\n\n**Repeatability Score (0–100)** — Computed from within-session variance across reaction times and technique. Higher = more consistent delivery.\n\n**CV% (Coefficient of Variation)** — Standard deviation / mean × 100 for reaction times. Lower = tighter clustering. <2% excellent, 2–5% good, 5–8% variable.\n\n**Best-vs-Average Gap %** — (Best - Average) / Best × 100. Lower = average performance closer to ceiling. <5% excellent, 5–15% good, >15% variable.\n\nImprovement percentages at bottom show first-to-latest session change. All three should ideally improve (repeatability up, CV down, gap down) as skill consolidates.\n\nDivergence between metrics is informative: improving repeatability with stable gap suggests you're becoming more consistent at your current level without raising the ceiling.`
			},
			elite: {
				heading: 'Consistency profiling across training cycles',
				body: `This panel tracks three orthogonal consistency dimensions to profile run-to-run stability:\n\n**Repeatability Score** — Mean-referenced metric. Measures typical variance around session average. Sensitive to overall skill consolidation.\n\n**CV%** — Normalized variance. Allows cross-session and cross-rider comparison. Particularly useful for identifying session-level arousal or fatigue effects.\n\n**Best-vs-Average Gap** — Ceiling-referenced metric. Distinguishes between "reliable but sub-maximal" (high repeatability, large gap) versus "peak performance unlocked" (high repeatability, small gap).\n\n**Coaching interpretation patterns:**\n\n**All three improving simultaneously** — Skill consolidation. Performance becoming both more consistent and closer to potential ceiling.\n\n**Repeatability improving, gap stable** — Floor is rising but ceiling isn't. Consistent delivery of current technique; needs stimulus to raise ceiling.\n\n**Gap narrowing, repeatability stable** — Ceiling is rising or average is improving faster than stability. May indicate recent breakthrough that hasn't fully consolidated.\n\n**All three declining** — Potential overtraining, competition stress, or technique modification period.`,
				callout: `Compare with the Session Consistency Trend in the main analytics to see CV% plotted alone. This chart adds the repeatability and gap metrics for fuller picture.`
			}
		}
	},

	benchmarkAchievement: {
		title: 'Benchmark Achievement Tracking',
		description: 'How often you reach Excellent, Good, and Developing performance levels',
		levels: {
			grom: {
				heading: 'Tracking your performance levels',
				body: `This shows how many of your sessions reached different quality levels:\n\n🏆 **Excellent (80+)** — Your very best performances\n⭐ **Good (60–79)** — Solid, competitive performances\n📈 **Developing (40–59)** — Building performances where you're improving\n\nThe goal is to have more and more sessions in the "Excellent" category over time. The progress bars show what percentage of your sessions reached each level.`,
				callout: `Consistency at any level is better than occasional excellence. Aim to get most sessions into "Good" or better, not just one or two "Excellent" sessions.`
			},
			club: {
				heading: 'Performance level distribution tracking',
				body: `This tracks what percentage of your sessions achieve each benchmark level based on overall technique scores:\n\n**Excellent (80+)** — Elite-level execution with minimal technical compromise\n**Good (60–79)** — Competitive execution with room for refinement\n**Developing (40–59)** — Foundational technique present but inconsistent application\n\nAchievement rates reveal your current performance distribution. Elite riders typically show 60%+ excellent, 35%+ good. Club riders show 40%+ good, 20%+ excellent.\n\nThe recent milestone section highlights achievements in the last 5 sessions — this is your current form indicator. Hitting excellent 3/5 times shows you're consolidating at that level.`,
				thresholds: [
					{ label: 'Elite consistency', value: '60%+ excellent sessions', color: '#3de8c8' },
					{ label: 'Strong development', value: '40%+ good sessions', color: '#f5a623' },
					{ label: 'Building phase', value: '60%+ developing sessions', color: '#ffcc44' }
				]
			},
			elite: {
				heading: 'Performance level distribution for periodisation',
				body: `This panel quantifies the distribution of session-level performance across benchmark categories. It answers: "What is the athlete's current performance baseline and ceiling?"\n\n**Interpretation for coaching:**\n\n**High excellent rate (>60%)** — Athlete has consolidated at elite level. Training focus should be on maintaining form and preventing regression. Consider whether challenge level is sufficient.\n\n**Balanced good/excellent (30-50% each)** — Athlete is transitioning between levels. Typical during skill refinement phases. Expect continued improvement with appropriate stimulus.\n\n**High developing rate (>50%)** — Athlete is in foundational development. Large gains possible with proper progression. Focus on consistency before pushing ceiling.\n\n**Declining rates over time** — Warning sign. May indicate overtraining, inadequate recovery, or training stimulus that doesn't match current capacity.\n\nThe "recent milestone" detection looks at last 5 sessions only — this is current form. An athlete with 40% overall excellent but 60% recent excellent is peaking. The inverse suggests declining form requiring investigation.`,
				callout: `Use alongside Best Session Analysis to confirm that your best sessions are representative of your top 20% or are outliers.`
			}
		}
	},

	techniqueCorrelation: {
		title: 'Technique Dimension Correlations',
		description: 'How different aspects of your technique influence each other',
		levels: {
			grom: {
				heading: 'Which skills are connected',
				body: `This shows which parts of your technique tend to improve together. For example, if it shows "Reaction ↔️ Explosiveness: 70%", it means when your reaction gets better, your explosiveness usually does too.\n\nThis is useful because it means working on one thing can help other things automatically. Strong connections (high percentages) mean those skills are closely linked in how you perform them.`,
				callout: `Focus your training on one skill from a strong connection pair — the other skill will often improve naturally as a result.`
			},
			club: {
				heading: 'Inter-dimensional correlation analysis',
				body: `This calculates Pearson correlation coefficients between technique dimension pairs across your sessions. Only correlations above 0.4 (40%) are shown — these represent meaningful relationships.\n\n**Positive correlations** (shown with higher percentages) indicate dimensions that improve together. Example: Reaction and Explosiveness correlating at 0.65 means improved reaction timing is associated with better explosiveness.\n\n**Interpretation for training:**\n\nHigh correlation between dimensions suggests they share biomechanical or neurological foundations. Training one dimension will likely produce gains in the correlated dimension.\n\nLow or absent correlation means dimensions are independent — each requires separate training focus.\n\nThe correlation strength (shown as progress bar) indicates reliability of the relationship. Requires minimum 5 sessions to calculate meaningful correlations.`,
				thresholds: [
					{ label: 'Strong correlation', value: '> 60%', color: '#3de8c8' },
					{ label: 'Moderate correlation', value: '40–60%', color: '#f5a623' }
				]
			},
			elite: {
				heading: 'Correlation analysis for targeted intervention',
				body: `This panel computes pairwise Pearson correlations between all technique dimensions across sessions, filtering for |r| > 0.4 to show only meaningful relationships.\n\n**Coaching applications:**\n\n**Coupled improvements** — Dimensions with r > 0.6 share underlying movement patterns or fitness qualities. Example: Explosiveness-Launch Quality correlation indicates that improving first-stroke power simultaneously improves positioning.\n\n**Independent dimensions** — Absence of correlation means dimensions are biomechanically decoupled. Each requires independent training stimulus. Common example: Reaction vs Smoothness — neurological timing versus force application control.\n\n**Strategic training focus** — When athlete shows weakness in correlated dimensions, addressing the more trainable dimension will produce gains in both. When dimensions are uncorrelated, both must be addressed separately.\n\n**Negative correlations** (rare, shown but not common) indicate potential trade-offs. Example: Explosiveness negatively correlating with Smoothness might suggest ballistic technique that sacrifices control for power. Requires careful interpretation.\n\nMinimum 5 sessions required for statistical validity. More sessions = more reliable correlation estimates.`,
				callout: `Correlations can change across training phases. Early-phase correlations may differ from late-phase as technique consolidates and dimensions become more independent.`
			}
		}
	},

	coachDiagnostics: {
		title: 'Coach Diagnostics',
		description: 'Detailed coaching insights with evidence and recommended actions',
		levels: {
			grom: {
				heading: 'What your coach would notice',
				body: `These are detailed observations about your performance — the kinds of things a coach would point out if they were watching.\n\nEach insight has three parts:\n• **What was noticed** — The main observation\n• **Evidence** — The specific data that shows this\n• **Next Steps** — What you might want to work on\n\nGreen insights (✓) are things you're doing well. Orange (○) are neutral observations. Red (⚠) are areas to focus on.`,
				callout: `This is like having a coach review your session. Read through the Next Steps sections for specific things to try.`
			},
			club: {
				heading: 'Structured diagnostic feedback',
				body: `Coach Diagnostics are generated by the performance engine's pattern recognition system. Each diagnostic includes:\n\n**Title & Summary** — The key observation in plain language\n**Evidence** — Specific data points supporting the observation (run numbers, metrics, thresholds)\n**Prescription** — Actionable next steps ranked by priority\n**Audience Level** — Whether this is beginner, intermediate, advanced, or coach-level detail\n\nTone indicates priority:\n**Positive (✓)** — Strengths to maintain or build on\n**Neutral (○)** — Observations without value judgment\n**Warning (⚠)** — Areas requiring attention\n\nDiagnostics are session-specific and adapt to your performance level. They're generated from physics analysis, technique scoring, and pattern matching against known performance profiles.`
			},
			elite: {
				heading: 'Performance engine diagnostic framework',
				body: `Coach Diagnostics represent the intelligence layer output of the performance engine. Each diagnostic is generated through:\n\n**Phase 1: Pattern Detection** — Algorithmic analysis identifies performance characteristics (explosive start, late peak G, inconsistent drive phase, etc.)\n\n**Phase 2: Evidence Assembly** — Supporting data points are collected and formatted for clarity\n\n**Phase 3: Prescription Generation** — Recommendations are produced based on detected pattern severity and athlete context\n\n**Phase 4: Audience Adaptation** — Content is filtered and phrased for target audience (grom/rider/elite/coach)\n\n**For coaching workflow:**\n\nDiagnostics with evidence provide accountability — athletes can verify observations independently. Prescription items are deliberately non-prescriptive about specific drills (that requires coaching context), but specific about focus areas.\n\nRecurring diagnostics across sessions appear in the Diagnostic Patterns panel. One-off observations are session anomalies or noise.\n\nThe tone classification allows quick filtering: warnings = intervention targets, positive = strengths to leverage, neutral = monitoring points.`,
				callout: `Compare Coach Diagnostics to the Strengths & Limiters section in the same session — they should align. Diagnostics provide the detail; Strengths & Limiters provide the summary.`
			}
		}
	},

	impulseMetrics: {
		title: 'Impulse Analysis',
		description:
			'Force application breakdown showing how power is distributed across the gate start',
		levels: {
			grom: {
				heading: 'How your power is applied',
				body: `Impulse is about how you apply your power across the start — not just how much, but when and how efficiently.\n\n**Total Impulse** (⚡) — The total amount of force you applied. More is generally better.\n\n**Time to 50%** (⏱️) — How quickly you reach half your total power. Faster means more explosive.\n\n**Front-Loaded** (🚀) — How much of your power comes early in the start. Higher is usually better for BMX.\n\n**Efficiency** (⚙️) — How effectively your power gets you moving. Higher means less wasted energy.`,
				callout: `Good BMX starts are "front-loaded" — meaning you hit hard right away rather than building up slowly.`
			},
			club: {
				heading: 'Impulse metrics and force distribution',
				body: `Impulse = Force × Time (measured in Newton-seconds). These metrics break down how force is applied across the gate start:\n\n**Total Impulse (N·s)** — Area under the force-time curve. Represents total momentum transfer. Higher total impulse = more energy put into the bike.\n\n**Time to Half-Impulse (s)** — Temporal midpoint of total impulse. Earlier midpoint = more front-loaded power application. Elite riders typically reach half-impulse in first 35–45% of elapsed time.\n\n**Front-Loaded Score (/100)** — Quantifies how much impulse occurs in first vs second half. Higher = more explosive ballistic start style. Lower = more sustained drive style.\n\n**Impulse Efficiency (%)** — Ratio of useful forward impulse to total impulse. Lower efficiency suggests force applied in non-forward directions (up, sideways) or wasted in bike deflection.\n\nThese metrics distinguish explosive (high front-loaded, early half-impulse) from sustained (lower front-loaded, later half-impulse) start styles.`
			},
			elite: {
				heading: 'Impulse analysis for biomechanical assessment',
				body: `Impulse analysis decomposes the force-time integral across the gate start to characterize power application strategy.\n\n**Total Impulse** = ∫F(t)dt from movement onset to end of measurement window. Derived from IMU acceleration after bias correction and mass estimation. Represents total momentum transferred to bike+rider system.\n\n**Time to Half-Impulse** — Temporal centroid of impulse distribution. Calculated as time when cumulative impulse reaches 50% of total. Reveals whether athlete front-loads effort (centroid < 40% elapsed time) or applies sustained drive (centroid > 50%).\n\n**Front-Loaded Score** = (First-half impulse / Total impulse) × 100. Ballistic starts (explosive first stroke, rapid peak) show scores >65. Sustained starts (progressive force build) show scores 45–55.\n\n**Impulse Efficiency** = Forward impulse component / Total impulse magnitude × 100. Accounts for force vector direction. Lower efficiency (<70%) indicates off-axis force application, premature wheel lift, or technique inefficiencies.\n\n**Coaching applications:**\n\nCompare impulse metrics to phase timing data. Early time-to-peak-G with high front-loaded score confirms explosive technique. Late peak-G with lower front-loaded score suggests sustained drive that may be sub-optimal for BMX gate starts.\n\nLow impulse efficiency with high power output suggests technique refinement needed (positioning, bike setup, timing) rather than strength work.`,
				callout: `Impulse metrics require profile completion (rider + bike mass) for accurate calculation. Values outside physiologically plausible ranges are flagged.`
			}
		}
	},

	runComparison: {
		title: 'Run Comparison Matrix',
		description:
			'Side-by-side technique scores for all runs showing best and worst in each dimension',
		levels: {
			grom: {
				heading: 'Comparing all your runs',
				body: `This table shows all your runs from a session lined up next to each other, with scores for different parts of your technique.\n\nYou can click any column header to sort by that score. The 🏆 icon shows your best run in each category. The ⬇️ icon shows your lowest.\n\nThis helps you see which runs were your strongest overall, and whether you're consistent across different areas or better in some than others.`,
				callout: `If your best overall run is also your best in most categories, you had a "complete" run. If different runs are best in different areas, you haven't put it all together yet.`
			},
			club: {
				heading: 'Multi-dimensional run-level comparison',
				body: `This matrix displays technique scores across all runs in six dimensions: Reaction, Explosiveness, Smoothness, Efficiency, and Overall.\n\nClick column headers to sort. The table identifies best (🏆) and worst (⬇️) values per dimension.\n\n**Analysis patterns:**\n\n**Best overall = best across dimensions** — This run represents your current ceiling. Study what made it work.\n\n**Different runs best per dimension** — You're capable of excellent performance in each area but haven't yet combined them. Focus on consistency.\n\n**Consistent colors across row** — That run had balanced technique. Most colors similar = consistent execution.\n\n**Mixed colors within run** — That run had uneven technique. Some aspects good, others weak.\n\nColor coding: Teal (80+) = excellent, Orange (60–79) = good, Red-orange (40–59) = developing, Red (<40) = needs work.`
			},
			elite: {
				heading: 'Run-level technique profiling for coaching intervention',
				body: `This matrix provides run-level granularity for within-session technique analysis. Use cases:\n\n**Ceiling identification** — Sort by Overall to identify best run. If this run is also best (or near-best) across dimensions, it represents an achievable integrated performance ceiling. If best overall but not best per dimension, there's headroom in specific areas.\n\n**Fatigue profiling** — Sort by Run # to see temporal progression. Declining scores across runs indicates within-session fatigue affecting technique quality. Stable or improving scores indicates good arousal management and no significant fatigue impact.\n\n**Consistency assessment** — Look at score variance within each dimension column. Low variance (<10 points spread) = consistent delivery. High variance (>20 points) = unstable technique requiring focus.\n\n**Dimension correlation** — Look for patterns across rows. Do low Smoothness runs also show low Efficiency? Does high Explosiveness correlate with high Overall? Reveals biomechanical coupling.\n\n**Outlier identification** — Runs marked best in one dimension but poor in others are analytically interesting. Example: Best Reaction but worst Overall suggests reaction was achieved by compromising drive phase setup.\n\nFor periodisation: early-phase sessions should show increasing variance as athlete explores technique. Late-phase sessions should show low variance as technique consolidates.`,
				callout: `Combine with the session-level Intelligence Panel to see how within-session patterns (this table) relate to session-level conclusions (drop-off, consistency, best-vs-avg).`
			}
		}
	},

	benchmarkComparison: {
		title: 'Benchmark Comparison Bars',
		description: 'Visual positioning of your scores against performance level thresholds',
		levels: {
			grom: {
				heading: 'Where you stand on each skill',
				body: `These bars show where your scores sit across different performance levels for each part of your technique.\n\nThe bar is divided into four colored zones:\n• **Red** (0–40) = Needs Work\n• **Orange** (40–60) = Developing\n• **Yellow** (60–80) = Good\n• **Teal** (80–100) = Excellent\n\nYour score is shown as a vertical line on the bar. The goal is to move that line further right (higher score) over time.`,
				callout: `Don't worry if you're not in "Excellent" for everything. Focus on moving from one zone to the next. Developing → Good is great progress!`
			},
			club: {
				heading: 'Benchmark positioning visualization',
				body: `This visualizes where your technique scores sit relative to standard BMX performance benchmarks:\n\n**Excellent (80–100)** — Elite-level execution. Minimal technical compromise. National/international competitive standard.\n\n**Good (60–79)** — Strong club-level execution. Competitive at regional level. Technique fundamentals solid, refinement opportunities present.\n\n**Developing (40–59)** — Foundational technique present but inconsistent application or execution gaps. Typical for riders in first 1–2 years of serious training.\n\n**Needs Work (0–39)** — Significant technique gaps or execution failures. Priority focus area.\n\nThe vertical line shows your current score. The shaded background regions show benchmark zones. The badge (Excellent/Good/Developing) confirms your current level.\n\nUse this to identify where you're strongest (scores in teal zone) and where you have most opportunity (scores in orange/red zones).`
			},
			elite: {
				heading: 'Benchmarking against performance standards',
				body: `This panel provides visual benchmarking against standardized performance thresholds derived from elite BMX gate start analysis.\n\nBenchmark thresholds are fixed across all athletes:\n**80+ = Excellent** — Top 10-15% of competitive BMX riders\n**60–79 = Good** — Top 35% of competitive riders\n**40–59 = Developing** — Middle 50% of training riders\n**<40 = Needs Work** — Bottom quartile, significant gaps\n\n**Coaching interpretation:**\n\n**All dimensions in excellent** — Athlete has consolidated at elite level across all aspects. Focus shifts to maintaining form and competition readiness.\n\n**Mixed excellent/good** — Athlete is transitioning to elite level. Good dimensions are improvement targets. Excellent dimensions are strengths to leverage.\n\n**Good/developing mix** — Athlete is in active skill development phase. Large improvement potential. Focus on moving developing → good first.\n\n**Any dimension in needs-work** — Priority intervention area regardless of other dimensions. Significant limiter that will constrain overall performance.\n\nNote these are absolute benchmarks, not relative to personal history. An athlete improving from 45 to 55 shows real progress even though both scores are "Developing". Use alongside Technique Score Trends to see relative improvement over time.`,
				callout: `These benchmarks are calibrated for adult competitive BMX. Youth riders and beginners should focus on relative improvement rather than absolute benchmark achievement.`
			}
		}
	}
};

export const HELP_LEVELS: { id: HelpLevel; label: string; desc: string }[] = [
	{ id: 'grom', label: 'Grom / Parent', desc: 'Plain language' },
	{ id: 'club', label: 'Club Rider', desc: 'Technical context' },
	{ id: 'elite', label: 'Elite / Coach', desc: 'Full methodology' }
];

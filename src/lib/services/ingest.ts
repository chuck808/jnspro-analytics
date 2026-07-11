/**
 * AppGatePro SD Card Upload Ingest Service
 *
 * Handles Schema v2 JSON files from the device SD card.
 * Applies all unit conversions documented in the working document:
 *
 *   chartData (int16×100)     → ÷100 → float G-units
 *   reactionTime (ms)         → direct → reaction_time_ms  (firmware outputs ms)
 *   timeSeries.pitchRad       → ×180/π → degrees
 *   timeSeries.rollRad        → ×180/π → degrees
 *   All speeds stored as m/s — conversion to km/h at display layer only
 *
 * Defensive parsing throughout — optional fields silently become null.
 */

const RAD_TO_DEG = 180 / Math.PI;
const SUPPORTED_SCHEMA_VERSION = 2;

// ─── Raw SD card types ────────────────────────────────────────────────────────

interface SDFirmwareAnalytics {
	valid?: boolean;
	maxPitchDeg?: number;
	avgPitchDeg?: number;
	timeToWheelieMs?: number;
	wheelieDurationMs?: number;
	pitchAtPeakGDeg?: number;
	frontWheelLifted?: boolean;
	endSpeedMs?: number;
	peakSpeedMs?: number;
	avgSpeedMs?: number;
	biasCorrectionMs2?: number;
	timeToPeakSpeedMs?: number;
}

interface SDTimeSeries {
	sampleRateHz?: number;
	sampleCount?: number;
	pitchRad?: number[];
	rollRad?: number[];
	linearAccelG?: number[];
	rawAccelG?: number[];
}

interface SDRun {
	timestamp?: number;
	reactionTime: number; // milliseconds — used directly, no conversion
	elapsedMs: number; // milliseconds
	maxG: number;
	avgG: number;
	distance: number; // metres
	chartData: number[]; // int16 × 100
	firmwareAnalytics?: SDFirmwareAnalytics;
	timeSeries?: SDTimeSeries;
}

interface SDSessionMetadata {
	startTime?: number;
	endTime?: number;
	totalRuns?: number;
	isSessionMode?: boolean;
	distance?: number;
}

export interface SDCardFile {
	schemaVersion: number;
	sessionMetadata?: SDSessionMetadata;
	runs: SDRun[];
}

// ─── Validation ───────────────────────────────────────────────────────────────

export interface ValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
	runCount: number;
}

export function validateSDFile(data: unknown): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	if (typeof data !== 'object' || data === null) {
		return { valid: false, errors: ['File is not a valid JSON object'], warnings, runCount: 0 };
	}

	const file = data as Record<string, unknown>;

	// Schema version check
	// Schema version check — only reject if explicitly wrong, not if missing
	const version = file.schemaVersion;
	if (version !== undefined && version !== SUPPORTED_SCHEMA_VERSION) {
		errors.push(
			`Unsupported schema version: ${version}. ` +
				`Expected version ${SUPPORTED_SCHEMA_VERSION}. ` +
				`Please update your AppGatePro firmware.`
		);
		return { valid: false, errors, warnings, runCount: 0 };
	}

	// Runs array
	if (!Array.isArray(file.runs)) {
		errors.push('Missing or invalid runs array');
		return { valid: false, errors, warnings, runCount: 0 };
	}

	if (file.runs.length === 0) {
		errors.push('Session file contains no runs');
		return { valid: false, errors, warnings, runCount: 0 };
	}

	// Validate each run
	let validRuns = 0;
	(file.runs as unknown[]).forEach((run, i) => {
		if (typeof run !== 'object' || run === null) {
			errors.push(`Run ${i + 1}: not a valid object`);
			return;
		}
		const r = run as Record<string, unknown>;

		const missing: string[] = [];
		if (typeof r.reactionTime !== 'number') missing.push('reactionTime');
		if (typeof r.elapsedMs !== 'number') missing.push('elapsedMs');
		if (typeof r.maxG !== 'number') missing.push('maxG');
		if (typeof r.avgG !== 'number') missing.push('avgG');
		if (!Array.isArray(r.chartData)) missing.push('chartData');

		if (missing.length > 0) {
			errors.push(`Run ${i + 1}: missing required fields: ${missing.join(', ')}`);
			return;
		}

		// Sanity checks
		// reactionTime is in milliseconds — warn if implausible (< 0 or > 3000ms)
		if ((r.reactionTime as number) < 0 || (r.reactionTime as number) > 3000) {
			warnings.push(
				`Run ${i + 1}: reaction time ${(r.reactionTime as number).toFixed(0)}ms looks unusual`
			);
		}
		if ((r.maxG as number) < 0 || (r.maxG as number) > 4) {
			warnings.push(`Run ${i + 1}: maxG ${r.maxG} exceeds ±2G sensor range — data may be corrupt`);
		}
		if ((r.chartData as unknown[]).length === 0) {
			warnings.push(`Run ${i + 1}: chartData is empty`);
		}

		validRuns++;
	});

	return {
		valid: errors.length === 0,
		errors,
		warnings,
		runCount: validRuns
	};
}

// ─── Transformation ───────────────────────────────────────────────────────────

export interface IngestRun {
	// For runs table
	run_number: number;
	elapsed_time_ms: number | null;
	distance_m: number | null;
	chart_data: number[]; // float G-units (already divided)

	// For gate_runs table
	reaction_time_ms: number;
	max_g: number;
	avg_g: number;
	speed_ms: number | null; // end speed
	peak_speed_ms: number | null;
	avg_speed_ms_calc: number | null;
	time_to_peak_speed_ms: number | null;
	bias_correction_ms2: number | null;
	analytics_valid: boolean;
	max_pitch_deg: number | null;
	avg_pitch_deg: number | null;
	pitch_at_peak_g_deg: number | null;
	time_to_wheelie_ms: number | null;
	wheelie_duration_ms: number | null;
	front_wheel_lifted: boolean | null;

	// For run_timeseries table (optional)
	timeSeries: {
		sample_rate_hz: number;
		sample_count: number;
		g_force_data: number[] | null;
		pitch_deg: number[] | null;
		roll_deg: number[] | null;
		linear_accel_g: number[] | null;
		raw_accel_g: number[] | null;
	} | null;
}

export interface IngestSession {
	session_type: 'gate';
	timestamp: string;
	distance_m: number;
	runs: IngestRun[];
}

function safeNum(val: unknown): number | null {
	if (typeof val === 'number' && isFinite(val)) return val;
	return null;
}

function safeBool(val: unknown): boolean | null {
	if (typeof val === 'boolean') return val;
	return null;
}

export function transformSDFile(file: SDCardFile): IngestSession {
	const MIN_VALID_TIMESTAMP = 1577836800000; // 2020-01-01 in Unix ms

	const metadata = file.sessionMetadata ?? {};
	const timestamp =
		metadata.startTime && metadata.startTime > MIN_VALID_TIMESTAMP
			? new Date(metadata.startTime).toISOString()
			: new Date().toISOString();

	const runs: IngestRun[] = file.runs.map((run, index) => {
		const fa = run.firmwareAnalytics ?? {};
		const analyticsValid = fa.valid === true;

		// chartData: int16 × 100 → divide to float G-units
		const chartData = Array.isArray(run.chartData) ? run.chartData.map((v) => v / 100) : [];

		// timeSeries: convert radians to degrees where needed
		let timeSeries: IngestRun['timeSeries'] = null;
		if (run.timeSeries && typeof run.timeSeries === 'object') {
			const ts = run.timeSeries;
			const sampleCount = ts.sampleCount ?? ts.pitchRad?.length ?? ts.linearAccelG?.length ?? 0;

			if (sampleCount > 0) {
				timeSeries = {
					sample_rate_hz: ts.sampleRateHz ?? 200,
					sample_count: sampleCount,
					g_force_data: chartData.length > 0 ? chartData : null,
					pitch_deg: Array.isArray(ts.pitchRad) ? ts.pitchRad.map((r) => r * RAD_TO_DEG) : null,
					roll_deg: Array.isArray(ts.rollRad) ? ts.rollRad.map((r) => r * RAD_TO_DEG) : null,
					linear_accel_g: Array.isArray(ts.linearAccelG) ? ts.linearAccelG : null,
					raw_accel_g: Array.isArray(ts.rawAccelG) ? ts.rawAccelG : null
				};
			}
		}

		return {
			run_number: index + 1,
			elapsed_time_ms: safeNum(run.elapsedMs),
			distance_m: safeNum(run.distance),
			chart_data: chartData,

			// reactionTime from device is already in milliseconds — use directly
			reaction_time_ms: Math.round(run.reactionTime ?? 0),
			max_g: run.maxG,
			avg_g: run.avgG,

			// Speed fields — only populated if analytics valid
			speed_ms: analyticsValid ? safeNum(fa.endSpeedMs) : null,
			peak_speed_ms: analyticsValid ? safeNum(fa.peakSpeedMs) : null,
			avg_speed_ms_calc: analyticsValid ? safeNum(fa.avgSpeedMs) : null,
			time_to_peak_speed_ms: analyticsValid ? safeNum(fa.timeToPeakSpeedMs) : null,
			bias_correction_ms2: safeNum(fa.biasCorrectionMs2), // always store for data quality
			analytics_valid: analyticsValid,

			// Pitch fields — always store if present (technique indicators)
			max_pitch_deg: safeNum(fa.maxPitchDeg),
			avg_pitch_deg: safeNum(fa.avgPitchDeg),
			pitch_at_peak_g_deg: safeNum(fa.pitchAtPeakGDeg),
			time_to_wheelie_ms: safeNum(fa.timeToWheelieMs),
			wheelie_duration_ms: safeNum(fa.wheelieDurationMs),
			front_wheel_lifted: safeBool(fa.frontWheelLifted),

			timeSeries
		};
	});

	return {
		session_type: 'gate',
		timestamp,
		distance_m: metadata.distance ?? file.runs[0]?.distance ?? 10,
		runs
	};
}

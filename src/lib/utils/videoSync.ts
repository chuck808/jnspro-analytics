/**
 * src/lib/utils/videoSync.ts
 *
 * Client-side flash-frame sync detection for attached run videos (see
 * VIDEO_SYNC_DESIGN.md §4). The same ESP-NOW broadcast that fires the gate
 * also fires a bright flash at the exact instant reaction time hits zero —
 * this scans the uploaded clip for that flash and returns its offset from
 * the start of the video, so the analytics chart (in run-clock time) can be
 * aligned to the video (in its own clock).
 *
 * All thresholds below are principled starting points, not validated against
 * real GoPro flash footage yet — expect to recalibrate once real clips are
 * available (see VIDEO_SYNC_DESIGN.md §7).
 */

const COARSE_SAMPLE_INTERVAL_S = 0.1;
const MAX_SCAN_S = 20; // arm -> random delay -> light sequence comfortably finishes inside this
const FINE_WINDOW_S = 0.15;
const FINE_STEP_S = 0.02;
const OVERALL_TIMEOUT_MS = 15_000;
const SEEK_TIMEOUT_MS = 2_000;
const METADATA_TIMEOUT_MS = 3_000;

const SAMPLE_WIDTH = 64;
const SAMPLE_HEIGHT = 36;

const MIN_ABS_DELTA = 12; // out of 255
const MIN_RELATIVE_DELTA_MULTIPLIER = 3; // relative to this clip's own noise floor
const DECAY_LOOKAHEAD_SAMPLES = 2;
const MIN_DECAY_FRACTION = 0.4;

export interface VideoAnalysisResult {
	durationMs: number | null;
	syncOffsetS: number | null;
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
	return new Promise((resolve) => {
		const timer = setTimeout(() => resolve(fallback), ms);
		promise.then((value) => {
			clearTimeout(timer);
			resolve(value);
		});
	});
}

function waitForEvent(el: HTMLVideoElement, event: string, timeoutMs: number): Promise<boolean> {
	return withTimeout(
		new Promise<boolean>((resolve) => {
			el.addEventListener(event, () => resolve(true), { once: true });
		}),
		timeoutMs,
		false
	);
}

function seekTo(video: HTMLVideoElement, t: number): Promise<boolean> {
	video.currentTime = t;
	return waitForEvent(video, 'seeked', SEEK_TIMEOUT_MS);
}

function sampleLuminance(video: HTMLVideoElement, ctx: CanvasRenderingContext2D): number {
	ctx.drawImage(video, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
	const { data } = ctx.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
	let total = 0;
	const pixelCount = SAMPLE_WIDTH * SAMPLE_HEIGHT;
	for (let i = 0; i < data.length; i += 4) {
		total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
	}
	return total / pixelCount;
}

export function median(values: number[]): number {
	if (values.length === 0) return 0;
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export interface FlashCandidate {
	index: number;
	offsetS: number;
	luminance: number;
}

/**
 * Pure decision logic for the coarse scan: given evenly-spaced luminance
 * samples, pick the flash candidate (if any) and validate it's a real flash
 * (large enough delta relative to this clip's own noise floor, AND decays
 * back down within a couple of samples — rejects a sustained brightness
 * change like room lights switching on and staying on). Deliberately
 * side-effect-free and independent of any video/canvas API so it's directly
 * unit-testable without a real browser video-decoding pipeline.
 *
 * `times[i]` must correspond to `luminances[i]`.
 */
export function selectFlashCandidate(luminances: number[], times: number[]): FlashCandidate | null {
	if (luminances.length < 3) return null;

	const deltas = luminances.slice(1).map((v, i) => v - luminances[i]);
	const medianAbsDelta = median(deltas.map(Math.abs));

	let candidateIdx = -1;
	let candidateDelta = -Infinity;
	for (let i = 0; i < deltas.length; i++) {
		if (deltas[i] > candidateDelta) {
			candidateDelta = deltas[i];
			candidateIdx = i;
		}
	}
	if (candidateIdx === -1) return null;

	const threshold = Math.max(MIN_ABS_DELTA, MIN_RELATIVE_DELTA_MULTIPLIER * medianAbsDelta);
	if (candidateDelta < threshold) return null;

	// A real flash decays — reject a sustained brightness change (e.g. lights
	// switching on and staying on) rather than a single spike.
	const flashIdx = candidateIdx + 1;
	const flashLuminance = luminances[flashIdx];
	const lookaheadEnd = Math.min(luminances.length - 1, flashIdx + DECAY_LOOKAHEAD_SAMPLES);
	let decayed = false;
	for (let i = flashIdx + 1; i <= lookaheadEnd; i++) {
		if (flashLuminance - luminances[i] >= candidateDelta * MIN_DECAY_FRACTION) {
			decayed = true;
			break;
		}
	}
	if (!decayed) return null;

	return { index: flashIdx, offsetS: times[flashIdx], luminance: flashLuminance };
}

async function findFlashOffset(
	video: HTMLVideoElement,
	ctx: CanvasRenderingContext2D,
	durationS: number
): Promise<number | null> {
	const scanEndS = Math.min(durationS, MAX_SCAN_S);
	if (scanEndS <= 0) return null;

	// --- Coarse scan ---
	const times: number[] = [];
	const luminances: number[] = [];
	for (let t = 0; t <= scanEndS; t += COARSE_SAMPLE_INTERVAL_S) {
		const seeked = await seekTo(video, t);
		if (!seeked) continue;
		times.push(t);
		luminances.push(sampleLuminance(video, ctx));
	}

	const candidate = selectFlashCandidate(luminances, times);
	if (candidate === null) return null;

	const coarseOffsetS = candidate.offsetS;

	// --- Fine refinement around the coarse candidate ---
	const fineStart = Math.max(0, coarseOffsetS - FINE_WINDOW_S);
	const fineEnd = Math.min(durationS, coarseOffsetS + FINE_WINDOW_S);
	let bestFineOffset = coarseOffsetS;
	let bestFineLuminance = candidate.luminance;
	for (let t = fineStart; t <= fineEnd; t += FINE_STEP_S) {
		const seeked = await seekTo(video, t);
		if (!seeked) continue;
		const luminance = sampleLuminance(video, ctx);
		if (luminance > bestFineLuminance) {
			bestFineLuminance = luminance;
			bestFineOffset = t;
		}
	}

	return bestFineOffset;
}

/**
 * Analyzes a video file for duration and flash-frame sync offset. Decodes
 * the file once (a single hidden <video> element) for both. Never throws —
 * failures resolve individual fields to null rather than rejecting, since a
 * failed sync detection should fall back to plain playback, not block the
 * upload.
 */
export async function analyzeVideoForSync(file: File): Promise<VideoAnalysisResult> {
	const video = document.createElement('video');
	video.muted = true;
	video.playsInline = true;
	video.preload = 'auto';

	const url = URL.createObjectURL(file);
	video.src = url;

	const cleanup = () => URL.revokeObjectURL(url);

	try {
		const hasMetadata = await waitForEvent(video, 'loadedmetadata', METADATA_TIMEOUT_MS);
		if (!hasMetadata || !Number.isFinite(video.duration)) {
			return { durationMs: null, syncOffsetS: null };
		}

		const durationMs = Math.round(video.duration * 1000);

		const canvas = document.createElement('canvas');
		canvas.width = SAMPLE_WIDTH;
		canvas.height = SAMPLE_HEIGHT;
		const ctx = canvas.getContext('2d', { willReadFrequently: true });
		if (!ctx) {
			return { durationMs, syncOffsetS: null };
		}

		const syncOffsetS = await withTimeout(
			findFlashOffset(video, ctx, video.duration),
			OVERALL_TIMEOUT_MS,
			null
		);

		return { durationMs, syncOffsetS };
	} catch (err) {
		console.error('Video sync analysis failed:', err);
		return { durationMs: null, syncOffsetS: null };
	} finally {
		cleanup();
	}
}

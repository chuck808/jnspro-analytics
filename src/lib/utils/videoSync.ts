/**
 * Client-side hardware-light sync detection for attached run videos.
 *
 * When enabled, the external Lights unit switches to a full-white background
 * for ~120 ms beginning at gate zero. That rising edge is the synchronization
 * event: reaction time and the run clock both start there. This detector scans
 * the uploaded clip for that finite luminance pulse and stores the leading-edge
 * offset from the start of the video.
 *
 * This is deliberately independent of GoPro recording control. A camera flash
 * is not the sync source, and failed detection must never block plain playback.
 */

const COARSE_SAMPLE_INTERVAL_S = 0.1;
const MAX_SCAN_S = 20;
const FINE_WINDOW_BEFORE_S = 0.15;
const FINE_WINDOW_AFTER_S = 0.3;
const FINE_STEP_S = 0.02;
const OVERALL_TIMEOUT_MS = 15_000;
const SEEK_TIMEOUT_MS = 2_000;
const METADATA_TIMEOUT_MS = 3_000;

const SAMPLE_WIDTH = 64;
const SAMPLE_HEIGHT = 36;

const MIN_ABS_DELTA = 12;
const MIN_RELATIVE_DELTA_MULTIPLIER = 3;
const MIN_DECAY_FRACTION = 0.4;
// The commanded cue is 120 ms. Allow camera exposure/seek quantisation and
// coarse 100 ms sampling without accepting a room light that simply stays on.
const MAX_PULSE_DECAY_WINDOW_S = 0.28;

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

export interface SyncPulseCandidate {
	index: number;
	offsetS: number;
	luminance: number;
}

/**
 * Select the leading edge of a finite bright pulse from timestamped luminance
 * samples. The candidate must rise well above this clip's noise floor and then
 * decay within a real-time window. Using timestamps rather than a fixed number
 * of samples makes the rule consistent between the 100 ms coarse scan and the
 * 20 ms refinement scan.
 */
export function selectSyncPulseCandidate(
	luminances: number[],
	times: number[],
	maxDecayWindowS = MAX_PULSE_DECAY_WINDOW_S
): SyncPulseCandidate | null {
	if (luminances.length < 3 || luminances.length !== times.length) return null;

	const deltas = luminances.slice(1).map((value, i) => value - luminances[i]);
	const medianAbsDelta = median(deltas.map(Math.abs));
	const threshold = Math.max(MIN_ABS_DELTA, MIN_RELATIVE_DELTA_MULTIPLIER * medianAbsDelta);

	// Evaluate strongest positive rises first. A later, brighter frame inside a
	// plateau is irrelevant; gate zero is the transition into the white pulse.
	const rises = deltas
		.map((delta, i) => ({ delta, edgeIndex: i + 1 }))
		.filter(({ delta }) => delta >= threshold)
		.sort((a, b) => b.delta - a.delta);

	for (const { delta, edgeIndex } of rises) {
		const edgeTime = times[edgeIndex];
		const pulseLuminance = luminances[edgeIndex];
		let decayed = false;

		for (let i = edgeIndex + 1; i < luminances.length; i++) {
			const elapsed = times[i] - edgeTime;
			if (elapsed < 0) continue;
			if (elapsed > maxDecayWindowS) break;
			if (pulseLuminance - luminances[i] >= delta * MIN_DECAY_FRACTION) {
				decayed = true;
				break;
			}
		}

		if (decayed) {
			return {
				index: edgeIndex,
				offsetS: edgeTime,
				luminance: pulseLuminance
			};
		}
	}

	return null;
}

async function sampleWindow(
	video: HTMLVideoElement,
	ctx: CanvasRenderingContext2D,
	startS: number,
	endS: number,
	stepS: number
): Promise<{ times: number[]; luminances: number[] }> {
	const times: number[] = [];
	const luminances: number[] = [];
	for (let t = startS; t <= endS + stepS / 2; t += stepS) {
		const seeked = await seekTo(video, t);
		if (!seeked) continue;
		times.push(t);
		luminances.push(sampleLuminance(video, ctx));
	}
	return { times, luminances };
}

async function findSyncPulseOffset(
	video: HTMLVideoElement,
	ctx: CanvasRenderingContext2D,
	durationS: number
): Promise<number | null> {
	const scanEndS = Math.min(durationS, MAX_SCAN_S);
	if (scanEndS <= 0) return null;

	const coarse = await sampleWindow(video, ctx, 0, scanEndS, COARSE_SAMPLE_INTERVAL_S);
	const coarseCandidate = selectSyncPulseCandidate(coarse.luminances, coarse.times);
	if (coarseCandidate === null) return null;

	// Refine the rising edge, not the brightest point of the white plateau.
	const fineStart = Math.max(0, coarseCandidate.offsetS - FINE_WINDOW_BEFORE_S);
	const fineEnd = Math.min(durationS, coarseCandidate.offsetS + FINE_WINDOW_AFTER_S);
	const fine = await sampleWindow(video, ctx, fineStart, fineEnd, FINE_STEP_S);
	const fineCandidate = selectSyncPulseCandidate(fine.luminances, fine.times);

	return fineCandidate?.offsetS ?? coarseCandidate.offsetS;
}

/**
 * Analyze a video file for duration and optional hardware-light sync offset.
 * Never throws: sync failure resolves to null so video attachment/playback can
 * still succeed without claiming synchronized telemetry.
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
		if (!ctx) return { durationMs, syncOffsetS: null };

		const syncOffsetS = await withTimeout(
			findSyncPulseOffset(video, ctx, video.duration),
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

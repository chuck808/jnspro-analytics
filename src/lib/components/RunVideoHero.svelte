<script lang="ts">
	/**
	 * Hero video player: native <video controls> for standard playback, plus a
	 * merged scrub-bar rendering the G-force trace as its own timeline
	 * (draggable/click-to-seek), a 3-tier HUD, and event callouts synced via
	 * the flash-frame offset. See VIDEO_SYNC_DESIGN.md §6.4.
	 *
	 * Pure presentational — no Supabase/network calls. Only rendered by the
	 * caller when `video.sync_offset_s` is non-null; an unsynced video falls
	 * back to the plain player in RunVideoAttachment.svelte instead.
	 */
	import { untrack } from 'svelte';
	import type { SeriesPoint } from '$lib/performance-engine';

	interface Props {
		video: { signed_url: string; sync_offset_s: number; duration_ms: number | null };
		drillDownData: SeriesPoint[];
		speedKmh: number[];
		reactionMs: number | null;
		measuredPeakSpeedKmh: number | null;
		maxG: number | null;
		techniqueScoreOverall: number | null;
		frontWheelLifted: boolean;
		timeToWheelieMs: number | null;
	}

	let {
		video,
		drillDownData,
		speedKmh,
		reactionMs,
		measuredPeakSpeedKmh,
		maxG,
		techniqueScoreOverall,
		frontWheelLifted,
		timeToWheelieMs
	}: Props = $props();

	let videoEl: HTMLVideoElement | undefined = $state();
	let barEl: SVGSVGElement | undefined = $state();
	let currentTime = $state(0);
	// Initial fallback only — loadedmetadata overwrites this with the real
	// decoded duration, so this deliberately captures video's value once
	// rather than tracking it reactively.
	let videoDuration = $state(untrack(() => (video.duration_ms ?? 0) / 1000));
	let dragging = $state(false);

	const BAR_WIDTH = 800;
	const BAR_HEIGHT = 72;
	const PADDING = 8;

	function clamp(v: number, min: number, max: number) {
		return Math.min(max, Math.max(min, v));
	}

	function videoTimeToX(t: number, duration: number) {
		const d = Math.max(duration, 0.001);
		return PADDING + (clamp(t, 0, d) / d) * (BAR_WIDTH - 2 * PADDING);
	}

	function xToVideoTime(x: number, duration: number) {
		const clamped = clamp(x, PADDING, BAR_WIDTH - PADDING);
		return ((clamped - PADDING) / (BAR_WIDTH - 2 * PADDING)) * duration;
	}

	// Last drillDownData point's timeS is elapsedMs/1000 by construction (see
	// detail/+page.svelte) — no need for a separate elapsedMs prop.
	let totalS = $derived(drillDownData.length ? drillDownData[drillDownData.length - 1].timeS : 0);
	let runTimeS = $derived(currentTime - video.sync_offset_s);
	let inDataRange = $derived(totalS > 0 && runTimeS >= 0 && runTimeS <= totalS);

	// drillDownData and speedKmh are both derived 1:1 from chart_data at the
	// same cadence — one index serves both, no separate timesS lookup needed.
	let idx = $derived(
		totalS > 0 ? Math.round(clamp(runTimeS / totalS, 0, 1) * (drillDownData.length - 1)) : 0
	);
	let liveG = $derived(inDataRange ? (drillDownData[idx]?.value ?? null) : null);
	let liveSpeed = $derived(
		inDataRange && speedKmh.length ? (speedKmh[Math.min(idx, speedKmh.length - 1)] ?? null) : null
	);

	let peakG = $derived.by(() => {
		if (!drillDownData.length) return null;
		let best = drillDownData[0];
		for (const p of drillDownData) if (p.value > best.value) best = p;
		return best;
	});

	let wheelieTimeS = $derived(timeToWheelieMs != null ? timeToWheelieMs / 1000 : null);

	let showPeakCallout = $derived(peakG !== null && Math.abs(runTimeS - peakG.timeS) < 0.4);
	let showWheelieCallout = $derived(
		frontWheelLifted && wheelieTimeS !== null && Math.abs(runTimeS - wheelieTimeS) < 0.4
	);

	// G-force trace, offset into video-time coordinates so it lands correctly
	// within the (possibly much longer) full video duration.
	let tracePath = $derived.by(() => {
		if (drillDownData.length < 2 || videoDuration <= 0) return '';
		const values = drillDownData.map((p) => p.value);
		let minY = Math.min(...values);
		let maxY = Math.max(...values);
		if (minY === maxY) {
			minY -= 1;
			maxY += 1;
		}
		const yScale = (v: number) =>
			BAR_HEIGHT - PADDING - ((v - minY) / (maxY - minY)) * (BAR_HEIGHT - 2 * PADDING);
		return drillDownData
			.map((p, i) => {
				const x = videoTimeToX(video.sync_offset_s + p.timeS, videoDuration);
				const y = yScale(p.value);
				return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
			})
			.join(' ');
	});

	let dataRegionX1 = $derived(videoTimeToX(video.sync_offset_s, videoDuration));
	let dataRegionX2 = $derived(videoTimeToX(video.sync_offset_s + totalS, videoDuration));
	let cursorX = $derived(videoTimeToX(currentTime, videoDuration));

	function handleLoadedMetadata() {
		if (videoEl && Number.isFinite(videoEl.duration)) {
			videoDuration = videoEl.duration;
		}
	}

	function handleTimeUpdate() {
		if (videoEl) currentTime = videoEl.currentTime;
	}

	// timeupdate alone is too coarse (~4/sec) for a smoothly moving cursor —
	// drive it with rAF while actually playing; numeric HUD readouts don't
	// need that precision so timeupdate covers them fine on its own.
	$effect(() => {
		if (!videoEl) return;
		const el = videoEl;
		let rafId: number | undefined;

		const tick = () => {
			if (!el.paused) {
				currentTime = el.currentTime;
				rafId = requestAnimationFrame(tick);
			}
		};
		const onPlay = () => {
			rafId = requestAnimationFrame(tick);
		};

		el.addEventListener('play', onPlay);
		return () => {
			el.removeEventListener('play', onPlay);
			if (rafId !== undefined) cancelAnimationFrame(rafId);
		};
	});

	function seekFromClientX(clientX: number) {
		if (!barEl || !videoEl || videoDuration <= 0) return;
		const rect = barEl.getBoundingClientRect();
		const svgX = ((clientX - rect.left) / rect.width) * BAR_WIDTH;
		const t = xToVideoTime(svgX, videoDuration);
		videoEl.currentTime = t;
		currentTime = t;
	}

	function handlePointerDown(e: PointerEvent) {
		dragging = true;
		(e.target as Element).setPointerCapture(e.pointerId);
		seekFromClientX(e.clientX);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!dragging) return;
		seekFromClientX(e.clientX);
	}

	function handlePointerUp(e: PointerEvent) {
		dragging = false;
		(e.target as Element).releasePointerCapture(e.pointerId);
	}

	function handleBarKeydown(e: KeyboardEvent) {
		if (!videoEl) return;
		if (e.key === 'ArrowLeft') {
			videoEl.currentTime = Math.max(0, currentTime - 1);
			currentTime = videoEl.currentTime;
		} else if (e.key === 'ArrowRight') {
			videoEl.currentTime = Math.min(videoDuration, currentTime + 1);
			currentTime = videoEl.currentTime;
		}
	}
</script>

<div class="space-y-2">
	<div class="relative overflow-hidden rounded-xl border border-[#221c18] bg-black">
		<!-- svelte-ignore a11y_media_has_caption -->
		<video
			bind:this={videoEl}
			src={video.signed_url}
			controls
			class="w-full"
			ontimeupdate={handleTimeUpdate}
			onloadedmetadata={handleLoadedMetadata}
		></video>

		<!-- Tier 1: persistent corner stats -->
		<div class="pointer-events-none absolute top-3 left-3 flex flex-col gap-1">
			{#if reactionMs !== null}
				<span
					class="rounded bg-black/60 px-2 py-1 text-xs font-semibold text-[#f0ece4] backdrop-blur-sm"
				>
					RT {(reactionMs / 1000).toFixed(3)}s
				</span>
			{/if}
			{#if measuredPeakSpeedKmh !== null}
				<span
					class="rounded bg-black/60 px-2 py-1 text-xs font-semibold text-[#f0ece4] backdrop-blur-sm"
				>
					PEAK {measuredPeakSpeedKmh.toFixed(1)} km/h
				</span>
			{/if}
			{#if maxG !== null}
				<span
					class="rounded bg-black/60 px-2 py-1 text-xs font-semibold text-[#f0ece4] backdrop-blur-sm"
				>
					MAX {maxG.toFixed(2)}G
				</span>
			{/if}
			{#if techniqueScoreOverall !== null}
				<span
					class="rounded bg-black/60 px-2 py-1 text-xs font-semibold text-[#f5a623] backdrop-blur-sm"
				>
					TECH {Math.round(techniqueScoreOverall)}
				</span>
			{/if}
		</div>

		<!-- Tier 3: event callouts -->
		<div class="pointer-events-none absolute top-3 right-3 flex flex-col items-end gap-1.5">
			{#if showPeakCallout && peakG}
				<div
					class="animate-pulse rounded bg-[#f5a623]/90 px-3 py-1.5 text-xs font-bold text-[#0a0809]"
				>
					PEAK G: {peakG.value.toFixed(2)}
				</div>
			{/if}
			{#if showWheelieCallout}
				<div
					class="animate-pulse rounded bg-[#3de8c8]/90 px-3 py-1.5 text-xs font-bold text-[#0a0809]"
				>
					FRONT WHEEL LIFT
				</div>
			{/if}
		</div>
	</div>

	<!-- Tier 2: live telemetry -->
	<div
		class="flex items-center gap-4 rounded-lg border border-[#221c18] bg-[#131010] px-3 py-2 text-xs text-[#9a8f7a]"
	>
		<span
			>G-force: <span class="font-semibold text-[#f0ece4]"
				>{liveG !== null ? liveG.toFixed(2) : '—'}</span
			></span
		>
		<span
			>Speed: <span class="font-semibold text-[#f0ece4]"
				>{liveSpeed !== null ? `${liveSpeed.toFixed(1)} km/h` : '—'}</span
			></span
		>
	</div>

	<!-- Merged scrub bar: seek control + G-force timeline in one -->
	<svg
		bind:this={barEl}
		viewBox="0 0 {BAR_WIDTH} {BAR_HEIGHT}"
		class="w-full touch-none rounded-lg border border-[#221c18] bg-[#0a0809]"
		role="slider"
		aria-label="Video position"
		aria-valuemin={0}
		aria-valuemax={videoDuration}
		aria-valuenow={currentTime}
		tabindex="0"
		onpointerdown={handlePointerDown}
		onpointermove={handlePointerMove}
		onpointerup={handlePointerUp}
		onkeydown={handleBarKeydown}
	>
		<!-- data-covered region -->
		<rect
			x={dataRegionX1}
			y="0"
			width={Math.max(0, dataRegionX2 - dataRegionX1)}
			height={BAR_HEIGHT}
			fill="#221c18"
			opacity="0.5"
		/>
		{#if tracePath}
			<path d={tracePath} fill="none" stroke="#f5a623" stroke-width="2" />
		{/if}
		<line x1={cursorX} y1="0" x2={cursorX} y2={BAR_HEIGHT} stroke="#f0ece4" stroke-width="2" />
	</svg>
</div>

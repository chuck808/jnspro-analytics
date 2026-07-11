/**
 * SVG path and rendering helpers
 */

/**
 * Returns the stroke-dasharray value for a circular gauge arc.
 * Usage: stroke-dasharray={gaugeArcPath(score)}
 *   score: 0–100
 */
export function gaugeArcPath(score: number, _radius = 15.9155): string {
	const pct = Math.min(100, Math.max(0, score));
	return `${pct}, 100`;
}

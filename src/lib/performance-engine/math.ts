export function mean(values: number[]): number | null {
	const clean = values.filter(Number.isFinite);
	if (!clean.length) return null;
	return clean.reduce((a, b) => a + b, 0) / clean.length;
}

export function min(values: number[]): number | null {
	const clean = values.filter(Number.isFinite);
	return clean.length ? Math.min(...clean) : null;
}

export function max(values: number[]): number | null {
	const clean = values.filter(Number.isFinite);
	return clean.length ? Math.max(...clean) : null;
}

export function standardDeviation(values: number[]): number | null {
	const m = mean(values);
	if (m === null) return null;
	const variance = values.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / values.length;
	return Math.sqrt(variance);
}

export function coefficientOfVariation(values: number[]): number | null {
	const m = mean(values);
	const sd = standardDeviation(values);
	if (!m || sd === null) return null;
	return (sd / m) * 100;
}

export function round(value: number | null | undefined, places = 2): number | null {
	if (value === null || value === undefined || !Number.isFinite(value)) return null;
	const factor = Math.pow(10, places);
	return Math.round(value * factor) / factor;
}

export function clamp(value: number, low = 0, high = 100): number {
	return Math.max(low, Math.min(high, value));
}

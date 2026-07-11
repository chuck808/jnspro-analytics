import type {
	ReportChart,
	ReportMetric,
	ReportPriority,
	ReportRecommendation,
	ReportSection,
	ReportSectionType
} from './types';

export function createSection(params: {
	id: string;
	type: ReportSectionType;
	title: string;
	priority?: ReportPriority;
	content?: string[];
	metrics?: ReportMetric[];
	charts?: ReportChart[];
}): ReportSection {
	return {
		id: params.id,
		type: params.type,
		title: params.title,
		priority: params.priority ?? 'medium',
		content: params.content ?? [],
		metrics: params.metrics,
		charts: params.charts
	};
}

export function createRecommendation(params: {
	id: string;
	priority?: ReportPriority;
	title: string;
	body: string;
	watchFor?: string;
}): ReportRecommendation {
	return {
		id: params.id,
		priority: params.priority ?? 'medium',
		title: params.title,
		body: params.body,
		watchFor: params.watchFor
	};
}

export function compactLines(lines: Array<string | null | undefined>): string[] {
	return lines.filter((line): line is string => Boolean(line && line.trim()));
}

export function formatPercent(value: number | null | undefined, decimals = 1): string {
	if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
	return `${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number | null | undefined, decimals = 1): string {
	if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
	return value.toFixed(decimals);
}

export function reportId(prefix: string): string {
	return `${prefix}-${Date.now()}`;
}

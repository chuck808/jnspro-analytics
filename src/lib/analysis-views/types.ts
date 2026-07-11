import type { DetailLevel, SessionAnalysis } from '$lib/performance-engine';

export interface DisplayMetric {
	label: string;
	value: string;
	explanation?: string;
	level: DetailLevel;
}

export interface DisplayInsight {
	tone: 'positive' | 'neutral' | 'warning';
	title: string;
	body: string;
}

export interface AnalysisView {
	level: DetailLevel;
	headline: string;
	summary: string;
	metrics: DisplayMetric[];
	insights: DisplayInsight[];
	nextActions: string[];
	showCharts: {
		acceleration: boolean;
		speed: boolean;
		impulse: boolean;
		power: boolean;
		jerk: boolean;
	};
	raw: SessionAnalysis;
}

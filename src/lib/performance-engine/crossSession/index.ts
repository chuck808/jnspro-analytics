/**
 * Performance Engine v8.0 — Cross-Session Intelligence
 * Public API
 */

export * from './types';
export * from './trendUtils';
export * from './progressionAnalysis';
export * from './consistencyTrends';
export * from './fatigueProgression';
export * from './crossSessionIntelligence';

// v8.1 - Enhanced Messaging & Feedback
export * from './messaging';
export * from './recommendationMessaging';

// v8.5 - Contextual Pattern Analysis
export * from './contextualPatterns';

// Shared SessionPerformanceSummary builder — consolidates what used to be two
// independently-drifting inline builders in analytics/+page.svelte and
// sessions/[id]/+layout.svelte.
export * from './buildSessionPerformanceSummary';

// Setup-change detection — automatic before/after comparison when a rider's
// bike or biometrics change between sessions.
export * from './setupChangeDetection';

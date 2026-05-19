/**
 * Run Types
 * Type definitions for BMX gate runs and related data structures
 */

/**
 * Run categorization tags
 * Used to classify runs and optionally exclude them from session statistics
 */
export type RunTag = 
  | 'warmup'              // Warmup run - typically excluded from stats
  | 'best-effort'         // Best effort/competition run
  | 'experimental'        // Trying new technique or setup
  | 'competition'         // Official competition run
  | 'exclude-from-stats'; // Explicitly exclude from all session statistics

/**
 * Run tag metadata for UI display
 */
export interface RunTagMeta {
  value: RunTag;
  label: string;
  icon: string;
  description: string;
  color: string;
}

/**
 * Available run tags with display metadata
 */
export const RUN_TAG_OPTIONS: RunTagMeta[] = [
  {
    value: 'warmup',
    label: 'Warmup',
    icon: '🔥',
    description: 'Warmup run - not counted in session averages',
    color: '#f5a623',
  },
  {
    value: 'best-effort',
    label: 'Best Effort',
    icon: '💪',
    description: 'Maximum effort run',
    color: '#3de8c8',
  },
  {
    value: 'experimental',
    label: 'Experimental',
    icon: '🧪',
    description: 'Testing new technique or setup',
    color: '#9b59b6',
  },
  {
    value: 'competition',
    label: 'Competition',
    icon: '🏆',
    description: 'Official competition or race',
    color: '#f5a623',
  },
  {
    value: 'exclude-from-stats',
    label: 'Exclude from Stats',
    icon: '🚫',
    description: 'Exclude this run from all session statistics',
    color: '#ff4444',
  },
];

/**
 * Helper function to check if a run should be excluded from statistics
 */
export function shouldExcludeFromStats(tags: RunTag[] | null): boolean {
  if (!tags || tags.length === 0) return false;
  return tags.includes('exclude-from-stats') || tags.includes('warmup');
}

/**
 * Returns human-readable labels for whichever tags caused a run to be excluded.
 * Returns an empty array if the run is not excluded.
 */
export function getExclusionReasons(tags: RunTag[] | null): string[] {
  if (!tags || tags.length === 0) return [];
  return tags
    .filter(t => t === 'warmup' || t === 'exclude-from-stats')
    .map(t => getTagMeta(t)?.label ?? t);
}

/**
 * Helper function to get tag metadata
 */
export function getTagMeta(tag: RunTag): RunTagMeta | undefined {
  return RUN_TAG_OPTIONS.find(opt => opt.value === tag);
}
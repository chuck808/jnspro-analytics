/**
 * Phase Consistency Analysis
 * Analyzes consistency across different phases of multiple runs
 */

export interface PhaseSplit {
  phase: string;
  time: number;
}

export interface RunWithSplits {
  splits: PhaseSplit[];
  [key: string]: unknown;
}

export interface PhaseConsistencyResult {
  phase: string;
  avg: number;
  spread: number;
  consistency: number;
}

/**
 * Analyzes phase consistency across multiple runs
 * @param runs - Array of runs with phase split data
 * @returns Array of consistency results per phase
 */
export function analysePhaseConsistency(runs: RunWithSplits[]): PhaseConsistencyResult[] {
  const phases: Record<string, number[]> = {};

  // Collect all times per phase
  runs.forEach(run => {
    if (!run.splits || !Array.isArray(run.splits)) return;
    
    run.splits.forEach(split => {
      if (!phases[split.phase]) {
        phases[split.phase] = [];
      }
      phases[split.phase].push(split.time);
    });
  });

  // Calculate statistics for each phase
  return Object.entries(phases).map(([phase, times]) => {
    if (times.length === 0) {
      return {
        phase,
        avg: 0,
        spread: 0,
        consistency: 0
      };
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const spread = Math.max(...times) - Math.min(...times);
    
    // Consistency score: 100 = perfect, lower = more variable
    // Avoid division by zero
    const consistency = avg > 0 ? 100 - (spread / avg) * 100 : 0;

    return {
      phase,
      avg,
      spread,
      consistency: Math.max(0, Math.min(100, consistency)) // Clamp between 0-100
    };
  });
}

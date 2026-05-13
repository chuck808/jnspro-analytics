/**
 * Phase Analysis - Detailed Drive/Transition/Velocity breakdown
 * Migrated from legacy analyticsExtended.ts
 */

export interface PhaseMetrics {
    drivePhase: {
        durationS: number;
        peakAccelMs2: number;
        timeToPeakS: number;
        efficiency: number;
    };
    transitionPhase: {
        durationS: number;
        velocityAtEndMs: number;
        transitionEfficiency: number;
    };
    velocityPhase: {
        durationS: number;
        peakVelocityMs: number;
        timeToMaxS: number;
        maintenanceScore: number;
    };
    technicalAssessment: string;
}

/**
 * Compute detailed phase analysis for a single run
 * Analyzes drive, transition, and velocity maintenance phases
 */
export function computeDetailedPhases(
    chartData: number[],
    elapsedMs: number
): PhaseMetrics | null {
    if (!chartData || chartData.length < 10 || !elapsedMs) {
        return null;
    }

    const dt = elapsedMs / 1000 / chartData.length;
    const velocities = chartData.map((g, i, arr) => {
        if (i === 0) return 0;
        const avgAccel = (arr.slice(0, i + 1).reduce((a, b) => a + b, 0) / (i + 1)) * 9.81;
        return avgAccel * (i * dt);
    });

    // ── Drive phase: acceleration build-up ────────────────────────────────────
    const peakAccel = Math.max(...chartData);
    const peakIdx = chartData.indexOf(peakAccel);
    const driveEnd = Math.round(peakIdx * 1.2);

    // ── Transition phase: acceleration plateau to inflection ─────────────────
    let inflection = driveEnd;
    for (let i = driveEnd; i < chartData.length - 1; i++) {
        if (chartData[i] < chartData[driveEnd] * 0.6) {
            inflection = i;
            break;
        }
    }

    // ── Velocity phase: post-inflection to peak velocity ─────────────────────
    const peakVel = Math.max(...velocities);
    const peakVelIdx = velocities.indexOf(peakVel);

    // ── Efficiency metrics ────────────────────────────────────────────────────
    const driveSlice = chartData.slice(0, driveEnd);
    const driveEff = driveSlice.length > 0
        ? driveSlice.reduce((a, b) => a + b, 0) / (driveSlice.length * peakAccel)
        : 0;

    const transSlice = chartData.slice(driveEnd, inflection);
    const transEff = transSlice.length > 0 && peakAccel > 0
        ? transSlice.reduce((a, b) => a + b, 0) / (transSlice.length * peakAccel)
        : 0.5;

    const velPhaseVels = velocities.slice(inflection);
    const velMaint = velPhaseVels.length > 0 && peakVel > 0
        ? velPhaseVels.reduce((a, b) => a + b, 0) / (velPhaseVels.length * peakVel)
        : 0;

    // ── Technical assessment ──────────────────────────────────────────────────
    let technicalAssessment: string;
    if (driveEff > 0.8 && transEff > 0.7 && velMaint > 0.9) {
        technicalAssessment = 'Elite technical performance — optimal phase transitions throughout';
    } else if (driveEff > 0.7 && transEff > 0.6 && velMaint > 0.8) {
        technicalAssessment = 'Strong technical performance with good phase management';
    } else if (driveEff > 0.8 && (transEff < 0.6 || velMaint < 0.8)) {
        technicalAssessment = 'Explosive drive phase — focus on smoother transition and velocity maintenance';
    } else if (driveEff < 0.7 && transEff > 0.7 && velMaint > 0.8) {
        technicalAssessment = 'Good velocity profile — initial drive power needs improvement';
    } else {
        technicalAssessment = 'Technical improvements available across all phases — consistent practice will close the gaps';
    }

    return {
        drivePhase: {
            durationS: parseFloat((driveEnd * dt).toFixed(3)),
            peakAccelMs2: parseFloat((peakAccel * 9.81).toFixed(3)),
            timeToPeakS: parseFloat((peakIdx * dt).toFixed(3)),
            efficiency: parseFloat(Math.min(1, driveEff).toFixed(3)),
        },
        transitionPhase: {
            durationS: parseFloat(((inflection - driveEnd) * dt).toFixed(3)),
            velocityAtEndMs: parseFloat((velocities[inflection] ?? 0).toFixed(3)),
            transitionEfficiency: parseFloat(Math.min(1, transEff).toFixed(3)),
        },
        velocityPhase: {
            durationS: parseFloat(((peakVelIdx - inflection) * dt).toFixed(3)),
            peakVelocityMs: parseFloat(peakVel.toFixed(3)),
            timeToMaxS: parseFloat((peakVelIdx * dt).toFixed(3)),
            maintenanceScore: parseFloat(Math.min(1, velMaint).toFixed(3)),
        },
        technicalAssessment,
    };
}

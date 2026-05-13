/**
 * Benchmarking Service
 * 
 * Peer comparison and leaderboard system for performance benchmarking.
 * Privacy-focused with opt-in participation and anonymization.
 */

// Re-export all modules
export * from './peerComparison';
export * from './leaderboards';

// Main benchmarking interface
import { compareToPeers, determineAgeGroup, estimateExperienceLevel, type PeerComparisonResult, type PerformanceBenchmark } from './peerComparison';
import { generateLeaderboard, isUserOptedIn, type LeaderboardResult, type LeaderboardOptions } from './leaderboards';

/**
 * Complete benchmarking analysis for a user
 */
export interface BenchmarkingAnalysis {
    peerComparison: PeerComparisonResult | null;
    leaderboardRank: number | null;
    isOptedIn: boolean;
    privacyNote: string;
}

/**
 * Perform comprehensive benchmarking analysis
 * 
 * @param userData User profile and performance data
 * @param benchmark Performance benchmark data (from aggregated stats)
 * @returns Complete benchmarking analysis
 */
export async function analyzeBenchmarking(
    userData: {
        userId: string;
        age: number;
        sessionCount: number;
        currentValue: number;
        metric: string;
        lowerIsBetter: boolean;
    },
    benchmark: PerformanceBenchmark | null
): Promise<BenchmarkingAnalysis> {
    // Check if user is opted into leaderboards
    const isOptedIn = await isUserOptedIn(userData.userId);

    // If no benchmark data available, return null comparison
    if (!benchmark) {
        return {
            peerComparison: null,
            leaderboardRank: null,
            isOptedIn,
            privacyNote: 'Benchmarking data will be available once we have sufficient users in the system.'
        };
    }

    // Determine user's cohort
    const ageGroup = determineAgeGroup(userData.age);
    
    // Estimate experience level (would use actual percentile in production)
    const experienceLevel = estimateExperienceLevel(userData.sessionCount, 50); // placeholder percentile

    // Perform peer comparison
    const peerComparison = compareToPeers(
        userData.currentValue,
        userData.metric,
        ageGroup,
        experienceLevel,
        benchmark,
        userData.lowerIsBetter
    );

    // Get leaderboard rank (if opted in)
    let leaderboardRank: number | null = null;
    if (isOptedIn) {
        // In production, query actual leaderboard
        // const leaderboard = generateLeaderboard({...}, userData.userId);
        // leaderboardRank = leaderboard.userRank;
    }

    return {
        peerComparison,
        leaderboardRank,
        isOptedIn,
        privacyNote: isOptedIn 
            ? 'Your data is included in anonymized leaderboards.'
            : 'Opt-in to leaderboards to see your global ranking and contribute to community benchmarks.'
    };
}

/**
 * Check if benchmarking is available
 * Requires minimum sample size for privacy and statistical validity
 */
export function isBenchmarkingAvailable(sampleSize: number): boolean {
    const MINIMUM_SAMPLE_SIZE = 30; // Need at least 30 users for valid statistics
    return sampleSize >= MINIMUM_SAMPLE_SIZE;
}

/**
 * Get benchmarking privacy policy text
 */
export function getBenchmarkingPrivacyPolicy(): string {
    return `
**Benchmarking Privacy Policy**

Your privacy is our top priority. Here's how we handle benchmarking data:

1. **Opt-In Only**: You must explicitly choose to participate in leaderboards
2. **Anonymization**: Your display name is either chosen by you or auto-generated
3. **Aggregated Stats**: Individual data is never shown; only aggregate statistics
4. **Limited Sharing**: Only age group and experience level are shared, never identifying info
5. **Right to Withdraw**: You can opt-out at any time and your data will be removed

We use this data to:
- Provide you with meaningful performance comparisons
- Help you set realistic goals
- Build a supportive community of riders
    `.trim();
}

/**
 * Suggest whether user should opt into benchmarking
 */
export function shouldSuggestOptIn(sessionCount: number, hasActiveGoals: boolean): boolean {
    // Suggest opt-in after user has some sessions and is engaged
    return sessionCount >= 5 && hasActiveGoals;
}

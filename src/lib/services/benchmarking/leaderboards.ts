/**
 * Leaderboards System
 * 
 * Privacy-preserving leaderboards with filtering and opt-in participation.
 * Supports multiple metrics and time periods.
 */

import type { AgeGroup, ExperienceLevel } from './peerComparison';

export type TimePeriod = 'all_time' | 'month' | 'week';
export type LeaderboardMetric = 'reactionTime' | 'peakSpeed' | 'maxG' | 'consistency';

export interface LeaderboardEntry {
    rank: number;
    userId: string;
    displayName: string;  // Anonymized or chosen username
    value: number;
    isCurrentUser: boolean;
    ageGroup?: AgeGroup;
    experienceLevel?: ExperienceLevel;
    sessionCount?: number;
}

export interface LeaderboardOptions {
    metric: LeaderboardMetric;
    timePeriod: TimePeriod;
    ageGroup?: AgeGroup;
    experienceLevel?: ExperienceLevel;
    limit?: number;
}

export interface LeaderboardResult {
    entries: LeaderboardEntry[];
    userRank: number | null;
    userEntry: LeaderboardEntry | null;
    totalEntries: number;
    filters: {
        metric: LeaderboardMetric;
        timePeriod: TimePeriod;
        ageGroup?: AgeGroup;
        experienceLevel?: ExperienceLevel;
    };
}

/**
 * Generate leaderboard (mock implementation - replace with DB query)
 * In production, this would query the database for actual user data
 */
export function generateLeaderboard(
    options: LeaderboardOptions,
    currentUserId: string
): LeaderboardResult {
    // This is a mock implementation
    // In production, replace with actual database query
    
    const limit = options.limit || 100;
    
    // Mock data generation (replace with real DB query)
    const entries = generateMockEntries(options, currentUserId, limit);
    
    // Find user's rank and entry
    const userEntry = entries.find(e => e.userId === currentUserId) || null;
    const userRank = userEntry?.rank || null;

    return {
        entries,
        userRank,
        userEntry,
        totalEntries: entries.length,
        filters: {
            metric: options.metric,
            timePeriod: options.timePeriod,
            ageGroup: options.ageGroup,
            experienceLevel: options.experienceLevel
        }
    };
}

/**
 * Mock entry generation (replace with real DB query)
 */
function generateMockEntries(
    options: LeaderboardOptions,
    currentUserId: string,
    limit: number
): LeaderboardEntry[] {
    // This is placeholder - in production, query actual user data
    const entries: LeaderboardEntry[] = [];
    
    // Note: This should be replaced with:
    // SELECT user_id, display_name, best_value, age_group, experience_level
    // FROM leaderboard_view
    // WHERE metric = ? AND time_period = ? AND (age_group = ? OR ? IS NULL)
    // ORDER BY best_value ASC/DESC
    // LIMIT ?
    
    return entries;
}

/**
 * Check if user is opted into leaderboards
 * In production, check user preferences table
 */
export function isUserOptedIn(userId: string): Promise<boolean> {
    // Placeholder - check database
    return Promise.resolve(false);
}

/**
 * Opt user into leaderboards
 */
export async function optIntoLeaderboards(userId: string, displayName: string): Promise<void> {
    // Update user preferences in database
    // INSERT INTO user_leaderboard_preferences (user_id, opted_in, display_name)
    // VALUES (?, true, ?)
    // ON CONFLICT (user_id) DO UPDATE SET opted_in = true, display_name = ?
}

/**
 * Opt user out of leaderboards
 */
export async function optOutOfLeaderboards(userId: string): Promise<void> {
    // Update user preferences in database
    // UPDATE user_leaderboard_preferences SET opted_in = false WHERE user_id = ?
}

/**
 * Get user's position in various leaderboards
 */
export interface UserLeaderboardStats {
    reactionTime: {
        rank: number | null;
        totalEntries: number;
        percentile: number | null;
    };
    peakSpeed: {
        rank: number | null;
        totalEntries: number;
        percentile: number | null;
    };
    maxG: {
        rank: number | null;
        totalEntries: number;
        percentile: number | null;
    };
}

/**
 * Get user's standings across all metrics
 */
export async function getUserLeaderboardStats(userId: string): Promise<UserLeaderboardStats> {
    // Placeholder - query database for user's rank in each metric
    return {
        reactionTime: { rank: null, totalEntries: 0, percentile: null },
        peakSpeed: { rank: null, totalEntries: 0, percentile: null },
        maxG: { rank: null, totalEntries: 0, percentile: null }
    };
}

/**
 * Get metric display name
 */
export function getMetricDisplayName(metric: LeaderboardMetric): string {
    switch (metric) {
        case 'reactionTime': return 'Reaction Time';
        case 'peakSpeed': return 'Peak Speed';
        case 'maxG': return 'Maximum G-Force';
        case 'consistency': return 'Consistency Score';
    }
}

/**
 * Get time period display name
 */
export function getTimePeriodDisplayName(period: TimePeriod): string {
    switch (period) {
        case 'all_time': return 'All Time';
        case 'month': return 'This Month';
        case 'week': return 'This Week';
    }
}

/**
 * Format leaderboard value for display
 */
export function formatLeaderboardValue(value: number, metric: LeaderboardMetric): string {
    switch (metric) {
        case 'reactionTime':
            return `${(value / 1000).toFixed(3)}s`;
        case 'peakSpeed':
            return `${(value * 3.6).toFixed(1)} km/h`;
        case 'maxG':
            return `${value.toFixed(2)}g`;
        case 'consistency':
            return `${value.toFixed(1)}%`;
    }
}

/**
 * Get medal emoji for top 3
 */
export function getRankMedal(rank: number): string {
    switch (rank) {
        case 1: return '🥇';
        case 2: return '🥈';
        case 3: return '🥉';
        default: return '';
    }
}

/**
 * Check if user is in top percentage
 */
export function isTopPercentage(rank: number, totalEntries: number, percentage: number): boolean {
    if (totalEntries === 0) return false;
    const threshold = Math.ceil(totalEntries * (percentage / 100));
    return rank <= threshold;
}

/**
 * Generate anonymized display name
 */
export function generateAnonymousName(userId: string): string {
    // Generate consistent anonymous name from user ID
    const hash = simpleHash(userId);
    const adjectives = ['Fast', 'Quick', 'Swift', 'Rapid', 'Lightning', 'Speed', 'Power', 'Pro'];
    const nouns = ['Rider', 'Racer', 'Pilot', 'Athlete', 'Champion', 'Star', 'Ace', 'Legend'];
    
    const adj = adjectives[hash % adjectives.length];
    const noun = nouns[Math.floor(hash / adjectives.length) % nouns.length];
    const num = (hash % 9999).toString().padStart(4, '0');
    
    return `${adj}${noun}${num}`;
}

/**
 * Simple hash function for consistent anonymization
 */
function simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

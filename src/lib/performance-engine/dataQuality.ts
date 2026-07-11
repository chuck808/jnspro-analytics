/**
 * Data Quality Assessment
 * Evaluates sensor data quality based on bias correction
 * Enhanced with legacy analytics.ts badge/color system
 */

export type DataQualityRating = 'excellent' | 'good' | 'fair' | 'calibrate' | 'unknown';

export interface DataQualityAssessment {
	rating: DataQualityRating;
	bias?: number;
	label: 'Excellent' | 'Good' | 'Fair' | 'Poor';
	color: string;
	badge: string;
	description: string;
}

/**
 * Assesses data quality based on bias correction value
 * @param bias - Bias correction value (typically in m/s²)
 * @returns Quality assessment with rating, badge, and description
 * Migrated from legacy analytics.ts with enhancements
 */
export function assessDataQuality(bias: number | null | undefined): DataQualityAssessment {
	if (bias == null) {
		return {
			rating: 'unknown',
			label: 'Poor',
			color: '#ff4444',
			badge: '⚠ No data',
			description: 'Speed analytics unavailable'
		};
	}

	const absBias = Math.abs(bias);

	if (absBias < 0.5) {
		return {
			rating: 'excellent',
			bias: absBias,
			label: 'Excellent',
			color: '#3de8c8',
			badge: '✓ Excellent',
			description: 'Highly accurate speed tracking'
		};
	}

	if (absBias < 1.0) {
		return {
			rating: 'good',
			bias: absBias,
			label: 'Good',
			color: '#f5a623',
			badge: '✓ Good',
			description: 'Reliable speed tracking'
		};
	}

	if (absBias < 2.0) {
		return {
			rating: 'fair',
			bias: absBias,
			label: 'Fair',
			color: '#ffcc44',
			badge: '⚠ Fair',
			description: 'Minor drift — check sensor placement'
		};
	}

	return {
		rating: 'calibrate',
		bias: absBias,
		label: 'Poor',
		color: '#ff4444',
		badge: '⚠ Poor',
		description: 'High drift — calibrate before next session'
	};
}

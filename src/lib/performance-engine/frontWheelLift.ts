/**
 * Front Wheel Lift Analysis
 * Analyzes wheelie behavior during gate starts
 */

export interface FrontWheelLiftInput {
	front_wheel_lifted?: boolean | null;
	wheelie_duration_ms?: number | null;
	max_pitch?: number | null;
	time_to_wheelie_ms?: number | null;
}

export type WheelieClassification =
	| 'no-lift'
	| 'controlled'
	| 'late-lift'
	| 'excessive-lift'
	| 'unknown';

export interface FrontWheelLiftAnalysis {
	detected: boolean;
	maxPitch: number | null;
	timeToLift: number | null;
	duration: number | null;
	classification: WheelieClassification;
}

/**
 * Analyzes front wheel lift/wheelie behavior
 * @param input - Input data containing wheelie metrics
 * @returns Analysis with classification and metrics
 */
export function analyseFrontWheelLift(input: FrontWheelLiftInput): FrontWheelLiftAnalysis {
	const detected = !!input.front_wheel_lifted || (input.wheelie_duration_ms ?? 0) > 0;

	const maxPitch = input.max_pitch ?? null;
	const timeToLift = input.time_to_wheelie_ms ?? null;
	const duration = input.wheelie_duration_ms ?? null;

	let classification: WheelieClassification;

	if (!detected) {
		classification = 'no-lift';
	} else if (maxPitch !== null && duration !== null && (maxPitch > 18 || duration > 900)) {
		classification = 'excessive-lift';
	} else if (timeToLift !== null && timeToLift > 700) {
		classification = 'late-lift';
	} else {
		classification = 'controlled';
	}

	return {
		detected,
		maxPitch,
		timeToLift,
		duration,
		classification
	};
}

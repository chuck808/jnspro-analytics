export interface CalibrationChecklistItem {
	id: string;
	label: string;
	why: string;
	status: 'required' | 'recommended';
}

export const BMX_CALIBRATION_CHECKLIST: CalibrationChecklistItem[] = [
	{
		id: 'acceleration-scale',
		label: 'Confirm acceleration scale uses 1g = 9.80665 m/s²',
		why: 'Incorrect scaling affects velocity, distance, impulse and power.',
		status: 'required'
	},
	{
		id: 'time-units',
		label: 'Confirm timestamps are seconds, not milliseconds',
		why: 'Time-unit mistakes create unrealistic speed and power values.',
		status: 'required'
	},
	{
		id: 'device-mounting',
		label: 'Keep device mounting consistent',
		why: 'Different mounting positions change acceleration and jerk signatures.',
		status: 'recommended'
	},
	{
		id: 'track-context',
		label: 'Record track, hill, gear and tyre context',
		why: 'Speed and G thresholds are not comparable without session context.',
		status: 'recommended'
	},
	{
		id: 'known-distance-check',
		label: 'Validate integrated distance against a known distance',
		why: 'Distance drift indicates integration or filtering issues.',
		status: 'required'
	}
];

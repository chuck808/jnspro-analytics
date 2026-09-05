export const progressDimensionPalette = {
	launchQuality: '#8de51e',
	explosiveness: '#59d25e',
	speedCarry: '#34d9ed',
	smoothness: '#c178ff',
	impulseTiming: '#ff9d2f',
	repeatability: '#3dd5c5'
} as const;

export type ProgressDimensionKey = keyof typeof progressDimensionPalette;

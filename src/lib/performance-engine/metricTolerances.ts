export interface MetricTolerance {
  excellent: number;
  good: number;
  poor: number;
  unit: string;
}

export interface MetricTolerances {
  reactionTime: MetricTolerance;
  speed: MetricTolerance;
  g: MetricTolerance;
}

export const METRIC_TOLERANCES: MetricTolerances = {
  reactionTime: {
    excellent: 0.025,
    good: 0.06,
    poor: 0.12,
    unit: 's'
  },
  speed: {
    excellent: 1.0,
    good: 2.5,
    poor: 5.0,
    unit: 'km/h'
  },
  g: {
    excellent: 0.15,
    good: 0.35,
    poor: 0.7,
    unit: 'g'
  }
};

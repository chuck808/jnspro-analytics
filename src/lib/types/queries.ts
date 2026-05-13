import type { Database } from './database.types';

type Tables = Database['public']['Tables'];
type TireLibraryRow = Tables['tire_library']['Row'];
type BikeRow = Tables['bikes']['Row'];
type RiderProfileRow = Tables['rider_profiles']['Row'];
type GateRunRow = Tables['gate_runs']['Row'];
type RunRow = Tables['runs']['Row'];
type SessionRow = Tables['sessions']['Row'];
type UserPreferencesRow = Tables['user_preferences']['Row'];
type ProfileRow = Tables['profiles']['Row'];
type TrainingGoalRow = Tables['training_goals']['Row'];

export type TireInfo = Pick<TireLibraryRow, 'brand' | 'model' | 'size' | 'diameter_inches'>;

export type BikeWithTires = Pick<BikeRow,
    'id' | 'name' | 'weight_kg' | 'crank_length_mm' |
    'chainring_teeth' | 'sprocket_teeth'
> & {
    front_tire: TireInfo | null;
    rear_tire: TireInfo | null;
};

export type SessionWithRelations = Pick<SessionRow,
    'id' | 'session_type' | 'timestamp' | 'notes' | 'archived' |
    'weather_conditions' | 'track_surface' | 'session_focus' | 'ride_feel'
> & {
    bikes: BikeWithTires | null;
    rider_profiles: Pick<RiderProfileRow,
        'height_cm' | 'weight_kg' | 'rider_level' | 'date_of_birth' | 'sex'
    > | null;
};

export type SessionListItem = Pick<SessionRow,
    'id' | 'session_type' | 'timestamp' | 'notes' | 'archived'
> & {
    bikes: Pick<BikeRow, 'name'> | null;
    runs: Array<Pick<RunRow, 'id' | 'elapsed_time_ms' | 'distance_m'> & {
        gate_runs: Array<Pick<GateRunRow,
            'reaction_time_ms' | 'max_g' | 'peak_speed_ms' | 'analytics_valid'
        >> | null;
    }>;
};

export type GoalWithProfile = Pick<TrainingGoalRow,
    'id' | 'user_id' | 'metric' | 'target_value' | 'start_value' | 'current_value' |
    'deadline' | 'completed' | 'completed_at' | 'created_at' | 'updated_at'
> & {
    profiles: Pick<ProfileRow, 'email' | 'name'> | null;
};

export interface AdaptiveAnalysisSuggestion {
    id: string;
    text: string;
    priority?: 'high' | 'medium' | 'low';
}

export interface GoalWithAdaptiveAnalysis {
    adaptiveAnalysis?: {
        suggestions: AdaptiveAnalysisSuggestion[];
    };
}

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	// Allows to automatically instantiate createClient with right options
	// instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
	__InternalSupabase: {
		PostgrestVersion: '14.1';
	};
	public: {
		Tables: {
			admin_role_audit: {
				Row: {
					actor_id: string | null;
					changed_at: string;
					id: number;
					new_role: string;
					old_role: string | null;
					reason: string | null;
					target_id: string;
				};
				Insert: {
					actor_id?: string | null;
					changed_at?: string;
					id?: number;
					new_role: string;
					old_role?: string | null;
					reason?: string | null;
					target_id: string;
				};
				Update: {
					actor_id?: string | null;
					changed_at?: string;
					id?: number;
					new_role?: string;
					old_role?: string | null;
					reason?: string | null;
					target_id?: string;
				};
				Relationships: [];
			};
			bikes: {
				Row: {
					chainring_teeth: number;
					crank_length_mm: number | null;
					created_at: string;
					custom_wheel_diameter_inches: number | null;
					front_tire_id: number | null;
					id: number;
					is_active: boolean;
					name: string;
					notes: string | null;
					rear_tire_id: number | null;
					sprocket_teeth: number;
					updated_at: string;
					user_id: string;
					weight_kg: number | null;
				};
				Insert: {
					chainring_teeth: number;
					crank_length_mm?: number | null;
					created_at?: string;
					custom_wheel_diameter_inches?: number | null;
					front_tire_id?: number | null;
					id?: number;
					is_active?: boolean;
					name: string;
					notes?: string | null;
					rear_tire_id?: number | null;
					sprocket_teeth: number;
					updated_at?: string;
					user_id: string;
					weight_kg?: number | null;
				};
				Update: {
					chainring_teeth?: number;
					crank_length_mm?: number | null;
					created_at?: string;
					custom_wheel_diameter_inches?: number | null;
					front_tire_id?: number | null;
					id?: number;
					is_active?: boolean;
					name?: string;
					notes?: string | null;
					rear_tire_id?: number | null;
					sprocket_teeth?: number;
					updated_at?: string;
					user_id?: string;
					weight_kg?: number | null;
				};
				Relationships: [
					{
						foreignKeyName: 'bikes_front_tire_id_fkey';
						columns: ['front_tire_id'];
						isOneToOne: false;
						referencedRelation: 'tire_library';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'bikes_rear_tire_id_fkey';
						columns: ['rear_tire_id'];
						isOneToOne: false;
						referencedRelation: 'tire_library';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'bikes_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			device_uploads: {
				Row: {
					completed_at: string | null;
					created_at: string | null;
					device_id: string | null;
					filename: string;
					firmware_version: string | null;
					id: string;
					schema_version: number | null;
					session_id: string | null;
					status: string;
					storage_path: string;
					user_id: string | null;
				};
				Insert: {
					completed_at?: string | null;
					created_at?: string | null;
					device_id?: string | null;
					filename: string;
					firmware_version?: string | null;
					id?: string;
					schema_version?: number | null;
					session_id?: string | null;
					status?: string;
					storage_path: string;
					user_id?: string | null;
				};
				Update: {
					completed_at?: string | null;
					created_at?: string | null;
					device_id?: string | null;
					filename?: string;
					firmware_version?: string | null;
					id?: string;
					schema_version?: number | null;
					session_id?: string | null;
					status?: string;
					storage_path?: string;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'device_uploads_device_id_fkey';
						columns: ['device_id'];
						isOneToOne: false;
						referencedRelation: 'devices';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'device_uploads_session_id_fkey';
						columns: ['session_id'];
						isOneToOne: false;
						referencedRelation: 'sessions';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'device_uploads_session_id_fkey';
						columns: ['session_id'];
						isOneToOne: false;
						referencedRelation: 'sessions_active';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'device_uploads_session_id_fkey';
						columns: ['session_id'];
						isOneToOne: false;
						referencedRelation: 'sessions_detailed';
						referencedColumns: ['id'];
					}
				];
			};
			devices: {
				Row: {
					created_at: string | null;
					device_name: string | null;
					device_secret: string;
					id: string;
					user_id: string | null;
				};
				Insert: {
					created_at?: string | null;
					device_name?: string | null;
					device_secret: string;
					id?: string;
					user_id?: string | null;
				};
				Update: {
					created_at?: string | null;
					device_name?: string | null;
					device_secret?: string;
					id?: string;
					user_id?: string | null;
				};
				Relationships: [];
			};
			error_events: {
				Row: {
					created_at: string;
					detail: string | null;
					id: number;
					message: string;
					route: string;
					severity: string;
					status_code: number;
					user_id: string | null;
				};
				Insert: {
					created_at?: string;
					detail?: string | null;
					id?: number;
					message: string;
					route: string;
					severity: string;
					status_code: number;
					user_id?: string | null;
				};
				Update: {
					created_at?: string;
					detail?: string | null;
					id?: number;
					message?: string;
					route?: string;
					severity?: string;
					status_code?: number;
					user_id?: string | null;
				};
				Relationships: [];
			};
			feedback: {
				Row: {
					admin_notes: string | null;
					created_at: string | null;
					description: string;
					email: string | null;
					id: string;
					status: string | null;
					subject: string;
					type: string;
					updated_at: string | null;
					user_id: string | null;
				};
				Insert: {
					admin_notes?: string | null;
					created_at?: string | null;
					description: string;
					email?: string | null;
					id?: string;
					status?: string | null;
					subject: string;
					type: string;
					updated_at?: string | null;
					user_id?: string | null;
				};
				Update: {
					admin_notes?: string | null;
					created_at?: string | null;
					description?: string;
					email?: string | null;
					id?: string;
					status?: string | null;
					subject?: string;
					type?: string;
					updated_at?: string | null;
					user_id?: string | null;
				};
				Relationships: [];
			};
			gate_runs: {
				Row: {
					analytics_valid: boolean;
					avg_g: number;
					avg_pitch_deg: number | null;
					avg_speed_ms_calc: number | null;
					bias_correction_ms2: number | null;
					front_wheel_lifted: boolean | null;
					max_g: number;
					max_pitch_deg: number | null;
					peak_speed_ms: number | null;
					pitch_at_peak_g_deg: number | null;
					reaction_time_ms: number;
					run_id: string;
					speed_ms: number | null;
					time_ms: number | null;
					time_to_peak_speed_ms: number | null;
					time_to_wheelie_ms: number | null;
					wheelie_duration_ms: number | null;
				};
				Insert: {
					analytics_valid?: boolean;
					avg_g: number;
					avg_pitch_deg?: number | null;
					avg_speed_ms_calc?: number | null;
					bias_correction_ms2?: number | null;
					front_wheel_lifted?: boolean | null;
					max_g: number;
					max_pitch_deg?: number | null;
					peak_speed_ms?: number | null;
					pitch_at_peak_g_deg?: number | null;
					reaction_time_ms: number;
					run_id: string;
					speed_ms?: number | null;
					time_ms?: number | null;
					time_to_peak_speed_ms?: number | null;
					time_to_wheelie_ms?: number | null;
					wheelie_duration_ms?: number | null;
				};
				Update: {
					analytics_valid?: boolean;
					avg_g?: number;
					avg_pitch_deg?: number | null;
					avg_speed_ms_calc?: number | null;
					bias_correction_ms2?: number | null;
					front_wheel_lifted?: boolean | null;
					max_g?: number;
					max_pitch_deg?: number | null;
					peak_speed_ms?: number | null;
					pitch_at_peak_g_deg?: number | null;
					reaction_time_ms?: number;
					run_id?: string;
					speed_ms?: number | null;
					time_ms?: number | null;
					time_to_peak_speed_ms?: number | null;
					time_to_wheelie_ms?: number | null;
					wheelie_duration_ms?: number | null;
				};
				Relationships: [
					{
						foreignKeyName: 'gate_runs_run_id_fkey';
						columns: ['run_id'];
						isOneToOne: true;
						referencedRelation: 'runs';
						referencedColumns: ['id'];
					}
				];
			};
			goal_milestones: {
				Row: {
					achieved_at: string;
					goal_id: string;
					id: number;
					value: number;
				};
				Insert: {
					achieved_at?: string;
					goal_id: string;
					id?: number;
					value: number;
				};
				Update: {
					achieved_at?: string;
					goal_id?: string;
					id?: number;
					value?: number;
				};
				Relationships: [
					{
						foreignKeyName: 'goal_milestones_goal_id_fkey';
						columns: ['goal_id'];
						isOneToOne: false;
						referencedRelation: 'training_goals';
						referencedColumns: ['id'];
					}
				];
			};
			help_faqs: {
				Row: {
					answer: string;
					category: string;
					created_at: string;
					created_by: string | null;
					display_order: number;
					id: string;
					is_published: boolean;
					question: string;
					updated_at: string;
					updated_by: string | null;
				};
				Insert: {
					answer: string;
					category: string;
					created_at?: string;
					created_by?: string | null;
					display_order?: number;
					id?: string;
					is_published?: boolean;
					question: string;
					updated_at?: string;
					updated_by?: string | null;
				};
				Update: {
					answer?: string;
					category?: string;
					created_at?: string;
					created_by?: string | null;
					display_order?: number;
					id?: string;
					is_published?: boolean;
					question?: string;
					updated_at?: string;
					updated_by?: string | null;
				};
				Relationships: [];
			};
			insight_feedback: {
				Row: {
					comment: string | null;
					content: string;
					context: Json | null;
					created_at: string | null;
					detail_level: string | null;
					id: string;
					insight_type: string;
					response: string;
					rider_id: string | null;
					session_id: string | null;
					timestamp: string;
				};
				Insert: {
					comment?: string | null;
					content: string;
					context?: Json | null;
					created_at?: string | null;
					detail_level?: string | null;
					id?: string;
					insight_type: string;
					response: string;
					rider_id?: string | null;
					session_id?: string | null;
					timestamp: string;
				};
				Update: {
					comment?: string | null;
					content?: string;
					context?: Json | null;
					created_at?: string | null;
					detail_level?: string | null;
					id?: string;
					insight_type?: string;
					response?: string;
					rider_id?: string | null;
					session_id?: string | null;
					timestamp?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'insight_feedback_session_id_fkey';
						columns: ['session_id'];
						isOneToOne: false;
						referencedRelation: 'sessions';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'insight_feedback_session_id_fkey';
						columns: ['session_id'];
						isOneToOne: false;
						referencedRelation: 'sessions_active';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'insight_feedback_session_id_fkey';
						columns: ['session_id'];
						isOneToOne: false;
						referencedRelation: 'sessions_detailed';
						referencedColumns: ['id'];
					}
				];
			};
			maintenance_schedules: {
				Row: {
					created_at: string | null;
					created_by: string | null;
					description: string | null;
					end_time: string;
					id: string;
					is_active: boolean | null;
					start_time: string;
					title: string;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					created_by?: string | null;
					description?: string | null;
					end_time: string;
					id?: string;
					is_active?: boolean | null;
					start_time: string;
					title: string;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					created_by?: string | null;
					description?: string | null;
					end_time?: string;
					id?: string;
					is_active?: boolean | null;
					start_time?: string;
					title?: string;
					updated_at?: string | null;
				};
				Relationships: [];
			};
			page_view_events: {
				Row: {
					created_at: string;
					duration_ms: number | null;
					id: number;
					route: string;
					user_id: string | null;
				};
				Insert: {
					created_at?: string;
					duration_ms?: number | null;
					id?: number;
					route: string;
					user_id?: string | null;
				};
				Update: {
					created_at?: string;
					duration_ms?: number | null;
					id?: number;
					route?: string;
					user_id?: string | null;
				};
				Relationships: [];
			};
			performance_aggregates: {
				Row: {
					age_group: string;
					computed_at: string;
					experience_level: string;
					id: number;
					metric: string;
					percentile_10: number;
					percentile_25: number;
					percentile_50: number;
					percentile_75: number;
					percentile_90: number;
					sample_size: number;
				};
				Insert: {
					age_group: string;
					computed_at?: string;
					experience_level: string;
					id?: number;
					metric: string;
					percentile_10: number;
					percentile_25: number;
					percentile_50: number;
					percentile_75: number;
					percentile_90: number;
					sample_size: number;
				};
				Update: {
					age_group?: string;
					computed_at?: string;
					experience_level?: string;
					id?: number;
					metric?: string;
					percentile_10?: number;
					percentile_25?: number;
					percentile_50?: number;
					percentile_75?: number;
					percentile_90?: number;
					sample_size?: number;
				};
				Relationships: [];
			};
			profiles: {
				Row: {
					background_image_updated_at: string | null;
					background_image_url: string | null;
					club: string | null;
					country: string | null;
					created_at: string;
					deleted_at: string | null;
					display_name: string | null;
					email: string;
					id: string;
					name: string;
					participation_type: string | null;
					profile_icon_updated_at: string | null;
					profile_icon_url: string | null;
					races_competitively: boolean | null;
					research_consent: boolean | null;
					research_consent_at: string | null;
					role: string;
					team: string | null;
					updated_at: string;
				};
				Insert: {
					background_image_updated_at?: string | null;
					background_image_url?: string | null;
					club?: string | null;
					country?: string | null;
					created_at?: string;
					deleted_at?: string | null;
					display_name?: string | null;
					email: string;
					id: string;
					name?: string;
					participation_type?: string | null;
					profile_icon_updated_at?: string | null;
					profile_icon_url?: string | null;
					races_competitively?: boolean | null;
					research_consent?: boolean | null;
					research_consent_at?: string | null;
					role?: string;
					team?: string | null;
					updated_at?: string;
				};
				Update: {
					background_image_updated_at?: string | null;
					background_image_url?: string | null;
					club?: string | null;
					country?: string | null;
					created_at?: string;
					deleted_at?: string | null;
					display_name?: string | null;
					email?: string;
					id?: string;
					name?: string;
					participation_type?: string | null;
					profile_icon_updated_at?: string | null;
					profile_icon_url?: string | null;
					races_competitively?: boolean | null;
					research_consent?: boolean | null;
					research_consent_at?: string | null;
					role?: string;
					team?: string | null;
					updated_at?: string;
				};
				Relationships: [];
			};
			pyramid_cadence_runs: {
				Row: {
					actual_cadence_rpm: number;
					adherence_percentage: number;
					interval_duration_ms: number;
					interval_type: string;
					run_id: string;
					target_cadence_rpm: number;
				};
				Insert: {
					actual_cadence_rpm: number;
					adherence_percentage: number;
					interval_duration_ms: number;
					interval_type: string;
					run_id: string;
					target_cadence_rpm: number;
				};
				Update: {
					actual_cadence_rpm?: number;
					adherence_percentage?: number;
					interval_duration_ms?: number;
					interval_type?: string;
					run_id?: string;
					target_cadence_rpm?: number;
				};
				Relationships: [
					{
						foreignKeyName: 'pyramid_cadence_runs_run_id_fkey';
						columns: ['run_id'];
						isOneToOne: true;
						referencedRelation: 'runs';
						referencedColumns: ['id'];
					}
				];
			};
			quick_cadence_runs: {
				Row: {
					avg_cadence_rpm: number;
					burst_duration_ms: number;
					max_cadence_rpm: number;
					run_id: string;
				};
				Insert: {
					avg_cadence_rpm: number;
					burst_duration_ms: number;
					max_cadence_rpm: number;
					run_id: string;
				};
				Update: {
					avg_cadence_rpm?: number;
					burst_duration_ms?: number;
					max_cadence_rpm?: number;
					run_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'quick_cadence_runs_run_id_fkey';
						columns: ['run_id'];
						isOneToOne: true;
						referencedRelation: 'runs';
						referencedColumns: ['id'];
					}
				];
			};
			rider_performance_snapshots: {
				Row: {
					age_group: string | null;
					best_consistency: number | null;
					best_max_g: number | null;
					best_peak_speed_ms: number | null;
					best_reaction_ms: number | null;
					display_name: string | null;
					experience_level: string | null;
					participation_type: string | null;
					session_count: number;
					show_on_leaderboard: boolean;
					total_runs: number;
					uci_category: string | null;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					age_group?: string | null;
					best_consistency?: number | null;
					best_max_g?: number | null;
					best_peak_speed_ms?: number | null;
					best_reaction_ms?: number | null;
					display_name?: string | null;
					experience_level?: string | null;
					participation_type?: string | null;
					session_count?: number;
					show_on_leaderboard?: boolean;
					total_runs?: number;
					uci_category?: string | null;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					age_group?: string | null;
					best_consistency?: number | null;
					best_max_g?: number | null;
					best_peak_speed_ms?: number | null;
					best_reaction_ms?: number | null;
					display_name?: string | null;
					experience_level?: string | null;
					participation_type?: string | null;
					session_count?: number;
					show_on_leaderboard?: boolean;
					total_runs?: number;
					uci_category?: string | null;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [];
			};
			rider_profiles: {
				Row: {
					created_at: string;
					date_of_birth: string | null;
					dominant_leg: string | null;
					effective_from: string;
					height_cm: number | null;
					id: number;
					rider_level: string | null;
					sex: string | null;
					user_id: string;
					weight_kg: number | null;
					years_racing: number | null;
				};
				Insert: {
					created_at?: string;
					date_of_birth?: string | null;
					dominant_leg?: string | null;
					effective_from?: string;
					height_cm?: number | null;
					id?: number;
					rider_level?: string | null;
					sex?: string | null;
					user_id: string;
					weight_kg?: number | null;
					years_racing?: number | null;
				};
				Update: {
					created_at?: string;
					date_of_birth?: string | null;
					dominant_leg?: string | null;
					effective_from?: string;
					height_cm?: number | null;
					id?: number;
					rider_level?: string | null;
					sex?: string | null;
					user_id?: string;
					weight_kg?: number | null;
					years_racing?: number | null;
				};
				Relationships: [
					{
						foreignKeyName: 'rider_profiles_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			run_timeseries: {
				Row: {
					created_at: string;
					g_force_data: Json | null;
					linear_accel_g: Json | null;
					pitch_deg: Json | null;
					raw_accel_g: Json | null;
					roll_deg: Json | null;
					run_id: string;
					sample_count: number;
					sample_rate_hz: number;
				};
				Insert: {
					created_at?: string;
					g_force_data?: Json | null;
					linear_accel_g?: Json | null;
					pitch_deg?: Json | null;
					raw_accel_g?: Json | null;
					roll_deg?: Json | null;
					run_id: string;
					sample_count: number;
					sample_rate_hz?: number;
				};
				Update: {
					created_at?: string;
					g_force_data?: Json | null;
					linear_accel_g?: Json | null;
					pitch_deg?: Json | null;
					raw_accel_g?: Json | null;
					roll_deg?: Json | null;
					run_id?: string;
					sample_count?: number;
					sample_rate_hz?: number;
				};
				Relationships: [
					{
						foreignKeyName: 'run_timeseries_run_id_fkey';
						columns: ['run_id'];
						isOneToOne: true;
						referencedRelation: 'runs';
						referencedColumns: ['id'];
					}
				];
			};
			runs: {
				Row: {
					chart_data: Json;
					created_at: string;
					distance_m: number | null;
					elapsed_time_ms: number | null;
					id: string;
					run_number: number;
					session_id: string;
					tags: string[] | null;
					updated_at: string;
				};
				Insert: {
					chart_data: Json;
					created_at?: string;
					distance_m?: number | null;
					elapsed_time_ms?: number | null;
					id?: string;
					run_number: number;
					session_id: string;
					tags?: string[] | null;
					updated_at?: string;
				};
				Update: {
					chart_data?: Json;
					created_at?: string;
					distance_m?: number | null;
					elapsed_time_ms?: number | null;
					id?: string;
					run_number?: number;
					session_id?: string;
					tags?: string[] | null;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'runs_session_id_fkey';
						columns: ['session_id'];
						isOneToOne: false;
						referencedRelation: 'sessions';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'runs_session_id_fkey';
						columns: ['session_id'];
						isOneToOne: false;
						referencedRelation: 'sessions_active';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'runs_session_id_fkey';
						columns: ['session_id'];
						isOneToOne: false;
						referencedRelation: 'sessions_detailed';
						referencedColumns: ['id'];
					}
				];
			};
			session_notes: {
				Row: {
					author_role: string | null;
					content: string;
					created_at: string | null;
					id: string;
					note_type: string;
					session_id: string;
					updated_at: string | null;
					user_id: string;
				};
				Insert: {
					author_role?: string | null;
					content: string;
					created_at?: string | null;
					id?: string;
					note_type: string;
					session_id: string;
					updated_at?: string | null;
					user_id: string;
				};
				Update: {
					author_role?: string | null;
					content?: string;
					created_at?: string | null;
					id?: string;
					note_type?: string;
					session_id?: string;
					updated_at?: string | null;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'session_notes_session_fkey';
						columns: ['session_id'];
						isOneToOne: false;
						referencedRelation: 'sessions';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'session_notes_session_fkey';
						columns: ['session_id'];
						isOneToOne: false;
						referencedRelation: 'sessions_active';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'session_notes_session_fkey';
						columns: ['session_id'];
						isOneToOne: false;
						referencedRelation: 'sessions_detailed';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'session_notes_session_id_fkey';
						columns: ['session_id'];
						isOneToOne: false;
						referencedRelation: 'sessions';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'session_notes_session_id_fkey';
						columns: ['session_id'];
						isOneToOne: false;
						referencedRelation: 'sessions_active';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'session_notes_session_id_fkey';
						columns: ['session_id'];
						isOneToOne: false;
						referencedRelation: 'sessions_detailed';
						referencedColumns: ['id'];
					}
				];
			};
			sessions: {
				Row: {
					archived: boolean;
					bike_id: number | null;
					created_at: string;
					file_checksum: string | null;
					id: string;
					notes: string | null;
					ride_feel: string | null;
					rider_profile_id: number | null;
					session_focus: string | null;
					session_type: string;
					timestamp: string;
					track_surface: string | null;
					updated_at: string;
					user_id: string;
					weather_conditions: string | null;
				};
				Insert: {
					archived?: boolean;
					bike_id?: number | null;
					created_at?: string;
					file_checksum?: string | null;
					id?: string;
					notes?: string | null;
					ride_feel?: string | null;
					rider_profile_id?: number | null;
					session_focus?: string | null;
					session_type: string;
					timestamp: string;
					track_surface?: string | null;
					updated_at?: string;
					user_id: string;
					weather_conditions?: string | null;
				};
				Update: {
					archived?: boolean;
					bike_id?: number | null;
					created_at?: string;
					file_checksum?: string | null;
					id?: string;
					notes?: string | null;
					ride_feel?: string | null;
					rider_profile_id?: number | null;
					session_focus?: string | null;
					session_type?: string;
					timestamp?: string;
					track_surface?: string | null;
					updated_at?: string;
					user_id?: string;
					weather_conditions?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'sessions_bike_id_fkey';
						columns: ['bike_id'];
						isOneToOne: false;
						referencedRelation: 'bikes';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'sessions_bike_id_fkey';
						columns: ['bike_id'];
						isOneToOne: false;
						referencedRelation: 'current_bikes';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'sessions_bike_id_fkey';
						columns: ['bike_id'];
						isOneToOne: false;
						referencedRelation: 'equipment_performance';
						referencedColumns: ['bike_id'];
					},
					{
						foreignKeyName: 'sessions_rider_profile_id_fkey';
						columns: ['rider_profile_id'];
						isOneToOne: false;
						referencedRelation: 'current_rider_profiles';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'sessions_rider_profile_id_fkey';
						columns: ['rider_profile_id'];
						isOneToOne: false;
						referencedRelation: 'rider_profiles';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'sessions_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			sprint_runs: {
				Row: {
					actual_time_ms: number | null;
					avg_acceleration_g: number;
					max_acceleration_g: number;
					peak_velocity_kmh: number;
					reaction_time_ms: number | null;
					run_id: string;
				};
				Insert: {
					actual_time_ms?: number | null;
					avg_acceleration_g: number;
					max_acceleration_g: number;
					peak_velocity_kmh: number;
					reaction_time_ms?: number | null;
					run_id: string;
				};
				Update: {
					actual_time_ms?: number | null;
					avg_acceleration_g?: number;
					max_acceleration_g?: number;
					peak_velocity_kmh?: number;
					reaction_time_ms?: number | null;
					run_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'sprint_runs_run_id_fkey';
						columns: ['run_id'];
						isOneToOne: true;
						referencedRelation: 'runs';
						referencedColumns: ['id'];
					}
				];
			};
			threshold_profiles: {
				Row: {
					computed_at: string;
					id: number;
					impulse_90_excellent: number;
					impulse_90_good: number;
					impulse_90_needs_work: number;
					notes: string | null;
					peak_g_excellent: number;
					peak_g_good: number;
					profile_level: string;
					reaction_ms_excellent: number;
					reaction_ms_good: number;
					reaction_ms_needs_work: number;
					sample_size: number | null;
					smoothness_excellent: number;
					smoothness_good: number;
					source: string;
					speed_carry_excellent: number;
					speed_carry_good: number;
				};
				Insert: {
					computed_at?: string;
					id?: number;
					impulse_90_excellent: number;
					impulse_90_good: number;
					impulse_90_needs_work: number;
					notes?: string | null;
					peak_g_excellent: number;
					peak_g_good: number;
					profile_level: string;
					reaction_ms_excellent: number;
					reaction_ms_good: number;
					reaction_ms_needs_work: number;
					sample_size?: number | null;
					smoothness_excellent: number;
					smoothness_good: number;
					source: string;
					speed_carry_excellent: number;
					speed_carry_good: number;
				};
				Update: {
					computed_at?: string;
					id?: number;
					impulse_90_excellent?: number;
					impulse_90_good?: number;
					impulse_90_needs_work?: number;
					notes?: string | null;
					peak_g_excellent?: number;
					peak_g_good?: number;
					profile_level?: string;
					reaction_ms_excellent?: number;
					reaction_ms_good?: number;
					reaction_ms_needs_work?: number;
					sample_size?: number | null;
					smoothness_excellent?: number;
					smoothness_good?: number;
					source?: string;
					speed_carry_excellent?: number;
					speed_carry_good?: number;
				};
				Relationships: [];
			};
			tire_library: {
				Row: {
					brand: string;
					diameter_inches: number | null;
					id: number;
					model: string;
					size: string;
				};
				Insert: {
					brand: string;
					diameter_inches?: number | null;
					id?: number;
					model: string;
					size: string;
				};
				Update: {
					brand?: string;
					diameter_inches?: number | null;
					id?: number;
					model?: string;
					size?: string;
				};
				Relationships: [];
			};
			training_goals: {
				Row: {
					completed: boolean;
					completed_at: string | null;
					created_at: string;
					current_value: number | null;
					deadline: string | null;
					distance_m: number | null;
					id: string;
					metric: string;
					start_value: number | null;
					target_value: number;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					completed?: boolean;
					completed_at?: string | null;
					created_at?: string;
					current_value?: number | null;
					deadline?: string | null;
					distance_m?: number | null;
					id?: string;
					metric: string;
					start_value?: number | null;
					target_value: number;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					completed?: boolean;
					completed_at?: string | null;
					created_at?: string;
					current_value?: number | null;
					deadline?: string | null;
					distance_m?: number | null;
					id?: string;
					metric?: string;
					start_value?: number | null;
					target_value?: number;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'training_goals_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			user_preferences: {
				Row: {
					email_alerts: boolean;
					leaderboard_display_name: string | null;
					measurement_unit: string;
					progress_reports: boolean;
					share_stats: boolean;
					show_background_image: boolean | null;
					show_decimal: boolean;
					show_on_leaderboard: boolean;
					show_profile_icon: boolean | null;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					email_alerts?: boolean;
					leaderboard_display_name?: string | null;
					measurement_unit?: string;
					progress_reports?: boolean;
					share_stats?: boolean;
					show_background_image?: boolean | null;
					show_decimal?: boolean;
					show_on_leaderboard?: boolean;
					show_profile_icon?: boolean | null;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					email_alerts?: boolean;
					leaderboard_display_name?: string | null;
					measurement_unit?: string;
					progress_reports?: boolean;
					share_stats?: boolean;
					show_background_image?: boolean | null;
					show_decimal?: boolean;
					show_on_leaderboard?: boolean;
					show_profile_icon?: boolean | null;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'user_preferences_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: true;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			user_subscriptions: {
				Row: {
					activated_at: string | null;
					plan_id: string | null;
					price: number | null;
					status: string;
					updated_at: string;
					user_id: string;
					valid_until: string | null;
				};
				Insert: {
					activated_at?: string | null;
					plan_id?: string | null;
					price?: number | null;
					status?: string;
					updated_at?: string;
					user_id: string;
					valid_until?: string | null;
				};
				Update: {
					activated_at?: string | null;
					plan_id?: string | null;
					price?: number | null;
					status?: string;
					updated_at?: string;
					user_id?: string;
					valid_until?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'user_subscriptions_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: true;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
		};
		Views: {
			admin_perf_metrics: {
				Row: {
					avg_ms: number | null;
					p50_ms: number | null;
					p95_ms: number | null;
					request_count: number | null;
				};
				Relationships: [];
			};
			current_bikes: {
				Row: {
					chainring_teeth: number | null;
					crank_length_mm: number | null;
					created_at: string | null;
					custom_wheel_diameter_inches: number | null;
					front_tire_id: number | null;
					id: number | null;
					is_active: boolean | null;
					name: string | null;
					notes: string | null;
					rear_tire_id: number | null;
					sprocket_teeth: number | null;
					updated_at: string | null;
					user_id: string | null;
					weight_kg: number | null;
				};
				Relationships: [
					{
						foreignKeyName: 'bikes_front_tire_id_fkey';
						columns: ['front_tire_id'];
						isOneToOne: false;
						referencedRelation: 'tire_library';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'bikes_rear_tire_id_fkey';
						columns: ['rear_tire_id'];
						isOneToOne: false;
						referencedRelation: 'tire_library';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'bikes_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			current_rider_profiles: {
				Row: {
					created_at: string | null;
					effective_from: string | null;
					height_cm: number | null;
					id: number | null;
					rider_level: string | null;
					user_id: string | null;
					weight_kg: number | null;
				};
				Relationships: [
					{
						foreignKeyName: 'rider_profiles_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			daily_performance_stats: {
				Row: {
					avg_peak_g: number | null;
					avg_reaction_ms: number | null;
					avg_speed_ms: number | null;
					best_peak_g: number | null;
					best_reaction_ms: number | null;
					best_speed_ms: number | null;
					reaction_stddev: number | null;
					session_count: number | null;
					session_type: string | null;
					total_runs: number | null;
					training_date: string | null;
					user_id: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'sessions_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			distance_performance_stats: {
				Row: {
					attempt_count: number | null;
					avg_peak_g: number | null;
					avg_reaction_ms: number | null;
					avg_time_ms: number | null;
					best_peak_g: number | null;
					best_reaction_ms: number | null;
					best_time_ms: number | null;
					distance_m: number | null;
					user_id: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'sessions_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			equipment_performance: {
				Row: {
					avg_peak_g: number | null;
					avg_reaction_ms: number | null;
					avg_speed_ms: number | null;
					bike_id: number | null;
					bike_name: string | null;
					sessions_used: number | null;
					user_id: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'bikes_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			insight_feedback_summary: {
				Row: {
					confusing_count: number | null;
					first_feedback: string | null;
					ignored_count: number | null;
					insight_type: string | null;
					last_feedback: string | null;
					not_useful_count: number | null;
					total_responses: number | null;
					useful_count: number | null;
					usefulness_percent: number | null;
				};
				Relationships: [];
			};
			leaderboard_view: {
				Row: {
					age_group: string | null;
					best_consistency: number | null;
					best_max_g: number | null;
					best_peak_speed_ms: number | null;
					best_reaction_ms: number | null;
					display_name: string | null;
					experience_level: string | null;
					session_count: number | null;
					user_id: string | null;
				};
				Insert: {
					age_group?: string | null;
					best_consistency?: number | null;
					best_max_g?: number | null;
					best_peak_speed_ms?: number | null;
					best_reaction_ms?: number | null;
					display_name?: never;
					experience_level?: string | null;
					session_count?: number | null;
					user_id?: string | null;
				};
				Update: {
					age_group?: string | null;
					best_consistency?: number | null;
					best_max_g?: number | null;
					best_peak_speed_ms?: number | null;
					best_reaction_ms?: number | null;
					display_name?: never;
					experience_level?: string | null;
					session_count?: number | null;
					user_id?: string | null;
				};
				Relationships: [];
			};
			sessions_active: {
				Row: {
					archived: boolean | null;
					bike_id: number | null;
					created_at: string | null;
					id: string | null;
					notes: string | null;
					rider_profile_id: number | null;
					session_type: string | null;
					timestamp: string | null;
					updated_at: string | null;
					user_id: string | null;
				};
				Insert: {
					archived?: boolean | null;
					bike_id?: number | null;
					created_at?: string | null;
					id?: string | null;
					notes?: string | null;
					rider_profile_id?: number | null;
					session_type?: string | null;
					timestamp?: string | null;
					updated_at?: string | null;
					user_id?: string | null;
				};
				Update: {
					archived?: boolean | null;
					bike_id?: number | null;
					created_at?: string | null;
					id?: string | null;
					notes?: string | null;
					rider_profile_id?: number | null;
					session_type?: string | null;
					timestamp?: string | null;
					updated_at?: string | null;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'sessions_bike_id_fkey';
						columns: ['bike_id'];
						isOneToOne: false;
						referencedRelation: 'bikes';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'sessions_bike_id_fkey';
						columns: ['bike_id'];
						isOneToOne: false;
						referencedRelation: 'current_bikes';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'sessions_bike_id_fkey';
						columns: ['bike_id'];
						isOneToOne: false;
						referencedRelation: 'equipment_performance';
						referencedColumns: ['bike_id'];
					},
					{
						foreignKeyName: 'sessions_rider_profile_id_fkey';
						columns: ['rider_profile_id'];
						isOneToOne: false;
						referencedRelation: 'current_rider_profiles';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'sessions_rider_profile_id_fkey';
						columns: ['rider_profile_id'];
						isOneToOne: false;
						referencedRelation: 'rider_profiles';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'sessions_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			sessions_detailed: {
				Row: {
					archived: boolean | null;
					bike_name: string | null;
					bike_weight_kg: number | null;
					chainring_teeth: number | null;
					crank_length_mm: number | null;
					effective_wheel_diameter: number | null;
					front_tire_brand: string | null;
					front_tire_diameter: number | null;
					front_tire_model: string | null;
					gear_ratio: number | null;
					height_cm: number | null;
					id: string | null;
					notes: string | null;
					rear_tire_brand: string | null;
					rear_tire_diameter: number | null;
					rear_tire_model: string | null;
					rider_level: string | null;
					session_type: string | null;
					sprocket_teeth: number | null;
					timestamp: string | null;
					total_mass_kg: number | null;
					user_email: string | null;
					user_id: string | null;
					user_name: string | null;
					weight_kg: number | null;
				};
				Relationships: [
					{
						foreignKeyName: 'sessions_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
		};
		Functions: {
			archive_session: { Args: { p_session_id: string }; Returns: undefined };
			get_period_metrics: {
				Args: {
					p_end_date: string;
					p_session_type?: string;
					p_start_date: string;
					p_user_id: string;
				};
				Returns: {
					avg_max_pitch_deg: number;
					avg_peak_g: number;
					avg_peak_speed_ms: number;
					avg_reaction_ms: number;
					best_peak_g: number;
					best_peak_speed_ms: number;
					best_reaction_ms: number;
					consistency_score: number;
					total_runs: number;
					total_sessions: number;
					wheelie_count: number;
				}[];
			};
			get_trend_data: {
				Args: {
					p_end_date: string;
					p_session_type?: string;
					p_start_date: string;
					p_user_id: string;
				};
				Returns: {
					avg_max_pitch_deg: number;
					avg_peak_speed_ms: number;
					avg_reaction_ms: number;
					best_peak_speed_ms: number;
					best_reaction_ms: number;
					consistency_score: number;
					max_g: number;
					session_date: string;
					wheelie_count: number;
				}[];
			};
			get_user_image_url: {
				Args: { p_image_type: string; p_user_id: string };
				Returns: string;
			};
			is_admin: { Args: never; Returns: boolean };
			owns_goal: { Args: { p_goal_id: string }; Returns: boolean };
			owns_run: { Args: { p_run_id: string }; Returns: boolean };
			owns_session: { Args: { p_session_id: string }; Returns: boolean };
			owns_user_id: { Args: { p_user_id: string }; Returns: boolean };
			refresh_analytics_views: { Args: never; Returns: undefined };
			refresh_performance_aggregates: { Args: never; Returns: undefined };
			refresh_threshold_profiles: { Args: never; Returns: undefined };
			set_user_role: {
				Args: { p_new_role: string; p_reason?: string; p_target_id: string };
				Returns: undefined;
			};
			unarchive_session: { Args: { p_session_id: string }; Returns: undefined };
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
		: never = never
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema['Tables']
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema['Tables']
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
		| keyof DefaultSchema['Enums']
		| { schema: keyof DatabaseWithoutInternals },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
		: never = never
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
		? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema['CompositeTypes']
		| { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
		: never = never
> = PublicCompositeTypeNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
		? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	public: {
		Enums: {}
	}
} as const;

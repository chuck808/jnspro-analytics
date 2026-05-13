/**
 * Session Context Types
 * 
 * Types and utilities for capturing environmental and operational context
 * that affects training sessions (weather, surface, focus areas, etc.)
 */

export type WeatherCondition = 
    | 'sunny' 
    | 'partly-cloudy' 
    | 'cloudy' 
    | 'light-rain' 
    | 'rain' 
    | 'windy' 
    | 'cold' 
    | 'hot';

export type TrackSurface = 
    | 'dry-concrete' 
    | 'dry-asphalt' 
    | 'damp' 
    | 'wet' 
    | 'muddy' 
    | 'indoor';

export type SessionFocus = 
    | 'reaction-time' 
    | 'explosiveness' 
    | 'speed-carry' 
    | 'technique' 
    | 'endurance' 
    | 'consistency' 
    | 'recovery' 
    | 'testing';

export interface WeatherMeta {
    value: WeatherCondition;
    label: string;
    icon: string;
    description: string;
}

export interface SurfaceMeta {
    value: TrackSurface;
    label: string;
    icon: string;
    description: string;
}

export interface FocusMeta {
    value: SessionFocus;
    label: string;
    icon: string;
    description: string;
    color: string;
}

export const WEATHER_OPTIONS: WeatherMeta[] = [
    { value: 'sunny', label: 'Sunny', icon: '☀️', description: 'Clear skies, bright sunshine' },
    { value: 'partly-cloudy', label: 'Partly Cloudy', icon: '⛅', description: 'Mix of sun and clouds' },
    { value: 'cloudy', label: 'Cloudy', icon: '☁️', description: 'Overcast, no direct sun' },
    { value: 'light-rain', label: 'Light Rain', icon: '🌦️', description: 'Drizzle or light showers' },
    { value: 'rain', label: 'Rain', icon: '🌧️', description: 'Steady rainfall' },
    { value: 'windy', label: 'Windy', icon: '💨', description: 'Strong wind conditions' },
    { value: 'cold', label: 'Cold', icon: '🥶', description: 'Low temperature' },
    { value: 'hot', label: 'Hot', icon: '🔥', description: 'High temperature' },
];

export const SURFACE_OPTIONS: SurfaceMeta[] = [
    { value: 'dry-concrete', label: 'Dry Concrete', icon: '🏗️', description: 'Dry concrete surface - optimal grip' },
    { value: 'dry-asphalt', label: 'Dry Asphalt', icon: '🛣️', description: 'Dry asphalt - good conditions' },
    { value: 'damp', label: 'Damp', icon: '💧', description: 'Surface slightly wet, reduced grip' },
    { value: 'wet', label: 'Wet', icon: '🌊', description: 'Surface wet, significantly reduced grip' },
    { value: 'muddy', label: 'Muddy', icon: '🟤', description: 'Muddy conditions, poor grip' },
    { value: 'indoor', label: 'Indoor', icon: '🏠', description: 'Indoor track - controlled conditions' },
];

export const FOCUS_OPTIONS: FocusMeta[] = [
    { 
        value: 'reaction-time', 
        label: 'Reaction Time', 
        icon: '⚡', 
        description: 'Focus on gate start reaction speed',
        color: '#f5a623'
    },
    { 
        value: 'explosiveness', 
        label: 'Explosiveness', 
        icon: '💥', 
        description: 'Maximum power output in first stroke',
        color: '#ff6b3d'
    },
    { 
        value: 'speed-carry', 
        label: 'Speed & Carry', 
        icon: '🚀', 
        description: 'Maintaining speed through the gate',
        color: '#3de8c8'
    },
    { 
        value: 'technique', 
        label: 'Technique', 
        icon: '🎯', 
        description: 'Refining movement patterns and form',
        color: '#9b87f5'
    },
    { 
        value: 'endurance', 
        label: 'Endurance', 
        icon: '🔋', 
        description: 'High-volume session, stamina building',
        color: '#8bc34a'
    },
    { 
        value: 'consistency', 
        label: 'Consistency', 
        icon: '🎲', 
        description: 'Repeatable performance across runs',
        color: '#ffcc44'
    },
    { 
        value: 'recovery', 
        label: 'Recovery', 
        icon: '🧘', 
        description: 'Light session, active recovery',
        color: '#9a8f7a'
    },
    { 
        value: 'testing', 
        label: 'Testing', 
        icon: '🔬', 
        description: 'Baseline testing or assessment',
        color: '#6b5f4d'
    },
];

/**
 * Get metadata for a weather condition
 */
export function getWeatherMeta(condition: WeatherCondition | null): WeatherMeta | null {
    if (!condition) return null;
    return WEATHER_OPTIONS.find(opt => opt.value === condition) ?? null;
}

/**
 * Get metadata for a track surface
 */
export function getSurfaceMeta(surface: TrackSurface | null): SurfaceMeta | null {
    if (!surface) return null;
    return SURFACE_OPTIONS.find(opt => opt.value === surface) ?? null;
}

/**
 * Get metadata for a session focus
 */
export function getFocusMeta(focus: SessionFocus | null): FocusMeta | null {
    if (!focus) return null;
    return FOCUS_OPTIONS.find(opt => opt.value === focus) ?? null;
}

/**
 * Session context data structure
 */
export interface SessionContext {
    weatherConditions: WeatherCondition | null;
    trackSurface: TrackSurface | null;
    sessionFocus: SessionFocus | null;
}

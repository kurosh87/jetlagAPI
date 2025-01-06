import { AdaptationSchedule } from './circadian';

export interface Airport {
  code: string;
  timezone: string;
  name?: string;
  city?: string;
  country?: string;
}

export interface FlightDetails {
  origin: Airport;
  destination: Airport;
  departureTime: string; // ISO 8601 format
  arrivalTime: string; // ISO 8601 format
  duration: number; // in minutes
  carrier?: string;
  flightNumber?: string;
  layovers?: Array<{
    airport: Airport;
    duration: number; // in minutes
    arrivalTime: string; // ISO 8601 format
    departureTime: string; // ISO 8601 format
  }>;
}

export interface UserPreferences {
  chronotype?: 'early' | 'normal' | 'late';
  lightSensitivity?: 'low' | 'normal' | 'high';
  caffeineMetabolism?: 'fast' | 'normal' | 'slow';
  typicalSleepDuration?: number; // in hours
  preferredWakeTime?: string; // HH:mm format
  canTakeMelatonin?: boolean;
}

export interface JetlagCalculationRequest {
  flight: FlightDetails;
  preferences?: UserPreferences;
}

export interface JetlagCalculationResponse {
  adaptationSchedule: AdaptationSchedule;
  requestId: string; // For tracking and saving history
  calculatedAt: string; // ISO 8601 format
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
} 
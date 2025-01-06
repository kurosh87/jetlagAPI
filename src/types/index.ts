export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Timezone {
  name: string;
  offset: number; // Hours from UTC
}

export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  timezone: {
    name: string;
    offset: number;
  };
  location: {
    latitude: number;
    longitude: number;
  };
}

export interface Layover {
  airport: Airport;
  arrival: Date;
  departure: Date;
  duration: number; // in seconds
}

export interface Flight {
  carrier: string;
  flightNumber: string;
  origin: Airport;
  destination: Airport;
  departure: Date;
  arrival: Date;
  duration: number; // in seconds
  layovers?: Layover[];
}

export interface JetlagSeverity {
  score: number;
  factors: {
    timezoneChange: number;
    direction: 'eastward' | 'westward';
    flightDuration: number;
    arrivalTime: number;
    layoverImpact?: number;
    accumulatedFatigue?: number;
  };
}

export type ActivityType = 'light' | 'sleep' | 'caffeine' | 'supplement' | 'exercise' | 'meal';
export type LightIntensity = 'no' | 'some' | 'full';

export interface TimeWindow {
  start: string;
  end: string;
}

export type ActivityPriority = 'critical' | 'high' | 'medium' | 'low';

export interface Activity {
  type: ActivityType;
  timeWindow: {
    start: string;
    end: string;
  };
  description: string;
  priority: ActivityPriority;
  intensity?: LightIntensity;
  naturalLight?: boolean;
  isFlexible?: boolean;
  duration?: number;
}

export interface AdaptationDay {
  day: number;
  activities: Activity[];
}

export interface ActivitySchedule {
  preFlightActivities: Activity[];
  arrivalDayActivities: Activity[];
  adaptationDays: AdaptationDay[];
  severity: JetlagSeverity;
  recommendations: string[];
}

export interface CircadianPhase {
  bedtime: string; // 24-hour format HH:mm
  wakeTime: string; // 24-hour format HH:mm
  peakAlertness: string; // 24-hour format HH:mm
  naturalMelatoninOnset: string; // 24-hour format HH:mm
  cbtMin?: string; // Core body temperature minimum, typically ~2 hours before wake
}

export interface LightExposureWindow {
  start: string;
  end: string;
  intensity: LightIntensity;
  naturalLight: boolean;
  type: 'advance' | 'delay' | 'maintain';
  priority: 'critical' | 'optimal' | 'avoid';
}

export interface LightSchedule {
  preFlight: LightExposureWindow[];
  inFlight: LightExposureWindow[];
  arrival: LightExposureWindow[];
  adaptation: LightExposureWindow[][];
}

export interface LightConditions {
  latitude: number;
  longitude: number;
  sunriseTime?: string;
  sunsetTime?: string;
  dayLength?: number;
  uvIndex?: number;
  season?: 'winter' | 'spring' | 'summer' | 'fall';
  cloudCover?: number;
}

export interface LightTiming {
  morning: {
    start: string;
    duration: number;
    intensity: LightIntensity;
    naturalLight: boolean;
    type: 'advance' | 'delay' | 'maintain';
  };
  evening: {
    start: string;
    duration: number;
    intensity: LightIntensity;
    naturalLight: boolean;
    type: 'advance' | 'delay' | 'maintain';
  };
}

export interface UserPreferences {
  chronotype: 'early' | 'intermediate' | 'late';
  usualBedtime: string; // 24-hour format HH:mm
  usualWakeTime: string; // 24-hour format HH:mm
  lightSensitivity: 'low' | 'normal' | 'high';
  melatoninTolerance: 'low' | 'normal' | 'high';
}

// Weather-related types
export interface WeatherData {
  clouds: number; // Cloud coverage percentage
  uvi: number; // UV index
  sunrise: number; // Unix timestamp
  sunset: number; // Unix timestamp
}

export interface LocationWeather {
  current: WeatherData;
  daily: WeatherData[];
}

export interface LightConditions {
  latitude: number;
  longitude: number;
  sunriseTime?: string;
  sunsetTime?: string;
  dayLength?: number;
  uvIndex?: number;
}

export interface LightTiming {
  morning: {
    start: string;
    duration: number;
    intensity: LightIntensity;
    naturalLight: boolean;
  };
  evening: {
    start: string;
    duration: number;
    intensity: LightIntensity;
    naturalLight: boolean;
  };
} 
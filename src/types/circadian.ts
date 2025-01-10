export enum LightIntensity {
  BRIGHT = 'BRIGHT',
  DIM = 'DIM'
}

export enum LightAction {
  ADVANCE = 'ADVANCE',
  DELAY = 'DELAY',
  AVOID = 'AVOID'
}

export enum LightPriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export enum ActivityType {
  SLEEP = 'sleep',
  BRIGHT_LIGHT = 'bright_light',
  AVOID_LIGHT = 'avoid_light',
  SUPPLEMENT = 'supplement',
  NAP = 'nap'
}

export enum ActivityPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum SupplementType {
  MELATONIN = 'melatonin'
}

export interface TimeWindow {
  start: string;
  end: string;
}

export interface LightTiming {
  brightLight: LightExposureWindow;
  avoidLight?: LightExposureWindow;
}

export interface LightExposureWindow {
  brightLight: TimeWindow;
  avoidLight?: TimeWindow;
  intensity: LightIntensity;
  type: LightAction;
  naturalLight?: boolean;
  priority: LightPriority;
  description?: string;
}

export interface SleepTiming {
  bedTime: string;
  wakeTime: string;
  totalDays: number;
}

export interface Activity {
  id: string;
  type: ActivityType;
  timeWindow: TimeWindow;
  priority: ActivityPriority;
  supplementType?: SupplementType;
}

export interface AdaptationDay {
  dayIndex: number;
  activities: Activity[];
}

export interface ActivitySchedule {
  arrivalDayActivities: Activity[];
  adaptationDays: AdaptationDay[];
}

export type Direction = 'eastward' | 'westward';

export interface LightConditions {
  latitude: number;
  longitude: number;
  sunriseTime?: string;
  sunsetTime?: string;
  dayLength?: number;
  uvIndex?: number;
}

export interface CircadianPhase {
  bedTime: string;
  wakeTime: string;
}

export const CIRCADIAN_CONSTANTS = {
  MAX_SHIFT_PER_DAY: 60, // minutes
  MIN_SLEEP_DURATION: 420, // 7 hours in minutes
  MAX_SLEEP_DURATION: 540, // 9 hours in minutes
  LIGHT_EXPOSURE_DURATION: 180, // 3 hours in minutes
  MIN_LIGHT_DURATION: 120, // 2 hours minimum
  MAX_LIGHT_DURATION: 240, // 4 hours maximum
  PHASE_SHIFT_RATE: 60, // minutes per day
  FATIGUE_HALF_LIFE: 1440, // 24 hours in minutes
  OPTIMAL_LIGHT_ADVANCE_HOURS: 180, // 3 hours
  OPTIMAL_LIGHT_DELAY_HOURS: 180, // 3 hours
  MELATONIN_BEFORE_BED: 60, // Take melatonin 1 hour before bed
  MELATONIN_WINDOW: 30, // 0.5 hours in minutes
  CAFFEINE_CUTOFF: 360, // 6 hours in minutes
  AVERAGE_ADJUSTMENT_RATE: 60, // 1 hour in minutes
  MAX_LIGHT_INTENSITY: 10000 // lux
} as const; 
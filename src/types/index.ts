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
  timezone: string;
  coordinates: Coordinates;
}

export interface Layover {
  airport: Airport;
  arrival: Date;
  departure: Date;
  duration: number; // in seconds
}

export interface Flight {
  id: string;
  carrier: string;
  flightNumber: string;
  origin: {
    code: string;
    name: string;
    city: string;
    country: string;
    timezone: string;
    coordinates: {
      latitude: number;
      longitude: number;
    }
  };
  destination: {
    code: string;
    name: string;
    city: string;
    country: string;
    timezone: string;
    coordinates: {
      latitude: number;
      longitude: number;
    }
  };
  departureTime: string | Date;
  arrivalTime: string | Date;
  duration: number;
  equipment: string;
  partnership?: {
    operatingCarrier: string;
    operatingFlightNumber: string;
  };
  isSegment: boolean;
  segmentIndex: number;
  totalSegments: number;
  layovers?: FlightLayover[];
}

export interface FlightLayover {
  airport: {
    code: string;
    name: string;
    city: string;
    country: string;
    timezone: string;
    coordinates: {
      latitude: number;
      longitude: number;
    }
  };
  arrival: string | Date;
  departure: string | Date;
  duration: number;
}

export interface JetlagSeverity {
  score: number;
  timezoneDifference: number;
  factors: {
    timezoneDifference: number;
    flightDuration: number;
    layoverImpact: number;
    directionality: 'eastward' | 'westward';
    timeOfDayImpact: number;
  };
  adaptationDays: number;
}

export enum ActivityType {
  SLEEP = 'sleep',
  LIGHT_EXPOSURE = 'light exposure',
  AVOID_LIGHT = 'avoid light',
  MELATONIN = 'melatonin',
  MEAL = 'meal',
  CAFFEINE = 'caffeine',
  EXERCISE = 'exercise'
}

export enum ActivityPriority {
  CRITICAL = 5,
  HIGH = 4,
  MEDIUM = 3,
  LOW = 2,
  FLEXIBLE = 1
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
  bedTime: string;
  wakeTime: string;
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

export interface AdaptationSchedule {
  preFlight: CircadianSchedule;
  inFlight: CircadianSchedule;
  postFlight: CircadianSchedule;
  severity: JetlagSeverity;
}

export const CIRCADIAN_CONSTANTS = {
  AVERAGE_ADJUSTMENT_RATE: 1,      // Hours per day the body can adjust
  MELATONIN_WINDOW: 2,            // Hours before desired sleep for melatonin
  CAFFEINE_HALFLIFE: 5,           // Hours for caffeine to reduce by half
  MIN_SLEEP_DURATION: 7,          // Minimum recommended sleep hours
  MAX_SLEEP_DURATION: 9,          // Maximum recommended sleep hours
  MAX_LIGHT_INTENSITY: 10000,     // Lux for bright light therapy
  DIM_LIGHT_THRESHOLD: 50,        // Lux threshold for melatonin production
  CORE_TEMP_MINIMUM: 4,           // Hours before natural wake time
  PHASE_ADVANCE_LIMIT: 2.5,       // Maximum hours to advance per day
  PHASE_DELAY_LIMIT: 2,           // Maximum hours to delay per day
  MEAL_TIMING_IMPACT: 0.5,        // Impact factor of meal timing
  MAX_SHIFT_PER_DAY: 60,         // Maximum minutes to shift per day
  CAFFEINE_CUTOFF: 6             // Hours before bed to stop caffeine
};

export const LIGHT_EXPOSURE_ADJUSTMENT = {
  ADVANCE: {
    MAX_SHIFT: 90,    // Maximum minutes to advance per day
    OPTIMAL_START: -6, // Hours before core body temperature minimum
    OPTIMAL_END: -2    // Hours before core body temperature minimum
  },
  DELAY: {
    MAX_SHIFT: 120,   // Maximum minutes to delay per day
    OPTIMAL_START: 2,  // Hours after core body temperature minimum
    OPTIMAL_END: 6     // Hours after core body temperature minimum
  }
};

export const MELATONIN_ADJUSTMENT = {
  ADVANCE: {
    DAILY_SHIFT: 60,  // Minutes to advance per day
    OPTIMAL_TIME: -5  // Hours before desired sleep time
  },
  DELAY: {
    DAILY_SHIFT: 90,  // Minutes to delay per day
    OPTIMAL_TIME: 2   // Hours after usual sleep time
  }
};

export const LIGHT_EXPOSURE_RULES = {
  ADVANCE: {
    OPTIMAL_START: -6,    // Hours before core body temperature minimum
    OPTIMAL_END: -2,      // Hours before core body temperature minimum
    AVOID_START: 2,       // Hours after core body temperature minimum
    AVOID_END: 6         // Hours after core body temperature minimum
  },
  DELAY: {
    OPTIMAL_START: 2,     // Hours after core body temperature minimum
    OPTIMAL_END: 6,       // Hours after core body temperature minimum
    AVOID_START: -6,      // Hours before core body temperature minimum
    AVOID_END: -2        // Hours before core body temperature minimum
  }
};

export const MELATONIN_RULES = {
  ADVANCE: {
    OPTIMAL_TIME: -5,     // Hours before desired sleep time
    DURATION: 0.5         // Hours to take effect
  },
  DELAY: {
    OPTIMAL_TIME: 2,      // Hours after usual sleep time
    DURATION: 0.5         // Hours to take effect
  },
  DOSAGE: {
    MINIMUM: 0.5,         // mg
    MAXIMUM: 5,           // mg
    STANDARD: 3           // mg
  }
};

export const MEAL_TIMING = {
  BREAKFAST: {
    EARLIEST: 'WAKE+30M',
    LATEST: 'WAKE+2H'
  },
  LUNCH: {
    WINDOW: 4  // hours around local noon
  },
  DINNER: {
    EARLIEST: 'SUNSET-3H',
    LATEST: 'BEDTIME-3H'
  }
};

export type Direction = 'eastward' | 'westward';
export type LightIntensity = 'no' | 'some' | 'full';

export interface TimeWindow {
  start: Date;
  end: Date;
  priority: ActivityPriority;
  notes?: string;
}

export interface MealWindow extends TimeWindow {
  type: 'breakfast' | 'lunch' | 'dinner';
}

export interface LightExposure extends TimeWindow {
  type: 'bright' | 'avoid';
  intensity?: number;
}

export interface CircadianSchedule {
  activities: Activity[];
  lightExposure: LightExposure[];
  melatoninWindows: TimeWindow[];
  caffeineWindows: TimeWindow[];
  mealWindows: MealWindow[];
  sleepWindows: TimeWindow[];
}

export interface Activity {
  id: string;
  type: ActivityType;
  timeWindow: TimeWindow;
  priority: ActivityPriority;
  duration?: string;
  notes?: string;
} 
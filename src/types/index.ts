export type Direction = 'eastward' | 'westward';

export interface TimeWindow {
  start: Date;
  end: Date;
  priority: ActivityPriority;
  notes?: string;
}

export interface LightExposure extends TimeWindow {
  type: 'bright' | 'avoid';
  intensity?: number;
}

export interface MealWindow extends TimeWindow {
  type: 'breakfast' | 'lunch' | 'dinner';
}

export interface CircadianSchedule {
  activities: Activity[];
  sleepWindows: TimeWindow[];
  lightExposure: LightExposure[];
  melatoninWindows: TimeWindow[];
  caffeineWindows: TimeWindow[];
  mealWindows: MealWindow[];
}

export interface AdaptationSchedule {
  preFlight: CircadianSchedule;
  inFlight: CircadianSchedule;
  postFlight: CircadianSchedule;
  severity: JetlagSeverity;
}

export interface JetlagSeverity {
  score: number;
  timezoneDifference: number;
  factors: {
    timezoneDifference: number;
    flightDuration: number;
    layoverImpact: number;
    directionality: Direction;
    timeOfDayImpact: number;
  };
  adaptationDays: number;
}

export enum ActivityType {
  SLEEP = 'SLEEP',
  LIGHT_EXPOSURE = 'LIGHT_EXPOSURE',
  AVOID_LIGHT = 'AVOID_LIGHT',
  MELATONIN = 'MELATONIN',
  MEAL = 'MEAL',
  CAFFEINE = 'CAFFEINE',
  EXERCISE = 'EXERCISE'
}

export enum ActivityPriority {
  CRITICAL = 5,
  HIGH = 4,
  MEDIUM = 3,
  LOW = 2,
  OPTIONAL = 1
}

export interface Activity {
  id: string;
  type: ActivityType;
  timeWindow: TimeWindow;
  priority: ActivityPriority;
  notes?: string;
}

export interface Airport {
  code: string;
  timezone: string;
  name: string;
  city: string;
  country: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface Layover {
  airport: Airport;
  arrival: string;
  departure: string;
  duration: number;
}

export interface Flight {
  id: string;
  carrier: string;
  flightNumber: string;
  origin: Airport;
  destination: Airport;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  equipment?: string;
  isSegment?: boolean;
  segmentIndex?: number;
  totalSegments?: number;
  partnership?: {
    operatingCarrier: string;
    operatingFlightNumber: string;
  };
  layovers?: Layover[];
}

export const CIRCADIAN_CONSTANTS = {
  MIN_SLEEP_DURATION: 7,
  MAX_LIGHT_INTENSITY: 10000,
  MELATONIN_WINDOW: 0.5,
  CAFFEINE_CUTOFF: 8,
  PHASE_ADVANCE_LIMIT: 2.5,
  PHASE_DELAY_LIMIT: 2,
  AVERAGE_ADJUSTMENT_RATE: 1
};

export const LIGHT_EXPOSURE_ADJUSTMENT = {
  ADVANCE: {
    START_HOURS_BEFORE_MIN: 7,
    DURATION_HOURS: 3
  },
  DELAY: {
    START_HOURS_AFTER_MIN: 2,
    DURATION_HOURS: 3
  }
};

export const MELATONIN_ADJUSTMENT = {
  ADVANCE: {
    HOURS_BEFORE_BEDTIME: 5,
    DAILY_SHIFT: 1
  },
  DELAY: {
    HOURS_BEFORE_BEDTIME: 0,
    DAILY_SHIFT: 1.5
  }
};

export const LIGHT_EXPOSURE_RULES = {
  MORNING: {
    START_OFFSET: 1,
    DURATION: 2
  },
  EVENING: {
    END_OFFSET: 2,
    DURATION: 2
  }
};

export const MELATONIN_RULES = {
  ADVANCE: {
    HOURS_BEFORE_BEDTIME: 5
  },
  DELAY: {
    HOURS_BEFORE_BEDTIME: 0
  }
};

export const MEAL_TIMING = {
  BREAKFAST: {
    MIN_AFTER_WAKE: 30,
    MAX_AFTER_WAKE: 120
  },
  LUNCH: {
    WINDOW_START: 11,
    WINDOW_END: 15
  },
  DINNER: {
    HOURS_BEFORE_BED: 3
  }
}; 
export enum ChronotypeCategory {
  EARLY_MORNING = 'EARLY_MORNING',
  MODERATE_MORNING = 'MODERATE_MORNING',
  NEUTRAL = 'NEUTRAL',
  MODERATE_EVENING = 'MODERATE_EVENING',
  LATE_EVENING = 'LATE_EVENING'
}

export enum SleepQuality {
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  POOR = 'POOR'
}

export enum AdaptationSpeed {
  CONSERVATIVE = 'CONSERVATIVE',
  MODERATE = 'MODERATE',
  AGGRESSIVE = 'AGGRESSIVE'
}

export interface SleepProfile {
  typicalBedTime: string;
  typicalWakeTime: string;
  sleepQuality: SleepQuality;
  sleepLatency: number; // minutes to fall asleep
  canNap: boolean;
  consistentSchedule: boolean;
}

export interface UserProfile {
  age: number;
  chronotype: ChronotypeCategory;
  sleepProfile: SleepProfile;
  previousJetlagRecovery?: {
    daysToRecover: number;
    symptoms: string[];
  };
}

export interface ChronotypeAssessmentQuestion {
  id: string;
  text: string;
  type: 'TIME_SELECT' | 'MULTIPLE_CHOICE' | 'SCALE';
  options: string[];
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  questions: ChronotypeAssessmentQuestion[];
  isRequired: boolean;
}

export interface OnboardingFlow {
  steps: OnboardingStep[];
  currentStep: number;
  completedSteps: string[];
  userResponses: {
    [stepId: string]: {
      [questionId: string]: string | number | boolean;
    };
  };
}

export interface PersonalizedSchedule {
  preFlightAdjustment: {
    days: AdaptationDay[];
  };
  duringFlight: {
    activities: Activity[];
    supplements: Supplement[];
  };
  postArrival: {
    days: AdaptationDay[];
    expectedRecoveryDays: number;
  };
}

export interface AdaptationDay {
  date: string;
  sleepWindow: {
    start: string;
    end: string;
    notes?: string;
  };
  naps?: {
    start: string;
    end: string;
    priority: 'RECOMMENDED' | 'OPTIONAL';
  }[];
  activities: Activity[];
  supplements: Supplement[];
}

export interface Activity {
  type: 'SLEEP' | 'EXERCISE' | 'MEAL' | 'REST';
  timeWindow: {
    start: string;
    end: string;
  };
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface Supplement {
  type: 'MELATONIN' | 'CAFFEINE';
  timing: string;
  dose: string;
  optional: boolean;
} 
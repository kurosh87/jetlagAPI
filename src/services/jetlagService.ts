import {
  CircadianPhase,
  TimeWindow,
  LightTiming,
  LightExposureWindow,
  SleepTiming,
  ActivityType,
  ActivityPriority,
  Activity,
  AdaptationDay,
  ActivitySchedule,
  SupplementType,
  LightAction,
  LightPriority,
  LightIntensity
} from '../types/circadian';
import { Flight, Layover } from '../types/flight';
import { JetlagValidationError } from '../types/errors';
import { CIRCADIAN_CONSTANTS } from '../constants';
import { timeToMinutes, minutesToTime, addMinutes, subtractMinutes, roundToNearestThirtyMinutes, calculateTimeDifference } from '../utils/dateUtils';
import { WeatherData } from '../types/weather';
import { v4 as uuidv4 } from 'uuid';
import { WeatherService } from './weatherService';
import { calculateOptimalLightTiming } from '../utils/circadianCalculations';

interface DailySchedule {
  day: number;
  sleepWindow: TimeWindow;
  lightExposure: LightExposureWindow;
  supplements: {
    melatonin: string;
  };
}

interface AdaptationSchedule {
  days: DailySchedule[];
  targetPhase: CircadianPhase;
}

export class JetlagService {
  private weatherService: WeatherService;
  private currentTimezoneOffset: number | null = null;

  constructor(weatherService: WeatherService) {
    this.weatherService = weatherService;
  }

  public calculateLightTiming(
    timezoneOffset: number,
    phase: CircadianPhase,
    dayIndex: number
  ): LightExposureWindow {
    const isEastward = timezoneOffset > 0;
    const brightLightStart = isEastward ? '09:00' : '16:30';
    const brightLightEnd = isEastward ? '11:00' : '18:30';
    const avoidLightStart = isEastward ? '17:30' : '05:00';
    const avoidLightEnd = isEastward ? '19:30' : '07:00';

    return {
      brightLight: {
        start: brightLightStart,
        end: brightLightEnd
      },
      avoidLight: {
        start: avoidLightStart,
        end: avoidLightEnd
      },
      intensity: isEastward ? LightIntensity.BRIGHT : LightIntensity.BRIGHT,
      type: isEastward ? LightAction.ADVANCE : LightAction.DELAY,
      naturalLight: true,
      priority: LightPriority.CRITICAL,
      description: isEastward ? 
        'Seek bright light exposure to advance your circadian rhythm' :
        'Seek bright light exposure to delay your circadian rhythm'
    };
  }

  public calculateNadir(bedTime: string, wakeTime: string): string {
    // Convert times to minutes
    const bedMinutes = timeToMinutes(bedTime);
    const wakeMinutes = timeToMinutes(wakeTime);
    
    // Calculate sleep duration and midpoint
    let sleepDuration = wakeMinutes - bedMinutes;
    if (sleepDuration <= 0) {
      sleepDuration += 24 * 60; // Add 24 hours if wake time is next day
    }
    
    // CBT min occurs approximately 2 hours before wake time
    // This is based on scientific research showing CBT min typically occurs
    // 2-3 hours before habitual wake time
    const cbtOffset = 120; // 2 hours in minutes
    let cbtMinMinutes = wakeMinutes - cbtOffset;
    
    // Handle day wrapping
    if (cbtMinMinutes < 0) {
      cbtMinMinutes += 24 * 60;
    }
    
    // Convert back to time string
    return minutesToTime(cbtMinMinutes);
  }

  public calculateSleepDuration(bedTime: string, wakeTime: string): number {
    const bedMinutes = timeToMinutes(bedTime);
    const wakeMinutes = timeToMinutes(wakeTime);
    
    // Calculate duration, handling day wrapping
    let duration = wakeMinutes - bedMinutes;
    if (duration <= 0) {
      duration += 24 * 60; // Add 24 hours if wake time is on next day
    }
    
    return duration;
  }

  public calculateSleepTiming(
    timezoneOffset: number,
    phase: CircadianPhase,
    dayIndex: number
  ): SleepTiming {
    const isEastward = timezoneOffset > 0;
    const totalShiftMinutes = timezoneOffset * 60;
    const maxShiftPerDay = CIRCADIAN_CONSTANTS.MAX_SHIFT_PER_DAY;
    const totalDays = Math.ceil(Math.abs(totalShiftMinutes) / maxShiftPerDay);
    
    // Calculate shift for this day, ensuring we shift by exactly maxShiftPerDay each day
    const shiftForThisDay = Math.min(
      maxShiftPerDay * dayIndex,
      Math.abs(totalShiftMinutes)
    ) * Math.sign(totalShiftMinutes);

    // Apply shift to bed and wake times
    const shiftedBedTime = addMinutes(phase.bedTime, shiftForThisDay);
    const shiftedWakeTime = addMinutes(phase.wakeTime, shiftForThisDay);

    return {
      bedTime: shiftedBedTime,
      wakeTime: shiftedWakeTime,
      totalDays
    };
  }

  private createLightActivity(window: TimeWindow, type: ActivityType): Activity {
    return {
      id: uuidv4(),
      type,
      timeWindow: window,
      priority: ActivityPriority.HIGH
    };
  }

  private createSleepActivity(timing: SleepTiming): Activity {
    return {
      id: uuidv4(),
      type: ActivityType.SLEEP,
      timeWindow: {
        start: timing.bedTime,
        end: timing.wakeTime
      },
      priority: ActivityPriority.HIGH
    };
  }

  private generateSupplementActivity(type: SupplementType, timeWindow: TimeWindow): Activity {
    // For melatonin, schedule based on scientific research:
    // - 0.5-5 hours before bedtime
    // - Longer lead time for more severe timezone changes
    const duration = 30; // 30-minute window for taking supplements
    
    let start: string;
    if (type === SupplementType.MELATONIN) {
      // Calculate lead time based on timezone difference
      const bedTime = timeToMinutes(timeWindow.end);
      const timezoneChange = Math.abs(this.currentTimezoneOffset || 0);
      
      // Calculate lead time: 30 min base + 15 min per timezone hour
      const leadTime = Math.min(
        Math.max(30, 30 + timezoneChange * 15), // Base 30 min + 15 min per hour
        300 // max 5 hours
      );
      
      // Ensure proper day wrapping when subtracting from bedtime
      const startMinutes = ((bedTime - leadTime + 24 * 60) % (24 * 60) + 24 * 60) % (24 * 60);
      start = minutesToTime(startMinutes);
    } else {
      start = timeWindow.start;
    }
    
    const end = addMinutes(start, duration);

    return {
      id: uuidv4(),
      type: ActivityType.SUPPLEMENT,
      timeWindow: {
        start: roundToNearestThirtyMinutes(start),
        end: roundToNearestThirtyMinutes(end)
      },
      priority: ActivityPriority.MEDIUM,
      supplementType: type
    };
  }

  private validateFlight(flight: Flight): void {
    if (!flight.origin || !flight.destination || !flight.departureTime || !flight.arrivalTime) {
      throw new JetlagValidationError('Missing required flight information: origin, destination, departure time, or arrival time');
    }

    if (flight.layovers?.some(layover => 
      new Date(layover.departureTime) <= new Date(layover.arrivalTime)
    )) {
      throw new JetlagValidationError('Layover departure time must be after arrival time');
    }
  }

  private validateCircadianPhase(phase?: CircadianPhase): void {
    if (!phase) return;

    const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timePattern.test(phase.bedTime) || !timePattern.test(phase.wakeTime)) {
      throw new JetlagValidationError('Invalid time format in circadian phase. Expected format: HH:MM');
    }

    // Validate sleep duration
    const duration = this.calculateSleepDuration(phase.bedTime, phase.wakeTime);
    if (duration < CIRCADIAN_CONSTANTS.MIN_SLEEP_DURATION || duration > CIRCADIAN_CONSTANTS.MAX_SLEEP_DURATION) {
      throw new JetlagValidationError('Sleep duration must be between 7 and 9 hours');
    }
  }

  public generateActivitySchedule(
    flight: Flight,
    phase?: CircadianPhase
  ): ActivitySchedule {
    try {
      // Store timezone offset for use in other methods
      this.currentTimezoneOffset = flight.timezoneOffset;
      
      // Validate inputs first
      try {
        this.validateFlight(flight);
        this.validateCircadianPhase(phase);
      } catch (validationError) {
        // Re-throw validation errors with their specific messages
        if (validationError instanceof JetlagValidationError) {
          throw validationError;
        }
        throw new JetlagValidationError('Invalid input data');
      }

      const defaultPhase: CircadianPhase = {
        bedTime: '23:00',
        wakeTime: '07:00'
      };
      
      const circadianPhase = phase || defaultPhase;
      const { timezoneOffset } = flight;
      
      // Calculate days needed for adaptation
      const totalDays = Math.ceil(Math.abs(timezoneOffset) * 60 / CIRCADIAN_CONSTANTS.MAX_SHIFT_PER_DAY);
      
      // Generate arrival day activities
      const arrivalDayActivities: Activity[] = [];
      const day0LightTiming = this.calculateLightTiming(timezoneOffset, circadianPhase, 0);
      const day0SleepTiming = this.calculateSleepTiming(timezoneOffset, circadianPhase, 0);
      
      // Add bright light exposure activity
      arrivalDayActivities.push(
        this.createLightActivity(day0LightTiming.brightLight, ActivityType.BRIGHT_LIGHT)
      );

      // Add avoid light activity if present
      if (day0LightTiming.avoidLight) {
        arrivalDayActivities.push(
          this.createLightActivity(day0LightTiming.avoidLight, ActivityType.AVOID_LIGHT)
        );
      }
      
      // Add sleep activity
      arrivalDayActivities.push(
        this.createSleepActivity(day0SleepTiming)
      );
      
      // Add melatonin if significant timezone change
      if (Math.abs(timezoneOffset) >= 5) {
        const melatoninWindow = {
          start: subtractMinutes(day0SleepTiming.bedTime, CIRCADIAN_CONSTANTS.MELATONIN_BEFORE_BED),
          end: day0SleepTiming.bedTime
        };
        arrivalDayActivities.push(
          this.generateSupplementActivity(SupplementType.MELATONIN, melatoninWindow)
        );
      }
      
      // Generate adaptation days
      const adaptationDays: AdaptationDay[] = [];
      for (let day = 1; day <= totalDays; day++) {
        const activities: Activity[] = [];
        const lightTiming = this.calculateLightTiming(timezoneOffset, circadianPhase, day);
        const sleepTiming = this.calculateSleepTiming(timezoneOffset, circadianPhase, day);
        
        // Add bright light exposure activity
        activities.push(
          this.createLightActivity(lightTiming.brightLight, ActivityType.BRIGHT_LIGHT)
        );

        // Add avoid light activity if present
        if (lightTiming.avoidLight) {
          activities.push(
            this.createLightActivity(lightTiming.avoidLight, ActivityType.AVOID_LIGHT)
          );
        }
        
        // Add sleep activity
        activities.push(
          this.createSleepActivity(sleepTiming)
        );
        
        // Add melatonin if needed (first few days of significant timezone change)
        if (Math.abs(timezoneOffset) >= 5 && day <= 3) {
          const melatoninWindow = {
            start: subtractMinutes(sleepTiming.bedTime, CIRCADIAN_CONSTANTS.MELATONIN_BEFORE_BED),
            end: sleepTiming.bedTime
          };
          activities.push(
            this.generateSupplementActivity(SupplementType.MELATONIN, melatoninWindow)
          );
        }
        
        adaptationDays.push({
          dayIndex: day,
          activities
        });
      }
      
      return {
        arrivalDayActivities,
        adaptationDays
      };
    } catch (error) {
      if (error instanceof JetlagValidationError) {
        throw error;
      }
      throw new JetlagValidationError('Error generating activity schedule');
    }
  }

  private generateDailySchedule(
    timezoneOffset: number,
    phase: CircadianPhase,
    dayIndex: number,
    weatherData?: WeatherData
  ): Activity[] {
    const sleepTiming = this.calculateSleepTiming(timezoneOffset, phase, dayIndex);
    const lightTiming = this.calculateLightTiming(timezoneOffset, phase, dayIndex);
    const activities: Activity[] = [];

    // Add sleep activity
    activities.push(this.createSleepActivity(sleepTiming));

    // Add light exposure activity
    activities.push(
      this.createLightActivity(lightTiming.brightLight, ActivityType.BRIGHT_LIGHT)
    );

    // Add avoid light activity if needed
    if (lightTiming.avoidLight) {
      activities.push(
        this.createLightActivity(lightTiming.avoidLight, ActivityType.AVOID_LIGHT)
      );
    }

    // Add melatonin supplement if needed
    if (Math.abs(timezoneOffset) >= 3) {
      const melatoninTime = subtractMinutes(sleepTiming.bedTime, CIRCADIAN_CONSTANTS.MELATONIN_BEFORE_BED);
      activities.push({
        id: uuidv4(),
        type: ActivityType.SUPPLEMENT,
        timeWindow: {
          start: melatoninTime,
          end: addMinutes(melatoninTime, CIRCADIAN_CONSTANTS.MELATONIN_WINDOW)
        },
        supplementType: SupplementType.MELATONIN,
        priority: ActivityPriority.HIGH
      });
    }

    return activities;
  }
}

export function calculateSleepTiming(
  currentBedTime: string,
  currentWakeTime: string,
  targetBedTime: string,
  targetWakeTime: string,
  dayIndex: number,
  totalDays: number
): SleepTiming {
  // Convert times to minutes for easier calculation
  const currentBedMinutes = timeToMinutes(currentBedTime);
  const currentWakeMinutes = timeToMinutes(currentWakeTime);
  const targetBedMinutes = timeToMinutes(targetBedTime);
  const targetWakeMinutes = timeToMinutes(targetWakeTime);

  // Calculate total shift needed
  let bedTimeShift = targetBedMinutes - currentBedMinutes;
  let wakeTimeShift = targetWakeMinutes - currentWakeMinutes;

  // Handle day wrapping
  if (bedTimeShift > 12 * 60) bedTimeShift -= 24 * 60;
  else if (bedTimeShift < -12 * 60) bedTimeShift += 24 * 60;
  if (wakeTimeShift > 12 * 60) wakeTimeShift -= 24 * 60;
  else if (wakeTimeShift < -12 * 60) wakeTimeShift += 24 * 60;

  // Calculate shift for this day (60 minutes per day)
  const shiftPerDay = 60;
  const bedTimeShiftForDay = Math.min(shiftPerDay, Math.abs(bedTimeShift)) * Math.sign(bedTimeShift);
  const wakeTimeShiftForDay = Math.min(shiftPerDay, Math.abs(wakeTimeShift)) * Math.sign(wakeTimeShift);

  // Apply shifts
  const newBedMinutes = ((currentBedMinutes + bedTimeShiftForDay * dayIndex) + 24 * 60) % (24 * 60);
  const newWakeMinutes = ((currentWakeMinutes + wakeTimeShiftForDay * dayIndex) + 24 * 60) % (24 * 60);

  return {
    bedTime: minutesToTime(newBedMinutes),
    wakeTime: minutesToTime(newWakeMinutes),
    totalDays
  };
}

export function generateLightExposure(
  currentPhase: string,
  targetPhase: string,
  currentDay: number,
  totalDays: number
): LightExposureWindow {
  return calculateOptimalLightTiming(currentPhase, targetPhase, currentDay, totalDays);
}

export function generateSupplementActivity(
  sleepTiming: SleepTiming
): { start: string; end: string } {
  // Schedule melatonin 45 minutes before bedtime
  const bedTimeMinutes = timeToMinutes(sleepTiming.bedTime);
  const startMinutes = ((bedTimeMinutes - 45) + 24 * 60) % (24 * 60);
  const endMinutes = ((startMinutes + 30) + 24 * 60) % (24 * 60);

  return {
    start: minutesToTime(startMinutes),
    end: minutesToTime(endMinutes)
  };
} 
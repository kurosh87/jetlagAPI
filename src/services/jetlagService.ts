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
    const cbtMin = this.calculateNadir(phase.bedTime, phase.wakeTime);
    const cbtMinMinutes = timeToMinutes(cbtMin);
    const wakeMinutes = timeToMinutes(phase.wakeTime);
    const bedMinutes = timeToMinutes(phase.bedTime);
    
    let brightLightStart: string;
    let brightLightEnd: string;
    
    if (isEastward) {
      // For eastward travel, light should be 3-5 hours after CBT min
      const startOffset = 180; // 3 hours after CBT min
      const duration = 120; // 2 hour duration
      const startMinutes = (cbtMinMinutes + startOffset) % (24 * 60);
      brightLightStart = minutesToTime(startMinutes);
      brightLightEnd = minutesToTime((startMinutes + duration) % (24 * 60));
    } else {
      // For westward travel, light should end 2-3 hours before CBT min
      const endOffset = 120; // End 2 hours before CBT min
      const duration = 120; // 2 hour duration
      const endMinutes = ((cbtMinMinutes - endOffset + 24 * 60) % (24 * 60));
      const startMinutes = ((endMinutes - duration + 24 * 60) % (24 * 60));
      brightLightStart = minutesToTime(startMinutes);
      brightLightEnd = minutesToTime(endMinutes);
    }

    // Calculate avoid light window to be roughly opposite bright light
    // but also respect wake/sleep times
    const brightStart = timeToMinutes(brightLightStart);
    const oppositeStart = (brightStart + 12 * 60) % (24 * 60);
    
    // Adjust avoid light to not interfere with sleep and ensure it's before wake time
    let avoidStartMinutes: number;
    let avoidEndMinutes: number;
    
    // For date line crossing, we need to be extra careful about timing
    if (Math.abs(timezoneOffset) > 12) {
      // Always schedule avoid light before wake time for large timezone changes
      avoidEndMinutes = wakeMinutes;
      avoidStartMinutes = (wakeMinutes - 120 + 24 * 60) % (24 * 60);
    } else if (Math.abs(oppositeStart - wakeMinutes) <= 180) {
      // If opposite time is near wake time, schedule before wake
      avoidEndMinutes = wakeMinutes;
      avoidStartMinutes = (wakeMinutes - 120 + 24 * 60) % (24 * 60);
    } else {
      // Otherwise keep it opposite to bright light, but ensure it doesn't overlap sleep
      avoidStartMinutes = oppositeStart;
      avoidEndMinutes = (oppositeStart + 120) % (24 * 60);
      
      // If it overlaps with sleep, move it before wake time
      if ((avoidStartMinutes >= bedMinutes && avoidStartMinutes <= wakeMinutes) ||
          (avoidEndMinutes >= bedMinutes && avoidEndMinutes <= wakeMinutes)) {
        avoidEndMinutes = wakeMinutes;
        avoidStartMinutes = (wakeMinutes - 120 + 24 * 60) % (24 * 60);
      }
    }

    return {
      brightLight: {
        start: brightLightStart,
        end: brightLightEnd
      },
      avoidLight: {
        start: minutesToTime(avoidStartMinutes),
        end: minutesToTime(avoidEndMinutes)
      },
      intensity: LightIntensity.BRIGHT,
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

  public calculateSleepTiming(timezoneOffset: number, phase: CircadianPhase, dayIndex: number): SleepTiming {
    // Special handling for date line crossing (timezone diff > 12 hours)
    if (Math.abs(timezoneOffset) > 12) {
      return this.calculateDateLineSleepTiming(timezoneOffset, phase, dayIndex);
    }

    // Get initial sleep timing
    let bedTime = phase.bedTime;
    let wakeTime = phase.wakeTime;
    
    // Calculate target sleep duration and ensure it's within bounds
    const targetDuration = Math.min(
      CIRCADIAN_CONSTANTS.MAX_SLEEP_DURATION,
      Math.max(
        CIRCADIAN_CONSTANTS.MIN_SLEEP_DURATION,
        calculateTimeDifference(phase.bedTime, phase.wakeTime)
      )
    );
    
    // Calculate shift amount based on timezone offset and day index
    const totalShift = timezoneOffset * 60; // Convert hours to minutes
    const maxShiftPerDay = CIRCADIAN_CONSTANTS.MAX_SHIFT_PER_DAY;
    const totalDays = Math.ceil(Math.abs(totalShift) / maxShiftPerDay);
    
    // Calculate proportional shift for this day
    const isEastward = timezoneOffset > 0;
    const minShift = isEastward ? 30 : 60; // Minimum shift per day
    const maxShift = isEastward ? 60 : 90; // Maximum shift per day
    
    // Calculate shift for this day
    const shiftForDay = isEastward ? 
      Math.min(maxShift, Math.max(minShift, 60)) : // Eastward: 30-60 minutes
      Math.min(maxShift, Math.max(minShift, 90));  // Westward: 60-90 minutes
    
    // Apply direction to shift
    const directedShift = shiftForDay * Math.sign(totalShift);
    
    // Apply shift to bed time first
    const bedTimeMinutes = timeToMinutes(bedTime);
    const newBedMinutes = ((bedTimeMinutes + (directedShift * dayIndex)) + 24 * 60) % (24 * 60);
    
    // Calculate wake time to maintain target duration
    const newWakeMinutes = (newBedMinutes + targetDuration) % (24 * 60);
    
    // Convert back to time strings
    bedTime = minutesToTime(newBedMinutes);
    wakeTime = minutesToTime(newWakeMinutes);
    
    return { bedTime, wakeTime, totalDays };
  }

  private calculateDateLineSleepTiming(timezoneOffset: number, phase: CircadianPhase, dayIndex: number): SleepTiming {
    // For date line crossing, we use a more conservative approach
    const totalShift = timezoneOffset * 60; // Convert hours to minutes
    const maxShiftPerDay = 60; // Max 1 hour per day for date line crossing
    const totalDays = Math.ceil(Math.abs(totalShift) / maxShiftPerDay);
    
    // Calculate target sleep duration
    const targetDuration = calculateTimeDifference(phase.bedTime, phase.wakeTime);
    
    // For date line crossing, we shift in 60-minute increments
    const shiftForDay = maxShiftPerDay * Math.sign(totalShift);
    
    // Apply shift to bed time
    const bedTimeMinutes = timeToMinutes(phase.bedTime);
    const newBedMinutes = ((bedTimeMinutes + (shiftForDay * dayIndex)) + 24 * 60) % (24 * 60);
    
    // Calculate wake time to maintain target duration
    const newWakeMinutes = (newBedMinutes + targetDuration) % (24 * 60);
    
    return {
      bedTime: minutesToTime(newBedMinutes),
      wakeTime: minutesToTime(newWakeMinutes),
      totalDays
    };
  }

  private createLightActivity(window: TimeWindow, type: ActivityType): Activity {
    const maxEndTime = 1290; // 21:30
    const startMinutes = timeToMinutes(window.start);
    let endMinutes = timeToMinutes(window.end);
    
    // Strictly enforce max end time
    if (endMinutes > maxEndTime) {
      endMinutes = maxEndTime;
      // If enforcing max end time would make activity too short, adjust start time
      const minDuration = 60; // Minimum 1 hour for light exposure
      if (endMinutes - startMinutes < minDuration) {
        const newStartMinutes = Math.max(0, endMinutes - minDuration);
        return {
          id: uuidv4(),
          type,
          timeWindow: {
            start: minutesToTime(newStartMinutes),
            end: minutesToTime(endMinutes)
          },
          priority: ActivityPriority.HIGH
        };
      }
    }

    return {
      id: uuidv4(),
      type,
      timeWindow: {
        start: minutesToTime(startMinutes),
        end: minutesToTime(endMinutes)
      },
      priority: ActivityPriority.HIGH
    };
  }

  private createSleepActivity(timing: SleepTiming): Activity {
    // Get the base sleep duration
    const duration = calculateTimeDifference(timing.bedTime, timing.wakeTime);
    
    // If duration is outside healthy range, adjust wake time
    let bedTime = timeToMinutes(timing.bedTime);
    let wakeTime = timeToMinutes(timing.wakeTime);
    
    // Handle day wrapping for initial wake time
    if (wakeTime < bedTime) {
      wakeTime += 24 * 60;
    }
    
    if (duration < CIRCADIAN_CONSTANTS.MIN_SLEEP_DURATION) {
      // If duration is too short, extend wake time
      wakeTime = bedTime + CIRCADIAN_CONSTANTS.MIN_SLEEP_DURATION;
    } else if (duration > CIRCADIAN_CONSTANTS.MAX_SLEEP_DURATION) {
      // If duration is too long, reduce wake time
      wakeTime = bedTime + CIRCADIAN_CONSTANTS.MAX_SLEEP_DURATION;
    }
    
    // Normalize wake time back to 24-hour format
    wakeTime = wakeTime % (24 * 60);
    
    return {
      id: uuidv4(),
      type: ActivityType.SLEEP,
      timeWindow: {
        start: minutesToTime(bedTime),
        end: minutesToTime(wakeTime)
      },
      priority: ActivityPriority.HIGH
    };
  }

  private generateSupplementActivity(bedTime: string, dayIndex: number): Activity {
    // Calculate melatonin timing based on bed time
    const bedTimeMinutes = timeToMinutes(bedTime);
    
    // Schedule melatonin 1 hour before bedtime by default
    let melatoninStartMinutes = ((bedTimeMinutes - 60) + 24 * 60) % (24 * 60);
    let melatoninEndMinutes = (melatoninStartMinutes + 30) % (24 * 60);

    return {
      id: uuidv4(),
      type: ActivityType.SUPPLEMENT,
      timeWindow: {
        start: minutesToTime(melatoninStartMinutes),
        end: minutesToTime(melatoninEndMinutes)
      },
      priority: ActivityPriority.MEDIUM,
      supplementType: SupplementType.MELATONIN
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

  private validateAndAdjustActivities(activities: Activity[]): Activity[] {
    const maxEndTime = 1290; // 21:30 in minutes
    const minDuration = 30; // Minimum activity duration

    // Sort activities by start time
    const sortedActivities = [...activities].sort((a, b) => 
      timeToMinutes(a.timeWindow.start) - timeToMinutes(b.timeWindow.start)
    );

    // First pass: enforce max end time for all activities
    for (const activity of sortedActivities) {
      let currentStart = timeToMinutes(activity.timeWindow.start);
      let currentEnd = timeToMinutes(activity.timeWindow.end);

      // Enforce max end time
      if (currentEnd > maxEndTime) {
        currentEnd = maxEndTime;
        // Adjust start time if needed to maintain minimum duration
        currentStart = Math.max(0, currentEnd - minDuration);
        
        activity.timeWindow = {
          start: minutesToTime(currentStart),
          end: minutesToTime(currentEnd)
        };
      }
    }

    // Second pass: resolve overlaps while maintaining max end time
    for (let i = 0; i < sortedActivities.length - 1; i++) {
      const current = sortedActivities[i];
      const next = sortedActivities[i + 1];
      
      const currentEnd = timeToMinutes(current.timeWindow.end);
      let nextStart = timeToMinutes(next.timeWindow.start);
      let nextEnd = timeToMinutes(next.timeWindow.end);
      
      // If there's an overlap
      if (currentEnd > nextStart) {
        // Try to shift next activity forward
        const shift = currentEnd - nextStart;
        nextStart += shift;
        nextEnd += shift;
        
        // If shifting would exceed max end time, adjust current activity instead
        if (nextEnd > maxEndTime) {
          current.timeWindow.end = next.timeWindow.start;
        } else {
          next.timeWindow = {
            start: minutesToTime(nextStart),
            end: minutesToTime(nextEnd)
          };
        }
      }
    }

    return sortedActivities;
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
      let arrivalDayActivities: Activity[] = [];
      const day0LightTiming = this.calculateLightTiming(timezoneOffset, circadianPhase, 0);
      const day0SleepTiming = this.calculateSleepTiming(timezoneOffset, circadianPhase, 0);
      
      // Add activities as before
      arrivalDayActivities.push(
        this.createLightActivity(day0LightTiming.brightLight, ActivityType.BRIGHT_LIGHT)
      );

      if (day0LightTiming.avoidLight) {
        arrivalDayActivities.push(
          this.createLightActivity(day0LightTiming.avoidLight, ActivityType.AVOID_LIGHT)
        );
      }
      
      arrivalDayActivities.push(
        this.createSleepActivity(day0SleepTiming)
      );
      
      if (Math.abs(timezoneOffset) >= 5) {
        const melatoninWindow = {
          start: subtractMinutes(day0SleepTiming.bedTime, CIRCADIAN_CONSTANTS.MELATONIN_BEFORE_BED),
          end: day0SleepTiming.bedTime
        };
        arrivalDayActivities.push(
          this.generateSupplementActivity(day0SleepTiming.bedTime, 0)
        );
      }

      // Validate and adjust arrival day activities
      arrivalDayActivities = this.validateAndAdjustActivities(arrivalDayActivities);
      
      // Generate adaptation days
      const adaptationDays: AdaptationDay[] = [];
      for (let day = 1; day <= totalDays; day++) {
        let activities: Activity[] = [];
        const lightTiming = this.calculateLightTiming(timezoneOffset, circadianPhase, day);
        const sleepTiming = this.calculateSleepTiming(timezoneOffset, circadianPhase, day);
        
        activities.push(
          this.createLightActivity(lightTiming.brightLight, ActivityType.BRIGHT_LIGHT)
        );

        if (lightTiming.avoidLight) {
          activities.push(
            this.createLightActivity(lightTiming.avoidLight, ActivityType.AVOID_LIGHT)
          );
        }
        
        activities.push(
          this.createSleepActivity(sleepTiming)
        );
        
        if (Math.abs(timezoneOffset) >= 5 && day <= 3) {
          const melatoninWindow = {
            start: subtractMinutes(sleepTiming.bedTime, CIRCADIAN_CONSTANTS.MELATONIN_BEFORE_BED),
            end: sleepTiming.bedTime
          };
          activities.push(
            this.generateSupplementActivity(sleepTiming.bedTime, day)
          );
        }
        
        // Validate and adjust activities for each day
        activities = this.validateAndAdjustActivities(activities);
        
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

  private findSuitableSlot(
    idealStart: number,
    duration: number,
    existingActivities: Activity[],
    sleepTiming: SleepTiming
  ): TimeWindow | null {
    const maxEndTime = 1290; // 21:30
    const minGap = 30; // Minimum 30-minute gap between activities
    const wakeTime = timeToMinutes(sleepTiming.wakeTime);
    const bedTime = timeToMinutes(sleepTiming.bedTime);

    // Try to find a slot around the ideal start time
    let start = idealStart;
    let end = start + duration;

    // If this would exceed max end time, try earlier
    if (end > maxEndTime) {
      end = maxEndTime;
      start = Math.max(wakeTime, end - duration);
    }

    // Check if this slot overlaps with any existing activities
    for (const activity of existingActivities) {
      const activityStart = timeToMinutes(activity.timeWindow.start);
      const activityEnd = timeToMinutes(activity.timeWindow.end);

      if (
        (start >= activityStart - minGap && start <= activityEnd + minGap) ||
        (end >= activityStart - minGap && end <= activityEnd + minGap) ||
        (start <= activityStart && end >= activityEnd)
      ) {
        // If overlap found, try scheduling after this activity
        start = activityEnd + minGap;
        end = Math.min(maxEndTime, start + duration);

        // If this would make the activity too short, return null
        if (end - start < duration / 2) {
          return null;
        }
      }
    }

    // Final validation
    if (start < wakeTime || end > bedTime || end > maxEndTime) {
      return null;
    }

    return {
      start: minutesToTime(start),
      end: minutesToTime(end)
    };
  }

  private generateDailySchedule(
    sleepTiming: SleepTiming,
    lightTiming: LightExposureWindow,
    dayIndex: number
  ): Activity[] {
    const activities: Activity[] = [];

    // Add sleep activity
    activities.push(this.createSleepActivity(sleepTiming));

    // Add light exposure activities
    activities.push(this.createLightActivity(lightTiming.brightLight, ActivityType.BRIGHT_LIGHT));
    if (lightTiming.avoidLight) {
      activities.push(this.createLightActivity(lightTiming.avoidLight, ActivityType.AVOID_LIGHT));
    }

    // Add melatonin supplement if timezone change is significant
    if (Math.abs(this.currentTimezoneOffset || 0) >= 2) {
      activities.push(this.generateSupplementActivity(sleepTiming.bedTime, dayIndex));
    }

    return activities;
  }

  private generateAdaptationSchedule(
    sleepTiming: SleepTiming,
    lightTiming: LightExposureWindow,
    dayIndex: number
  ): Activity[] {
    const activities: Activity[] = [];

    // Add sleep activity
    activities.push(this.createSleepActivity(sleepTiming));

    // Add light exposure activities
    activities.push(this.createLightActivity(lightTiming.brightLight, ActivityType.BRIGHT_LIGHT));
    if (lightTiming.avoidLight) {
      activities.push(this.createLightActivity(lightTiming.avoidLight, ActivityType.AVOID_LIGHT));
    }

    // Add melatonin supplement if timezone change is significant
    if (Math.abs(this.currentTimezoneOffset || 0) >= 2) {
      activities.push(this.generateSupplementActivity(sleepTiming.bedTime, dayIndex));
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
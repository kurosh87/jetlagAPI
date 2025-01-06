import { 
  LightExposureWindow, 
  LightIntensity, 
  LightAction, 
  LightPriority,
  TimeWindow,
  CIRCADIAN_CONSTANTS,
  SleepTiming
} from '../types/circadian';
import { timeToMinutes, minutesToTime, addMinutes } from './dateUtils';

export function calculateOptimalLightTiming(
  currentPhase: string,
  targetPhase: string,
  currentDay: number,
  totalDays: number
): LightExposureWindow {
  const currentMinutes = timeToMinutes(currentPhase);
  const targetMinutes = timeToMinutes(targetPhase);
  const totalShift = targetMinutes - currentMinutes;
  const isAdvance = totalShift > 0;

  // Calculate optimal timing based on direction
  let startMinutes: number;
  let endMinutes: number;
  
  if (isAdvance) {
    // For phase advance, light should be 3-5 hours after CBT min
    startMinutes = (currentMinutes + 180) % (24 * 60); // 3 hours after
    endMinutes = (startMinutes + CIRCADIAN_CONSTANTS.LIGHT_EXPOSURE_DURATION) % (24 * 60);
  } else {
    // For phase delay, light should be 3-5 hours before CBT min
    startMinutes = (currentMinutes - 300) % (24 * 60); // 5 hours before
    endMinutes = (startMinutes + CIRCADIAN_CONSTANTS.LIGHT_EXPOSURE_DURATION) % (24 * 60);
  }

  const brightLight: TimeWindow = {
    start: minutesToTime(startMinutes),
    end: minutesToTime(endMinutes)
  };

  // Calculate avoid light window (typically opposite of bright light)
  const avoidStartMinutes = (startMinutes + 12 * 60) % (24 * 60);
  const avoidEndMinutes = (endMinutes + 12 * 60) % (24 * 60);

  const avoidLight: TimeWindow = {
    start: minutesToTime(avoidStartMinutes),
    end: minutesToTime(avoidEndMinutes)
  };

  return {
    brightLight,
    avoidLight,
    intensity: LightIntensity.BRIGHT,
    type: isAdvance ? LightAction.ADVANCE : LightAction.DELAY,
    priority: LightPriority.CRITICAL,
    naturalLight: true,
    description: isAdvance ? 
      'Seek bright light exposure to advance your circadian rhythm' :
      'Seek bright light exposure to delay your circadian rhythm'
  };
}

export function calculateSleepTiming(
  bedTime: string,
  wakeTime: string,
  dayIndex: number,
  totalDays: number
): SleepTiming {
  return {
    bedTime,
    wakeTime,
    totalDays
  };
} 
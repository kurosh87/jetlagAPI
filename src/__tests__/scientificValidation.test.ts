import { JetlagService } from '../services/jetlagService';
import { WeatherService } from '../services/weatherService';
import { timeToMinutes, calculateTimeDifference } from '../utils/dateUtils';

function normalizeMinutes(minutes: number): number {
  let normalized = minutes;
  while (normalized < 0) {
    normalized += 24 * 60;
  }
  return normalized % (24 * 60);
}

function calculateDuration(startTime: string, endTime: string): number {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  // Calculate duration accounting for day wrapping
  let duration = endMinutes - startMinutes;
  if (duration <= 0) {
    duration += 24 * 60;
  }
  
  return duration;
}

function calculateOffset(time1: string, time2: string): number {
  const minutes1 = timeToMinutes(time1);
  const minutes2 = timeToMinutes(time2);
  
  // Calculate offset accounting for day wrapping
  let offset = minutes2 - minutes1;
  if (offset <= 0) {
    offset += 24 * 60;
  }
  
  return offset;
}

describe('Scientific Validation', () => {
  let jetlagService: JetlagService;
  let weatherService: WeatherService;

  beforeEach(() => {
    weatherService = new WeatherService();
    jetlagService = new JetlagService(weatherService);
  });

  describe('Light Timing Validation', () => {
    it('should time light exposure correctly relative to CBT min', () => {
      const phase = { bedTime: '23:00', wakeTime: '07:00' };
      const cbtMin = jetlagService.calculateNadir(phase.bedTime, phase.wakeTime);
      const cbtMinMinutes = timeToMinutes(cbtMin);
      
      // Test westward travel
      const westwardTiming = jetlagService.calculateLightTiming(-8, phase, 1);
      const westEndMinutes = timeToMinutes(westwardTiming.brightLight.end);
      const westwardHoursBeforeCBTMin = ((cbtMinMinutes - westEndMinutes + 24 * 60) % (24 * 60)) / 60;
      
      // Should be 2-3 hours before CBT min (optimal for phase delays)
      expect(westwardHoursBeforeCBTMin).toBeGreaterThanOrEqual(2);
      expect(westwardHoursBeforeCBTMin).toBeLessThanOrEqual(3);
      
      // Test eastward travel
      const eastwardTiming = jetlagService.calculateLightTiming(8, phase, 1);
      const eastStartMinutes = timeToMinutes(eastwardTiming.brightLight.start);
      const eastwardHoursAfterCBTMin = ((eastStartMinutes - cbtMinMinutes + 24 * 60) % (24 * 60)) / 60;
      
      // Should be 3-5 hours after CBT min (optimal for phase advances)
      expect(eastwardHoursAfterCBTMin).toBeGreaterThanOrEqual(3);
      expect(eastwardHoursAfterCBTMin).toBeLessThanOrEqual(5);
      
      // Verify light exposure durations
      const westwardDuration = calculateTimeDifference(
        westwardTiming.brightLight.start,
        westwardTiming.brightLight.end
      );
      const eastwardDuration = calculateTimeDifference(
        eastwardTiming.brightLight.start,
        eastwardTiming.brightLight.end
      );
      
      // Light exposure should be 2-3 hours
      expect(westwardDuration).toBeGreaterThanOrEqual(120);
      expect(westwardDuration).toBeLessThanOrEqual(180);
      expect(eastwardDuration).toBeGreaterThanOrEqual(120);
      expect(eastwardDuration).toBeLessThanOrEqual(180);
    });
  });

  describe('Sleep Schedule Validation', () => {
    it('should maintain healthy sleep duration', () => {
      const phase = { bedTime: '23:00', wakeTime: '07:00' };
      const sleepTiming = jetlagService.calculateSleepTiming(8, phase, 1);
      
      const duration = calculateDuration(sleepTiming.bedTime, sleepTiming.wakeTime);
      
      // Sleep duration should be between 7-9 hours (420-540 minutes)
      expect(duration).toBeGreaterThanOrEqual(420);
      expect(duration).toBeLessThanOrEqual(540);
    });
  });
}); 
import { JetlagService } from '../services/jetlagService';
import { WeatherService } from '../services/weatherService';
import { timeToMinutes } from '../utils/dateUtils';

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
      
      // Test westward travel
      const westwardTiming = jetlagService.calculateLightTiming(-8, phase, 1);
      const westwardDuration = calculateDuration(
        westwardTiming.brightLight.start,
        westwardTiming.brightLight.end
      );
      // Duration should be 2-5 hours based on severity
      expect(westwardDuration).toBeGreaterThanOrEqual(120);
      expect(westwardDuration).toBeLessThanOrEqual(300);
      
      // Test timing relative to CBT min for westward
      const westwardEndOffset = calculateOffset(
        westwardTiming.brightLight.end,
        cbtMin
      );
      // Should be 3-5 hours before CBT min (optimal for phase delays)
      expect(westwardEndOffset).toBeGreaterThanOrEqual(180);
      expect(westwardEndOffset).toBeLessThanOrEqual(300);
      
      // Test eastward travel
      const eastwardTiming = jetlagService.calculateLightTiming(8, phase, 1);
      const eastwardDuration = calculateDuration(
        eastwardTiming.brightLight.start,
        eastwardTiming.brightLight.end
      );
      // Duration should be 2-5 hours based on severity
      expect(eastwardDuration).toBeGreaterThanOrEqual(120);
      expect(eastwardDuration).toBeLessThanOrEqual(300);
      
      // Test timing relative to CBT min for eastward
      const eastwardStartOffset = calculateOffset(
        cbtMin,
        eastwardTiming.brightLight.start
      );
      // Should be 6-8 hours after CBT min (optimal for phase advances)
      expect(eastwardStartOffset).toBeGreaterThanOrEqual(360);
      expect(eastwardStartOffset).toBeLessThanOrEqual(480);
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
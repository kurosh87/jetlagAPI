import { JetlagService } from '../services/jetlagService';
import { WeatherService } from '../services/weatherService';
import { CircadianPhase, CIRCADIAN_CONSTANTS } from '../types/circadian';
import { timeToMinutes, calculateTimeDifference } from '../utils/dateUtils';

describe('Circadian Calculations', () => {
  let jetlagService: JetlagService;
  let weatherService: WeatherService;

  beforeEach(() => {
    weatherService = new WeatherService();
    jetlagService = new JetlagService(weatherService);
  });

  describe('Phase Shift Direction', () => {
    it('should shift light timing correctly for eastward travel', () => {
      const phase = { bedTime: '23:00', wakeTime: '07:00' };
      const eastwardTiming = jetlagService.calculateLightTiming(12, phase, 1);
      
      // For eastward travel, bright light should be after CBT min
      const cbtMin = jetlagService.calculateNadir(phase.bedTime, phase.wakeTime);
      const lightStart = timeToMinutes(eastwardTiming.brightLight.start);
      const cbtMinMinutes = timeToMinutes(cbtMin);
      
      expect(lightStart - cbtMinMinutes).toBeGreaterThan(0);
    });

    it('should shift light timing correctly for westward travel', () => {
      const phase = { bedTime: '23:00', wakeTime: '07:00' };
      const westwardTiming = jetlagService.calculateLightTiming(-12, phase, 1);
      
      // For westward travel, bright light should be before CBT min
      const cbtMin = jetlagService.calculateNadir(phase.bedTime, phase.wakeTime);
      const lightEnd = timeToMinutes(westwardTiming.brightLight.end);
      const cbtMinMinutes = timeToMinutes(cbtMin);
      
      expect(cbtMinMinutes - lightEnd).toBeGreaterThan(0);
    });
  });

  describe('Light Exposure Duration', () => {
    it('should maintain consistent light exposure durations', () => {
      const phase = { bedTime: '23:00', wakeTime: '07:00' };
      const lightTiming = jetlagService.calculateLightTiming(8, phase, 1);

      // Calculate duration using calculateTimeDifference
      const brightDuration = calculateTimeDifference(
        lightTiming.brightLight.start,
        lightTiming.brightLight.end
      );
      
      // Light exposure should be 2-3 hours
      expect(brightDuration).toBeGreaterThanOrEqual(120);
      expect(brightDuration).toBeLessThanOrEqual(180);

      // Avoid light duration should be asymmetric around CBT min
      if (lightTiming.avoidLight) {
        const avoidDuration = calculateTimeDifference(
          lightTiming.avoidLight.start,
          lightTiming.avoidLight.end
        );
        
        // Total avoidance window should be 2-3 hours
        expect(avoidDuration).toBeGreaterThanOrEqual(120);
        expect(avoidDuration).toBeLessThanOrEqual(180);
      }
    });
  });

  describe('Light Timing Relative to Circadian Phase', () => {
    it('should time light exposure relative to circadian nadir', () => {
      const phase = { bedTime: '23:00', wakeTime: '07:00' };
      const lightTiming = jetlagService.calculateLightTiming(8, phase, 1);
      
      // Calculate CBT min
      const cbtMin = jetlagService.calculateNadir(phase.bedTime, phase.wakeTime);
      const cbtMinMinutes = timeToMinutes(cbtMin);
      
      // Bright light should be appropriately timed relative to CBT min
      const brightStart = timeToMinutes(lightTiming.brightLight.start);
      const timingDiff = Math.abs(brightStart - cbtMinMinutes);
      
      // Should be within 2-5 hours of CBT min
      expect(timingDiff).toBeGreaterThanOrEqual(120);
      expect(timingDiff).toBeLessThanOrEqual(300);
    });
  });
}); 
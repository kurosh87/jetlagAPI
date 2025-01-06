import { JetlagService } from '../services/jetlagService';
import { WeatherService } from '../services/weatherService';
import { timeToMinutes, calculateTimeDifference } from '../utils/dateUtils';
import { Activity, ActivityType } from '../types/circadian';

describe('Activity Windows Tests', () => {
  let jetlagService: JetlagService;
  let weatherService: WeatherService;

  beforeEach(() => {
    weatherService = new WeatherService();
    jetlagService = new JetlagService(weatherService);
  });

  describe('Light Exposure Windows', () => {
    const phase = { bedTime: '23:00', wakeTime: '07:00' };

    it('Eastward travel light timing', () => {
      const { brightLight, avoidLight } = jetlagService.calculateLightTiming(8, phase, 1);
      const cbtMin = jetlagService.calculateNadir(phase.bedTime, phase.wakeTime);
      const cbtMinMinutes = timeToMinutes(cbtMin);
      const lightStartMinutes = timeToMinutes(brightLight.start);
      
      // For eastward travel, bright light should be 3-5 hours after CBT min
      const hoursAfterCBTMin = ((lightStartMinutes - cbtMinMinutes + 24 * 60) % (24 * 60)) / 60;
      expect(hoursAfterCBTMin).toBeGreaterThanOrEqual(3);
      expect(hoursAfterCBTMin).toBeLessThanOrEqual(5);
      
      // Light exposure should be 2-3 hours long
      const duration = calculateTimeDifference(brightLight.start, brightLight.end);
      expect(duration).toBeGreaterThanOrEqual(120);
      expect(duration).toBeLessThanOrEqual(180);
      
      // Avoid light should be roughly 12 hours opposite
      const avoidStartMinutes = timeToMinutes(avoidLight!.start);
      const hoursBetweenLightAndAvoid = ((avoidStartMinutes - lightStartMinutes + 24 * 60) % (24 * 60)) / 60;
      expect(Math.abs(hoursBetweenLightAndAvoid - 12)).toBeLessThanOrEqual(2);
    });

    it('Westward travel light timing', () => {
      const { brightLight, avoidLight } = jetlagService.calculateLightTiming(-8, phase, 1);
      const cbtMin = jetlagService.calculateNadir(phase.bedTime, phase.wakeTime);
      const cbtMinMinutes = timeToMinutes(cbtMin);
      const lightEndMinutes = timeToMinutes(brightLight.end);
      
      // For westward travel, bright light should end 2-3 hours before CBT min
      const hoursBeforeCBTMin = ((cbtMinMinutes - lightEndMinutes + 24 * 60) % (24 * 60)) / 60;
      expect(hoursBeforeCBTMin).toBeGreaterThanOrEqual(2);
      expect(hoursBeforeCBTMin).toBeLessThanOrEqual(3);
      
      // Light exposure should be 2-3 hours long
      const duration = calculateTimeDifference(brightLight.start, brightLight.end);
      expect(duration).toBeGreaterThanOrEqual(120);
      expect(duration).toBeLessThanOrEqual(180);
      
      // Avoid light should be roughly 12 hours opposite
      const brightStartMinutes = timeToMinutes(brightLight.start);
      const avoidStartMinutes = timeToMinutes(avoidLight!.start);
      const hoursBetweenLightAndAvoid = ((avoidStartMinutes - brightStartMinutes + 24 * 60) % (24 * 60)) / 60;
      expect(Math.abs(hoursBetweenLightAndAvoid - 12)).toBeLessThanOrEqual(2);
    });
  });

  describe('Sleep Windows', () => {
    it('should shift sleep timing at scientifically appropriate rates', () => {
      const phase = { bedTime: '23:00', wakeTime: '07:00' };
      let previousSleep = null;
      
      // Test westward travel (-8 hours)
      for (let day = 1; day <= 3; day++) {
        const currentSleep = jetlagService.calculateSleepTiming(-8, phase, day);
        
        if (previousSleep) {
          const prevStart = timeToMinutes(previousSleep.bedTime);
          const currStart = timeToMinutes(currentSleep.bedTime);
          const shift = Math.abs(currStart - prevStart);
          
          // For westward travel, expect 1-1.5 hours shift per day
          expect(shift).toBeGreaterThanOrEqual(60);  // At least 1 hour
          expect(shift).toBeLessThanOrEqual(90);     // At most 1.5 hours
        }
        
        previousSleep = currentSleep;
      }
      
      // Reset for eastward test
      previousSleep = null;
      
      // Test eastward travel (+8 hours)
      for (let day = 1; day <= 3; day++) {
        const currentSleep = jetlagService.calculateSleepTiming(8, phase, day);
        
        if (previousSleep) {
          const prevStart = timeToMinutes(previousSleep.bedTime);
          const currStart = timeToMinutes(currentSleep.bedTime);
          const shift = Math.abs(currStart - prevStart);
          
          // For eastward travel, expect 0.5-1 hour shift per day
          expect(shift).toBeGreaterThanOrEqual(30);  // At least 0.5 hour
          expect(shift).toBeLessThanOrEqual(60);     // At most 1 hour
        }
        
        previousSleep = currentSleep;
      }
    });
  });
}); 
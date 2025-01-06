import { JetlagService } from '../services/jetlagService';
import { WeatherService } from '../services/weatherService';
import { Activity, ActivityType } from '../types/circadian';

describe('Activity Windows Tests', () => {
  let jetlagService: JetlagService;
  let weatherService: WeatherService;

  beforeEach(() => {
    weatherService = new WeatherService();
    jetlagService = new JetlagService(weatherService);
  });

  describe('Light Exposure Windows', () => {
    it('Eastward travel light timing', () => {
      const phase = { bedTime: '23:00', wakeTime: '07:00' };
      const lightTiming = jetlagService.calculateLightTiming(8, phase, 1);
      const { brightLight, avoidLight } = lightTiming;
      
      // For eastward travel, bright light should be in morning
      expect(brightLight.start).toBe('09:00');
      expect(brightLight.end).toBe('11:00');
      
      // Avoid light should be in evening
      expect(avoidLight?.start).toBe('17:30');
      expect(avoidLight?.end).toBe('19:30');
    });

    it('Westward travel light timing', () => {
      const phase = { bedTime: '23:00', wakeTime: '07:00' };
      const lightTiming = jetlagService.calculateLightTiming(-8, phase, 1);
      const { brightLight, avoidLight } = lightTiming;
      
      // For westward travel, bright light should be in evening
      expect(brightLight.start).toBe('16:30');
      expect(brightLight.end).toBe('18:30');
      // Avoid light should be before wake
      expect(avoidLight?.start).toBe('05:00');
      expect(avoidLight?.end).toBe('07:00');
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

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
} 
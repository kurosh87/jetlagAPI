import { JetlagService } from '../services/jetlagService';
import { WeatherService } from '../services/weatherService';
import { Flight } from '../types/flight';
import { ActivityType, SupplementType } from '../types/circadian';

describe('Activity Scheduling', () => {
  let weatherService: WeatherService;
  let jetlagService: JetlagService;

  beforeEach(() => {
    weatherService = new WeatherService();
    jetlagService = new JetlagService(weatherService);
  });

  describe('Activity Timing', () => {
    const testFlight: Flight = {
      id: '1',
      origin: {
        code: 'SFO',
        name: 'San Francisco International Airport',
        location: {
          latitude: 37.7749,
          longitude: -122.4194
        },
        timezone: {
          name: 'America/Los_Angeles',
          offset: -8
        }
      },
      destination: {
        code: 'LHR',
        name: 'London Heathrow Airport',
        location: {
          latitude: 51.5074,
          longitude: -0.1278
        },
        timezone: {
          name: 'Europe/London',
          offset: 0
        }
      },
      departureTime: '2024-01-15T08:00:00Z',
      arrivalTime: '2024-01-15T16:00:00Z',
      timezoneOffset: 8
    };

    test('should not overlap sleep and light exposure activities', async () => {
      const schedule = await jetlagService.generateActivitySchedule(testFlight);
      const activities = schedule.arrivalDayActivities;

      // Find sleep and light exposure activities
      const sleep = activities.find(a => a.type === ActivityType.SLEEP);
      const lightExposure = activities.find(a => a.type === ActivityType.BRIGHT_LIGHT);

      expect(sleep).toBeDefined();
      expect(lightExposure).toBeDefined();

      // Convert times to minutes for comparison
      const sleepStart = timeToMinutes(sleep!.timeWindow.start);
      const sleepEnd = timeToMinutes(sleep!.timeWindow.end);
      const lightStart = timeToMinutes(lightExposure!.timeWindow.start);
      const lightEnd = timeToMinutes(lightExposure!.timeWindow.end);

      // Check for no overlap
      expect(
        (lightStart >= sleepEnd) || (lightEnd <= sleepStart)
      ).toBe(true);
    });

    test('should schedule supplements at appropriate times', async () => {
      const schedule = await jetlagService.generateActivitySchedule(testFlight);
      const activities = schedule.arrivalDayActivities;

      // Find melatonin supplement activity
      const melatonin = activities.find(a => a.type === ActivityType.SUPPLEMENT && (a as any).supplementType === SupplementType.MELATONIN);
      const sleep = activities.find(a => a.type === ActivityType.SLEEP);

      expect(melatonin).toBeDefined();
      expect(sleep).toBeDefined();

      // Melatonin should be taken 0.5-5 hours before bedtime
      const melatoninTime = timeToMinutes(melatonin!.timeWindow.start);
      const bedTime = timeToMinutes(sleep!.timeWindow.start);
      const timeDiff = bedTime - melatoninTime;

      // Verify melatonin is taken within scientifically optimal window
      // Studies show effectiveness 0.5-5 hours before bedtime
      expect(timeDiff).toBeGreaterThanOrEqual(30);  // 0.5 hours
      expect(timeDiff).toBeLessThanOrEqual(300);    // 5 hours
    });
  });
});

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
} 
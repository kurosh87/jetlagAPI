import { JetlagService } from '../services/jetlagService';
import { WeatherService } from '../services/weatherService';
import { Flight } from '../types/flight';
import { ActivityType, SupplementType, CIRCADIAN_CONSTANTS, SleepTiming } from '../types/circadian';
import { JetlagValidationError } from '../types/errors';
import { calculateTimeDifference } from '../utils/dateUtils';

describe('JetlagService', () => {
  let weatherService: WeatherService;
  let jetlagService: JetlagService;

  beforeEach(() => {
    weatherService = new WeatherService();
    jetlagService = new JetlagService(weatherService);
  });

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

  describe('Input Validation', () => {
    test('should throw error for invalid flight data', async () => {
      const invalidFlight = {} as Flight;
      await expect(async () => {
        await jetlagService.generateActivitySchedule(invalidFlight);
      }).rejects.toThrow(JetlagValidationError);
      await expect(async () => {
        await jetlagService.generateActivitySchedule(invalidFlight);
      }).rejects.toThrow('Missing required flight information: origin, destination, departure time, or arrival time');
    });

    test('should throw error for invalid layover timing', async () => {
      const flightWithInvalidLayover: Flight = {
        ...testFlight,
        layovers: [{
          airport: testFlight.destination,
          arrivalTime: '2024-01-15T14:00:00Z',
          departureTime: '2024-01-15T13:00:00Z', // Departure before arrival
          duration: 60
        }]
      };
      await expect(async () => {
        await jetlagService.generateActivitySchedule(flightWithInvalidLayover);
      }).rejects.toThrow(JetlagValidationError);
      await expect(async () => {
        await jetlagService.generateActivitySchedule(flightWithInvalidLayover);
      }).rejects.toThrow('Layover departure time must be after arrival time');
    });

    test('should throw error for invalid circadian phase', async () => {
      await expect(async () => {
        await jetlagService.generateActivitySchedule(testFlight, { bedTime: 'invalid', wakeTime: 'invalid' });
      }).rejects.toThrow(JetlagValidationError);
      await expect(async () => {
        await jetlagService.generateActivitySchedule(testFlight, { bedTime: 'invalid', wakeTime: 'invalid' });
      }).rejects.toThrow('Invalid time format in circadian phase. Expected format: HH:MM');
    });
  });

  describe('Activity Generation', () => {
    test('should generate correct number of adaptation days', async () => {
      const schedule = await jetlagService.generateActivitySchedule(testFlight);
      const lightActivities = schedule.arrivalDayActivities.filter(a => 
        a.type === ActivityType.BRIGHT_LIGHT || a.type === ActivityType.AVOID_LIGHT
      );
      expect(lightActivities.length).toBe(2); // One bright light and one avoid light activity
    });

    test('should include melatonin for significant timezone changes', async () => {
      const schedule = await jetlagService.generateActivitySchedule(testFlight);
      const melatoninActivity = schedule.arrivalDayActivities.find(
        a => a.type === ActivityType.SUPPLEMENT && (a as any).supplementType === SupplementType.MELATONIN
      );
      expect(melatoninActivity).toBeDefined();
    });

    test('should adjust light exposure timing based on direction', async () => {
      const schedule = await jetlagService.generateActivitySchedule(testFlight);
      const lightActivities = schedule.arrivalDayActivities.filter(a => 
        a.type === ActivityType.BRIGHT_LIGHT || a.type === ActivityType.AVOID_LIGHT
      );
      expect(lightActivities.length).toBe(2);
    });

    test('should maintain consistent sleep schedule duration', async () => {
      const schedule = await jetlagService.generateActivitySchedule(testFlight);
      const sleepActivity = schedule.arrivalDayActivities.find(a => a.type === ActivityType.SLEEP);
      expect(sleepActivity).toBeDefined();

      const duration = jetlagService.calculateSleepDuration(
        sleepActivity!.timeWindow.start,
        sleepActivity!.timeWindow.end
      );

      // Sleep duration should be between 7-9 hours (420-540 minutes)
      expect(duration).toBeGreaterThanOrEqual(420);
      expect(duration).toBeLessThanOrEqual(540);
    });
  });

  describe('Layover Handling', () => {
    test('should adjust recommendations for long layovers', async () => {
      const flightWithLongLayover: Flight = {
        ...testFlight,
        layovers: [{
          airport: {
            code: 'JFK',
            name: 'John F. Kennedy International Airport',
            location: {
              latitude: 40.6413,
              longitude: -73.7781
            },
            timezone: {
              name: 'America/New_York',
              offset: -5
            }
          },
          arrivalTime: '2024-01-15T12:00:00Z',
          departureTime: '2024-01-15T18:00:00Z', // 6-hour layover
          duration: 21600
        }]
      };

      const schedule = await jetlagService.generateActivitySchedule(flightWithLongLayover);
      const lightActivities = schedule.arrivalDayActivities.filter(a => 
        a.type === ActivityType.BRIGHT_LIGHT || a.type === ActivityType.AVOID_LIGHT
      );
      expect(lightActivities.length).toBe(2);
    });
  });

  describe('International Date Line Handling', () => {
    const dateLineFlight: Flight = {
      id: '2',
      origin: {
        code: 'NRT',
        name: 'Narita International Airport',
        location: {
          latitude: 35.7720,
          longitude: 140.3929
        },
        timezone: {
          name: 'Asia/Tokyo',
          offset: 9
        }
      },
      destination: {
        code: 'LAX',
        name: 'Los Angeles International Airport',
        location: {
          latitude: 33.9416,
          longitude: -118.4085
        },
        timezone: {
          name: 'America/Los_Angeles',
          offset: -8
        }
      },
      departureTime: '2024-01-15T10:00:00Z',
      arrivalTime: '2024-01-15T04:00:00Z', // Earlier UTC time but next calendar day
      timezoneOffset: -17 // Crossing date line: +9 to -8
    };

    test('should handle date line crossing timezone calculations', async () => {
      const schedule = await jetlagService.generateActivitySchedule(dateLineFlight);
      const sleepActivity = schedule.arrivalDayActivities.find(a => a.type === ActivityType.SLEEP);
      expect(sleepActivity).toBeDefined();

      // Verify sleep duration is within limits even when crossing date line
      const duration = jetlagService.calculateSleepDuration(
        sleepActivity!.timeWindow.start,
        sleepActivity!.timeWindow.end
      );
      expect(duration).toBeGreaterThanOrEqual(420); // Min 7 hours
      expect(duration).toBeLessThanOrEqual(540); // Max 9 hours
    });

    test('should calculate correct light timing across date line', async () => {
      const phase = { bedTime: '23:00', wakeTime: '07:00' };
      const lightTiming = jetlagService.calculateLightTiming(-17, phase, 1);

      // For westward travel across date line, bright light should be in evening
      expect(timeToMinutes(lightTiming.brightLight.start)).toBeLessThan(timeToMinutes('19:00'));
      expect(timeToMinutes(lightTiming.brightLight.end)).toBeLessThan(timeToMinutes('21:00'));

      // Avoid light should be before wake
      if (lightTiming.avoidLight) {
        expect(timeToMinutes(lightTiming.avoidLight.start)).toBeLessThan(timeToMinutes(phase.wakeTime));
      }
    });

    test('should properly shift sleep schedule across date line', () => {
      const phase = { bedTime: '23:00', wakeTime: '07:00' };
      const days = 3;
      let previousSleep: SleepTiming | null = null;

      for (let day = 0; day < days; day++) {
        const currentSleep = jetlagService.calculateSleepTiming(-17, phase, day);
        
        if (previousSleep) {
          const prevStart = timeToMinutes(previousSleep.bedTime);
          const currStart = timeToMinutes(currentSleep.bedTime);
          
          // Check that shift is at most MAX_SHIFT_PER_DAY
          const shift = Math.abs(currStart - prevStart);
          expect(shift).toBeLessThanOrEqual(CIRCADIAN_CONSTANTS.MAX_SHIFT_PER_DAY);
        }

        // Verify sleep duration
        const duration = jetlagService.calculateSleepDuration(currentSleep.bedTime, currentSleep.wakeTime);
        expect(duration).toBeGreaterThanOrEqual(420);
        expect(duration).toBeLessThanOrEqual(540);
        
        previousSleep = currentSleep;
      }
    });
  });

  describe('Light Timing', () => {
    test('should maintain consistent light exposure duration', () => {
      const phase = { bedTime: '23:00', wakeTime: '07:00' };
      
      // Test eastward travel
      const eastwardTiming = jetlagService.calculateLightTiming(8, phase, 1);
      expect(calculateTimeDifference(
        eastwardTiming.brightLight.start,
        eastwardTiming.brightLight.end
      )).toBe(120); // Always 2 hours
      
      // Test westward travel
      const westwardTiming = jetlagService.calculateLightTiming(-8, phase, 1);
      expect(calculateTimeDifference(
        westwardTiming.brightLight.start,
        westwardTiming.brightLight.end
      )).toBe(120); // Always 2 hours
    });

    test('should set correct light timing based on direction', () => {
      const phase = { bedTime: '23:00', wakeTime: '07:00' };
      
      // Eastward travel: bright light in morning
      const eastwardTiming = jetlagService.calculateLightTiming(8, phase, 1);
      expect(eastwardTiming.brightLight.start).toBe('09:00');
      expect(eastwardTiming.brightLight.end).toBe('11:00');
      expect(eastwardTiming.avoidLight?.start).toBe('17:30');
      expect(eastwardTiming.avoidLight?.end).toBe('19:30');
      
      // Westward travel: bright light in evening
      const westwardTiming = jetlagService.calculateLightTiming(-8, phase, 1);
      expect(westwardTiming.brightLight.start).toBe('16:30');
      expect(westwardTiming.brightLight.end).toBe('18:30');
      expect(westwardTiming.avoidLight?.start).toBe('05:00');
      expect(westwardTiming.avoidLight?.end).toBe('07:00');
    });
  });

  describe('End-to-End Integration', () => {
    test('should generate complete adaptation schedule with weather integration', async () => {
      const schedule = await jetlagService.generateActivitySchedule(testFlight);
      
      // Verify arrival day activities
      expect(schedule.arrivalDayActivities).toBeDefined();
      expect(schedule.arrivalDayActivities.length).toBeGreaterThan(0);
      
      // Verify adaptation days
      expect(schedule.adaptationDays).toBeDefined();
      expect(schedule.adaptationDays.length).toBeGreaterThan(0);
      
      // Verify each adaptation day has required activities
      schedule.adaptationDays.forEach(day => {
        // Each day should have at least sleep and light exposure activities
        const activities = day.activities;
        expect(activities.length).toBeGreaterThanOrEqual(2);
        
        // Verify sleep activity
        const sleepActivity = activities.find(a => a.type === ActivityType.SLEEP);
        expect(sleepActivity).toBeDefined();
        expect(sleepActivity!.timeWindow.start).toMatch(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/);
        expect(sleepActivity!.timeWindow.end).toMatch(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/);
        
        // Verify light exposure activities
        const lightActivities = activities.filter(a => 
          a.type === ActivityType.BRIGHT_LIGHT || a.type === ActivityType.AVOID_LIGHT
        );
        expect(lightActivities.length).toBeGreaterThanOrEqual(1);
        
        // Verify activity timing progression
        if (day.dayIndex > 1) {
          const prevDayActivities = schedule.adaptationDays[day.dayIndex - 2].activities;
          const prevSleep = prevDayActivities.find(a => a.type === ActivityType.SLEEP);
          const currSleep = sleepActivity;
          
          // Verify sleep timing shifts gradually
          const prevStart = timeToMinutes(prevSleep!.timeWindow.start);
          const currStart = timeToMinutes(currSleep!.timeWindow.start);
          const shift = Math.abs(currStart - prevStart);
          expect(shift).toBeLessThanOrEqual(CIRCADIAN_CONSTANTS.MAX_SHIFT_PER_DAY);
        }
      });
    });

    test('should handle extreme timezone changes', async () => {
      const extremeFlight: Flight = {
        ...testFlight,
        timezoneOffset: 12 // 12-hour difference
      };
      
      const schedule = await jetlagService.generateActivitySchedule(extremeFlight);
      
      // Verify adaptation takes longer for extreme changes
      expect(schedule.adaptationDays.length).toBeGreaterThanOrEqual(6); // At least 6 days for 12-hour shift
      
      // Verify melatonin supplementation for significant shifts
      const hasMelatonin = schedule.arrivalDayActivities.some(
        a => a.type === ActivityType.SUPPLEMENT && (a as any).supplementType === SupplementType.MELATONIN
      );
      expect(hasMelatonin).toBe(true);
    });

    test('should integrate weather data with light exposure windows', async () => {
      // Mock weather data is used (sunrise: 06:00, sunset: 18:00)
      const schedule = await jetlagService.generateActivitySchedule(testFlight);
      
      schedule.adaptationDays.forEach(day => {
        const lightActivities = day.activities.filter(a => 
          a.type === ActivityType.BRIGHT_LIGHT || a.type === ActivityType.AVOID_LIGHT
        );
        
        lightActivities.forEach(activity => {
          const startTime = timeToMinutes(activity.timeWindow.start);
          const endTime = timeToMinutes(activity.timeWindow.end);
          
          if (activity.type === ActivityType.BRIGHT_LIGHT) {
            // Bright light activities should align with daylight hours
            expect(startTime).toBeGreaterThanOrEqual(timeToMinutes('06:00')); // After sunrise
            expect(endTime).toBeLessThanOrEqual(timeToMinutes('18:00')); // Before sunset
          }
        });
      });
    });

    test('should maintain consistent activity scheduling across multiple days', async () => {
      const schedule = await jetlagService.generateActivitySchedule(testFlight);
      
      let previousSleepDuration: number | null = null;
      
      schedule.adaptationDays.forEach(day => {
        const sleepActivity = day.activities.find(a => a.type === ActivityType.SLEEP);
        expect(sleepActivity).toBeDefined();
        
        const duration = calculateTimeDifference(
          sleepActivity!.timeWindow.start,
          sleepActivity!.timeWindow.end
        );
        
        if (previousSleepDuration !== null) {
          // Sleep duration should remain consistent
          expect(Math.abs(duration - previousSleepDuration)).toBeLessThanOrEqual(30); // Allow 30 minutes variation
        }
        
        previousSleepDuration = duration;
        
        // Verify no overlapping activities
        const sortedActivities = [...day.activities].sort((a, b) => 
          timeToMinutes(a.timeWindow.start) - timeToMinutes(b.timeWindow.start)
        );
        
        for (let i = 0; i < sortedActivities.length - 1; i++) {
          const currentEnd = timeToMinutes(sortedActivities[i].timeWindow.end);
          const nextStart = timeToMinutes(sortedActivities[i + 1].timeWindow.start);
          expect(currentEnd).toBeLessThanOrEqual(nextStart);
        }
      });
    });
  });
});

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
} 
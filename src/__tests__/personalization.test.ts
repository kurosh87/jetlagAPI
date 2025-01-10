import { JetlagService } from '../services/jetlagService';
import { WeatherService } from '../services/weatherService';
import { ChronotypeCategory, SleepQuality, UserProfile, AdaptationSpeed } from '../types/chronotype';
import { ActivityType } from '../types/circadian';

describe('Personalized Jetlag Calculations', () => {
  let service: JetlagService;
  let weatherService: WeatherService;

  beforeEach(() => {
    weatherService = new WeatherService();
    service = new JetlagService(weatherService);
  });

  describe('Activity Time Adjustments', () => {
    it('should adjust sleep windows based on chronotype', async () => {
      const earlyBirdProfile: UserProfile = {
        age: 30,
        chronotype: ChronotypeCategory.EARLY_MORNING,
        sleepProfile: {
          typicalBedTime: '21:00',
          typicalWakeTime: '05:00',
          sleepQuality: SleepQuality.GOOD,
          sleepLatency: 10,
          canNap: true,
          consistentSchedule: true
        }
      };

      const schedule = await service.calculateSchedule({
        departureTime: '2024-02-01T10:00:00Z',
        arrivalTime: '2024-02-02T02:00:00Z',
        timeZoneDifference: 8,
        userProfile: earlyBirdProfile
      });

      // Early bird should have earlier sleep windows
      const firstDay = schedule.postArrival.days[0];
      const sleepActivity = firstDay.activities.find(a => a.type === ActivityType.SLEEP);
      const sleepHour = parseInt(sleepActivity!.timeWindow.start.split(':')[0]);
      expect(sleepHour).toBeLessThan(23);
    });

    it('should adjust sleep windows for night owls', async () => {
      const nightOwlProfile: UserProfile = {
        age: 25,
        chronotype: ChronotypeCategory.LATE_EVENING,
        sleepProfile: {
          typicalBedTime: '01:00',
          typicalWakeTime: '09:00',
          sleepQuality: SleepQuality.GOOD,
          sleepLatency: 20,
          canNap: false,
          consistentSchedule: true
        }
      };

      const schedule = await service.calculateSchedule({
        departureTime: '2024-02-01T10:00:00Z',
        arrivalTime: '2024-02-02T02:00:00Z',
        timeZoneDifference: 8,
        userProfile: nightOwlProfile
      });

      // Night owl should have later sleep windows
      const firstDay = schedule.postArrival.days[0];
      const sleepActivity = firstDay.activities.find(a => a.type === ActivityType.SLEEP);
      const sleepHour = parseInt(sleepActivity!.timeWindow.start.split(':')[0]);
      expect(sleepHour).toBeGreaterThan(21);
    });
  });

  describe('Age-Based Adaptations', () => {
    it('should recommend more conservative adaptation for older travelers', async () => {
      const olderProfile: UserProfile = {
        age: 65,
        chronotype: ChronotypeCategory.MODERATE_MORNING,
        sleepProfile: {
          typicalBedTime: '22:00',
          typicalWakeTime: '06:00',
          sleepQuality: SleepQuality.FAIR,
          sleepLatency: 30,
          canNap: true,
          consistentSchedule: true
        }
      };

      const schedule = await service.calculateSchedule({
        departureTime: '2024-02-01T10:00:00Z',
        arrivalTime: '2024-02-02T02:00:00Z',
        timeZoneDifference: 8,
        userProfile: olderProfile
      });

      // Should have more gradual adaptation
      expect(schedule.postArrival.expectedRecoveryDays).toBeGreaterThan(3);
      expect(schedule.postArrival.days[0].activities.length).toBeGreaterThan(0);
    });
  });

  describe('Sleep Quality Adaptations', () => {
    it('should add more rest periods for poor sleepers', async () => {
      const poorSleeperProfile: UserProfile = {
        age: 30,
        chronotype: ChronotypeCategory.NEUTRAL,
        sleepProfile: {
          typicalBedTime: '23:00',
          typicalWakeTime: '07:00',
          sleepQuality: SleepQuality.POOR,
          sleepLatency: 45,
          canNap: true,
          consistentSchedule: false
        }
      };

      const schedule = await service.calculateSchedule({
        departureTime: '2024-02-01T10:00:00Z',
        arrivalTime: '2024-02-02T02:00:00Z',
        timeZoneDifference: 8,
        userProfile: poorSleeperProfile
      });

      // Should include more rest/nap opportunities
      const napActivities = schedule.postArrival.days[0].activities.filter(
        a => a.type === ActivityType.NAP
      );
      expect(napActivities.length).toBeGreaterThan(1);
    });
  });

  describe('Nap Preferences', () => {
    it('should include nap windows for nappers', async () => {
      const napperProfile: UserProfile = {
        age: 30,
        chronotype: ChronotypeCategory.NEUTRAL,
        sleepProfile: {
          typicalBedTime: '23:00',
          typicalWakeTime: '07:00',
          sleepQuality: SleepQuality.GOOD,
          sleepLatency: 15,
          canNap: true,
          consistentSchedule: true
        }
      };

      const schedule = await service.calculateSchedule({
        departureTime: '2024-02-01T10:00:00Z',
        arrivalTime: '2024-02-02T02:00:00Z',
        timeZoneDifference: 8,
        userProfile: napperProfile
      });

      // Should include nap activities
      const napActivities = schedule.postArrival.days[0].activities.filter(
        a => a.type === ActivityType.NAP
      );
      expect(napActivities.length).toBeGreaterThan(0);
    });

    it('should exclude nap windows for non-nappers', async () => {
      const nonNapperProfile: UserProfile = {
        age: 30,
        chronotype: ChronotypeCategory.NEUTRAL,
        sleepProfile: {
          typicalBedTime: '23:00',
          typicalWakeTime: '07:00',
          sleepQuality: SleepQuality.GOOD,
          sleepLatency: 15,
          canNap: false,
          consistentSchedule: true
        }
      };

      const schedule = await service.calculateSchedule({
        departureTime: '2024-02-01T10:00:00Z',
        arrivalTime: '2024-02-02T02:00:00Z',
        timeZoneDifference: 8,
        userProfile: nonNapperProfile
      });

      // Should not include nap activities
      const napActivities = schedule.postArrival.days[0].activities.filter(
        a => a.type === ActivityType.NAP
      );
      expect(napActivities.length).toBe(0);
    });
  });

  describe('Recovery Time Predictions', () => {
    it('should predict longer recovery for challenging profiles', async () => {
      const challengingProfile: UserProfile = {
        age: 70,
        chronotype: ChronotypeCategory.LATE_EVENING,
        sleepProfile: {
          typicalBedTime: '01:00',
          typicalWakeTime: '09:00',
          sleepQuality: SleepQuality.POOR,
          sleepLatency: 45,
          canNap: false,
          consistentSchedule: false
        },
        previousJetlagRecovery: {
          daysToRecover: 6,
          symptoms: ['insomnia', 'fatigue']
        }
      };

      const schedule = await service.calculateSchedule({
        departureTime: '2024-02-01T10:00:00Z',
        arrivalTime: '2024-02-02T02:00:00Z',
        timeZoneDifference: 8,
        userProfile: challengingProfile
      });

      // Should predict longer recovery time
      expect(schedule.postArrival.expectedRecoveryDays).toBeGreaterThan(5);
    });
  });
}); 
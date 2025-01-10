import { OnboardingService } from '../services/onboardingService';
import { ChronotypeCategory, SleepQuality } from '../types/chronotype';

describe('OnboardingService', () => {
  let service: OnboardingService;

  beforeEach(() => {
    service = new OnboardingService();
  });

  describe('Flow Navigation', () => {
    it('should return first step when no current step', () => {
      const step = service.getNextStep();
      expect(step?.id).toBe('core-info');
    });

    it('should return correct next step in sequence', () => {
      const step = service.getNextStep('core-info');
      expect(step?.id).toBe('sleep-patterns');
    });

    it('should return null at end of flow', () => {
      const step = service.getNextStep('jetlag-experience');
      expect(step).toBeNull();
    });
  });

  describe('Response Validation', () => {
    it('should validate required responses', () => {
      const isValid = service.validateResponse('core-info', {
        age: '25'
      });
      expect(isValid).toBe(true);
    });

    it('should fail validation for missing required responses', () => {
      const isValid = service.validateResponse('core-info', {});
      expect(isValid).toBe(false);
    });

    it('should allow missing responses for optional steps', () => {
      const isValid = service.validateResponse('jetlag-experience', {});
      expect(isValid).toBe(true);
    });
  });

  describe('Chronotype Determination', () => {
    it('should identify early morning chronotype', async () => {
      const profile = await service.processResponses({
        'age': '30',
        'typical-bedtime': '21:00',
        'typical-waketime': '05:00',
        'sleep-quality': SleepQuality.GOOD,
        'sleep-latency': 'Less than 15 minutes'
      });
      expect(profile.chronotype).toBe(ChronotypeCategory.EARLY_MORNING);
    });

    it('should identify late evening chronotype', async () => {
      const profile = await service.processResponses({
        'age': '30',
        'typical-bedtime': '01:00',
        'typical-waketime': '09:00',
        'sleep-quality': SleepQuality.GOOD,
        'sleep-latency': 'Less than 15 minutes'
      });
      expect(profile.chronotype).toBe(ChronotypeCategory.LATE_EVENING);
    });

    it('should adjust chronotype for young age', async () => {
      const profile = await service.processResponses({
        'age': '20',
        'typical-bedtime': '23:00',
        'typical-waketime': '07:00',
        'sleep-quality': SleepQuality.GOOD,
        'sleep-latency': 'Less than 15 minutes'
      });
      // Young age shifts towards evening
      expect(profile.chronotype).toBe(ChronotypeCategory.MODERATE_EVENING);
    });

    it('should adjust chronotype for older age', async () => {
      const profile = await service.processResponses({
        'age': '65',
        'typical-bedtime': '23:00',
        'typical-waketime': '07:00',
        'sleep-quality': SleepQuality.GOOD,
        'sleep-latency': 'Less than 15 minutes'
      });
      // Older age shifts towards morning
      expect(profile.chronotype).toBe(ChronotypeCategory.MODERATE_MORNING);
    });
  });

  describe('Sleep Profile Processing', () => {
    it('should correctly process sleep latency', async () => {
      const profile = await service.processResponses({
        'age': '30',
        'typical-bedtime': '23:00',
        'typical-waketime': '07:00',
        'sleep-quality': SleepQuality.GOOD,
        'sleep-latency': 'More than 30 minutes'
      });
      expect(profile.sleepProfile.sleepLatency).toBe(45);
    });

    it('should correctly process napping ability', async () => {
      const profile = await service.processResponses({
        'age': '30',
        'typical-bedtime': '23:00',
        'typical-waketime': '07:00',
        'sleep-quality': SleepQuality.GOOD,
        'sleep-latency': 'Less than 15 minutes',
        'can-nap': 'Yes, easily'
      });
      expect(profile.sleepProfile.canNap).toBe(true);
    });

    it('should handle "Sometimes" nap response correctly', async () => {
      const profile = await service.processResponses({
        'age': '30',
        'typical-bedtime': '23:00',
        'typical-waketime': '07:00',
        'sleep-quality': SleepQuality.GOOD,
        'sleep-latency': 'Less than 15 minutes',
        'can-nap': 'Sometimes'
      });
      expect(profile.sleepProfile.canNap).toBe(true);
    });
  });

  describe('Jet Lag Recovery Processing', () => {
    it('should process recovery days correctly', async () => {
      const profile = await service.processResponses({
        'age': '30',
        'typical-bedtime': '23:00',
        'typical-waketime': '07:00',
        'sleep-quality': SleepQuality.GOOD,
        'sleep-latency': 'Less than 15 minutes',
        'recovery-time': '3-4 days'
      });
      expect(profile.previousJetlagRecovery?.daysToRecover).toBe(4);
    });

    it('should handle missing jet lag experience', async () => {
      const profile = await service.processResponses({
        'age': '30',
        'typical-bedtime': '23:00',
        'typical-waketime': '07:00',
        'sleep-quality': SleepQuality.GOOD,
        'sleep-latency': 'Less than 15 minutes'
      });
      expect(profile.previousJetlagRecovery).toBeUndefined();
    });
  });

  describe('Time Calculations', () => {
    it('should handle day wrapping in sleep schedule', async () => {
      const profile = await service.processResponses({
        'age': '30',
        'typical-bedtime': '02:00',
        'typical-waketime': '10:00',
        'sleep-quality': SleepQuality.GOOD,
        'sleep-latency': 'Less than 15 minutes'
      });
      expect(profile.chronotype).toBe(ChronotypeCategory.LATE_EVENING);
    });

    it('should calculate mid-sleep point correctly', async () => {
      const profile = await service.processResponses({
        'age': '30',
        'typical-bedtime': '23:00',
        'typical-waketime': '07:00',
        'sleep-quality': SleepQuality.GOOD,
        'sleep-latency': 'Less than 15 minutes'
      });
      // Mid-sleep at 3:00, should be neutral chronotype
      expect(profile.chronotype).toBe(ChronotypeCategory.NEUTRAL);
    });
  });
}); 
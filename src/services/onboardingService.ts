import {
  OnboardingStep,
  OnboardingFlow,
  ChronotypeAssessmentQuestion,
  UserProfile,
  ChronotypeCategory,
  SleepQuality
} from '../types/chronotype';

export class OnboardingService {
  private readonly onboardingFlow: OnboardingFlow = {
    steps: [
      {
        id: 'core-info',
        title: 'Basic Information',
        description: 'Tell us about yourself',
        isRequired: true,
        questions: [
          {
            id: 'age',
            text: 'What is your age?',
            type: 'SCALE',
            options: Array.from({length: 83}, (_, i) => (18 + i).toString())
          }
        ]
      },
      {
        id: 'sleep-patterns',
        title: 'Sleep Patterns',
        description: 'Tell us about your typical sleep schedule',
        isRequired: true,
        questions: [
          {
            id: 'typical-bedtime',
            text: 'What time do you usually go to bed?',
            type: 'TIME_SELECT',
            options: generateTimeOptions('20:00', '03:00')
          },
          {
            id: 'typical-waketime',
            text: 'What time do you usually wake up?',
            type: 'TIME_SELECT',
            options: generateTimeOptions('04:00', '11:00')
          },
          {
            id: 'sleep-quality',
            text: 'How would you rate your sleep quality?',
            type: 'MULTIPLE_CHOICE',
            options: Object.values(SleepQuality)
          },
          {
            id: 'sleep-latency',
            text: 'How long does it usually take you to fall asleep?',
            type: 'MULTIPLE_CHOICE',
            options: [
              'Less than 15 minutes',
              '15-30 minutes',
              'More than 30 minutes'
            ]
          }
        ]
      },
      {
        id: 'travel-basics',
        title: 'Travel & Sleep',
        description: 'Help us understand your travel sleep patterns',
        isRequired: true,
        questions: [
          {
            id: 'can-nap',
            text: 'Can you usually take short naps during the day?',
            type: 'MULTIPLE_CHOICE',
            options: ['Yes, easily', 'Sometimes', 'No, rarely']
          },
          {
            id: 'plane-sleep',
            text: 'Can you sleep on planes?',
            type: 'MULTIPLE_CHOICE',
            options: ['Yes, easily', 'Sometimes', 'No, rarely']
          }
        ]
      },
      {
        id: 'jetlag-experience',
        title: 'Previous Jet Lag',
        description: 'Tell us about your jet lag experience',
        isRequired: false,
        questions: [
          {
            id: 'recovery-time',
            text: 'How long does it typically take you to recover from jet lag?',
            type: 'MULTIPLE_CHOICE',
            options: ['1-2 days', '3-4 days', '5+ days', 'Not sure']
          },
          {
            id: 'melatonin-use',
            text: 'Are you open to using melatonin supplements?',
            type: 'MULTIPLE_CHOICE',
            options: ['Yes', 'No', 'Need more information']
          }
        ]
      }
    ],
    currentStep: 0,
    completedSteps: [],
    userResponses: {}
  };

  public getNextStep(currentStepId?: string): OnboardingStep | null {
    if (!currentStepId) {
      return this.onboardingFlow.steps[0];
    }

    const currentIndex = this.onboardingFlow.steps.findIndex(step => step.id === currentStepId);
    if (currentIndex === -1 || currentIndex === this.onboardingFlow.steps.length - 1) {
      return null;
    }

    return this.onboardingFlow.steps[currentIndex + 1];
  }

  public validateResponse(stepId: string, responses: Record<string, any>): boolean {
    const step = this.onboardingFlow.steps.find(s => s.id === stepId);
    if (!step) return false;

    return step.questions.every(question => {
      if (step.isRequired) {
        return responses[question.id] !== undefined && responses[question.id] !== '';
      }
      return true;
    });
  }

  public async processResponses(responses: Record<string, any>): Promise<UserProfile> {
    const sleepProfile = {
      typicalBedTime: responses['typical-bedtime'],
      typicalWakeTime: responses['typical-waketime'],
      sleepQuality: responses['sleep-quality'],
      sleepLatency: this.parseSleepLatency(responses['sleep-latency']),
      canNap: responses['can-nap'] === 'Yes, easily' || responses['can-nap'] === 'Sometimes',
      consistentSchedule: true // Assuming consistent schedule for initial implementation
    };

    return {
      age: parseInt(responses['age']),
      chronotype: this.determineChronotype({
        bedTime: responses['typical-bedtime'],
        wakeTime: responses['typical-waketime'],
        age: parseInt(responses['age'])
      }),
      sleepProfile,
      previousJetlagRecovery: responses['recovery-time'] ? {
        daysToRecover: this.parseRecoveryDays(responses['recovery-time']),
        symptoms: []
      } : undefined
    };
  }

  private determineChronotype(data: { bedTime: string, wakeTime: string, age: number }): ChronotypeCategory {
    const midSleepMinutes = this.calculateMidSleep(data.bedTime, data.wakeTime);
    
    // Age-based adjustments
    let adjustment = 0;
    if (data.age < 25) adjustment = 60; // Younger people tend towards evening
    else if (data.age > 60) adjustment = -60; // Older people tend towards morning
    
    const adjustedMidSleep = (midSleepMinutes + adjustment + 24 * 60) % (24 * 60);
    
    if (adjustedMidSleep < timeToMinutes('02:00')) return ChronotypeCategory.EARLY_MORNING;
    if (adjustedMidSleep < timeToMinutes('03:00')) return ChronotypeCategory.MODERATE_MORNING;
    if (adjustedMidSleep < timeToMinutes('04:00')) return ChronotypeCategory.NEUTRAL;
    if (adjustedMidSleep < timeToMinutes('05:00')) return ChronotypeCategory.MODERATE_EVENING;
    return ChronotypeCategory.LATE_EVENING;
  }

  private calculateMidSleep(bedTime: string, wakeTime: string): number {
    const bedMinutes = timeToMinutes(bedTime);
    let wakeMinutes = timeToMinutes(wakeTime);
    if (wakeMinutes < bedMinutes) wakeMinutes += 24 * 60;
    return (bedMinutes + wakeMinutes) / 2;
  }

  private parseSleepLatency(latencyResponse: string): number {
    switch (latencyResponse) {
      case 'Less than 15 minutes': return 10;
      case '15-30 minutes': return 20;
      case 'More than 30 minutes': return 45;
      default: return 15;
    }
  }

  private parseRecoveryDays(recoveryResponse: string): number {
    switch (recoveryResponse) {
      case '1-2 days': return 2;
      case '3-4 days': return 4;
      case '5+ days': return 6;
      default: return 3;
    }
  }
}

function generateTimeOptions(start: string, end: string): string[] {
  const times: string[] = [];
  let current = start;
  while (current !== end) {
    times.push(current);
    const [hours, minutes] = current.split(':').map(Number);
    const totalMinutes = (hours * 60 + minutes + 30) % (24 * 60);
    const newHours = Math.floor(totalMinutes / 60);
    const newMinutes = totalMinutes % 60;
    current = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
  }
  times.push(end);
  return times;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
} 
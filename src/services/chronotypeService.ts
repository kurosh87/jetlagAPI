import { v4 as uuidv4 } from 'uuid';
import {
  ChronotypeCategory,
  ChronotypeAssessmentAnswer,
  SleepProfile,
  UserProfile,
  PersonalizationPreferences,
  PersonalizedSchedule,
  PersonalizedAdaptationDay,
  SleepQuality,
  PersonalizedActivity,
  PersonalizedSupplement
} from '../types/chronotype';
import { Flight } from '../types/flight';
import { timeToMinutes, minutesToTime, calculateTimeDifference } from '../utils/dateUtils';
import { JetlagService } from './jetlagService';

export class ChronotypeService {
  private jetlagService: JetlagService;

  constructor(jetlagService: JetlagService) {
    this.jetlagService = jetlagService;
  }

  public async determineChronotype(answers: ChronotypeAssessmentAnswer[]): Promise<ChronotypeCategory> {
    let morningScore = 0;
    let eveningScore = 0;

    for (const answer of answers) {
      switch (answer.questionId) {
        case 'natural_bedtime':
          const bedTime = timeToMinutes(answer.answer);
          if (bedTime < timeToMinutes('22:00')) morningScore += 2;
          else if (bedTime > timeToMinutes('00:00')) eveningScore += 2;
          break;
        case 'natural_waketime':
          const wakeTime = timeToMinutes(answer.answer);
          if (wakeTime < timeToMinutes('06:00')) morningScore += 2;
          else if (wakeTime > timeToMinutes('09:00')) eveningScore += 2;
          break;
        case 'weekend_sleep_diff':
          // If they maintain similar schedule on weekends, likely strong chronotype
          if (answer.answer === 'SIMILAR') {
            morningScore += 1;
            eveningScore += 1;
          }
          break;
      }
    }

    // Determine chronotype category based on scores
    if (morningScore > eveningScore + 4) return ChronotypeCategory.EARLY_MORNING;
    if (morningScore > eveningScore) return ChronotypeCategory.MODERATE_MORNING;
    if (eveningScore > morningScore + 4) return ChronotypeCategory.LATE_EVENING;
    if (eveningScore > morningScore) return ChronotypeCategory.MODERATE_EVENING;
    return ChronotypeCategory.NEUTRAL;
  }

  public async createUserProfile(
    age: number,
    sleepProfile: SleepProfile,
    previousRecovery?: { daysToRecover: number; symptoms: string[] }
  ): Promise<UserProfile> {
    // Calculate chronotype based on sleep profile and age
    const midSleep = this.calculateMidSleep(sleepProfile.typicalBedTime, sleepProfile.typicalWakeTime);
    
    // Adjust chronotype calculation based on age
    // Younger people tend towards evening, older towards morning
    let ageAdjustment = 0;
    if (age < 25) ageAdjustment = 60; // Add 60 minutes to midSleep
    else if (age > 60) ageAdjustment = -60; // Subtract 60 minutes from midSleep
    
    const adjustedMidSleep = midSleep + ageAdjustment;
    
    let chronotype: ChronotypeCategory;
    if (adjustedMidSleep < timeToMinutes('02:00')) {
      chronotype = ChronotypeCategory.EARLY_MORNING;
    } else if (adjustedMidSleep < timeToMinutes('03:00')) {
      chronotype = ChronotypeCategory.MODERATE_MORNING;
    } else if (adjustedMidSleep < timeToMinutes('04:00')) {
      chronotype = ChronotypeCategory.NEUTRAL;
    } else if (adjustedMidSleep < timeToMinutes('05:00')) {
      chronotype = ChronotypeCategory.MODERATE_EVENING;
    } else {
      chronotype = ChronotypeCategory.LATE_EVENING;
    }

    return {
      age,
      chronotype,
      sleepProfile,
      previousJetlagRecovery: previousRecovery
    };
  }

  public async generatePersonalizedSchedule(
    flight: Flight,
    userProfile: UserProfile,
    preferences: PersonalizationPreferences
  ): Promise<PersonalizedSchedule> {
    // Get base schedule from jetlag service
    const baseSchedule = await this.jetlagService.generateActivitySchedule(flight);

    // Calculate expected recovery days based on profile
    const expectedRecoveryDays = this.calculateExpectedRecoveryDays(
      flight.timezoneOffset,
      userProfile
    );

    // Generate personalized schedule
    const personalizedDays: PersonalizedAdaptationDay[] = baseSchedule.adaptationDays.map(day => {
      const sleepWindow = this.adjustSleepWindowForProfile(
        day.activities.find(a => a.type === 'SLEEP')?.timeWindow,
        userProfile
      );

      return {
        date: new Date(flight.arrivalTime).toISOString().split('T')[0],
        sleepWindow,
        naps: this.recommendNaps(userProfile, sleepWindow),
        activities: this.generatePersonalizedActivities(userProfile, sleepWindow),
        supplements: this.recommendSupplements(preferences, sleepWindow, userProfile)
      };
    });

    return {
      preFlightAdjustment: {
        days: this.generatePreFlightAdjustment(flight, userProfile, preferences)
      },
      duringFlight: {
        activities: this.generateFlightActivities(flight, userProfile),
        supplements: this.generateFlightSupplements(flight, preferences)
      },
      postArrival: {
        days: personalizedDays,
        expectedRecoveryDays
      }
    };
  }

  private calculateExpectedRecoveryDays(timezoneOffset: number, profile: UserProfile): number {
    let baseDays = Math.ceil(Math.abs(timezoneOffset) / 2); // Base: ~2 hours per day
    
    // Adjust for age
    if (profile.age > 60) baseDays += 1;
    if (profile.age < 25) baseDays -= 1;
    
    // Adjust for sleep quality
    if (profile.sleepProfile.sleepQuality === SleepQuality.POOR) baseDays += 1;
    if (profile.sleepProfile.sleepQuality === SleepQuality.EXCELLENT) baseDays -= 1;
    
    // Consider previous recovery experience
    if (profile.previousJetlagRecovery) {
      baseDays = Math.max(baseDays, profile.previousJetlagRecovery.daysToRecover - 1);
    }
    
    return Math.max(1, baseDays); // Minimum 1 day
  }

  private adjustSleepWindowForProfile(
    baseWindow: { start: string; end: string } | undefined,
    profile: UserProfile
  ): { start: string; end: string; notes?: string } {
    if (!baseWindow) {
      return {
        start: profile.sleepProfile.typicalBedTime,
        end: profile.sleepProfile.typicalWakeTime
      };
    }

    // Calculate adjustments based on chronotype and sleep profile
    const preferredMidSleep = this.calculateMidSleep(
      profile.sleepProfile.typicalBedTime,
      profile.sleepProfile.typicalWakeTime
    );
    
    const baseMidSleep = this.calculateMidSleep(baseWindow.start, baseWindow.end);
    let adjustment = (preferredMidSleep - baseMidSleep) / 2;
    
    // Reduce adjustment for poor sleepers to minimize disruption
    if (profile.sleepProfile.sleepQuality === SleepQuality.POOR) {
      adjustment = adjustment * 0.7;
    }

    return {
      start: minutesToTime((timeToMinutes(baseWindow.start) + adjustment + 24 * 60) % (24 * 60)),
      end: minutesToTime((timeToMinutes(baseWindow.end) + adjustment + 24 * 60) % (24 * 60)),
      notes: this.generateSleepNotes(profile)
    };
  }

  private generateSleepNotes(profile: UserProfile): string {
    const notes = [];
    if (profile.sleepProfile.sleepLatency > 30) {
      notes.push('Allow extra time to fall asleep');
    }
    if (!profile.sleepProfile.consistentSchedule) {
      notes.push('Try to maintain consistent sleep times');
    }
    return notes.join('. ');
  }

  private calculateMidSleep(bedTime: string, wakeTime: string): number {
    let bedMinutes = timeToMinutes(bedTime);
    let wakeMinutes = timeToMinutes(wakeTime);
    if (wakeMinutes < bedMinutes) wakeMinutes += 24 * 60;
    return (bedMinutes + wakeMinutes) / 2;
  }

  private recommendNaps(
    profile: UserProfile,
    sleepWindow: { start: string; end: string }
  ): { start: string; end: string; priority: 'RECOMMENDED' | 'OPTIONAL' }[] {
    if (!profile.sleepProfile.canNap) {
      return [];
    }

    // Calculate ideal nap time (typically 7-8 hours after wake time)
    const wakeMinutes = timeToMinutes(sleepWindow.end);
    const napStart = (wakeMinutes + 420) % (24 * 60); // 7 hours after wake
    
    return [{
      start: minutesToTime(napStart),
      end: minutesToTime((napStart + 20) % (24 * 60)), // 20-minute nap
      priority: profile.sleepProfile.sleepQuality === SleepQuality.POOR ? 'RECOMMENDED' : 'OPTIONAL'
    }];
  }

  private generatePersonalizedActivities(
    profile: UserProfile,
    sleepWindow: { start: string; end: string }
  ): PersonalizedActivity[] {
    const activities: PersonalizedActivity[] = [];
    const wakeMinutes = timeToMinutes(sleepWindow.end);
    
    // Morning activity
    activities.push({
      type: 'EXERCISE',
      recommendedTime: minutesToTime((wakeMinutes + 120) % (24 * 60)), // 2 hours after wake
      duration: 30,
      priority: 'MEDIUM'
    });

    // Meals
    activities.push({
      type: 'MEAL',
      recommendedTime: minutesToTime((wakeMinutes + 60) % (24 * 60)), // 1 hour after wake
      duration: 30,
      priority: 'HIGH'
    });

    return activities;
  }

  private recommendSupplements(
    preferences: PersonalizationPreferences,
    sleepWindow: { start: string; end: string },
    profile: UserProfile
  ): PersonalizedSupplement[] {
    if (preferences.supplementPreference === 'NO_SUPPLEMENTS') {
      return [];
    }

    const supplements: PersonalizedSupplement[] = [];
    
    // Melatonin timing based on sleep quality and latency
    const melatoninOffset = profile.sleepProfile.sleepLatency > 30 ? 90 : 60;
    supplements.push({
      type: 'MELATONIN',
      timing: minutesToTime((timeToMinutes(sleepWindow.start) - melatoninOffset + 24 * 60) % (24 * 60)),
      dose: profile.sleepProfile.sleepQuality === SleepQuality.POOR ? '1mg' : '0.5mg',
      optional: profile.sleepProfile.sleepQuality !== SleepQuality.POOR
    });

    return supplements;
  }

  private generatePreFlightAdjustment(
    flight: Flight,
    profile: UserProfile,
    preferences: PersonalizationPreferences
  ): PersonalizedAdaptationDay[] {
    // Implementation will generate pre-flight adjustment schedule
    // This is a placeholder that needs to be implemented
    return [];
  }

  private generateFlightActivities(
    flight: Flight,
    profile: UserProfile
  ): PersonalizedActivity[] {
    // Implementation will generate in-flight activities
    // This is a placeholder that needs to be implemented
    return [];
  }

  private generateFlightSupplements(
    flight: Flight,
    preferences: PersonalizationPreferences
  ): PersonalizedSupplement[] {
    // Implementation will generate in-flight supplement recommendations
    // This is a placeholder that needs to be implemented
    return [];
  }
} 
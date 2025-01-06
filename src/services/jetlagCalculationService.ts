import {
  Direction,
  TimeWindow,
  LightExposure,
  MealWindow,
  CircadianSchedule,
  AdaptationSchedule,
  JetlagSeverity,
  ActivityPriority,
  CIRCADIAN_CONSTANTS,
  LIGHT_EXPOSURE_ADJUSTMENT,
  MELATONIN_ADJUSTMENT,
  LIGHT_EXPOSURE_RULES,
  MELATONIN_RULES,
  MEAL_TIMING
} from '../types/circadian';

export class JetlagCalculationService {
  /**
   * Calculate jetlag severity and generate adaptation schedule
   */
  public calculateJetlagAdaptation(
    flight: {
      origin: { timezone: string },
      destination: { timezone: string },
      departureTime: Date,
      arrivalTime: Date,
      duration: number,
      layovers?: Array<{ duration: number }>
    },
    userPreferences?: {
      chronotype?: 'early' | 'normal' | 'late',
      lightSensitivity?: 'low' | 'normal' | 'high',
      caffeineMetabolism?: 'fast' | 'normal' | 'slow',
      typicalSleepDuration?: number,
      preferredWakeTime?: string,
      canTakeMelatonin?: boolean
    }
  ): AdaptationSchedule {
    // Calculate base severity
    const severity = this.calculateSeverity(flight, userPreferences);

    // Generate schedules
    const preFlight = this.generatePreFlightSchedule(
      severity.factors.directionality,
      severity.timezoneDifference,
      flight.departureTime,
      userPreferences
    );

    const inFlight = this.generateFlightSchedule(
      flight.duration,
      severity.factors.directionality,
      flight.departureTime,
      flight.arrivalTime,
      flight.layovers,
      userPreferences
    );

    const postFlight = this.generatePostFlightSchedule(
      severity.factors.directionality,
      severity.timezoneDifference,
      flight.arrivalTime,
      userPreferences
    );

    return {
      preFlight,
      inFlight,
      postFlight,
      severity
    };
  }

  private calculateSeverity(
    flight: {
      origin: { timezone: string },
      destination: { timezone: string },
      departureTime: Date,
      arrivalTime: Date,
      duration: number,
      layovers?: Array<{ duration: number }>
    },
    userPreferences?: {
      chronotype?: 'early' | 'normal' | 'late'
    }
  ): JetlagSeverity {
    const timezoneDiff = this.calculateTimezoneDifference(
      flight.origin.timezone,
      flight.destination.timezone
    );

    const directionality = timezoneDiff > 0 ? 'eastward' : 'westward';
    const directionalityFactor = this.calculateDirectionalityFactor(
      directionality,
      userPreferences?.chronotype
    );

    const timezoneImpact = Math.abs(timezoneDiff) * directionalityFactor;
    const durationImpact = this.calculateDurationImpact(flight.duration);
    const layoverImpact = flight.layovers ? 
      this.calculateLayoverImpact(flight.layovers) : 0;
    const timeOfDayImpact = this.calculateTimeOfDayImpact(
      flight.departureTime,
      flight.arrivalTime,
      flight.origin.timezone,
      flight.destination.timezone
    );

    // Calculate base score (0-10 scale)
    const baseScore = Math.min(
      (timezoneImpact + durationImpact + layoverImpact + timeOfDayImpact) / 3,
      10
    );

    const adaptationDays = Math.ceil(
      Math.abs(timezoneDiff) / CIRCADIAN_CONSTANTS.AVERAGE_ADJUSTMENT_RATE
    );

    return {
      score: Number(baseScore.toFixed(1)),
      timezoneDifference: timezoneDiff,
      factors: {
        timezoneDifference: Math.abs(timezoneDiff),
        flightDuration: durationImpact,
        layoverImpact,
        directionality,
        timeOfDayImpact
      },
      adaptationDays
    };
  }

  private calculateDirectionalityFactor(
    direction: Direction,
    chronotype?: 'early' | 'normal' | 'late'
  ): number {
    let baseFactor = direction === 'eastward' ? 1.2 : 1.0;

    // Adjust for chronotype
    if (chronotype) {
      if (direction === 'eastward' && chronotype === 'late') {
        baseFactor *= 1.2; // Late types struggle more with phase advances
      } else if (direction === 'westward' && chronotype === 'early') {
        baseFactor *= 1.1; // Early types struggle more with phase delays
      }
    }

    return baseFactor;
  }

  private calculateTimezoneDifference(
    originTz: string,
    destTz: string
  ): number {
    const now = new Date();
    const originOffset = new Date(now.toLocaleString('en-US', { timeZone: originTz }))
      .getTimezoneOffset();
    const destOffset = new Date(now.toLocaleString('en-US', { timeZone: destTz }))
      .getTimezoneOffset();
    
    return (originOffset - destOffset) / 60; // Convert to hours
  }

  private calculateDurationImpact(duration: number): number {
    const hoursFactor = duration / 60; // Convert minutes to hours
    return Math.min(hoursFactor / 24, 1) * 2;
  }

  private calculateLayoverImpact(
    layovers: Array<{ duration: number }>
  ): number {
    return layovers.reduce((impact, layover) => {
      const layoverHours = layover.duration / 60;
      if (layoverHours < 3) {
        // Short layovers are more disruptive
        return impact + (layoverHours / 3) * 0.8;
      } else if (layoverHours > 6) {
        // Long layovers allow for adaptation
        return impact + Math.min((layoverHours - 6) / 6, 1) * 0.3;
      }
      // Medium layovers have moderate impact
      return impact + Math.min(layoverHours / 3, 1) * 0.5;
    }, 0);
  }

  private calculateTimeOfDayImpact(
    departureTime: Date,
    arrivalTime: Date,
    originTz: string,
    destTz: string
  ): number {
    const departureLocal = new Date(
      departureTime.toLocaleString('en-US', { timeZone: originTz })
    );
    const arrivalLocal = new Date(
      arrivalTime.toLocaleString('en-US', { timeZone: destTz })
    );

    let impact = 0;

    // Impact is higher for arrivals during normal sleep hours (22:00-06:00)
    const arrivalHour = arrivalLocal.getHours();
    if (arrivalHour >= 22 || arrivalHour <= 6) {
      impact += 0.5;
    }

    // Impact is higher for very early or very late departures
    const departureHour = departureLocal.getHours();
    if (departureHour <= 4 || departureHour >= 23) {
      impact += 0.5;
    } else if (departureHour <= 6 || departureHour >= 21) {
      impact += 0.3;
    }

    return impact;
  }

  private generatePreFlightSchedule(
    direction: Direction,
    timezoneDiff: number,
    departureTime: Date,
    userPreferences?: {
      chronotype?: 'early' | 'normal' | 'late',
      lightSensitivity?: 'low' | 'normal' | 'high',
      canTakeMelatonin?: boolean,
      typicalSleepDuration?: number
    }
  ): CircadianSchedule {
    const daysBeforeFlight = Math.min(Math.abs(timezoneDiff) / 2, 3);
    const dailyShift = direction === 'eastward'
      ? LIGHT_EXPOSURE_ADJUSTMENT.ADVANCE.MAX_SHIFT
      : -LIGHT_EXPOSURE_ADJUSTMENT.DELAY.MAX_SHIFT;

    const sleepWindows = this.generatePreFlightSleepWindows(
      daysBeforeFlight,
      dailyShift,
      departureTime,
      userPreferences?.typicalSleepDuration
    );

    const lightExposure = this.generatePreFlightLightExposure(
      direction,
      daysBeforeFlight,
      departureTime,
      userPreferences?.lightSensitivity
    );

    const melatoninWindows = userPreferences?.canTakeMelatonin !== false
      ? this.generatePreFlightMelatonin(direction, daysBeforeFlight, departureTime)
      : [];

    return {
      sleepWindows,
      lightExposure,
      melatoninWindows,
      caffeineWindows: this.generatePreFlightCaffeine(sleepWindows),
      mealWindows: this.generatePreFlightMeals(sleepWindows, direction)
    };
  }

  private generateFlightSchedule(
    duration: number,
    direction: Direction,
    departureTime: Date,
    arrivalTime: Date,
    layovers?: Array<{ duration: number }>,
    userPreferences?: {
      lightSensitivity?: 'low' | 'normal' | 'high',
      canTakeMelatonin?: boolean
    }
  ): CircadianSchedule {
    const sleepWindows = this.calculateOptimalFlightSleep(
      duration,
      direction,
      departureTime,
      arrivalTime,
      layovers
    );

    const lightExposure = this.calculateFlightLightExposure(
      direction,
      departureTime,
      arrivalTime,
      userPreferences?.lightSensitivity
    );

    const melatoninWindows = userPreferences?.canTakeMelatonin !== false
      ? this.calculateFlightMelatonin(direction, departureTime, arrivalTime)
      : [];

    return {
      sleepWindows,
      lightExposure,
      melatoninWindows,
      caffeineWindows: this.calculateFlightCaffeine(sleepWindows, duration),
      mealWindows: this.calculateFlightMeals(duration, direction, departureTime, arrivalTime)
    };
  }

  private generatePostFlightSchedule(
    direction: Direction,
    timezoneDiff: number,
    arrivalTime: Date,
    userPreferences?: {
      chronotype?: 'early' | 'normal' | 'late',
      lightSensitivity?: 'low' | 'normal' | 'high',
      canTakeMelatonin?: boolean,
      typicalSleepDuration?: number
    }
  ): CircadianSchedule {
    const adjustmentDays = Math.ceil(
      Math.abs(timezoneDiff) / CIRCADIAN_CONSTANTS.AVERAGE_ADJUSTMENT_RATE
    );

    const sleepWindows = this.generatePostFlightSleepWindows(
      direction,
      adjustmentDays,
      arrivalTime,
      userPreferences?.typicalSleepDuration
    );

    const lightExposure = this.generatePostFlightLightExposure(
      direction,
      adjustmentDays,
      arrivalTime,
      userPreferences?.lightSensitivity
    );

    const melatoninWindows = userPreferences?.canTakeMelatonin !== false
      ? this.generatePostFlightMelatonin(direction, adjustmentDays, arrivalTime)
      : [];

    return {
      sleepWindows,
      lightExposure,
      melatoninWindows,
      caffeineWindows: this.generatePostFlightCaffeine(sleepWindows),
      mealWindows: this.generatePostFlightMeals(sleepWindows, direction)
    };
  }

  private generatePreFlightSleepWindows(
    daysBeforeFlight: number,
    dailyShift: number,
    departureTime: Date,
    typicalSleepDuration: number = CIRCADIAN_CONSTANTS.MIN_SLEEP_DURATION
  ): TimeWindow[] {
    const windows: TimeWindow[] = [];
    const baselineWakeTime = new Date(departureTime);
    baselineWakeTime.setHours(7, 0, 0, 0); // Assume 7 AM baseline wake time

    for (let day = 0; day < daysBeforeFlight; day++) {
      const shift = dailyShift * (day + 1);
      const sleepStart = new Date(baselineWakeTime);
      sleepStart.setDate(sleepStart.getDate() - (daysBeforeFlight - day));
      sleepStart.setHours(23 - shift, 0, 0, 0);

      const sleepEnd = new Date(sleepStart);
      sleepEnd.setHours(sleepStart.getHours() + typicalSleepDuration);

      windows.push({
        start: sleepStart,
        end: sleepEnd,
        priority: ActivityPriority.HIGH,
        notes: `Pre-flight sleep window - Day ${day + 1}`
      });
    }

    return windows;
  }

  private generatePreFlightLightExposure(
    direction: Direction,
    daysBeforeFlight: number,
    departureTime: Date,
    sensitivity: 'low' | 'normal' | 'high' = 'normal'
  ): LightExposure[] {
    const exposures: LightExposure[] = [];
    const intensityMultiplier = {
      low: 1.2,
      normal: 1.0,
      high: 0.8
    }[sensitivity];

    for (let day = 0; day < daysBeforeFlight; day++) {
      const date = new Date(departureTime);
      date.setDate(date.getDate() - (daysBeforeFlight - day));

      if (direction === 'eastward') {
        // Morning light exposure
        exposures.push({
          start: new Date(date.setHours(6, 0, 0, 0)),
          end: new Date(date.setHours(8, 0, 0, 0)),
          type: 'bright',
          intensity: CIRCADIAN_CONSTANTS.MAX_LIGHT_INTENSITY * intensityMultiplier,
          priority: ActivityPriority.CRITICAL,
          notes: `Morning light exposure - Day ${day + 1}`
        });

        // Evening light avoidance
        exposures.push({
          start: new Date(date.setHours(20, 0, 0, 0)),
          end: new Date(date.setHours(22, 0, 0, 0)),
          type: 'avoid',
          priority: ActivityPriority.HIGH,
          notes: `Avoid bright light - Day ${day + 1}`
        });
      } else {
        // Evening light exposure
        exposures.push({
          start: new Date(date.setHours(20, 0, 0, 0)),
          end: new Date(date.setHours(22, 0, 0, 0)),
          type: 'bright',
          intensity: CIRCADIAN_CONSTANTS.MAX_LIGHT_INTENSITY * intensityMultiplier,
          priority: ActivityPriority.CRITICAL,
          notes: `Evening light exposure - Day ${day + 1}`
        });

        // Morning light avoidance
        exposures.push({
          start: new Date(date.setHours(6, 0, 0, 0)),
          end: new Date(date.setHours(8, 0, 0, 0)),
          type: 'avoid',
          priority: ActivityPriority.HIGH,
          notes: `Avoid bright light - Day ${day + 1}`
        });
      }
    }

    return exposures;
  }

  private generatePreFlightMelatonin(
    direction: Direction,
    daysBeforeFlight: number,
    departureTime: Date
  ): TimeWindow[] {
    const windows: TimeWindow[] = [];
    const baselineMelatoninTime = new Date(departureTime);
    baselineMelatoninTime.setHours(21, 0, 0, 0); // Assume 9 PM baseline melatonin time

    for (let day = 0; day < daysBeforeFlight; day++) {
      const shift = direction === 'eastward'
        ? MELATONIN_ADJUSTMENT.ADVANCE.DAILY_SHIFT * (day + 1)
        : -MELATONIN_ADJUSTMENT.DELAY.DAILY_SHIFT * (day + 1);

      const melatoninTime = new Date(baselineMelatoninTime);
      melatoninTime.setDate(melatoninTime.getDate() - (daysBeforeFlight - day));
      melatoninTime.setHours(21 + shift, 0, 0, 0);

      windows.push({
        start: melatoninTime,
        end: new Date(melatoninTime.getTime() + CIRCADIAN_CONSTANTS.MELATONIN_WINDOW * 60 * 60 * 1000),
        priority: ActivityPriority.HIGH,
        notes: `Pre-flight melatonin - Day ${day + 1}`
      });
    }

    return windows;
  }

  private generatePreFlightCaffeine(sleepWindows: TimeWindow[]): TimeWindow[] {
    return sleepWindows.map(window => {
      const caffeineEnd = new Date(window.start.getTime() - CIRCADIAN_CONSTANTS.CAFFEINE_CUTOFF * 60 * 60 * 1000);
      const caffeineStart = new Date(caffeineEnd.getTime() - 12 * 60 * 60 * 1000); // 12-hour caffeine window

      return {
        start: caffeineStart,
        end: caffeineEnd,
        priority: ActivityPriority.MEDIUM,
        notes: 'Avoid caffeine before sleep window'
      };
    });
  }

  private generatePreFlightMeals(sleepWindows: TimeWindow[], direction: Direction): MealWindow[] {
    const meals: MealWindow[] = [];

    sleepWindows.forEach(window => {
      const date = new Date(window.start);
      
      // Breakfast: 30 minutes after wake
      const breakfastTime = new Date(window.end);
      meals.push({
        start: breakfastTime,
        end: new Date(breakfastTime.getTime() + 30 * 60 * 1000),
        priority: ActivityPriority.MEDIUM,
        type: 'breakfast',
        notes: 'Breakfast'
      });

      // Lunch: middle of the day
      const lunchTime = new Date(date.setHours(13, 0, 0, 0));
      meals.push({
        start: lunchTime,
        end: new Date(lunchTime.getTime() + 45 * 60 * 1000),
        priority: ActivityPriority.MEDIUM,
        type: 'lunch',
        notes: 'Lunch'
      });

      // Dinner: adjusted based on direction
      const dinnerTime = new Date(date);
      dinnerTime.setHours(direction === 'eastward' ? 18 : 19, 0, 0, 0);
      meals.push({
        start: dinnerTime,
        end: new Date(dinnerTime.getTime() + 45 * 60 * 1000),
        priority: ActivityPriority.MEDIUM,
        type: 'dinner',
        notes: 'Dinner'
      });
    });

    return meals;
  }

  private calculateOptimalFlightSleep(
    duration: number,
    direction: Direction,
    departureTime: Date,
    arrivalTime: Date,
    layovers?: Array<{ duration: number }>
  ): TimeWindow[] {
    const windows: TimeWindow[] = [];
    const totalLayoverDuration = layovers?.reduce((sum, layover) => sum + layover.duration, 0) || 0;
    const flightDuration = duration - totalLayoverDuration;

    if (flightDuration >= CIRCADIAN_CONSTANTS.MIN_SLEEP_DURATION) {
      const optimalSleepStart = direction === 'eastward'
        ? this.calculateEastwardFlightSleepTime(departureTime, arrivalTime)
        : this.calculateWestwardFlightSleepTime(departureTime, arrivalTime);

      windows.push({
        start: optimalSleepStart,
        end: new Date(optimalSleepStart.getTime() + CIRCADIAN_CONSTANTS.MIN_SLEEP_DURATION * 60 * 60 * 1000),
        priority: ActivityPriority.CRITICAL,
        notes: 'Optimal in-flight sleep window'
      });
    }

    return windows;
  }

  private calculateEastwardFlightSleepTime(departureTime: Date, arrivalTime: Date): Date {
    // For eastward flights, aim to sleep in the latter portion of the flight
    const flightMidpoint = new Date((departureTime.getTime() + arrivalTime.getTime()) / 2);
    const sleepStart = new Date(flightMidpoint);
    sleepStart.setHours(sleepStart.getHours() - Math.floor(CIRCADIAN_CONSTANTS.MIN_SLEEP_DURATION / 2));
    return sleepStart;
  }

  private calculateWestwardFlightSleepTime(departureTime: Date, arrivalTime: Date): Date {
    // For westward flights, aim to sleep in the early portion of the flight
    const sleepStart = new Date(departureTime);
    sleepStart.setHours(sleepStart.getHours() + 2); // Start sleep 2 hours into flight
    return sleepStart;
  }

  private calculateFlightLightExposure(
    direction: Direction,
    departureTime: Date,
    arrivalTime: Date,
    sensitivity: 'low' | 'normal' | 'high' = 'normal'
  ): LightExposure[] {
    const exposures: LightExposure[] = [];
    const intensityMultiplier = {
      low: 1.2,
      normal: 1.0,
      high: 0.8
    }[sensitivity];

    if (direction === 'eastward') {
      // For eastward flights, bright light exposure after the sleep window
      const postSleepTime = new Date(arrivalTime);
      postSleepTime.setHours(postSleepTime.getHours() - 4);
      
      exposures.push({
        start: postSleepTime,
        end: arrivalTime,
        type: 'bright',
        intensity: CIRCADIAN_CONSTANTS.MAX_LIGHT_INTENSITY * intensityMultiplier,
        priority: ActivityPriority.HIGH,
        notes: 'Post-sleep light exposure'
      });
    } else {
      // For westward flights, light avoidance in the early part of the flight
      const avoidanceEnd = new Date(departureTime);
      avoidanceEnd.setHours(avoidanceEnd.getHours() + 4);
      
      exposures.push({
        start: departureTime,
        end: avoidanceEnd,
        type: 'avoid',
        priority: ActivityPriority.HIGH,
        notes: 'Initial light avoidance'
      });
    }

    return exposures;
  }

  private calculateFlightMelatonin(
    direction: Direction,
    departureTime: Date,
    arrivalTime: Date
  ): TimeWindow[] {
    const windows: TimeWindow[] = [];
    const flightMidpoint = new Date((departureTime.getTime() + arrivalTime.getTime()) / 2);

    if (direction === 'eastward') {
      // Take melatonin earlier in the flight for eastward travel
      const melatoninTime = new Date(flightMidpoint);
      melatoninTime.setHours(melatoninTime.getHours() - 2);

      windows.push({
        start: melatoninTime,
        end: new Date(melatoninTime.getTime() + CIRCADIAN_CONSTANTS.MELATONIN_WINDOW * 60 * 60 * 1000),
        priority: ActivityPriority.HIGH,
        notes: 'In-flight melatonin'
      });
    } else {
      // Take melatonin later in the flight for westward travel
      const melatoninTime = new Date(flightMidpoint);
      melatoninTime.setHours(melatoninTime.getHours() + 2);

      windows.push({
        start: melatoninTime,
        end: new Date(melatoninTime.getTime() + CIRCADIAN_CONSTANTS.MELATONIN_WINDOW * 60 * 60 * 1000),
        priority: ActivityPriority.HIGH,
        notes: 'In-flight melatonin'
      });
    }

    return windows;
  }

  private calculateFlightCaffeine(sleepWindows: TimeWindow[], duration: number): TimeWindow[] {
    const windows: TimeWindow[] = [];

    if (duration > 4) { // Only suggest caffeine for longer flights
      sleepWindows.forEach(window => {
        const caffeineEnd = new Date(window.start.getTime() - CIRCADIAN_CONSTANTS.CAFFEINE_CUTOFF * 60 * 60 * 1000);
        const caffeineStart = new Date(caffeineEnd.getTime() - 2 * 60 * 60 * 1000); // 2-hour caffeine window

        windows.push({
          start: caffeineStart,
          end: caffeineEnd,
          priority: ActivityPriority.MEDIUM,
          notes: 'Avoid caffeine before sleep window'
        });
      });
    }

    return windows;
  }

  private calculateFlightMeals(
    duration: number,
    direction: Direction,
    departureTime: Date,
    arrivalTime: Date
  ): MealWindow[] {
    const meals: MealWindow[] = [];
    const mealDuration = 45 * 60 * 1000; // 45 minutes for each meal

    if (duration > 4) { // Only suggest meals for longer flights
      const flightMidpoint = new Date((departureTime.getTime() + arrivalTime.getTime()) / 2);

      // First meal
      const firstMealTime = new Date(departureTime);
      firstMealTime.setHours(firstMealTime.getHours() + 1);
      meals.push({
        start: firstMealTime,
        end: new Date(firstMealTime.getTime() + mealDuration),
        priority: ActivityPriority.MEDIUM,
        type: 'breakfast',
        notes: 'First in-flight meal'
      });

      // Mid-flight meal for long flights
      if (duration > 8) {
        meals.push({
          start: flightMidpoint,
          end: new Date(flightMidpoint.getTime() + mealDuration),
          priority: ActivityPriority.MEDIUM,
          type: 'lunch',
          notes: 'Mid-flight meal'
        });
      }

      // Last meal
      const lastMealTime = new Date(arrivalTime);
      lastMealTime.setHours(lastMealTime.getHours() - 2);
      meals.push({
        start: lastMealTime,
        end: new Date(lastMealTime.getTime() + mealDuration),
        priority: ActivityPriority.MEDIUM,
        type: 'dinner',
        notes: 'Pre-arrival meal'
      });
    }

    return meals;
  }

  private generatePostFlightSleepWindows(
    direction: Direction,
    adjustmentDays: number,
    arrivalTime: Date,
    typicalSleepDuration: number = CIRCADIAN_CONSTANTS.MIN_SLEEP_DURATION
  ): TimeWindow[] {
    const windows: TimeWindow[] = [];
    const targetSleepTime = direction === 'eastward' ? 22 : 23; // Target local bedtime

    for (let day = 0; day < adjustmentDays; day++) {
      const date = new Date(arrivalTime);
      date.setDate(date.getDate() + day);

      const sleepStart = new Date(date);
      sleepStart.setHours(targetSleepTime, 0, 0, 0);

      const sleepEnd = new Date(sleepStart);
      sleepEnd.setHours(sleepStart.getHours() + typicalSleepDuration);

      windows.push({
        start: sleepStart,
        end: sleepEnd,
        priority: ActivityPriority.CRITICAL,
        notes: `Post-flight sleep window - Day ${day + 1}`
      });
    }

    return windows;
  }

  private generatePostFlightLightExposure(
    direction: Direction,
    adjustmentDays: number,
    arrivalTime: Date,
    sensitivity: 'low' | 'normal' | 'high' = 'normal'
  ): LightExposure[] {
    const exposures: LightExposure[] = [];
    const intensityMultiplier = {
      low: 1.2,
      normal: 1.0,
      high: 0.8
    }[sensitivity];

    for (let day = 0; day < adjustmentDays; day++) {
      const date = new Date(arrivalTime);
      date.setDate(date.getDate() + day);

      if (direction === 'eastward') {
        // Morning light exposure for eastward travel
        const morningStart = new Date(date);
        morningStart.setHours(7, 0, 0, 0);
        
        exposures.push({
          start: morningStart,
          end: new Date(morningStart.getTime() + 2 * 60 * 60 * 1000),
          type: 'bright',
          intensity: CIRCADIAN_CONSTANTS.MAX_LIGHT_INTENSITY * intensityMultiplier,
          priority: ActivityPriority.CRITICAL,
          notes: `Morning light exposure - Day ${day + 1}`
        });

        // Evening light avoidance
        const eveningStart = new Date(date);
        eveningStart.setHours(20, 0, 0, 0);
        
        exposures.push({
          start: eveningStart,
          end: new Date(eveningStart.getTime() + 2 * 60 * 60 * 1000),
          type: 'avoid',
          priority: ActivityPriority.HIGH,
          notes: `Evening light avoidance - Day ${day + 1}`
        });
      } else {
        // Evening light exposure for westward travel
        const eveningStart = new Date(date);
        eveningStart.setHours(19, 0, 0, 0);
        
        exposures.push({
          start: eveningStart,
          end: new Date(eveningStart.getTime() + 2 * 60 * 60 * 1000),
          type: 'bright',
          intensity: CIRCADIAN_CONSTANTS.MAX_LIGHT_INTENSITY * intensityMultiplier,
          priority: ActivityPriority.CRITICAL,
          notes: `Evening light exposure - Day ${day + 1}`
        });

        // Morning light avoidance
        const morningStart = new Date(date);
        morningStart.setHours(6, 0, 0, 0);
        
        exposures.push({
          start: morningStart,
          end: new Date(morningStart.getTime() + 2 * 60 * 60 * 1000),
          type: 'avoid',
          priority: ActivityPriority.HIGH,
          notes: `Morning light avoidance - Day ${day + 1}`
        });
      }
    }

    return exposures;
  }

  private generatePostFlightMelatonin(
    direction: Direction,
    adjustmentDays: number,
    arrivalTime: Date
  ): TimeWindow[] {
    const windows: TimeWindow[] = [];
    const targetMelatoninTime = direction === 'eastward' ? 20 : 21; // Target local melatonin time

    for (let day = 0; day < adjustmentDays; day++) {
      const date = new Date(arrivalTime);
      date.setDate(date.getDate() + day);
      date.setHours(targetMelatoninTime, 0, 0, 0);

      windows.push({
        start: date,
        end: new Date(date.getTime() + CIRCADIAN_CONSTANTS.MELATONIN_WINDOW * 60 * 60 * 1000),
        priority: ActivityPriority.HIGH,
        notes: `Post-flight melatonin - Day ${day + 1}`
      });
    }

    return windows;
  }

  private generatePostFlightCaffeine(sleepWindows: TimeWindow[]): TimeWindow[] {
    return sleepWindows.map(window => {
      const caffeineEnd = new Date(window.start.getTime() - CIRCADIAN_CONSTANTS.CAFFEINE_CUTOFF * 60 * 60 * 1000);
      const caffeineStart = new Date(caffeineEnd.getTime() - 12 * 60 * 60 * 1000); // 12-hour caffeine window

      return {
        start: caffeineStart,
        end: caffeineEnd,
        priority: ActivityPriority.MEDIUM,
        notes: 'Avoid caffeine before sleep window'
      };
    });
  }

  private generatePostFlightMeals(sleepWindows: TimeWindow[], direction: Direction): MealWindow[] {
    const meals: MealWindow[] = [];

    sleepWindows.forEach((window, index) => {
      const date = new Date(window.start);
      
      // Breakfast: 30 minutes after wake
      const breakfastTime = new Date(window.end);
      meals.push({
        start: breakfastTime,
        end: new Date(breakfastTime.getTime() + 30 * 60 * 1000),
        priority: ActivityPriority.MEDIUM,
        type: 'breakfast',
        notes: `Breakfast - Day ${index + 1}`
      });

      // Lunch: middle of the day
      const lunchTime = new Date(date.setHours(13, 0, 0, 0));
      meals.push({
        start: lunchTime,
        end: new Date(lunchTime.getTime() + 45 * 60 * 1000),
        priority: ActivityPriority.MEDIUM,
        type: 'lunch',
        notes: `Lunch - Day ${index + 1}`
      });

      // Dinner: adjusted based on direction
      const dinnerTime = new Date(date);
      dinnerTime.setHours(direction === 'eastward' ? 18 : 19, 0, 0, 0);
      meals.push({
        start: dinnerTime,
        end: new Date(dinnerTime.getTime() + 45 * 60 * 1000),
        priority: ActivityPriority.MEDIUM,
        type: 'dinner',
        notes: `Dinner - Day ${index + 1}`
      });
    });

    return meals;
  }
} 
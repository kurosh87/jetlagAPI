# Jetlag Calculation Algorithm

## Scientific Background

### Circadian Rhythm Constants

```typescript
export const CIRCADIAN_CONSTANTS = {
  AVERAGE_ADJUSTMENT_RATE: 1,      // Hours per day the body can adjust
  MELATONIN_WINDOW: 2,            // Hours before desired sleep for melatonin
  CAFFEINE_HALFLIFE: 5,           // Hours for caffeine to reduce by half
  MIN_SLEEP_DURATION: 7,          // Minimum recommended sleep hours
  MAX_LIGHT_INTENSITY: 10000,     // Lux for bright light therapy
  DIM_LIGHT_THRESHOLD: 50,        // Lux threshold for melatonin production
  CORE_TEMP_MINIMUM: 4,           // Hours before natural wake time
  PHASE_ADVANCE_LIMIT: 2.5,       // Maximum hours to advance per day
  PHASE_DELAY_LIMIT: 2,           // Maximum hours to delay per day
  MEAL_TIMING_IMPACT: 0.5         // Impact factor of meal timing
};
```

### Key Principles

1. **Directional Asymmetry**
   - Eastward travel (phase advance) is harder to adjust to than westward travel (phase delay)
   - Maximum daily phase shifts:
     * Advance: 2.5 hours per day
     * Delay: 2 hours per day

2. **Light Exposure Timing**
   ```typescript
   const LIGHT_EXPOSURE_RULES = {
     ADVANCE: {
       OPTIMAL_START: -6,    // Hours before core body temperature minimum
       OPTIMAL_END: -2,      // Hours before core body temperature minimum
       AVOID_START: 2,       // Hours after core body temperature minimum
       AVOID_END: 6         // Hours after core body temperature minimum
     },
     DELAY: {
       OPTIMAL_START: 2,     // Hours after core body temperature minimum
       OPTIMAL_END: 6,       // Hours after core body temperature minimum
       AVOID_START: -6,      // Hours before core body temperature minimum
       AVOID_END: -2        // Hours before core body temperature minimum
     }
   };
   ```

3. **Melatonin Timing**
   ```typescript
   const MELATONIN_RULES = {
     ADVANCE: {
       OPTIMAL_TIME: -5,     // Hours before desired sleep time
       DURATION: 0.5         // Hours to take effect
     },
     DELAY: {
       OPTIMAL_TIME: 2,      // Hours after usual sleep time
       DURATION: 0.5         // Hours to take effect
     },
     DOSAGE: {
       MINIMUM: 0.5,         // mg
       MAXIMUM: 5,           // mg
       STANDARD: 3           // mg
     }
   };
   ```

## Severity Calculation

### Base Score Calculation

```typescript
function calculateBaseScore(timezoneDiff: number, flightDuration: number): number {
  const directionality = timezoneDiff > 0 ? 'eastward' : 'westward';
  const directionalityFactor = directionality === 'eastward' ? 1.2 : 1;
  
  const timezoneImpact = Math.abs(timezoneDiff) * directionalityFactor;
  const durationImpact = Math.min(flightDuration / (24 * 60), 1) * 2;
  
  return Math.min((timezoneImpact + durationImpact) / 2, 10);
}
```

### Adjustment Factors

1. **Flight Duration Impact**
   ```typescript
   function calculateDurationImpact(duration: number): number {
     const hoursFactor = duration / 60;  // Convert minutes to hours
     return Math.min(hoursFactor / 24, 1) * 2;
   }
   ```

2. **Layover Impact**
   ```typescript
   function calculateLayoverImpact(layovers: Layover[]): number {
     return layovers.reduce((impact, layover) => {
       const layoverHours = layover.duration / 60;
       return impact + Math.min(layoverHours / 3, 1) * 0.5;
     }, 0);
   }
   ```

3. **Time of Day Impact**
   ```typescript
   function calculateTimeOfDayImpact(
     departureTime: Date,
     arrivalTime: Date,
     originTimezone: string,
     destTimezone: string
   ): number {
     const departureLocal = convertToLocalTime(departureTime, originTimezone);
     const arrivalLocal = convertToLocalTime(arrivalTime, destTimezone);
     
     // Impact is higher for arrivals during normal sleep hours
     const sleepHoursImpact = isInSleepHours(arrivalLocal) ? 0.5 : 0;
     // Impact is higher for departures very early or very late
     const departureImpact = calculateTimeImpact(departureLocal);
     
     return sleepHoursImpact + departureImpact;
   }
   ```

## Schedule Generation

### Pre-Flight Adaptation

```typescript
function generatePreFlightSchedule(
  direction: 'eastward' | 'westward',
  timezoneDiff: number,
  departureTime: Date
): Schedule {
  const daysBeforeFlight = Math.min(Math.abs(timezoneDiff) / 2, 3);
  const dailyShift = direction === 'eastward' 
    ? CIRCADIAN_CONSTANTS.PHASE_ADVANCE_LIMIT 
    : -CIRCADIAN_CONSTANTS.PHASE_DELAY_LIMIT;

  return {
    sleepSchedule: generateSleepWindows(daysBeforeFlight, dailyShift),
    lightExposure: generateLightExposure(direction, daysBeforeFlight),
    melatoninTiming: calculateMelatoninTiming(direction, daysBeforeFlight)
  };
}
```

### In-Flight Management

```typescript
function generateFlightSchedule(
  flightDuration: number,
  direction: 'eastward' | 'westward',
  departureTime: Date,
  arrivalTime: Date
): Schedule {
  return {
    sleepWindows: calculateOptimalFlightSleep(
      flightDuration,
      direction,
      departureTime,
      arrivalTime
    ),
    lightExposure: calculateFlightLightExposure(
      direction,
      departureTime,
      arrivalTime
    ),
    caffeineWindows: calculateCaffeineStrategy(
      flightDuration,
      direction
    )
  };
}
```

### Post-Flight Adaptation

```typescript
function generatePostFlightSchedule(
  direction: 'eastward' | 'westward',
  timezoneDiff: number,
  arrivalTime: Date
): Schedule {
  const adjustmentDays = Math.ceil(
    Math.abs(timezoneDiff) / CIRCADIAN_CONSTANTS.AVERAGE_ADJUSTMENT_RATE
  );

  return {
    sleepSchedule: generateAdjustmentSleepSchedule(
      direction,
      adjustmentDays,
      arrivalTime
    ),
    lightExposure: generateAdjustmentLightExposure(
      direction,
      adjustmentDays
    ),
    melatoninTiming: calculateAdjustmentMelatonin(
      direction,
      adjustmentDays
    ),
    mealTiming: generateMealSchedule(
      direction,
      adjustmentDays
    )
  };
}
```

## Activity Scheduling Rules

### Sleep Windows

1. **Pre-Flight**
   - Eastward: Start advancing sleep time by 1-2 hours per day
   - Westward: Start delaying sleep time by 1-2 hours per day
   - Maintain consistent wake times
   - Minimum sleep duration: 7 hours

2. **In-Flight**
   - Align sleep with destination night time when possible
   - Break long sleep periods into strategic naps if necessary
   - Avoid sleep during critical light exposure windows

3. **Post-Flight**
   - Maintain strict sleep/wake schedule
   - Use light exposure to reinforce new schedule
   - No naps longer than 30 minutes

### Light Exposure

1. **Timing Rules**
   ```typescript
   const LIGHT_TIMING = {
     ADVANCE: {
       MORNING: {
         START: 'SUNRISE',
         DURATION: 2  // hours
       },
       EVENING: {
         AVOID_BEFORE: 'SUNSET-2H'
       }
     },
     DELAY: {
       EVENING: {
         START: 'SUNSET',
         DURATION: 3  // hours
       },
       MORNING: {
         AVOID_UNTIL: 'SUNRISE+2H'
       }
     }
   };
   ```

2. **Intensity Guidelines**
   - Bright light: 10,000 lux (morning/evening therapy)
   - Moderate light: 1,000-5,000 lux (daytime)
   - Dim light: <50 lux (evening/night)

### Melatonin Supplementation

1. **Timing**
   - Advance: 5 hours before current bedtime
   - Delay: 2 hours after usual bedtime

2. **Dosage**
   - Standard: 3mg
   - Maximum: 5mg
   - Duration: 30 minutes to take effect

### Meal Timing

1. **General Rules**
   ```typescript
   const MEAL_TIMING = {
     BREAKFAST: {
       EARLIEST: 'WAKE+30M',
       LATEST: 'WAKE+2H'
     },
     LUNCH: {
       WINDOW: 4  // hours around local noon
     },
     DINNER: {
       EARLIEST: 'SUNSET-3H',
       LATEST: 'BEDTIME-3H'
     }
   };
   ```

2. **Fasting Strategy**
   - Optional 16-hour fast during travel
   - Break fast at destination breakfast time
   - Helps reset peripheral circadian clocks

## Implementation Notes

1. **Priority Levels**
   ```typescript
   enum ActivityPriority {
     CRITICAL = 5,    // Must follow (light exposure during critical windows)
     HIGH = 4,        // Strongly recommended (main sleep periods)
     MEDIUM = 3,      // Recommended (meal timing)
     LOW = 2,         // Optional (short naps)
     FLEXIBLE = 1     // Adjustable (caffeine timing)
   }
   ```

2. **Schedule Conflicts**
   - Light exposure takes precedence over sleep
   - Sleep takes precedence over melatonin
   - Melatonin takes precedence over meals
   - All take precedence over caffeine

3. **Adaptation Speed**
   - Maximum shift: 1-2 hours per day
   - Faster adaptation with perfect adherence
   - Slower adaptation with partial adherence
   - Account for individual variation 
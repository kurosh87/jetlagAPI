# Jetlag Calculation Algorithm

## Overview

The jetlag calculation algorithm is designed to generate personalized adaptation schedules based on flight details and circadian rhythm science. It takes into account multiple factors to determine severity and optimal adaptation strategies.

## Core Components

### 1. Severity Calculation

```typescript
interface SeverityFactors {
  timezoneDifference: number;   // Hours difference between timezones
  flightDuration: number;       // Total flight time in hours
  layoverImpact: number;        // Impact of layovers on adaptation
  directionality: 'eastward' | 'westward';  // Direction of travel
  timeOfDayImpact: number;      // Impact of departure/arrival times
}

interface Severity {
  score: number;                // Overall severity score (0-10)
  timezoneDifference: number;   // Absolute timezone difference
  factors: SeverityFactors;     // Contributing factors
  adaptationDays: number;       // Days needed for adaptation
}
```

#### Calculation Formula
```typescript
severityScore = (
  (timezoneDifference * 0.4) +
  (flightDuration * 0.3) +
  (layoverImpact * 0.1) +
  (timeOfDayImpact * 0.2)
) * directionalityMultiplier;

adaptationDays = Math.ceil(severityScore / 2);
```

### 2. Activity Scheduling

#### Pre-flight Activities
- Sleep schedule adjustment
- Light exposure timing
- Meal timing optimization
- Melatonin supplementation

#### In-flight Activities
- Sleep windows
- Light exposure/avoidance
- Meal timing
- Movement recommendations

#### Post-flight Activities
- Sleep schedule adaptation
- Light exposure patterns
- Meal timing
- Supplementation schedule

### 3. Timezone Analysis

#### Eastward Travel
```typescript
if (direction === 'eastward') {
  // Advance sleep schedule
  lightExposure = {
    start: destinationMorning,
    duration: '2-3 hours'
  };
  sleepTime = {
    start: destinationNight,
    duration: '7-8 hours'
  };
}
```

#### Westward Travel
```typescript
if (direction === 'westward') {
  // Delay sleep schedule
  lightExposure = {
    start: destinationEvening,
    duration: '2-3 hours'
  };
  sleepTime = {
    start: destinationNight,
    duration: '7-8 hours'
  };
}
```

## Activity Types

### 1. Sleep
- Primary adaptation mechanism
- Scheduled based on destination timezone
- Duration: 7-8 hours
- Priority: Highest

### 2. Light Exposure
- Key zeitgeber for circadian entrainment
- Timing based on direction of travel
- Duration: 2-3 hours
- Priority: High

### 3. Light Avoidance
- Prevents incorrect circadian signals
- Complementary to light exposure
- Duration: 2-4 hours
- Priority: Medium-High

### 4. Melatonin
- Supplementary adaptation aid
- Timing based on destination night
- Duration: 30 minutes before sleep
- Priority: Medium

### 5. Meals
- Secondary zeitgeber
- Aligned with destination mealtimes
- Duration: 30-45 minutes
- Priority: Medium

### 6. Exercise
- Tertiary zeitgeber
- Timing based on alertness windows
- Duration: 30-60 minutes
- Priority: Low

## Implementation Details

### 1. Schedule Generation

```typescript
interface ActivityWindow {
  start: Date;
  end: Date;
  type: ActivityType;
  priority: number;
  notes?: string;
}

interface Schedule {
  preFlight: ActivityWindow[];
  inFlight: ActivityWindow[];
  postFlight: ActivityWindow[];
}
```

### 2. Adaptation Rules

#### Eastward Travel
1. Advance sleep schedule by 1-2 hours per day
2. Morning light exposure at destination
3. Evening light avoidance
4. Melatonin 5 hours before destination bedtime

#### Westward Travel
1. Delay sleep schedule by 1-2 hours per day
2. Evening light exposure at destination
3. Morning light avoidance
4. Melatonin at destination bedtime

### 3. Special Cases

#### International Date Line
```typescript
if (Math.abs(timezoneDifference) > 12) {
  timezoneDifference = 24 - Math.abs(timezoneDifference);
  direction = direction === 'eastward' ? 'westward' : 'eastward';
}
```

#### Long Layovers
```typescript
if (layover.duration > 180) {  // 3 hours
  includeLayoverAdaptation = true;
  severityFactors.layoverImpact = layover.duration / 60 * 0.1;
}
```

## Scientific Basis

### Circadian Principles
1. Light is the primary zeitgeber
2. Direction of travel affects adaptation
3. Rate of adaptation is ~1 hour per day
4. Multiple zeitgebers improve adaptation

### Research References
- Eastman & Burgess (2009)
- Waterhouse et al. (2007)
- Sack (2010)
- Herxheimer & Petrie (2002)

## Validation

### Test Scenarios
1. Short-haul eastward
2. Long-haul westward
3. Multi-segment flights
4. Date line crossing
5. Multiple layovers

### Success Metrics
1. Adaptation speed
2. Sleep quality
3. Daytime alertness
4. Minimal side effects

## Future Enhancements

### 1. Personalization
- Age consideration
- Previous travel history
- Sleep preferences
- Medical conditions

### 2. Environmental Factors
- Seasonal variations
- Local weather
- Indoor/outdoor activities
- Travel purpose

### 3. Machine Learning
- Pattern recognition
- Success rate analysis
- Personalized recommendations
- Continuous improvement 
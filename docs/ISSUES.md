# Jetlag API Issues Documentation

## 1. Type System Issues

### 1.1 LightExposureWindow Interface Mismatch
**Location**: `src/types/circadian.ts`  
**Problem**: Interface definition doesn't match actual usage across codebase  
**Current Definition**:
```typescript
export interface LightExposureWindow {
  timeWindow: TimeWindow;
  intensity: LightIntensity;
  type: LightType;
  naturalLight: boolean;
  priority: number;
  description: string;
}
```
**Actual Usage**: Code directly accesses `start` and `end` properties instead of `timeWindow`

### 1.2 LightType Enum Conflicts
**Location**: `src/types/circadian.ts`  
**Problem**: Type is defined as `'critical' | 'optimal' | 'avoid'` but code uses `'advance' | 'delay' | 'maintain'`  
**Impact**: Causes type errors in light timing calculations

### 1.3 Priority Type Inconsistency
**Problem**: Priority is defined as number but used as string ('critical', 'optimal', etc.)  
**Affected Files**:
- `src/utils/circadianCalculations.ts`
- `src/services/jetlagService.ts`

## 2. Missing Dependencies

### 2.1 TimeUtils Module
**Problem**: Code imports from non-existent `timeUtils.ts`  
**Solution**: Functions exist in `dateUtils.ts`  
**Affected Files**:
- `src/utils/circadianCalculations.ts`

### 2.2 WeatherService Integration
**Problem**: Tests pass WeatherService but implementation doesn't handle it  
**Affected Files**:
- `src/__tests__/jetlagService.test.ts`
- `src/__tests__/activityConflicts.test.ts`
- `src/services/jetlagService.ts`

## 3. Constants and Configuration

### 3.1 Missing CIRCADIAN_CONSTANTS
**Problem**: Several constants referenced but not defined  
**Missing Constants**:
- `PHASE_SHIFT_RATE`
- `FATIGUE_HALF_LIFE`
- `OPTIMAL_LIGHT_ADVANCE_HOURS`
- `OPTIMAL_LIGHT_DELAY_HOURS`
- `MELATONIN_WINDOW`
- `CAFFEINE_CUTOFF`
- `AVERAGE_ADJUSTMENT_RATE`
- `MAX_LIGHT_INTENSITY`

### 3.2 Unit Inconsistencies
**Problem**: Mixed usage of hours and minutes across constants  
**Example**:
- Some constants in minutes: `MAX_SHIFT_PER_DAY: 60`
- Others in hours: `MELATONIN_WINDOW: 0.5`

## 4. Algorithm Implementation Issues

### 4.1 Light Timing Calculations
**Location**: `src/utils/circadianCalculations.ts`  
**Problems**:
1. Inconsistent handling of light window types
2. Direct property access on wrong interface structure
3. Type conflicts in light exposure windows

### 4.2 Phase Shift Calculations
**Location**: `src/utils/circadianCalculations.ts`  
**Problems**:
1. Missing rate limiting constants
2. Inconsistent direction handling
3. Type conflicts in shift calculations

## 5. Service Architecture Issues

### 5.1 JetlagService Constructor
**Problem**: Constructor parameter mismatch with tests  
**Location**: `src/services/jetlagService.ts`  
**Impact**: Tests fail due to constructor signature mismatch

### 5.2 Service Dependencies
**Problem**: Unclear separation between JetlagService and JetlagCalculationService  
**Affected Files**:
- `src/services/jetlagService.ts`
- `src/services/jetlagCalculationService.ts`

## 6. Test Suite Issues

### 6.1 Constructor Mismatch
**Problem**: Tests instantiate services with parameters that aren't handled  
**Affected Tests**:
- `src/__tests__/jetlagService.test.ts`
- `src/__tests__/activityConflicts.test.ts`

### 6.2 Light Timing Validation
**Problem**: Tests expect behavior that doesn't match current implementation  
**Location**: `src/__tests__/circadianCalculations.test.ts`

## Recommended Fix Order

1. **Type System Fixes**
   - Update LightExposureWindow interface
   - Resolve LightType enum conflicts
   - Fix priority type inconsistency

2. **Dependencies Resolution**
   - Correct timeUtils imports
   - Implement proper WeatherService integration

3. **Constants Standardization**
   - Add missing constants
   - Standardize units (convert all to minutes)
   - Update constant references

4. **Service Architecture**
   - Fix JetlagService constructor
   - Clarify service boundaries
   - Implement proper dependency injection

5. **Algorithm Implementation**
   - Update light timing calculations
   - Fix phase shift calculations
   - Implement proper type checking

6. **Test Suite Updates**
   - Update test instantiation
   - Fix validation expectations
   - Add missing test cases

## Impact Analysis

### Critical Issues
- Type system mismatches causing compilation errors
- Missing dependencies breaking functionality
- Constructor mismatches causing test failures

### Performance Issues
- Unit inconsistencies may lead to calculation errors
- Inconsistent handling of light windows may affect algorithm accuracy

### Maintenance Issues
- Unclear service boundaries making code harder to maintain
- Mixed type usage making the codebase harder to understand
- Inconsistent constant units making calculations error-prone

## Next Steps

1. Create individual tickets for each issue category
2. Prioritize fixes based on impact and dependencies
3. Update documentation as fixes are implemented
4. Add regression tests for fixed functionality
5. Review and update API documentation 
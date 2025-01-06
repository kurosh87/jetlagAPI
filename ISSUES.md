# Current Issues

## Test Failures

1. Melatonin Timing Test (`activityConflicts.test.ts:88`)
   - **Status**: Fixed ✅
   - **Original Issue**: Melatonin timing was calculated incorrectly, resulting in -1380 minutes from bedtime
   - **Fix Applied**: Updated `generateSupplementActivity` to properly handle day wrapping using modulo arithmetic and `CIRCADIAN_CONSTANTS.MELATONIN_BEFORE_BED`

2. Sleep Shift Test (`jetlagService.test.ts:386`)
   - **Status**: In Progress 🔄
   - **Issue**: Sleep shift calculation not maintaining consistent shift rates
   - **Root Cause**: The shift calculation in `calculateSleepTiming` needs further adjustment
   - **Required Fix**: 
     - Need to ensure shifts are proportional to remaining timezone difference
     - Must maintain minimum shift requirements (30 min eastward, 60 min westward)
     - Should handle day wrapping correctly for sleep timing

## Code Improvements Needed

1. Sleep Duration Consistency
   - **Status**: Needs Review 🔍
   - **Issue**: Sleep duration varies more than allowed between consecutive days
   - **Location**: `calculateSleepTiming` method
   - **Fix Required**: Ensure sleep duration changes are gradual and within limits

2. Light Exposure Timing
   - **Status**: Working Correctly ✅
   - **Validation**: Tests confirm correct timing relative to CBT min
   - **Details**: 
     - Eastward: 3-5 hours after CBT min
     - Westward: 2-3 hours before CBT min

## Next Steps

1. Refine sleep shift calculation to:
   - Maintain consistent shift rates based on direction
   - Ensure minimum shift requirements are met
   - Prevent excessive duration changes between days

2. Add additional validation tests for:
   - Sleep duration consistency across multiple days
   - Proper handling of date line crossing
   - Edge cases in melatonin timing

3. Consider adding safeguards for:
   - Maximum daily sleep schedule changes
   - Proper handling of extreme timezone differences
   - Activity conflict resolution 
# Stable Versions

This document tracks stable versions of the JetLag API that serve as reliable baselines for future development.

## v1.0.0-stable-baseline

**Tagged on:** January 6, 2024
**Branch:** fix/timing-expectations
**Status:** All tests passing (43/43)

### Key Features
- Correct light timing calculations relative to CBT min
- Proper handling of eastward vs westward travel
- Accurate sleep schedule adjustments
- International date line crossing support
- Weather integration for light exposure windows
- Activity conflict resolution
- Comprehensive test coverage

### Test Coverage
- Overall statement coverage: 70.63%
- Branch coverage: 55.14%
- Function coverage: 70%
- Line coverage: 71.21%

### How to Use This Version

1. **View this version:**
   ```bash
   git checkout v1.0.0-stable-baseline
   ```

2. **Start new work from this point:**
   ```bash
   git checkout -b new-branch-name v1.0.0-stable-baseline
   ```

3. **Reset current branch to this point:**
   ```bash
   git reset --hard v1.0.0-stable-baseline
   ```

### Validation
To verify you're on the correct version:
1. Run the test suite:
   ```bash
   npm test
   ```
2. All 43 tests should pass without any failures

### Known Areas for Improvement
- Test coverage for circadianCalculations.ts (currently at 21.05%)
- Additional coverage for dateUtils.ts (currently at 71.05%)
- Enhanced coverage for jetlagService.ts (currently at 70.47%)

### Notes
This version represents the first stable equilibrium after extensive development and testing. It serves as a reliable foundation for future enhancements while maintaining scientific accuracy in jetlag calculations. 
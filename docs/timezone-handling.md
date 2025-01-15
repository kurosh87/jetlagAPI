# Timezone Handling in Jetlag API

## Current State Analysis

### Identified Issues
1. **Inconsistent Timezone Formats**
   - Amadeus API uses UTC offset strings (e.g., '+09:00', '-05:00')
   - Internal calculations use IANA timezone names (e.g., 'America/New_York')
   - Flutter app may send either format

2. **Validation Gaps**
   - No strict validation of timezone formats
   - Inconsistent handling of DST
   - Edge cases with international date line not properly handled

3. **Integration Points**
   - Amadeus API queries require UTC offset format
   - Jetlag calculations need accurate timezone info
   - Client apps need consistent response format

## Proposed Solution

### 1. Standardization
- **Internal Standard**: Use UTC offset strings ('+HH:mm' format) as the primary timezone format
- **Conversion Layer**: Add conversion utilities for IANA names when needed
- **Validation**: Implement strict validation for all timezone inputs

### 2. Implementation Details

#### API Layer
```typescript
interface TimezoneFormat {
  utcOffset: string;        // e.g., '+09:00'
  ianaName?: string;        // e.g., 'Asia/Tokyo'
  displayName?: string;     // e.g., 'Tokyo (JST)'
}

interface Airport {
  code: string;
  timezone: TimezoneFormat;
  // ... other fields
}
```

#### Validation Rules
1. UTC offset must match pattern: `^[+-]\\d{2}:\\d{2}$`
2. Hours must be 00-14
3. Minutes must be 00-59
4. Total offset must not exceed ±14:00

#### Conversion Functions
```typescript
function validateUtcOffset(offset: string): boolean
function convertIanaToUtc(ianaName: string): string
function convertUtcToIana(utcOffset: string): string
function normalizeTimezone(timezone: string): TimezoneFormat
```

### 3. Integration Points

#### Amadeus API
- Always use UTC offset format for queries
- Validate response timezone data
- Cache common airport timezone mappings

#### Jetlag Calculations
- Convert all inputs to UTC offset format
- Perform calculations using numeric offset values
- Handle date line crossing explicitly

#### Client API
- Accept both UTC and IANA formats
- Always return UTC offset format
- Include IANA name and display name when available

### 4. Testing Strategy

1. **Unit Tests**
   - Timezone format validation
   - Conversion functions
   - Edge cases (date line, DST)

2. **Integration Tests**
   - Amadeus API queries
   - Jetlag calculations
   - Full request/response cycle

3. **End-to-End Tests**
   - Client app integration
   - Real flight data validation
   - Performance testing

### 5. Deployment Considerations

1. **Environment Setup**
   - Timezone data must be available in all environments
   - Consider caching timezone mappings
   - Monitor timezone-related errors

2. **Monitoring**
   - Log timezone conversion errors
   - Track API response formats
   - Alert on validation failures

3. **Updates**
   - Plan for timezone data updates
   - Version API responses
   - Document upgrade paths

## Implementation Plan

1. **Phase 1: Core Updates**
   - Implement timezone validation
   - Add conversion utilities
   - Update API interfaces

2. **Phase 2: Integration**
   - Update Amadeus service
   - Modify jetlag calculations
   - Update API endpoints

3. **Phase 3: Testing**
   - Add comprehensive tests
   - Validate with real data
   - Performance testing

4. **Phase 4: Deployment**
   - Update documentation
   - Deploy monitoring
   - Release to staging

## Migration Guide

### For API Users
```typescript
// Old format
airport.timezone = 'America/New_York';

// New format
airport.timezone = {
  utcOffset: '-05:00',
  ianaName: 'America/New_York',
  displayName: 'New York (EST)'
};
```

### For Internal Services
1. Always validate timezone inputs
2. Use UTC offset for calculations
3. Store both formats when available
4. Log conversion errors

## Error Handling

1. **Validation Errors**
   - Return 400 Bad Request
   - Include specific error message
   - Log validation failures

2. **Conversion Errors**
   - Use fallback timezone data
   - Log error for investigation
   - Return best available format

3. **Integration Errors**
   - Retry with alternate format
   - Log integration failures
   - Alert on repeated failures

## Monitoring and Maintenance

1. **Metrics to Track**
   - Timezone validation failures
   - Conversion errors
   - API response formats

2. **Regular Tasks**
   - Update timezone data
   - Review error logs
   - Update documentation

3. **Support Procedures**
   - Document common issues
   - Provide troubleshooting guide
   - Define escalation path 
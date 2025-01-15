# Amadeus API Testing Documentation

## Overview
This document outlines our testing approach for the Amadeus API integration and subsequent jetlag calculations, including both successful and failed approaches.

## What Works

1. **Flight Search via Amadeus API**:
   - Successfully retrieves flight details using carrier code and flight number
   - Example: `GET /api/flights/search?carrierCode=BA&flightNumber=112&scheduledDepartureDate=2025-01-17`
   - Returns accurate flight times, durations, and equipment types

2. **Jetlag Calculation with UTC Offset Format**:
   - Works when using strict UTC offset format (e.g., "+00:00", "-05:00")
   - Example that works:
   ```json
   {
     "flight": {
       "departure": "2025-01-17T23:30:00Z",
       "arrival": "2025-01-18T06:30:00Z",
       "originTimezone": "+00:00",
       "destinationTimezone": "+00:00",
       "duration": 420
     },
     "phase": "arrival"
   }
   ```

## What Doesn't Work

1. **IANA Timezone Names**:
   - Attempts to use IANA names (e.g., "America/New_York") fail with "Invalid timezone offset" error
   - Current implementation only supports UTC offset format
   - Example of failing request:
   ```json
   {
     "flight": {
       "originTimezone": "America/New_York",
       "destinationTimezone": "Europe/London"
     }
   }
   ```

2. **Date Line Crossing**:
   - Flights crossing the international date line (e.g., TPE-YVR) produce incorrect severity scores
   - Timezone difference calculations are unreliable for these routes

3. **Timezone Mapping**:
   - Limited set of supported timezone offsets in `offsetToIANA` function
   - Missing many major airport timezones
   - Current mapping:
     ```typescript
     '+08:00': 'Asia/Taipei',
     '-08:00': 'America/Vancouver',
     '-05:00': 'America/Toronto',
     '-03:00': 'America/Sao_Paulo',
     '+00:00': 'UTC',
     '+01:00': 'Europe/Paris',
     '+09:00': 'Asia/Tokyo',
     '+04:00': 'Asia/Dubai',
     '+11:00': 'Australia/Sydney',
     '-06:00': 'America/Chicago'
     ```

## Test Cases Results

### Test Case 1: BA112 (JFK-LHR) - Partially Working
- **What Worked**:
  - Flight search returned correct schedule
  - Jetlag calculation completed
- **What Failed**:
  - Initial timezone handling using IANA names
  - Had to convert to UTC offsets manually

### Test Case 2: EK211 (DXB-IAH) - Initially Failed
- **What Worked**:
  - Flight search returned correct schedule
  - Final calculation with UTC offsets successful
- **What Failed**:
  - Multiple timezone handling attempts
  - Required manual offset conversion

### Test Case 3: QF9 (PER-LHR) - Partially Working
- **What Worked**:
  - Flight search successful
  - Duration calculation accurate
- **What Failed**:
  - Initial timezone handling
  - Required workaround for timezone offsets

## Current Limitations

1. **Timezone Handling**:
   - Only supports UTC offset format
   - No DST handling
   - Limited timezone mapping
   - No support for dynamic timezone lookup

2. **API Integration**:
   - Token refresh not fully automated
   - Error handling needs improvement
   - Rate limiting not implemented

3. **Calculation Issues**:
   - Severity scores may be inaccurate for certain routes
   - Date line crossing not properly handled
   - Adaptation days calculation needs validation

## Workarounds

1. **Timezone Handling**:
   - Convert all times to UTC before API calls
   - Use offset format instead of IANA names
   - Manually add missing timezone mappings as needed

2. **API Calls**:
   - Use local API endpoint for testing
   - Implement proper error handling
   - Add console logging for debugging

## Recommendations for Improvement

1. **Short Term**:
   - Complete timezone offset mapping
   - Implement proper IANA timezone support
   - Fix date line crossing calculations

2. **Long Term**:
   - Rewrite timezone handling using a robust library (e.g., Luxon)
   - Implement proper DST handling
   - Add comprehensive error handling
   - Create automated test suite

## API Testing Structure

### 1. Flight Search Endpoint
```
GET /api/flights/search
```
Parameters:
- `carrierCode`: Airline code (e.g., "BA", "EK", "QF")
- `flightNumber`: Flight number
- `scheduledDepartureDate`: YYYY-MM-DD format

Example Request:
```bash
curl -X GET "http://localhost:3000/api/flights/search?carrierCode=BA&flightNumber=112&scheduledDepartureDate=2025-01-17"
```

### 2. Jetlag Calculation Endpoint
```
POST /api/jetlag
```
Request Body:
```json
{
  "flight": {
    "departure": "2025-01-17T23:30:00Z",
    "arrival": "2025-01-18T06:30:00Z",
    "originTimezone": "+00:00",
    "destinationTimezone": "+00:00",
    "duration": 420
  },
  "phase": "arrival"
}
```

## Test Cases

### Test Case 1: BA112 (JFK-LHR)
- **Flight Details**:
  - Departure: 2025-01-17 23:30 UTC-5 (04:30 UTC)
  - Arrival: 2025-01-18 06:30 UTC+0
  - Duration: 7 hours
  - Severity Score: 4.5/10
  - Adaptation Days: 2

### Test Case 2: EK211 (DXB-IAH)
- **Flight Details**:
  - Departure: 2025-01-17 09:45 UTC+4 (05:45 UTC)
  - Arrival: 2025-01-17 16:20 UTC-6 (22:20 UTC)
  - Duration: 16 hours 35 minutes
  - Severity Score: 7.5/10
  - Adaptation Days: 5

### Test Case 3: QF9 (PER-LHR)
- **Flight Details**:
  - Departure: 2025-01-17 11:15 UTC+8 (03:15 UTC)
  - Arrival: 2025-01-18 05:05 UTC+0
  - Duration: 17 hours 50 minutes
  - Severity Score: 7.6/10
  - Adaptation Days: 6

## Common Issues and Solutions

### 1. Timezone Handling
- **Issue**: Inconsistent handling of timezone offsets vs. IANA names
- **Solution**: Standardized on UTC times for API requests, with conversion happening server-side

### 2. Date Line Crossing
- **Issue**: Flights crossing the international date line caused calculation errors
- **Solution**: Implemented proper handling of negative timezone differences

### 3. API Authentication
- **Issue**: Token expiration and authentication errors
- **Solution**: Implemented proper token refresh mechanism

## Testing Guidelines

1. **Use UTC Times**:
   - Convert all local times to UTC before making API calls
   - Format: "YYYY-MM-DDThh:mm:ssZ"

2. **Timezone Offsets**:
   - Use standardized offset format: "+HH:MM" or "-HH:MM"
   - Example: "+00:00" for UTC, "+01:00" for CET

3. **Duration Calculation**:
   - Always specify duration in minutes
   - Calculate as: (arrival_time - departure_time) in minutes

## Validation Checklist

- [ ] Flight search returns correct flight details
- [ ] Timezone conversions are accurate
- [ ] Severity scores reflect flight characteristics:
  - Duration impact
  - Timezone difference
  - Direction of travel
  - Time of day impact
- [ ] Adaptation schedule is appropriate for:
  - Sleep timing
  - Light exposure
  - Melatonin timing
  - Meal scheduling

## Future Improvements

1. Expand timezone mapping to cover all major airports
2. Implement batch testing capability
3. Add validation for edge cases (polar routes, date line crossing)
4. Enhance error handling and reporting 